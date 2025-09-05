import * as api from './api.js';
import * as ui from './ui.js';
import * as auth from './auth.js';

// --- ESTADO GLOBAL DA APLICAÇÃO ---
export const state = {
    currentUser: null,
    booking: {}, // Será resetado a cada novo agendamento
    services: [],
    barbers: [],
    // Listeners do Firebase que precisam ser desligados ao trocar de página/usuário
    listeners: {
        services: null,
        barbers: null,
        appointments: null,
        blockedSlots: null
    }
};

// --- FUNÇÃO CENTRAL DE LIMPEZA ---
function cleanupListeners() {
    Object.keys(state.listeners).forEach(key => {
        if (state.listeners[key]) {
            state.listeners[key](); // Executa a função de unsubscribe do Firebase
            state.listeners[key] = null;
        }
    });
}


// --- LÓGICA DE AGENDAMENTO ---
async function calculateAvailableSlots() {
    const { service, barber, date } = state.booking;
    if (!service || !barber || !date) return [];

    const barberData = state.barbers.find(b => b.id === barber);
    if (!barberData) return [];

    const dayOfWeek = new Date(date + 'T12:00:00Z').toLocaleString('en-US', { weekday: 'long' }).toLowerCase();
    const workSchedule = barberData.workSchedule?.[dayOfWeek];

    if (!workSchedule || !workSchedule.active) return [];

    const appointmentsPromise = new Promise(resolve => {
        const unsubscribe = api.getAppointments(barber, date, (data) => {
            unsubscribe();
            resolve(data);
        });
    });
    const blockedSlotsPromise = new Promise(resolve => {
        const unsubscribe = api.getBlockedSlots(barber, date, (data) => {
            unsubscribe();
            resolve(data);
        });
    });
    const [appointments, blockedSlots] = await Promise.all([appointmentsPromise, blockedSlotsPromise]);

    const toMinutes = (timeStr) => parseInt(timeStr.split(':')[0]) * 60 + parseInt(timeStr.split(':')[1]);
    const workStart = toMinutes(workSchedule.start);
    const workEnd = toMinutes(workSchedule.end);
    const breakStart = workSchedule.breakStart ? toMinutes(workSchedule.breakStart) : null;
    const breakEnd = workSchedule.breakEnd ? toMinutes(workSchedule.breakEnd) : null;

    let occupiedSlots = [];
    appointments.forEach(app => {
        const start = toMinutes(app.time);
        occupiedSlots.push({ start, end: start + app.duration });
    });
    blockedSlots.forEach(block => {
        const start = toMinutes(block.time);
        occupiedSlots.push({ start, end: start + 30 }); // Bloqueios são de 30 min
    });
    if (breakStart !== null && breakEnd !== null) {
        occupiedSlots.push({ start: breakStart, end: breakEnd });
    }

    const availableSlots = [];
    const serviceDuration = service.duration;
    const step = 15;

    for (let currentSlotStart = workStart; currentSlotStart <= workEnd - serviceDuration; currentSlotStart += step) {
        const currentSlotEnd = currentSlotStart + serviceDuration;
        let isAvailable = true;

        for (const occupied of occupiedSlots) {
            if (currentSlotStart < occupied.end && currentSlotEnd > occupied.start) {
                isAvailable = false;
                break;
            }
        }

        if (isAvailable) {
            const hours = Math.floor(currentSlotStart / 60).toString().padStart(2, '0');
            const minutes = (currentSlotStart % 60).toString().padStart(2, '0');
            availableSlots.push(`${hours}:${minutes}`);
        }
    }
    return availableSlots;
}

// --- ROTEAMENTO E CONFIGURAÇÃO DE PÁGINAS ---
async function setupPage(page) {
    cleanupListeners();
    state.booking = { service: null, barber: null, date: null, time: null };

    if (page === 'barbers') {
        state.listeners.barbers = api.getBarbers(barbers => {
            const barbersListContainer = document.getElementById('barbers-list');
            if(barbersListContainer) {
                barbersListContainer.innerHTML = '';
                if (barbers.length === 0) {
                     barbersListContainer.innerHTML = '<p class="text-center text-gray-400 col-span-full">Nenhum barbeiro encontrado.</p>';
                     return;
                }
                barbers.forEach(barber => {
                    const div = document.createElement('div');
                    div.className = 'bg-gray-800 p-6 rounded-lg text-center';
                    div.innerHTML = `
                        <img src="${barber.imageUrl || 'https://placehold.co/200x200/1F2937/FBBF24?text=Barbeiro'}" alt="Foto de ${barber.name}" class="w-32 h-32 rounded-full mx-auto mb-4 object-cover">
                        <h4 class="text-xl font-bold text-amber-400">${barber.name}</h4>
                        <p class="text-gray-400 mt-2">${barber.about}</p>
                    `;
                    barbersListContainer.appendChild(div);
                });
            }
        });
    }

    switch(page) {
        case 'schedule':
            ui.renderServicesList(state.services, (service) => {
                state.booking.service = service;
                document.getElementById('step-2-barber').classList.remove('hidden');
                document.getElementById('step-3-datetime').classList.add('hidden');
                document.getElementById('booking-form-container').classList.add('hidden');
            });
            ui.populateBarberSelect(state.barbers, 'barber-select');
            ui.initPhoneMask('client-phone');
            break;
        case 'admin':
            if (!state.currentUser) { loadPage('login'); return; }
            document.getElementById('admin-loader')?.classList.add('hidden');
            ui.renderAdminTabs(state.currentUser.role);
            setupAdminTabs();
            break;
    }
}

