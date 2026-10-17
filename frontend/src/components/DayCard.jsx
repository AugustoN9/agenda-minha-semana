import React from 'react'

function DayCard({ dayName, dateStr, isPassed, isToday, holidayName, appointments = [], onEdit, onToggleComplete }) {
  
  const processAppointments = () => {
    const list = []

    appointments.forEach((app) => {
      const periodsCount = parseInt(app.creditPeriods) || 1
      const durationMin = parseInt(app.periodDuration) || 50

      if (app.subjectCode && periodsCount > 1) {
        const [startH, startM] = (app.time || '18:20').split(':').map(Number)
        let currentBaseDate = new Date()
        currentBaseDate.setHours(startH, startM, 0, 0)

        for (let i = 0; i < periodsCount; i++) {
          const periodStartH = String(currentBaseDate.getHours()).padStart(2, '0')
          const periodStartM = String(currentBaseDate.getMinutes()).padStart(2, '0')

          currentBaseDate.setMinutes(currentBaseDate.getMinutes() + durationMin)

          const periodEndH = String(currentBaseDate.getHours()).padStart(2, '0')
          const periodEndM = String(currentBaseDate.getMinutes()).padStart(2, '0')

          list.push({
            ...app,
            subKey: `${app.id || app._id}_period_${i}`,
            timeFormatted: `${periodStartH}:${periodStartM} - ${periodEndH}:${periodEndM}`,
            periodIndex: i + 1,
            isDiscipline: true
          })
        }
      } else {
        list.push({
          ...app,
          subKey: app.id || app._id,
          timeFormatted: app.time && app.endTime ? `${app.time} - ${app.endTime}` : (app.time || '00:00'),
          periodIndex: 1,
          isDiscipline: Boolean(app.subjectCode)
        })
      }
    })

    return list
  }

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'MUITO ALTA':
        return <span className="badge bg-danger text-white flex-shrink-0" style={{ fontSize: '0.65rem' }}>Muito Alta</span>
      case 'ALTA':
        return <span className="badge bg-warning text-dark flex-shrink-0" style={{ fontSize: '0.65rem' }}>Alta</span>
      case 'BAIXA':
        return <span className="badge bg-success text-white flex-shrink-0" style={{ fontSize: '0.65rem' }}>Baixa</span>
      case 'MÉDIA':
        return <span className="badge bg-info text-dark flex-shrink-0" style={{ fontSize: '0.65rem' }}>Média</span>
      case 'SEM PRIORIDADE':
      default:
        return null
    }
  }

  const processedList = processAppointments()

  return (
    <div className={`card shadow-sm border-0 rounded-3 h-100 bg-white ${isToday ? 'border-start border-success border-4' : ''}`}>
      <div className="card-header bg-white border-bottom-0 pt-3 px-3 d-flex justify-content-between align-items-center">
        <div>
          <span className={`fw-bold fs-5 ${isPassed ? 'text-secondary' : 'text-dark'}`}>{dayName}</span>
          {isPassed && <span className="text-muted small ms-2">(Concluído)</span>}
        </div>
        <span className={`fw-bold small ${isPassed ? 'text-muted' : 'text-dark'}`}>{dateStr}</span>
      </div>

      <div className="card-body px-3 pb-3 pt-1">
        {holidayName && (
          <div className="p-2 mb-2 rounded bg-warning bg-opacity-10 border border-warning text-warning-emphasis small">
            <i className="bi bi-geo-fill me-1"></i>
            <strong>Feriado / Facultativo:</strong> {holidayName}
          </div>
        )}

        {processedList.length === 0 ? (
          <p className="text-muted small my-3">Nenhum compromisso</p>
        ) : (
          processedList.map((item) => {
            const isCompleted = item.isCompleted && !item.isDiscipline

            return (
              <div 
                key={item.subKey} 
                onClick={() => onEdit(item)}
                className={`d-flex align-items-center justify-content-between py-2 px-2 my-1 rounded border-bottom last-border-0 cursor-pointer ${
                  isCompleted ? 'opacity-50 bg-light' : 'bg-hover-light'
                }`}
                style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
              >
                {/* Lado Esquerdo: Badge do Horário + Título + Tag de Prioridade */}
                <div className="d-flex align-items-center gap-2 overflow-hidden me-2">
                  <div className={`badge ${isCompleted ? 'bg-secondary' : 'bg-dark'} text-white px-2 py-1 fw-bold rounded small flex-shrink-0`} style={{ fontSize: '0.75rem' }}>
                    {item.timeFormatted}
                  </div>

                  <span className={`fw-semibold small text-truncate ${isCompleted ? 'text-decoration-line-through text-muted' : isPassed ? 'text-muted' : 'text-dark'}`}>
                    {item.title}
                  </span>

                  {!item.isDiscipline && getPriorityBadge(item.priority)}
                </div>

                {/* Lado Direito: Checkbox reposicionada no fim da linha */}
                {!item.isDiscipline && (
                  <div className="form-check m-0 p-0 d-flex align-items-center flex-shrink-0">
                    <input 
                      type="checkbox" 
                      className="form-check-input my-0 cursor-pointer"
                      checked={Boolean(item.isCompleted)}
                      onChange={(e) => {
                        e.stopPropagation()
                        onToggleComplete(item)
                      }}
                    />
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default DayCard