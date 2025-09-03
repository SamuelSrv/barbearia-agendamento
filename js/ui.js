export function renderBarbers(barbers, targetId) {
    const container = document.getElementById(targetId);
    if (!container) return;
    container.innerHTML = '';
    if (barbers.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-400 col-span-full">Nenhum barbeiro encontrado.</p>';
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
        container.appendChild(div);
    });
}

export function renderAdminBarbers(barbers) {
    const container = document.getElementById('admin-barbers-list');
    if (!container) return;
    container.innerHTML = `<h3 class="text-2xl font-bold mb-4">Barbeiros Cadastrados</h3>`;
    if (barbers.length === 0) {
        container.innerHTML += '<p class="text-center text-gray-400">Nenhum barbeiro cadastrado.</p>';
        return;
    }
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

export function populateBarberSelect(barbers) {
    const select = document.getElementById('barber-select');
    if (!select) return;
    select.innerHTML = '<option value="">Selecione um barbeiro</option>';
    barbers.forEach(barber => {
        const option = document.createElement('option');
        option.value = barber.id;
        option.textContent = barber.name;
        option.dataset.name = barber.name;
        select.appendChild(option);
    });
}

export function renderTimeSlots(bookedSlots) {
    const container = document.getElementById('time-slots');
    if (!container) return;
    container.innerHTML = '';
    document.getElementById('booking-form-container').classList.add('hidden');

    const openingHour = 9, closingHour = 18;
    let slotsAvailable = false;

    for (let hour = openingHour; hour < closingHour; hour++) {
        const time = `${String(hour).padStart(2, '0')}:00`;
        const isBooked = bookedSlots.includes(time);
        
        const button = document.createElement('button');
        button.textContent = time;
        button.dataset.time = time;
        button.className = `p-2 rounded-lg font-semibold text-center ${isBooked ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-amber-400 text-gray-900 hover:bg-amber-500'}`;
        if (isBooked) button.disabled = true;
        else slotsAvailable = true;
        container.appendChild(button);
    }
    if(!slotsAvailable) {
        container.innerHTML = '<p class="text-gray-400 col-span-full text-center">Nenhum horário disponível. Por favor, selecione outro dia.</p>';
    }
}

export function renderBarberAppointments(appointments) {
    const container = document.getElementById('barber-appointments-list');
    if(!container) return;
    container.innerHTML = '';
    if (appointments.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-400 mt-4">Nenhum agendamento para esta data.</p>';
        return;
    }
    appointments.sort((a, b) => a.time.localeCompare(b.time));
    appointments.forEach(app => {
        const div = document.createElement('div');
        div.className = 'bg-gray-700 p-4 rounded-lg mb-3';
        div.innerHTML = `
            <p class="font-bold text-lg text-amber-400">${app.time}</p>
            <p>Cliente: ${app.clientName}</p>
            <p>Contato: ${app.clientContact}</p>
        `;
        container.appendChild(div);
    });
}

export function updateNav(user) {
    const loggedOutLinks = document.querySelectorAll('#login-nav-link, #login-nav-link-mobile');
    const loggedInLinks = document.querySelectorAll('#admin-nav-link, #logout-nav-link, #admin-nav-link-mobile, #logout-nav-link-mobile');

    if (user) {
        loggedOutLinks.forEach(link => link.classList.add('hidden'));
        loggedInLinks.forEach(link => link.classList.remove('hidden'));
    } else {
        loggedOutLinks.forEach(link => link.classList.remove('hidden'));
        loggedInLinks.forEach(link => link.classList.add('hidden'));
    }
}

export const modal = {
    show(title, message) {
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-message').textContent = message;
        document.getElementById('modal').classList.remove('hidden');
    },
    hide() {
        document.getElementById('modal').classList.add('hidden');
    }
};