let charts = {}; // Para armazenar instâncias de gráficos e destruí-las

// --- RENDERIZAÇÃO PÚBLICA E DE AGENDAMENTO ---
export function renderServicesList(services, onSelect) {
    const container = document.getElementById('services-list');
    if (!container) return;
    container.innerHTML = services.length > 0 ? '' : '<p>Nenhum serviço disponível no momento.</p>';
    services.forEach(service => {
        const button = document.createElement('button');
        button.className = 'bg-gray-700 p-4 rounded-lg text-left hover:bg-gray-600 border-2 border-transparent focus:border-amber-500 focus:outline-none transition-all';
        button.innerHTML = `
            <h4 class="font-bold text-white">${service.name}</h4>
            <p class="text-sm text-gray-400">${service.duration} min - R$${service.price}</p>
        `;
        button.addEventListener('click', () => {
            container.querySelectorAll('button').forEach(btn => btn.classList.remove('border-amber-500', 'bg-gray-600'));
            button.classList.add('border-amber-500', 'bg-gray-600');
            onSelect(service);
        });
        container.appendChild(button);
    });
}

export function populateBarberSelect(barbers, selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;
    select.innerHTML = '<option value="">Selecione um barbeiro</option>';
    barbers.forEach(barber => {
        const option = document.createElement('option');
        option.value = barber.id;
        option.textContent = barber.name;
        select.appendChild(option);
    });
}

export function initPhoneMask(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        IMask(element, { mask: '(00) 00000-0000' });
    }
}

export function initDatePicker(elementId, onDateSelect, disabledDates = []) {
    const element = document.getElementById(elementId);
    if (element) {
        if (element._flatpickr) {
            element._flatpickr.destroy();
        }
        flatpickr(element, {
            locale: "pt",
            minDate: "today",
            dateFormat: "Y-m-d",
            disable: [
                function(date) {
                    return (date.getDay() === 0); // Desabilita apenas Domingos
                },
                ...disabledDates
            ],
            onChange: function(selectedDates, dateStr) {
                onDateSelect(dateStr);
            },
        });
    }
}

export function renderTimeSlots(slots, onSelect) {
    const container = document.getElementById('time-slots');
    if (!container) return;
    container.innerHTML = slots.length > 0 ? '' : '<p class="text-gray-400 col-span-full text-center">Nenhum horário disponível para esta data.</p>';
    slots.forEach(time => {
        const button = document.createElement('button');
        button.textContent = time;
        button.className = 'bg-gray-700 p-2 rounded-lg hover:bg-amber-500 transition-colors';
        button.addEventListener('click', () => {
            container.querySelectorAll('button').forEach(btn => btn.classList.remove('bg-amber-600', 'text-gray-900'));
            button.classList.add('bg-amber-600', 'text-gray-900');
            onSelect(time);
        });
        container.appendChild(button);
    });
}

// --- RENDERIZAÇÃO DO PAINEL DE ADMIN E BARBEIRO ---
export function renderAdminTabs(role) {
    const tabsContainer = document.getElementById('admin-tabs');
    if (!tabsContainer) return;
    const allTabs = {
        'dashboard': 'Dashboard',
        'manage-barbers': 'Barbeiros',
        'manage-services': 'Serviços',
        'manage-schedules': 'Horários',
        'my-schedule': 'Minha Agenda'
    };
    const visibleTabs = role === 'admin'
        ? ['dashboard', 'manage-barbers', 'manage-services', 'manage-schedules']
        : ['my-schedule'];

    tabsContainer.innerHTML = '';
    visibleTabs.forEach(tabId => {
        const a = document.createElement('a');
        a.href = '#';
        a.dataset.tab = tabId;
        a.className = 'px-3 py-2 font-medium text-sm rounded-md text-gray-300 hover:bg-gray-700';
        a.textContent = allTabs[tabId];
        tabsContainer.appendChild(a);
    });
}

export function switchAdminTab(tabId) {
    document.querySelectorAll('.admin-tab-pane').forEach(pane => pane.style.display = 'none');
    document.querySelectorAll('#admin-tabs a').forEach(a => a.classList.remove('bg-gray-900', 'text-white'));

    const activePane = document.getElementById(`${tabId}-content`);
    const activeTab = document.querySelector(`#admin-tabs a[data-tab="${tabId}"]`);

    if (activePane) activePane.style.display = 'block';
    if (activeTab) activeTab.classList.add('bg-gray-900', 'text-white');
}

export function renderAdminServices(services, onEdit, onRemove) {
    const container = document.getElementById('admin-services-list');
    if (!container) return;
    container.innerHTML = `<h3 class="text-2xl font-bold mb-4">Serviços Cadastrados</h3>`;
    services.forEach(service => {
        const div = document.createElement('div');
        div.className = 'flex justify-between items-center bg-gray-700 p-3 rounded mb-2';
        div.innerHTML = `
            <span>${service.name} (${service.duration} min) - R$${service.price}</span>
            <div>
                <button data-id="${service.id}" class="edit-service-btn bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 px-3 rounded mr-2">Editar</button>
                <button data-id="${service.id}" class="remove-service-btn bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded">Remover</button>
            </div>
        `;
        div.querySelector('.edit-service-btn').addEventListener('click', (e) => onEdit(e.target.dataset.id));
        div.querySelector('.remove-service-btn').addEventListener('click', (e) => onRemove(e.target.dataset.id));
        container.appendChild(div);
    });
}

