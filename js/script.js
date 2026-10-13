// Configuração da API e Estado da Aplicação
const API_URL = 'http://localhost:3000/agendamentos';
let appointments = [];
let useApi = false;
let selectedMobileDayKey = null;

// Instâncias Modais do Bootstrap
let appointmentModal, detailsModal;

document.addEventListener('DOMContentLoaded', async () => {
  appointmentModal = new bootstrap.Modal(document.getElementById('appointmentModal'));
  detailsModal = new bootstrap.Modal(document.getElementById('detailsModal'));

  // Define o dia selecionado inicialmente como o dia atual (1 a 6)
  const now = new Date();
  let currentDayOfWeek = now.getDay();
  if (currentDayOfWeek === 0 || currentDayOfWeek === 7) currentDayOfWeek = 1;
  selectedMobileDayKey = currentDayOfWeek;

  await initAppointments();

  renderCalendar();
  renderWeekCards();

  document.getElementById('appointmentForm').addEventListener('submit', handleFormSubmit);
  document.getElementById('btnOpenAddModal').addEventListener('click', prepareAddModal);

  window.addEventListener('resize', renderWeekCards);
});

async function initAppointments() {
  try {
    const response = await fetch(API_URL);
    if (response.ok) {
      appointments = await response.json();
      useApi = true;
      return;
    }
  } catch (e) {
    console.log('Servidor REST não detectado. Utilizando armazenamento local (localStorage).');
  }

  const localData = localStorage.getItem('appointments');
  if (localData) {
    appointments = JSON.parse(localData);
  } else {
    try {
      const response = await fetch('../agendamentos.json');
      if (response.ok) {
        appointments = await response.json();
        saveLocalData();
      }
    } catch (error) {
      appointments = [];
    }
  }
}

