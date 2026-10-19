import React from 'react'

function CalendarWidget({ selectedDate, onSelectDate, appointments = [] }) {
  const year = selectedDate.getFullYear()
  const month = selectedDate.getMonth()

  const MONTH_NAMES = [
    'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
    'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
  ]

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfWeek = new Date(year, month, 1).getDay()

  const handlePrevMonth = () => {
    const prev = new Date(year, month - 1, 1)
    onSelectDate(prev)
  }

  const handleNextMonth = () => {
    const next = new Date(year, month + 1, 1)
    onSelectDate(next)
  }

  // Identifica o nível máximo de prioridade dos compromissos pendentes de um determinado dia
  const getDayPriorityStatus = (dayNum) => {
    const monthStr = String(month + 1).padStart(2, '0')
    const dayStr = String(dayNum).padStart(2, '0')
    const isoDate = `${year}-${monthStr}-${dayStr}`

    const dayApps = appointments.filter(a => a.date === isoDate && !a.isCompleted)

    if (dayApps.length === 0) return null

    if (dayApps.some(a => a.priority === 'MUITO ALTA')) return 'MUITO ALTA'
    if (dayApps.some(a => a.priority === 'ALTA')) return 'ALTA'
    
    // Retorna 'GERAL' para dias que possuem compromissos (Sem Prioridade, Baixa ou Média)
    return 'GERAL'
  }

  const renderDays = () => {
    const days = []

    // Preenche os espaços vazios do início do mês
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(
        <div key={`empty-${i}`} style={{ width: '14.28%' }} className="text-center p-1"></div>
      )
    }

    // Renderiza os dias do mês
    for (let d = 1; d <= daysInMonth; d++) {
      const isSelected = selectedDate.getDate() === d && selectedDate.getMonth() === month && selectedDate.getFullYear() === year
      const priorityStatus = getDayPriorityStatus(d)

      // Define a classe CSS de destaque de acordo com a prioridade do dia
      let priorityClass = ''
      if (!isSelected) {
        if (priorityStatus === 'MUITO ALTA') {
          priorityClass = 'bg-danger text-white rounded-3 fw-bold shadow-sm'
        } else if (priorityStatus === 'ALTA') {
          priorityClass = 'bg-warning text-dark border border-warning-subtle rounded-3 fw-bold shadow-sm'
        } else if (priorityStatus === 'GERAL') {
          priorityClass = 'bg-secondary-subtle text-dark border rounded-3 fw-semibold'
        }
      }

      days.push(
        <div 
          key={d} 
          onClick={() => onSelectDate(new Date(year, month, d))}
          className="d-flex align-items-center justify-content-center p-1"
          style={{ width: '14.28%', cursor: 'pointer' }}
        >
          <div 
            className={`d-flex align-items-center justify-content-center ${
              isSelected 
                ? 'bg-dark text-white rounded-circle shadow-sm fw-bold' 
                : priorityClass
            }`}
            style={{ width: '32px', height: '32px', fontSize: '0.85rem', transition: 'all 0.2s ease' }}
          >
            {d}
          </div>
        </div>
      )
    }

    return days
  }

  const weekHeaders = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  return (
    <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white h-100">
      <div className="row g-0 h-100">
        
        {/* Painel Esquerdo com Destaque do Dia Selecionado */}
        <div className="col-5 bg-success text-white p-3 d-flex flex-column justify-content-between">
          <div className="fs-5 fw-bold opacity-75">{year}</div>
          <div className="display-1 fw-bold text-center my-auto">
            {selectedDate.getDate()}
          </div>
          <div className="d-flex align-items-center justify-content-between pt-2 border-top border-white border-opacity-25">
            <button className="btn btn-sm text-white p-0" onClick={handlePrevMonth}>
              <i className="bi bi-chevron-left fs-5"></i>
            </button>
            <span className="fw-bold extra-small">{MONTH_NAMES[month]}</span>
            <button className="btn btn-sm text-white p-0" onClick={handleNextMonth}>
              <i className="bi bi-chevron-right fs-5"></i>
            </button>
          </div>
        </div>

        {/* Grade do Calendário */}
        <div className="col-7 p-3 d-flex flex-column justify-content-center">
          <div className="d-flex text-center fw-bold text-muted extra-small mb-2">
            {weekHeaders.map(day => (
              <div key={day} style={{ width: '14.28%' }}>{day}</div>
            ))}
          </div>

          <div className="d-flex flex-wrap align-items-center">
            {renderDays()}
          </div>
        </div>

      </div>
    </div>
  )
}

export default CalendarWidget