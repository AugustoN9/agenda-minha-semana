// Configuração da API e Estado da Aplicação
const API_URL = 'http://localhost:3000/agendamentos';
let appointments = [];
let useApi = false;

// Estado Global de Data Selecionada no Calendário
let currentCalendarDate = new Date();

// Nomes dos meses em Português
const MONTH_NAMES = [
  "JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO",
  "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"
];

// Dicionário de Feriados Nacionais e Pontos Facultativos (Formato YYYY-MM-DD)
const NATIONAL_HOLIDAYS = {
  // Feriados 2026
  "2026-01-01": "Confraternização Universal",
  "2026-02-16": "Carnaval (Ponto Facultativo)",
  "2026-02-17": "Carnaval (Ponto Facultativo)",
  "2026-04-03": "Sexta-feira Santa",
  "2026-04-21": "Tiradentes",
  "2026-05-01": "Dia do Trabalhador",
  "2026-06-04": "Corpus Christi (Ponto Facultativo)",
  "2026-09-07": "Independência do Brasil",
  "2026-09-20": "Revolução Farroupilha (RS)",
  "2026-10-12": "Nossa Senhora Aparecida / Dia das Crianças",
  "2026-10-28": "Dia do Servidor Público (Ponto Facultativo)",
  "2026-11-02": "Finados",
  "2026-11-15": "Proclamação da República",
  "2026-11-20": "Dia da Consciência Negra",
  "2026-12-25": "Natal",
  
  // Feriados 2027
  "2027-01-01": "Confraternização Universal",
  "2027-02-08": "Carnaval (Ponto Facultativo)",
  "2027-02-09": "Carnaval (Ponto Facultativo)",
  "2027-03-26": "Sexta-feira Santa",
  "2027-04-21": "Tiradentes",
  "2027-05-01": "Dia do Trabalhador",
  "2027-05-27": "Corpus Christi (Ponto Facultativo)",
  "2027-09-07": "Independência do Brasil",
  "2027-09-20": "Revolução Farroupilha (RS)",
  "2027-10-12": "Nossa Senhora Aparecida",
  "2027-11-02": "Finados",
  "2027-11-15": "Proclamação da República",
  "2027-11-20": "Dia da Consciência Negra",
  "2027-12-25": "Natal"
};

function getHolidayName(dateIso) {
  return NATIONAL_HOLIDAYS[dateIso] || null;
}

// Calcula o semestre letivo (ex: "2026/2" ou "2027/1") com base no ano e mês do calendário
function getCurrentSemesterFromCalendar() {
  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth(); // 0-11
  const period = month >= 6 ? '2' : '1'; // Meses Jan-Jun = 1º Semestre, Jul-Dez = 2º Semestre
  return `${year}/${period}`;
}

// Instâncias Modais do Bootstrap
let appointmentModal, detailsModal;

document.addEventListener('DOMContentLoaded', async () => {
  appointmentModal = new bootstrap.Modal(document.getElementById('appointmentModal'));
  detailsModal = new bootstrap.Modal(document.getElementById('detailsModal'));

  await initAppointments();
  renderMainGrid();

  document.getElementById('appointmentForm').addEventListener('submit', handleFormSubmit);
  document.getElementById('btnOpenAddModal').addEventListener('click', prepareAddModal);

  window.addEventListener('resize', renderMainGrid);
});

