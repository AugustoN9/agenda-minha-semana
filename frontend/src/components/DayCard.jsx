import React from 'react'

function DayCard({ dayName, dateStr, isPassed, isToday, holidayName, appointments = [], onEdit }) {
  
  // Função para desmembrar compromissos/disciplinas em múltiplos períodos de horário
  const processAppointments = () => {
    const list = []

    appointments.forEach((app) => {
      const periodsCount = parseInt(app.creditPeriods) || 1
      const durationMin = parseInt(app.periodDuration) || 50

      if (app.subjectCode && periodsCount > 1) {
        // Se for disciplina com múltiplos períodos, divide em N linhas
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
            periodIndex: i + 1
          })
        }
      } else {
        // Compromisso normal ou disciplina de 1 período
        list.push({
          ...app,
          subKey: app.id || app._id,
          timeFormatted: app.time && app.endTime ? `${app.time} - ${app.endTime}` : (app.time || '00:00'),
          periodIndex: 1
        })
      }
    })

    return list
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
          processedList.map((item) => (
            <div 
              key={item.subKey} 
              onClick={() => onEdit(item)}
              className="d-flex align-items-center justify-content-between py-2 px-2 my-1 rounded border-bottom last-border-0 cursor-pointer bg-hover-light"
              style={{ cursor: 'pointer', transition: 'background-color 0.2s ease' }}
            >
              <div className="d-flex align-items-center gap-2">
                {/* Badge de Horário do Período */}
                <div className="badge bg-secondary text-white px-2 py-1 fw-bold rounded small" style={{ fontSize: '0.75rem' }}>
                  {item.timeFormatted}
                </div>
                <span className={`fw-semibold small ${isPassed ? 'text-muted' : 'text-dark'}`}>
                  {item.title}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default DayCard