export function renderWorkScheduleForm(schedule = {}) {
    const container = document.getElementById('work-schedule-form');
    if(!container) return;
    const daysOfWeek = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

    container.innerHTML = '';
    dayKeys.forEach((dayKey, index) => {
        const dayData = schedule[dayKey] || { active: true, start: '09:00', end: '18:00', breakStart: '12:00', breakEnd: '13:00' };
        const isChecked = dayData.active !== false;

        const fieldset = document.createElement('fieldset');
        fieldset.className = 'grid grid-cols-6 gap-4 items-center mb-4 bg-gray-700 p-4 rounded';
        fieldset.innerHTML = `
            <div class="col-span-1">
                <input type="checkbox" id="${dayKey}-active" name="${dayKey}-active" class="mr-2 h-4 w-4 rounded" ${isChecked ? 'checked' : ''}>
                <label for="${dayKey}-active" class="font-bold">${daysOfWeek[index]}</label>
            </div>
            <div class="col-span-1"><label for="${dayKey}-start">Início</label><input type="time" name="${dayKey}-start" value="${dayData.start || ''}" class="bg-gray-600 rounded p-1 w-full" ${!isChecked ? 'disabled' : ''}></div>
            <div class="col-span-1"><label for="${dayKey}-end">Fim</label><input type="time" name="${dayKey}-end" value="${dayData.end || ''}" class="bg-gray-600 rounded p-1 w-full" ${!isChecked ? 'disabled' : ''}></div>
            <div class="col-span-1"><label>Pausa Início</label><input type="time" name="${dayKey}-breakStart" value="${dayData.breakStart || ''}" class="bg-gray-600 rounded p-1 w-full" ${!isChecked ? 'disabled' : ''}></div>
            <div class="col-span-1"><label>Pausa Fim</label><input type="time" name="${dayKey}-breakEnd" value="${dayData.breakEnd || ''}" class="bg-gray-600 rounded p-1 w-full" ${!isChecked ? 'disabled' : ''}></div>
        `;
        container.appendChild(fieldset);
        fieldset.querySelector(`#${dayKey}-active`).addEventListener('change', (e) => {
            fieldset.querySelectorAll('input[type="time"]').forEach(input => input.disabled = !e.target.checked);
        });
    });
}

export function renderBarberDaySchedule(slots, onSlotClick) {
    const container = document.getElementById('barber-day-schedule');
    if (!container) return;
    container.innerHTML = '';
    if (slots.length === 0) {
        container.innerHTML = '<p class="text-gray-400 text-center">Você não trabalha neste dia ou não há horários definidos.</p>';
        return;
    }

    slots.forEach(slot => {
        const div = document.createElement('div');
        let bgColor = 'bg-gray-700';
        let content = `<span>${slot.time}</span>`;
        let actionButton = `<button class="text-xs bg-blue-500 hover:bg-blue-600 px-2 py-1 rounded">Bloquear</button>`;

        if (slot.type === 'appointment') {
            bgColor = 'bg-red-900';
            content = `<div class="flex flex-col"><span class="font-bold">${slot.time} - ${slot.details.serviceName}</span><span class="text-sm">${slot.details.clientName}</span></div>`;
            actionButton = '';
        } else if (slot.type === 'blocked') {
            bgColor = 'bg-gray-600 text-gray-400';
            content = `<span>${slot.time} - Bloqueado</span>`;
            actionButton = `<button class="text-xs bg-green-500 hover:bg-green-600 px-2 py-1 rounded">Desbloquear</button>`;
        }

        div.className = `${bgColor} p-3 rounded-lg flex justify-between items-center mb-2`;
        div.innerHTML = `
            <div class="flex flex-col text-sm">${content}</div>
            <div class="slot-action">${actionButton}</div>
        `;
        div.querySelector('.slot-action button')?.addEventListener('click', () => onSlotClick(slot));
        container.appendChild(div);
    });
}


// --- GRÁFICOS DO DASHBOARD ---
function destroyChart(chartId) {
    if (charts[chartId]) {
        charts[chartId].destroy();
        delete charts[chartId];
    }
}

export function renderWeeklyAppointmentsChart(data) {
    const chartId = 'appointments-chart-week';
    destroyChart(chartId);
    const ctx = document.getElementById(chartId)?.getContext('2d');
    if (!ctx) return;

    charts[chartId] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Agendamentos',
                data: data.values,
                backgroundColor: 'rgba(251, 146, 60, 0.2)',
                borderColor: 'rgba(251, 146, 60, 1)',
                borderWidth: 2,
                tension: 0.3,
                pointBackgroundColor: 'rgba(251, 146, 60, 1)'
            }]
        },
        options: { scales: { y: { beginAtZero: true, ticks: { color: '#9ca3af' } }, x: { ticks: { color: '#9ca3af' } } } }
    });
}

export function renderBarberAppointmentsChart(data) {
     const chartId = 'appointments-chart-barber';
    destroyChart(chartId);
    const ctx = document.getElementById(chartId)?.getContext('2d');
    if (!ctx) return;

    charts[chartId] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Agendamentos no Mês',
                data: data.values,
                backgroundColor: ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#6366f1'],
            }]
        },
        options: { indexAxis: 'y', scales: { y: { ticks: { color: '#9ca3af' } }, x: { ticks: { color: '#9ca3af' } } } }
    });
}