function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

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

    if (app.date === newApp.date && !app.isCanceled) {
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

function generateCalendarHtml() {
  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();
  const selectedDay = currentCalendarDate.getDate();

  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const selectedDayOfWeek = currentCalendarDate.getDay();
  const sundayOfSelectedWeek = selectedDay - selectedDayOfWeek;
  const saturdayOfSelectedWeek = sundayOfSelectedWeek + 6;

  let daysGridHtml = '';

  for (let i = 0; i < firstDay; i++) {
    daysGridHtml += `<div class="cal-day-cell"></div>`;
  }

  for (let day = 1; day <= totalDays; day++) {
    const isSelected = day === selectedDay;
    const isSelectedWeek = day >= sundayOfSelectedWeek && day <= saturdayOfSelectedWeek;

    let classes = 'cal-day-cell clickable';
    if (isSelectedWeek) classes += ' current-week-day';
    if (isSelected) classes += ' current-day-selected';

    daysGridHtml += `
      <div class="${classes}" onclick="selectCalendarDay(${day})">
        ${day}
      </div>
    `;
  }

  return `
    <div class="calendar-split-container">
      <div class="calendar-left-panel cal-bg-month-${month}">
        <div class="selected-year-display">${year}</div>
        <div class="selected-day-display">${selectedDay}</div>
        
        <div class="month-navigator">
          <i class="bi bi-chevron-left month-nav-btn" onclick="changeMonth(-1)" title="Mês anterior"></i>
          <span>${MONTH_NAMES[month]}</span>
          <i class="bi bi-chevron-right month-nav-btn" onclick="changeMonth(1)" title="Próximo mês"></i>
        </div>
      </div>
      <div class="calendar-right-panel">
        <div class="cal-grid">
          <div class="cal-header-day">Dom</div>
          <div class="cal-header-day">Seg</div>
          <div class="cal-header-day">Ter</div>
          <div class="cal-header-day">Qua</div>
          <div class="cal-header-day">Qui</div>
          <div class="cal-header-day">Sex</div>
          <div class="cal-header-day">Sáb</div>
        </div>
        <div class="cal-grid">${daysGridHtml}</div>
      </div>
    </div>
  `;
}

function changeMonth(delta) {
  currentCalendarDate.setMonth(currentCalendarDate.getMonth() + delta);
  renderMainGrid();
}

function selectCalendarDay(dayNumber) {
  currentCalendarDate.setDate(dayNumber);
  renderMainGrid();
}

// Renderiza o Card de Resumo de Disciplinas Semestrais FILTRANDO PELO SEMESTRE DA DATA EM EXIBIÇÃO
function renderSemesterSummary() {
  const container = document.getElementById('semesterDisciplinesList');
  if (!container) return;

  const currentSemester = getCurrentSemesterFromCalendar();
  const badge = document.getElementById('semesterBadge');
  if (badge) badge.innerText = currentSemester;

  // Filtra estritamente agendamentos do semestre correspondente
  const academicApps = appointments.filter(a => a.semester === currentSemester);
  
  const uniqueSubjects = {};
  academicApps.forEach(app => {
    const key = app.subjectCode || app.title;
    if (!uniqueSubjects[key]) {
      uniqueSubjects[key] = app;
    }
  });

  // Ordena por dia da semana (Segunda = 1, Terça = 2, ...) e depois pelo horário
  const sortedSubjects = Object.values(uniqueSubjects).sort((a, b) => {
    const dateA = new Date(a.date + 'T00:00:00');
    const dateB = new Date(b.date + 'T00:00:00');

    let dayA = dateA.getDay();
    if (dayA === 0) dayA = 7;

    let dayB = dateB.getDay();
    if (dayB === 0) dayB = 7;

    if (dayA !== dayB) {
      return dayA - dayB;
    }
    return a.time.localeCompare(b.time);
  });

  if (sortedSubjects.length === 0) {
    container.innerHTML = '<small class="text-muted">Nenhuma disciplina cadastrada para o semestre ' + currentSemester + '.</small>';
    return;
  }

  let html = '';
  sortedSubjects.forEach(app => {
    const codeBadge = app.subjectCode ? `<span class="badge bg-dark me-2">${app.subjectCode}</span>` : '';

    html += `
      <div class="appointment-item d-flex align-items-center justify-content-between p-2 mb-2 bg-light rounded border">
        <div>
          ${codeBadge}
          <strong class="text-dark">${app.title}</strong>
          ${app.professor ? `<small class="text-muted ms-2"><i class="bi bi-person-badge me-1"></i>${app.professor}</small>` : ''}
          ${app.creditPeriods ? `<small class="badge bg-secondary ms-2">${app.creditPeriods} períodos</small>` : ''}
        </div>
        <div>
          <button class="action-btn text-success me-1" onclick="prepareEditModal('${app.id}')" title="Editar Disciplina">
            <i class="bi bi-pencil-fill"></i>
          </button>
          <button class="action-btn text-danger" onclick="deleteEntireSubject('${app.subjectCode || app.title}')" title="Excluir Disciplina e Aulas">
            <i class="bi bi-trash-fill"></i>
          </button>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

// Renderiza a Grade Principal da Semana
function renderMainGrid() {
  const container = document.getElementById('mainGridContainer');
  container.innerHTML = '';

  let selectedDayKey = currentCalendarDate.getDay(); 

  const daysConfig = [
    { name: 'Domingo', key: 0, class: 'card-domingo' },
    { name: 'Segunda', key: 1, class: 'card-segunda' },
    { name: 'Terça',   key: 2, class: 'card-terca' },
    { name: 'Quarta',  key: 3, class: 'card-quarta' },
    { name: 'Quinta',  key: 4, class: 'card-quinta' },
    { name: 'Sexta',   key: 5, class: 'card-sexta' },
    { name: 'Sábado',  key: 6, class: 'card-sabado' }
  ];

  // 1. LINHA 1 (ESQUERDA): Calendário Split Widget
  const calCol = document.createElement('div');
  calCol.className = 'col-md-6';
  calCol.innerHTML = generateCalendarHtml();
  container.appendChild(calCol);

  // 2. LINHA 1 (DIREITA): Card do Dia Selecionado no Calendário
  const selectedConfig = daysConfig.find(d => d.key === selectedDayKey) || daysConfig[0];
  container.appendChild(createDayCardElement(selectedConfig));

  // 3. LINHA 2: Resumo de Disciplinas do Semestre Ativo na Data
  const currentSemester = getCurrentSemesterFromCalendar();
  const summaryCol = document.createElement('div');
  summaryCol.className = 'col-12';
  summaryCol.innerHTML = `
    <div class="day-card card-semester-summary">
      <div class="day-title d-flex justify-content-between align-items-center mb-2">
        <span><i class="bi bi-mortarboard-fill me-2 text-primary"></i>Disciplinas do Semestre Ativo</span>
        <span class="badge bg-primary fs-6" id="semesterBadge">${currentSemester}</span>
      </div>
      <div id="semesterDisciplinesList" class="appointments-list"></div>
    </div>
  `;
  container.appendChild(summaryCol);

  renderSemesterSummary();

  // 4. LINHAS SEGUINTES: Cards dos Dias da Semana em ordem cronológica (Seg a Dom)
  const displayOrder = [1, 2, 3, 4, 5, 6, 0];
  displayOrder.forEach(dayKey => {
    if (dayKey === selectedDayKey) return;
    const config = daysConfig.find(d => d.key === dayKey);
    container.appendChild(createDayCardElement(config));
  });
}

function createDayCardElement(day) {
  const col = document.createElement('div');
  col.className = 'col-md-6';

  const currentYear = currentCalendarDate.getFullYear();
  const currentMonth = currentCalendarDate.getMonth();
  const currentDay = currentCalendarDate.getDate();
  const currentDayOfWeek = currentCalendarDate.getDay(); 
  
  const sundayOfWeek = new Date(currentYear, currentMonth, currentDay - currentDayOfWeek);

  const targetDate = new Date(sundayOfWeek);
  targetDate.setDate(sundayOfWeek.getDate() + day.key);
  
  const yearStr = targetDate.getFullYear();
  const monthStr = String(targetDate.getMonth() + 1).padStart(2, '0');
  const dayStr = String(targetDate.getDate()).padStart(2, '0');
  
  const exactTargetDateIso = `${yearStr}-${monthStr}-${dayStr}`;
  const dateFormattedString = `${dayStr}/${monthStr}/${String(yearStr).slice(-2)}`;

  const todayStr = getTodayDateString();
  const isPast = exactTargetDateIso < todayStr;
  const disabledClass = isPast ? 'card-disabled' : '';

  const holidayToday = getHolidayName(exactTargetDateIso);

  const dayAppointments = appointments
    .filter(app => app.date === exactTargetDateIso)
    .sort((a, b) => a.time.localeCompare(b.time));

  let itemsHtml = '';
  dayAppointments.forEach(app => {
    let statusBadges = '';
    let canceledClass = app.isCanceled ? 'item-canceled' : '';
    
    const isAcademicSubject = Boolean(app.semester || app.subjectCode);
    const darkHighlightClass = isAcademicSubject ? 'academic-subject-item' : '';

    if (app.subjectCode) {
      statusBadges += `<span class="badge bg-warning text-dark me-1">${app.subjectCode}</span>`;
    } else if (isAcademicSubject) {
      statusBadges += `<span class="badge bg-info text-dark me-1">UFCSPA</span>`;
    }

    if (app.isExam) {
      statusBadges += `<span class="badge-exam"><i class="bi bi-exclamation-triangle-fill me-1"></i>PROVA</span>`;
    }

    if (app.holidayName || holidayToday) {
      statusBadges += `<span class="badge bg-warning text-dark ms-1"><i class="bi bi-flag-fill me-1"></i>FERIADO: ${app.holidayName || holidayToday}</span>`;
    } else if (app.isCanceled) {
      statusBadges += `<span class="badge-canceled">CANCELADA</span>`;
    }

    itemsHtml += `
      <div class="appointment-item d-flex align-items-center mb-3 ${darkHighlightClass}">
        <div class="cursor-pointer" onclick="showDetails('${app.id}')">
          ${generateFlipClockHtml(app.time)}
        </div>
        
        <div class="appointment-content d-flex justify-content-between align-items-center flex-grow-1 ms-2">
          <div class="cursor-pointer ms-1 ${canceledClass}" onclick="showDetails('${app.id}')">
            <span class="fw-semibold">${app.title}</span>
            ${statusBadges}
          </div>
          <div style="pointer-events: auto;">
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

  if (holidayToday && dayAppointments.length === 0) {
    itemsHtml = `<div class="p-2 bg-warning-subtle text-warning-emphasis border border-warning rounded small"><i class="bi bi-balloon-fill me-1"></i><strong>Feriado / Facultativo:</strong> ${holidayToday}</div>`;
  }

  col.innerHTML = `
    <div class="day-card ${day.class} ${disabledClass}">
      <div class="day-title d-flex justify-content-between align-items-center">
        <span>${day.name} ${isPast ? '<small class="fs-6 fw-normal ms-1">(Concluído)</small>' : ''}</span>
        <span class="card-date-badge">${dateFormattedString}</span>
      </div>
      <div class="appointments-list">${itemsHtml || '<small class="opacity-75">Nenhum compromisso</small>'}</div>
    </div>
  `;

  return col;
}

function setFormType(type) {
  document.getElementById('formType').value = type;
  const labelTitle = document.getElementById('labelTitle');

  if (type === 'general') {
    labelTitle.innerText = 'Título do Compromisso / Evento';
    document.getElementById('title').placeholder = 'Ex: Palestra / Reunião / Prova de Anatomia';
    document.getElementById('date').required = true;
    document.getElementById('time').required = true;
    document.getElementById('academicStartDate').required = false;
    document.getElementById('academicStartTime').required = false;
  } else {
    labelTitle.innerText = 'Nome da Disciplina Semestral';
    document.getElementById('title').placeholder = 'Ex: Anatomia Humana - UFCSPA';
    document.getElementById('date').required = false;
    document.getElementById('time').required = false;
    document.getElementById('academicStartDate').required = true;
    document.getElementById('academicStartTime').required = true;
  }
}

async function handleFormSubmit(e) {
  e.preventDefault();

  const id = document.getElementById('appointmentId').value;
  const isEdit = Boolean(id);
  const formType = document.getElementById('formType').value;
  const todayStr = getTodayDateString();

  const baseTitle = document.getElementById('title').value;
  const description = document.getElementById('description').value;
  const location = document.getElementById('location').value;
  const phone = document.getElementById('phone').value;

  if (formType === 'general' || isEdit) {
    const startDateStr = document.getElementById('date').value;
    const startTime = document.getElementById('time').value;
    const endTime = document.getElementById('endTime').value;
    const isExam = document.getElementById('isExam').checked;
    const isCanceled = document.getElementById('isCanceled').checked;

    if (startDateStr < todayStr) {
      Swal.fire({
        icon: 'error',
        title: 'Data Inválida!',
        text: 'Não é possível agendar compromissos em datas anteriores ao dia de hoje.',
        confirmButtonColor: '#e87234'
      });
      return;
    }

    let durationMinutes = 60;
    if (startTime && endTime) {
      const startMin = timeToMinutes(startTime);
      const endMin = timeToMinutes(endTime);
      if (endMin > startMin) durationMinutes = endMin - startMin;
    }

    const holidayName = getHolidayName(startDateStr);

    const appointmentData = {
      id: isEdit ? id : String(Date.now()),
      date: startDateStr,
      time: startTime,
      endTime: endTime,
      duration: durationMinutes,
      title: baseTitle,
      description: description,
      location: location,
      phone: phone,
      isExam: isExam,
      isCanceled: isCanceled,
      holidayName: holidayName
    };

    const conflictCheck = findTimeConflict(appointmentData);
    if (conflictCheck.conflict) {
      showConflictAlert(conflictCheck);
      return;
    }

    await saveAppointment(appointmentData, isEdit);
  } else {
    // ABA 2: Disciplina Semestral Recorrente
    const startDateStr = document.getElementById('academicStartDate').value;
    const startTime = document.getElementById('academicStartTime').value;
    const endTime = document.getElementById('academicEndTime').value;
    const semester = document.getElementById('semester').value;
    const repeatWeeks = parseInt(document.getElementById('repeatWeeks').value) || 16;
    const subjectCode = document.getElementById('subjectCode').value;
    const professor = document.getElementById('professor').value;
    const creditPeriods = document.getElementById('creditPeriods').value;

    let durationMinutes = 60;
    if (startTime && endTime) {
      const startMin = timeToMinutes(startTime);
      const endMin = timeToMinutes(endTime);
      if (endMin > startMin) durationMinutes = endMin - startMin;
    }

    const createdAppointments = [];
    let baseDate = new Date(startDateStr + 'T00:00:00');

    for (let week = 0; week < repeatWeeks; week++) {
      const currentDate = new Date(baseDate);
      currentDate.setDate(baseDate.getDate() + (week * 7));

      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      const holidayName = getHolidayName(dateStr);

      const newApp = {
        id: String(Date.now() + week),
        date: dateStr,
        time: startTime,
        endTime: endTime,
        duration: durationMinutes,
        title: baseTitle,
        semester: semester,
        subjectCode: subjectCode,
        professor: professor,
        creditPeriods: creditPeriods,
        description: holidayName ? `Aula suspensa devido ao feriado: ${holidayName}` : description,
        location: location,
        phone: phone,
        isExam: false,
        isCanceled: Boolean(holidayName),
        holidayName: holidayName || null
      };

      const conflictCheck = findTimeConflict(newApp);
      if (conflictCheck.conflict) {
        showConflictAlert(conflictCheck);
        return;
      }

      createdAppointments.push(newApp);
    }

    for (const app of createdAppointments) {
      await saveAppointment(app, false);
    }
  }

  if (useApi) await initAppointments();

  appointmentModal.hide();
  renderMainGrid();

  Swal.fire({
    icon: 'success',
    title: isEdit ? 'Compromisso atualizado!' : 'Agendamento(s) salvo(s) com sucesso!',
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 2500,
    timerProgressBar: true
  });
}

function showConflictAlert(conflictCheck) {
  const conflicting = conflictCheck.conflictingApp;
  const dur = conflicting.duration ? `${conflicting.duration} min` : '60 min (padrão)';

  Swal.fire({
    icon: 'error',
    title: 'Conflito de Horário!',
    html: `
      Já existe o compromisso <strong>"${conflicting.title}"</strong> em <strong>${conflicting.date}</strong> às <strong>${conflicting.time}</strong> (duração: ${dur}).<br><br>
      Horário livre sugerido a partir de: <strong>${conflictCheck.suggestedStart}</strong>.
    `,
    confirmButtonColor: '#e87234'
  });
}

function prepareAddModal() {
  document.getElementById('appointmentForm').reset();
  document.getElementById('appointmentId').value = '';
  document.getElementById('modalTitle').innerText = 'Novo Compromisso / Disciplina';

  const firstTab = new bootstrap.Tab(document.getElementById('general-tab'));
  firstTab.show();
  setFormType('general');

  const todayStr = getTodayDateString();
  
  const dateInput = document.getElementById('date');
  dateInput.min = todayStr;
  dateInput.value = todayStr;

  const academicDateInput = document.getElementById('academicStartDate');
  academicDateInput.removeAttribute('min');
  academicDateInput.value = todayStr;
}

function prepareEditModal(id) {
  const app = appointments.find(a => String(a.id) === String(id));
  if (!app) return;

  const todayStr = getTodayDateString();
  document.getElementById('date').min = todayStr;

  const firstTab = new bootstrap.Tab(document.getElementById('general-tab'));
  firstTab.show();
  setFormType('general');

  document.getElementById('appointmentId').value = app.id;
  document.getElementById('date').value = app.date;
  document.getElementById('time').value = app.time;
  document.getElementById('endTime').value = app.endTime || '';
  document.getElementById('title').value = app.title;
  document.getElementById('description').value = app.description || '';
  document.getElementById('location').value = app.location || '';
  document.getElementById('phone').value = app.phone || '';
  document.getElementById('isExam').checked = Boolean(app.isExam);
  document.getElementById('isCanceled').checked = Boolean(app.isCanceled);

  if (app.subjectCode) document.getElementById('subjectCode').value = app.subjectCode;
  if (app.professor) document.getElementById('professor').value = app.professor;
  if (app.creditPeriods) document.getElementById('creditPeriods').value = app.creditPeriods;

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
      renderMainGrid();

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

function deleteEntireSubject(subjectIdentifier) {
  Swal.fire({
    title: `Excluir disciplina "${subjectIdentifier}"?`,
    text: `Isto irá remover TODAS as aulas agendadas para esta disciplina no semestre!`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Sim, excluir tudo',
    cancelButtonText: 'Cancelar'
  }).then(async (result) => {
    if (result.isConfirmed) {
      const appsToRemove = appointments.filter(a => a.subjectCode === subjectIdentifier || a.title === subjectIdentifier);
      for (const app of appsToRemove) {
        await removeAppointment(app.id);
      }
      renderMainGrid();

      Swal.fire({
        icon: 'success',
        title: 'Disciplina Excluída!',
        text: `Todas as aulas da disciplina foram removidas.`,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2500
      });
    }
  });
}

function clearAllData() {
  Swal.fire({
    title: 'Resetar todos os dados?',
    text: 'Isto irá apagar todos os compromissos e disciplinas salvos localmente!',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Sim, limpar tudo',
    cancelButtonText: 'Cancelar'
  }).then((result) => {
    if (result.isConfirmed) {
      localStorage.removeItem('appointments');
      appointments = [];
      renderMainGrid();

      Swal.fire({
        icon: 'success',
        title: 'Dados Limpos!',
        text: 'A sua agenda foi resetada com sucesso.',
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
    <p><strong>Disciplina / Título:</strong> ${app.title}</p>
    ${app.subjectCode ? `<p><strong>Código:</strong> <span class="badge bg-dark">${app.subjectCode}</span></p>` : ''}
    ${app.professor ? `<p><strong>Professor Regente:</strong> ${app.professor}</p>` : ''}
    ${app.creditPeriods ? `<p><strong>Quantidade de Períodos:</strong> ${app.creditPeriods}</p>` : ''}
    ${app.semester ? `<p><strong>Semestre Letivo:</strong> <span class="badge bg-primary">${app.semester}</span></p>` : ''}
    <p><strong>Data:</strong> ${app.date}</p>
    <p><strong>Horário:</strong> ${app.time} ${app.endTime ? `às ${app.endTime}` : ''} ${app.duration ? `(${app.duration} min)` : ''}</p>
    ${app.holidayName ? `<p class="text-warning fw-bold"><i class="bi bi-flag-fill me-1"></i> Feriado: ${app.holidayName}</p>` : ''}
    ${app.isExam ? '<p class="text-danger fw-bold"><i class="bi bi-exclamation-triangle-fill"></i> Dia de Prova Marcado!</p>' : ''}
    ${app.isCanceled ? '<p class="text-secondary fw-bold"><i class="bi bi-x-circle-fill"></i> Aula / Compromisso Cancelado</p>' : ''}
    ${app.location ? `<p><strong>Local / Sala:</strong> ${app.location}</p>` : ''}
    ${app.description ? `<p><strong>Detalhes / Descrição:</strong> ${app.description}</p>` : ''}
    ${app.phone ? `<p><strong>Telefone / Contato:</strong> ${app.phone}</p>` : ''}
  `;

  detailsModal.show();
}