// --- LÓGICA DO PAINEL ADMIN ---
function setupAdminTabs() {
    const tabsContainer = document.getElementById('admin-tabs');
    if (!tabsContainer) return;

    tabsContainer.addEventListener('click', (e) => {
        e.preventDefault();
        const tabId = e.target.dataset.tab;
        if(tabId) {
            ui.switchAdminTab(tabId);
            loadAdminTabData(tabId);
        }
    });

    const firstTab = tabsContainer.querySelector('a')?.dataset.tab;
    if (firstTab) {
        ui.switchAdminTab(firstTab);
        loadAdminTabData(firstTab);
    }
}

async function loadAdminTabData(tabId) {
    cleanupListeners();
    switch(tabId) {
        case 'manage-barbers':
            state.listeners.barbers = api.getBarbers(barbers => {
                const container = document.getElementById('admin-barbers-list');
                if (container) {
                    container.innerHTML = `<h3 class="text-2xl font-bold mb-4">Barbeiros Cadastrados</h3>`;
                    barbers.forEach(barber => {
                        const div = document.createElement('div');
                        div.className = 'flex justify-between items-center bg-gray-700 p-3 rounded mb-2';
                        div.innerHTML = `
                            <span>${barber.name}</span>
                            <button data-id="${barber.id}" class="remove-barber-btn bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded">Remover</button>
                        `;
                        container.appendChild(div);
                    });
                }
            });
            break;
        case 'manage-services':
             // O listener principal já está cuidando da atualização do state.services.
             // Aqui apenas renderizamos a lista com os dados atuais.
             renderAdminServicesUI();
            break;
        case 'manage-schedules':
            ui.populateBarberSelect(state.barbers, 'schedule-barber-select');
            document.getElementById('schedule-barber-select').dispatchEvent(new Event('change'));
            break;
        case 'my-schedule':
            ui.initDatePicker('barber-date-picker', date => loadBarberDaySchedule(date));
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('barber-date-picker')._flatpickr.setDate(today, true);
            break;
    }
}

// Função auxiliar para renderizar a UI de serviços no painel
function renderAdminServicesUI() {
    ui.renderAdminServices(state.services,
        (id) => { // Lógica de Edição
            const service = state.services.find(s => s.id === id);
            if (service) {
                document.getElementById('service-id').value = service.id;
                document.getElementById('service-name').value = service.name;
                document.getElementById('service-duration').value = service.duration;
                document.getElementById('service-price').value = service.price;
            }
        },
        async (id) => { // Lógica de Remoção
            if(confirm('Tem certeza? Isso removerá o serviço permanentemente.')) await api.removeService(id);
        }
    );
}