async function saveAppointment(appointmentData, isEdit) {
  if (useApi) {
    if (isEdit) {
      await fetch(`${API_URL}/${appointmentData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appointmentData)
      });
    } else {
      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appointmentData)
      });
    }
    await initAppointments();
  } else {
    if (isEdit) {
      const index = appointments.findIndex(a => a.id === appointmentData.id);
      if (index !== -1) appointments[index] = appointmentData;
    } else {
      appointments.push(appointmentData);
    }
    saveLocalData();
  }
}

async function removeAppointment(id) {
  if (useApi) {
    await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    await initAppointments();
  } else {
    appointments = appointments.filter(a => a.id !== id);
    saveLocalData();
  }
}

function saveLocalData() {
  localStorage.setItem('appointments', JSON.stringify(appointments));
}

function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function findTimeConflict(newApp) {
  const newStart = timeToMinutes(newApp.time);
  const newDuration = newApp.duration ? parseInt(newApp.duration) : 30;
  const newEnd = newStart + newDuration;

  for (const app of appointments) {
    if (String(app.id) === String(newApp.id)) continue;

    if (app.date === newApp.date) {
      const existingStart = timeToMinutes(app.time);
      const existingDuration = app.duration ? parseInt(app.duration) : 30;
      const existingEnd = existingStart + existingDuration;

      if (newStart < existingEnd && newEnd > existingStart) {
        return {
          conflict: true,
          conflictingApp: app,
          suggestedStart: minutesToTime(existingEnd)
        };
      }
    }
  }

  return { conflict: false };
}

function generateFlipClockHtml(timeStr) {
  const [hh, mm] = timeStr.split(':');
  return `
    <div class="flip-clock">
      <span class="flip-card">${hh}</span>
      <span class="flip-dots">:</span>
      <span class="flip-card">${mm}</span>
    </div>
  `;
}

function renderCalendar() {
  const grid = document.getElementById('calendarDaysGrid');
  grid.innerHTML = '';

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  document.getElementById('displayDayNumber').innerText = now.getDate();
  const monthNames = ["JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO", "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"];
  document.getElementById('displayMonthYear').innerText = `${monthNames[month]} - ${year}`;

  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const currentDay = now.getDate();

  const currentDayOfWeek = now.getDay();
  const sundayOfCurrentWeek = currentDay - currentDayOfWeek;
  const saturdayOfCurrentWeek = sundayOfCurrentWeek + 6;

  for (let i = 0; i < firstDay; i++) {
    grid.innerHTML += `<div class="cal-day-cell"></div>`;
  }

  for (let day = 1; day <= totalDays; day++) {
    const isToday = day === currentDay;
    const isCurrentWeek = day >= sundayOfCurrentWeek && day <= saturdayOfCurrentWeek;

    let classes = 'cal-day-cell';
    if (isCurrentWeek) classes += ' current-week-day';
    if (isToday) classes += ' current-day-selected';

    grid.innerHTML += `<div class="${classes}">${day}</div>`;
  }
}

// Renderiza Mini Cards Seletores para Telas Pequenas
function renderMobileSelectors(daysConfig) {
  const selectorsContainer = document.getElementById('mobileDaySelectors');
  selectorsContainer.innerHTML = '';

  daysConfig.forEach(day => {
    const miniCard = document.createElement('div');
    const isActive = day.key === selectedMobileDayKey ? 'active' : '';
    miniCard.className = `mini-day-card ${isActive}`;
    miniCard.innerText = day.short;
    miniCard.onclick = () => {
      selectedMobileDayKey = day.key;
      renderWeekCards();
    };
    selectorsContainer.appendChild(miniCard);
  });
}

// Renderização dos Cards dos Dias da Semana
function renderWeekCards() {
  const container = document.getElementById('weekCardsContainer');
  container.innerHTML = '';

  const now = new Date();
  let todayKey = now.getDay();
  if (todayKey === 0) todayKey = 7;

  const isMobile = window.innerWidth <= 768;

  const daysConfig = [
    { name: 'Segunda', short: 'Seg', key: 1, class: 'card-segunda' },
    { name: 'Terça',   short: 'Ter', key: 2, class: 'card-terca' },
    { name: 'Quarta',  short: 'Qua', key: 3, class: 'card-quarta' },
    { name: 'Quinta',  short: 'Qui', key: 4, class: 'card-quinta' },
    { name: 'Sexta',   short: 'Sex', key: 5, class: 'card-sexta' },
    { name: 'Sábado',  short: 'Sáb', key: 6, class: 'card-sabado' }
  ];

  renderMobileSelectors(daysConfig);

  daysConfig.forEach(day => {
    const isPast = day.key < todayKey;
    
    // No mobile exibe apenas o card do dia selecionado nos mini cards
    // No desktop (largura > 768px), exibe TODOS os 6 dias da semana
    if (isMobile && day.key !== selectedMobileDayKey) {
      return;
    }

    // No desktop, dias passados recebem opacidade e filtro desativado
    const disabledClass = (!isMobile && isPast) ? 'card-disabled' : '';

    const dayAppointments = appointments
      .filter(app => {
        const appDate = new Date(app.date + 'T00:00:00');
        return appDate.getDay() === day.key;
      })
      .sort((a, b) => a.time.localeCompare(b.time));

    let itemsHtml = '';
    dayAppointments.forEach(app => {
      itemsHtml += `
        <div class="appointment-item d-flex align-items-center mb-3">
          <div class="cursor-pointer" onclick="showDetails('${app.id}')">
            ${generateFlipClockHtml(app.time)}
          </div>
          
          <div class="appointment-content d-flex justify-content-between align-items-center flex-grow-1 ms-2">
            <span class="fw-semibold cursor-pointer ms-1" onclick="showDetails('${app.id}')">${app.title}</span>
            <div>
              <button class="action-btn text-danger me-1" onclick="deleteAppointment('${app.id}')" title="Excluir">
                <i class="bi bi-x-circle-fill"></i>
              </button>
              <button class="action-btn text-success" onclick="prepareEditModal('${app.id}')" title="Editar">
                <i class="bi bi-pencil-fill"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    });

    const col = document.createElement('div');
    col.className = 'col-md-6';
    col.innerHTML = `
      <div class="day-card ${day.class} ${disabledClass}">
        <div class="day-title">${day.name} ${(!isMobile && isPast) ? '<small class="fs-6 fw-normal ms-2 opacity-75">(Concluído)</small>' : ''}</div>
        <div class="appointments-list">${itemsHtml || '<small class="opacity-75">Nenhum compromisso</small>'}</div>
      </div>
    `;
    container.appendChild(col);
  });
}

