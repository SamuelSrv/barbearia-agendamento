// A inicialização do Firebase foi removida daqui, pois agora é centralizada
import { getBarbers, addBarber, removeBarber, getAppointments, createAppointment, getAppointmentsForBarber } from './api.js';
import * as ui from './ui.js';
import * as auth from './auth.js';

// --- ESTADO GLOBAL DA APLICAÇÃO ---
export const state = {
    currentUser: null,
    unsubscribeBarbers: null,
    unsubscribeAppointments: null,
};

// --- ROTEAMENTO E CARREGAMENTO DE PÁGINAS ---
const appContent = document.getElementById('app-content');

export async function loadPage(page) {
    // Limpa listeners antigos para evitar memory leaks
    if (state.unsubscribeBarbers) state.unsubscribeBarbers();
    if (state.unsubscribeAppointments) state.unsubscribeAppointments();

    window.location.hash = page; // Atualiza a URL
    try {
        const response = await fetch(`pages/${page}.html`);
        if (!response.ok) throw new Error('Página não encontrada');
        appContent.innerHTML = await response.text();
        document.title = `Classic Cuts - ${page.charAt(0).toUpperCase() + page.slice(1)}`;
        await setupPage(page);
    } catch (error) {
        console.error("Erro ao carregar página:", error);
        appContent.innerHTML = `<p class="text-center text-red-500">Erro: ${error.message}. <a href="#" data-page="home">Voltar para Home</a>.</p>`;
    }
}

// --- CONFIGURAÇÃO ESPECÍFICA DE CADA PÁGINA ---
async function setupPage(page) {
    switch(page) {
        case 'barbers':
            state.unsubscribeBarbers = getBarbers(barbers => ui.renderBarbers(barbers, 'barbers-list'));
            break;
        case 'schedule':
            document.getElementById('date-select').min = new Date().toISOString().split("T")[0];
            getBarbers(ui.populateBarberSelect);
            break;
        case 'admin':
            if (!state.currentUser) {
                ui.modal.show('Acesso Negado', 'Você precisa estar logado para acessar esta página.');
                loadPage('login');
                return;
            }
            document.getElementById('admin-loader').classList.add('hidden');
            if (state.currentUser.role === 'admin') {
                document.getElementById('admin-content').classList.remove('hidden');
                state.unsubscribeBarbers = getBarbers(ui.renderAdminBarbers);
            } else {
                document.getElementById('barber-content').classList.remove('hidden');
                const today = new Date().toISOString().split("T")[0];
                document.getElementById('barber-schedule-date').value = today;
                state.unsubscribeAppointments = getAppointmentsForBarber(state.currentUser.uid, today, ui.renderBarberAppointments);
            }
            break;
    }
}

// --- EVENT LISTENERS GLOBAIS ---
function setupEventListeners() {
    // Navegação Principal
    document.querySelector('header').addEventListener('click', e => {
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

    // Event listeners dinâmicos para o conteúdo carregado
    appContent.addEventListener('submit', handleFormSubmissions);
    appContent.addEventListener('change', handleDynamicChanges);
    appContent.addEventListener('click', handleDynamicClicks);

    // Modal
    document.getElementById('modal-close').addEventListener('click', ui.modal.hide);
}

// --- HANDLERS DE EVENTOS DINÂMICOS ---
async function handleFormSubmissions(e) {
    e.preventDefault();
    if (e.target.id === 'login-form') {
        const email = e.target.querySelector('#login-email').value;
        const password = e.target.querySelector('#login-password').value;
        try {
            await auth.login(email, password);
            loadPage('admin');
        } catch (error) {
            e.target.querySelector('#login-error').textContent = "Email ou senha inválidos.";
        }
    }
    if (e.target.id === 'add-barber-form') {
        const name = e.target.querySelector('#barber-name').value;
        const imageUrl = e.target.querySelector('#barber-photo').value;
        const about = e.target.querySelector('#barber-about').value;
        try {
            await addBarber(name, imageUrl, about);
            ui.modal.show("Sucesso!", "Barbeiro adicionado.");
            e.target.reset();
        } catch(error) { ui.modal.show("Erro", "Não foi possível adicionar o barbeiro."); }
    }
    if (e.target.id === 'booking-form') {
        const appointmentData = {
            barberId: e.target.querySelector('#selected-barber-id').value,
            barberName: e.target.querySelector('#selected-barber-name').value,
            date: e.target.querySelector('#selected-date').value,
            time: e.target.querySelector('#selected-time').value,
            clientName: e.target.querySelector('#client-name').value,
            clientContact: e.target.querySelector('#client-phone').value,
        };
        try {
            await createAppointment(appointmentData);
            ui.modal.show("Confirmado!", `Seu horário com ${appointmentData.barberName} às ${appointmentData.time} foi agendado.`);
            loadPage('schedule'); // Recarrega a página de agendamento
        } catch(error) { ui.modal.show("Erro", "Não foi possível agendar."); }
    }
}

async function handleDynamicChanges(e) {
    if (e.target.matches('#barber-select, #date-select')) {
        const barberId = document.getElementById('barber-select').value;
        const date = document.getElementById('date-select').value;
        if (barberId && date) {
            document.getElementById('schedule-loader').classList.remove('hidden');
            const appointments = await getAppointments(barberId, date);
            const bookedSlots = appointments.map(app => app.time);
            ui.renderTimeSlots(bookedSlots);
            document.getElementById('schedule-loader').classList.add('hidden');
            document.getElementById('time-slots-container').classList.remove('hidden');
        }
    }
    if (e.target.id === 'barber-schedule-date') {
        if(state.unsubscribeAppointments) state.unsubscribeAppointments();
        state.unsubscribeAppointments = getAppointmentsForBarber(state.currentUser.uid, e.target.value, ui.renderBarberAppointments);
    }
}

async function handleDynamicClicks(e) {
     if (e.target.closest('.remove-barber-btn')) {
        const id = e.target.closest('.remove-barber-btn').dataset.id;
        if (confirm("Tem certeza que deseja remover este barbeiro?")) {
            try {
                await removeBarber(id);
                ui.modal.show("Sucesso!", "Barbeiro removido.");
            } catch(error) { ui.modal.show("Erro", "Não foi possível remover."); }
        }
    }
    if (e.target.matches('#time-slots button') && !e.target.disabled) {
        const selected = document.querySelector('#time-slots button.bg-orange-600');
        if(selected) selected.classList.replace('bg-orange-600','bg-zinc-700');
        e.target.classList.replace('bg-zinc-700', 'bg-orange-600');

        const barberSelect = document.getElementById('barber-select');
        const selectedOption = barberSelect.options[barberSelect.selectedIndex];

        document.getElementById('selected-barber-id').value = barberSelect.value;
        document.getElementById('selected-barber-name').value = selectedOption.dataset.name;
        document.getElementById('selected-date').value = document.getElementById('date-select').value;
        document.getElementById('selected-time').value = e.target.dataset.time;
        document.getElementById('booking-form-container').classList.remove('hidden');
    }
}

// --- INICIALIZAÇÃO DA APLICAÇÃO ---
function init() {
    auth.setupAuthListener();
    setupEventListeners();
    const initialPage = window.location.hash.replace('#', '') || 'home';
    loadPage(initialPage);
    window.addEventListener('hashchange', () => {
        const page = window.location.hash.replace('#', '') || 'home';
        loadPage(page);
    });
}

init();