async function loadBarberDaySchedule(date) {
    const barberId = state.currentUser.uid;
    const barberData = state.barbers.find(b => b.id === barberId);

    if (!barberData) return;

    const dayOfWeek = new Date(date + 'T12:00:00Z').toLocaleString('en-US', { weekday: 'long' }).toLowerCase();
    const workSchedule = barberData.workSchedule?.[dayOfWeek];

    if (!workSchedule || !workSchedule.active) {
        ui.renderBarberDaySchedule([], () => {});
        return;
    }

    const onDataUpdate = (appointments, blockedSlots) => {
        const toMinutes = (t) => parseInt(t.split(':')[0])*60 + parseInt(t.split(':')[1]);
        const fromMinutes = (m) => `${Math.floor(m/60).toString().padStart(2, '0')}:${(m%60).toString().padStart(2, '0')}`;

        const slots = [];
        const occupied = new Set();

        appointments.forEach(app => {
            const startMin = toMinutes(app.time);
            for(let i = 0; i < app.duration; i += 30) {
                occupied.add(startMin + i);
            }
            slots.push({ time: app.time, type: 'appointment', details: app });
        });

        blockedSlots.forEach(block => {
            occupied.add(toMinutes(block.time));
            slots.push({ ...block, type: 'blocked' });
        });

        const start = toMinutes(workSchedule.start);
        const end = toMinutes(workSchedule.end);
        for (let min = start; min < end; min += 30) {
            if (!occupied.has(min)) {
                slots.push({ time: fromMinutes(min), type: 'free' });
            }
        }

        slots.sort((a,b) => toMinutes(a.time) - toMinutes(b.time));
        ui.renderBarberDaySchedule(slots, handleBarberSlotClick);
    };

    let currentAppointments = [], currentBlocks = [];
    state.listeners.appointments = api.getAppointments(barberId, date, (apps) => {
        currentAppointments = apps;
        onDataUpdate(currentAppointments, currentBlocks);
    });
    state.listeners.blockedSlots = api.getBlockedSlots(barberId, date, (blocks) => {
        currentBlocks = blocks;
        onDataUpdate(currentAppointments, currentBlocks);
    });
}

// --- EVENT HANDLERS ---
function setupEventListeners() {
    const header = document.querySelector('header');
    header.addEventListener('click', e => {
        if (e.target.matches('a[data-page], button[data-page]')) {
            e.preventDefault();
            loadPage(e.target.dataset.page);
        }
        if (e.target.matches('#logout-nav-link, #logout-nav-link-mobile')) {
            e.preventDefault();
            auth.logout();
        }
        if (e.target.closest('#mobile-menu-button')) {
            document.getElementById('mobile-menu').classList.toggle('hidden');
        }
         if (e.target.matches('.nav-link-mobile')) {
            document.getElementById('mobile-menu').classList.add('hidden');
        }
    });

    const modal = document.getElementById('modal');
    modal.querySelector('#modal-close').addEventListener('click', () => modal.classList.add('hidden'));

    const content = document.getElementById('app-content');
    content.addEventListener('submit', handleFormSubmissions);
    content.addEventListener('change', handleDynamicChanges);
    content.addEventListener('click', handleDynamicClicks);
}

async function handleFormSubmissions(e) {
    e.preventDefault();
    if (e.target.id === 'login-form') {
        const email = e.target.querySelector('#login-email').value;
        const password = e.target.querySelector('#login-password').value;
        const errorP = e.target.querySelector('#login-error');
        errorP.textContent = '';
        try {
            await auth.login(email, password);
            loadPage('admin');
        } catch (error) {
            errorP.textContent = "Email ou senha inválidos.";
        }
    }
    if (e.target.id === 'add-barber-form') {
        const name = e.target.querySelector('input[type="text"]').value;
        const imageUrl = e.target.querySelector('input[type="text"]:nth-of-type(2)').value;
        const about = e.target.querySelector('textarea').value;
        try {
            await api.addBarber(name, imageUrl, about);
            ui.modal.show("Sucesso!", "Barbeiro adicionado. Lembre-se de criar o login para ele no Firebase Authentication e definir seus horários de trabalho.");
            e.target.reset();
        } catch (error) {
            ui.modal.show("Erro", "Não foi possível adicionar o barbeiro.");
            console.error("Erro ao adicionar barbeiro:", error);
        }
    }

    if(e.target.id === 'service-form') {
        const id = e.target.querySelector('#service-id').value;
        const nameInput = e.target.querySelector('#service-name');
        const durationInput = e.target.querySelector('#service-duration');
        const priceInput = e.target.querySelector('#service-price');
        
        const data = {
            name: nameInput.value,
            duration: parseInt(durationInput.value),
            price: parseFloat(priceInput.value),
        };

        if (!data.name || !data.duration || !data.price) {
            ui.modal.show("Erro", "Por favor, preencha todos os campos do serviço.");
            return;
        }

        try {
            if (id) {
                await api.updateService(id, data);
                 ui.modal.show("Sucesso!", "Serviço atualizado.");
            } else {
                await api.addService(data);
                ui.modal.show("Sucesso!", "Serviço adicionado.");
            }
            e.target.reset();
            document.getElementById('service-id').value = '';
        } catch(error) {
            ui.modal.show("Erro", "Ocorreu um erro ao salvar o serviço.");
            console.error("Erro ao salvar serviço:", error);
        }
    }
    if (e.target.id === 'work-schedule-form') {
        const barberId = document.getElementById('schedule-barber-select').value;
        if (!barberId) { ui.modal.show("Atenção", "Selecione um barbeiro!"); return; }
        const formData = new FormData(e.target);
        const schedule = {};
        const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        dayKeys.forEach(day => {
            schedule[day] = {
                active: formData.has(`${day}-active`),
                start: formData.get(`${day}-start`),
                end: formData.get(`${day}-end`),
                breakStart: formData.get(`${day}-breakStart`),
                breakEnd: formData.get(`${day}-breakEnd`),
            };
        });
        await api.updateBarberWorkSchedule(barberId, schedule);
        ui.modal.show("Sucesso!", "Horários salvos.");
    }
    if (e.target.id === 'booking-form') {
        const appointmentData = {
            ...state.booking,
            duration: state.booking.service.duration,
            serviceName: state.booking.service.name,
            price: state.booking.service.price,
            barberId: state.booking.barber,
            barberName: state.barbers.find(b => b.id === state.booking.barber).name,
            clientName: e.target.querySelector('#client-name').value,
            clientContact: e.target.querySelector('#client-phone').value,
        };
        delete appointmentData.service;
        await api.createAppointment(appointmentData);
        ui.modal.show("Confirmado!", "Seu agendamento foi confirmado com sucesso.");
        loadPage('home');
    }
}