async function handleFormSubmit(e) {
  e.preventDefault();

  const id = document.getElementById('appointmentId').value;
  const isEdit = Boolean(id);

  const appointmentData = {
    id: isEdit ? id : String(Date.now()),
    date: document.getElementById('date').value,
    time: document.getElementById('time').value,
    duration: document.getElementById('duration').value ? parseInt(document.getElementById('duration').value) : null,
    title: document.getElementById('title').value,
    description: document.getElementById('description').value,
    location: document.getElementById('location').value,
    phone: document.getElementById('phone').value
  };

  const conflictCheck = findTimeConflict(appointmentData);

  if (conflictCheck.conflict) {
    const conflicting = conflictCheck.conflictingApp;
    const dur = conflicting.duration ? `${conflicting.duration} min` : '30 min (padrão)';

    Swal.fire({
      icon: 'error',
      title: 'Conflito de Horário!',
      html: `
        Já existe o compromisso <strong>"${conflicting.title}"</strong> às <strong>${conflicting.time}</strong> (duração: ${dur}).<br><br>
        Horário livre sugerido a partir de: <strong>${conflictCheck.suggestedStart}</strong>.
      `,
      confirmButtonColor: '#e87234'
    });

    return;
  }

  await saveAppointment(appointmentData, isEdit);
  appointmentModal.hide();
  renderWeekCards();

  Swal.fire({
    icon: 'success',
    title: isEdit ? 'Compromisso atualizado!' : 'Compromisso adicionado!',
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 2500,
    timerProgressBar: true
  });
}

function prepareAddModal() {
  document.getElementById('appointmentForm').reset();
  document.getElementById('appointmentId').value = '';
  document.getElementById('modalTitle').innerText = 'Novo Compromisso';
}

function prepareEditModal(id) {
  const app = appointments.find(a => String(a.id) === String(id));
  if (!app) return;

  document.getElementById('appointmentId').value = app.id;
  document.getElementById('date').value = app.date;
  document.getElementById('time').value = app.time;
  document.getElementById('duration').value = app.duration || '';
  document.getElementById('title').value = app.title;
  document.getElementById('description').value = app.description || '';
  document.getElementById('location').value = app.location || '';
  document.getElementById('phone').value = app.phone || '';

  document.getElementById('modalTitle').innerText = 'Editar Compromisso';
  appointmentModal.show();
}

function deleteAppointment(id) {
  const app = appointments.find(a => String(a.id) === String(id));
  
  Swal.fire({
    title: 'Excluir compromisso?',
    text: `Deseja remover "${app ? app.title : 'este item'}" da sua agenda?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Sim, excluir',
    cancelButtonText: 'Cancelar'
  }).then(async (result) => {
    if (result.isConfirmed) {
      await removeAppointment(id);
      renderWeekCards();

      Swal.fire({
        icon: 'success',
        title: 'Excluído!',
        text: 'O compromisso foi removido.',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000
      });
    }
  });
}

function showDetails(id) {
  const app = appointments.find(a => String(a.id) === String(id));
  if (!app) return;

  const detailBody = document.getElementById('detailBody');
  detailBody.innerHTML = `
    <p><strong>Título:</strong> ${app.title}</p>
    <p><strong>Data:</strong> ${app.date}</p>
    <p><strong>Horário:</strong> ${app.time} ${app.duration ? `(${app.duration} min)` : ''}</p>
    ${app.description ? `<p><strong>Detalhes:</strong> ${app.description}</p>` : ''}
    ${app.location ? `<p><strong>Local:</strong> ${app.location}</p>` : ''}
    ${app.phone ? `<p><strong>Telefone:</strong> ${app.phone}</p>` : ''}
  `;

  detailsModal.show();
}