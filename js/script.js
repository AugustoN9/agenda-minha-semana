// Estado da Aplicação
let appointments = [];

// Instâncias Modais do Bootstrap
let appointmentModal, detailsModal;

document.addEventListener('DOMContentLoaded', async () => {
  appointmentModal = new bootstrap.Modal(document.getElementById('appointmentModal'));
  detailsModal = new bootstrap.Modal(document.getElementById('detailsModal'));

  // Carrega os compromissos do JSON / LocalStorage
  await initAppointments();

  renderCalendar();
  renderWeekCards();

  document.getElementById('appointmentForm').addEventListener('submit', handleFormSubmit);
  document.getElementById('btnOpenAddModal').addEventListener('click', prepareAddModal);
});

// Inicialização: Busca dados do agendamentos.json ou do localStorage
async function initAppointments() {
  const localData = localStorage.getItem('appointments');

  if (localData) {
    appointments = JSON.parse(localData);
  } else {
    try {
      const response = await fetch('../agendamentos.json');
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      appointments = await response.json();
      saveData();
    } catch (error) {
      console.error('Erro ao carregar o agendamentos.json:', error);
      appointments = [];
    }
  }
}

// Converte string de hora ("16:00") para minutos totais do dia (960 min)
function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

// Converte minutos do dia para formato "HH:mm"
function minutesToTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

// Verifica se há conflito de horário
function findTimeConflict(newApp) {
  const newStart = timeToMinutes(newApp.time);
  const newDuration = newApp.duration ? parseInt(newApp.duration) : 30; // Padrão: 30 min
  const newEnd = newStart + newDuration;

  for (const app of appointments) {
    // Ignora o próprio registro se estiver editando
    if (app.id === newApp.id) continue;

    // Apenas verifica compromissos do mesmo dia
    if (app.date === newApp.date) {
      const existingStart = timeToMinutes(app.time);
      const existingDuration = app.duration ? parseInt(app.duration) : 30; // Padrão: 30 min
      const existingEnd = existingStart + existingDuration;

      // H2 > H1_inicio E H1 < H2_fim (fórmula clássica de sobreposição de intervalos)
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

// Gera HTML do Relógio Flip Clock para os horários
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

// Renderização do Calendário com leve sombreado na semana corrente
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

// Renderização dos Cards dos Dias da Semana (Ordenados por horário)
function renderWeekCards() {
  const container = document.getElementById('weekCardsContainer');
  container.innerHTML = '';

  const daysConfig = [
    { name: 'Segunda', key: 1, class: 'card-segunda' },
    { name: 'Terça',   key: 2, class: 'card-terca' },
    { name: 'Quarta',  key: 3, class: 'card-quarta' },
    { name: 'Quinta',  key: 4, class: 'card-quinta' },
    { name: 'Sexta',   key: 5, class: 'card-sexta' },
    { name: 'Sábado',  key: 6, class: 'card-sabado' }
  ];

  daysConfig.forEach(day => {
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
          <div class="cursor-pointer" onclick="showDetails(${app.id})">
            ${generateFlipClockHtml(app.time)}
          </div>
          
          <div class="appointment-content d-flex justify-content-between align-items-center flex-grow-1 ms-2">
            <span class="fw-semibold cursor-pointer ms-1" onclick="showDetails(${app.id})">${app.title}</span>
            <div>
              <button class="action-btn text-danger me-1" onclick="deleteAppointment(${app.id})" title="Excluir">
                <i class="bi bi-x-circle-fill"></i>
              </button>
              <button class="action-btn text-success" onclick="prepareEditModal(${app.id})" title="Editar">
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
      <div class="day-card ${day.class}">
        <div class="day-title">${day.name}</div>
        <div class="appointments-list">${itemsHtml || '<small class="opacity-75">Nenhum compromisso</small>'}</div>
      </div>
    `;
    container.appendChild(col);
  });
}

// Salvar / Editar Compromisso com Validação de Conflito de Horário
function handleFormSubmit(e) {
  e.preventDefault();

  const id = document.getElementById('appointmentId').value;
  const isEdit = Boolean(id);

  const appointmentData = {
    id: isEdit ? parseInt(id) : Date.now(),
    date: document.getElementById('date').value,
    time: document.getElementById('time').value,
    duration: document.getElementById('duration').value ? parseInt(document.getElementById('duration').value) : null,
    title: document.getElementById('title').value,
    description: document.getElementById('description').value,
    location: document.getElementById('location').value,
    phone: document.getElementById('phone').value
  };

  // --- VALIDAÇÃO DE CONFLITO ---
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

    return; // Bloqueia o salvamento
  }

  // Se não houver conflito, salva normalmente
  if (isEdit) {
    const index = appointments.findIndex(a => a.id === parseInt(id));
    if (index !== -1) appointments[index] = appointmentData;
  } else {
    appointments.push(appointmentData);
  }

  saveData();
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

// Preparar modal para adição
function prepareAddModal() {
  document.getElementById('appointmentForm').reset();
  document.getElementById('appointmentId').value = '';
  document.getElementById('modalTitle').innerText = 'Novo Compromisso';
}

// Preparar modal para edição
function prepareEditModal(id) {
  const app = appointments.find(a => a.id === id);
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

// Excluir Compromisso com Modal SweetAlert2
function deleteAppointment(id) {
  const app = appointments.find(a => a.id === id);
  
  Swal.fire({
    title: 'Excluir compromisso?',
    text: `Deseja remover "${app ? app.title : 'este item'}" da sua agenda?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Sim, excluir',
    cancelButtonText: 'Cancelar'
  }).then((result) => {
    if (result.isConfirmed) {
      appointments = appointments.filter(a => a.id !== id);
      saveData();
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

// Exibir Detalhes no Modal
function showDetails(id) {
  const app = appointments.find(a => a.id === id);
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

function saveData() {
  localStorage.setItem('appointments', JSON.stringify(appointments));
}