async function handleDynamicChanges(e) {
    if (e.target.id === 'barber-select') {
        state.booking.barber = e.target.value;
        document.getElementById('step-3-datetime').classList.remove('hidden');
        ui.initDatePicker('date-picker', async (dateStr) => {
            state.booking.date = dateStr;
            document.getElementById('time-slots-container').classList.remove('hidden');
            document.getElementById('booking-form-container').classList.add('hidden');
            const slots = await calculateAvailableSlots();
            ui.renderTimeSlots(slots, (time) => {
                state.booking.time = time;
                document.getElementById('summary-service').textContent = state.booking.service.name;
                document.getElementById('summary-barber').textContent = state.barbers.find(b => b.id === state.booking.barber).name;
                document.getElementById('summary-date').textContent = new Date(state.booking.date + 'T12:00:00Z').toLocaleDateString('pt-BR');
                document.getElementById('summary-time').textContent = state.booking.time;
                document.getElementById('booking-form-container').classList.remove('hidden');
            });
        });
    }
    if (e.target.id === 'schedule-barber-select') {
        const barber = state.barbers.find(b => b.id === e.target.value);
        ui.renderWorkScheduleForm(barber?.workSchedule);
    }
}

async function handleDynamicClicks(e) {
    if (e.target.classList.contains('remove-barber-btn')) {
        const barberId = e.target.dataset.id;
        if (confirm('Tem certeza que deseja remover este barbeiro? A ação não pode ser desfeita.')) {
            try {
                await api.removeBarber(barberId);
                ui.modal.show("Sucesso", "Barbeiro removido.");
            } catch (error) {
                ui.modal.show("Erro", "Não foi possível remover o barbeiro.");
                console.error("Erro ao remover barbeiro:", error);
            }
        }
    }
}


async function handleBarberSlotClick(slot) {
    const date = document.getElementById('barber-date-picker').value;
    if (slot.type === 'free') {
        await api.addBlockedSlot({
            barberId: state.currentUser.uid,
            date: date,
            time: slot.time
        });
    } else if (slot.type === 'blocked') {
        await api.removeBlockedSlot(slot.id);
    }
}

// --- FUNÇÕES DE INICIALIZAÇÃO E ROTEAMENTO PRINCIPAIS ---
const appContent = document.getElementById('app-content');
export async function loadPage(page) {
    window.location.hash = page;
    try {
        const response = await fetch(`pages/${page}.html`);
        appContent.innerHTML = await response.text();
        await setupPage(page);
    } catch (error) {
        console.error("Erro ao carregar página:", error);
    }
}

function init() {
    auth.setupAuthListener();

    // ==========================================================
    // CORREÇÃO APLICADA AQUI: O listener agora também redesenha a UI
    // ==========================================================
    state.listeners.services = api.getServices(services => {
        state.services = services;
        // Se o usuário estiver na aba de gerenciar serviços, atualiza a lista em tempo real
        if (document.getElementById('manage-services-content')?.style.display === 'block') {
            renderAdminServicesUI();
        }
    });

    state.listeners.barbers = api.getBarbers(barbers => {
        state.barbers = barbers;
    });

    setupEventListeners();
    const initialPage = window.location.hash.replace('#', '') || 'home';
    loadPage(initialPage);
    window.addEventListener('hashchange', () => loadPage(window.location.hash.replace('#', '') || 'home'));
}
init();