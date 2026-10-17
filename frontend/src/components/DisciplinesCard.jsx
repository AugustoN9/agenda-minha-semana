import React from 'react'

const DIAS_SEMANA_NOMES = {
  0: 'Domingo',
  1: 'Segunda-feira',
  2: 'Terça-feira',
  3: 'Quarta-feira',
  4: 'Quinta-feira',
  5: 'Sexta-feira',
  6: 'Sábado'
}

function DisciplinesCard({ disciplines = [], activeSemester = '2026/2', onAddDiscipline, onEditDiscipline, onDeleteDiscipline }) {
  const getDayName = (dateStr) => {
    if (!dateStr) return ''
    const dateParts = dateStr.split('-')
    if (dateParts.length === 3) {
      const d = new Date(dateParts[0], dateParts[1] - 1, dateParts[2])
      return DIAS_SEMANA_NOMES[d.getDay()] || ''
    }
    return ''
  }

  return (
    <div className="card shadow-sm border-0 border-start border-primary border-4 rounded-3 bg-white mb-4">
      <div className="card-body p-3">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="d-flex align-items-center gap-2">
            <h6 className="fw-bold m-0 text-dark">
              <i className="bi bi-mortarboard-fill me-2 text-primary"></i>
              Disciplinas do Semestre Ativo
            </h6>
            <span className="badge bg-primary px-3 py-1 rounded-pill">{activeSemester}</span>
          </div>

          <button 
            className="btn p-0 border-0 bg-transparent" 
            title="Adicionar Disciplina"
            onClick={onAddDiscipline}
          >
            <i className="bi bi-plus-circle-fill fs-3 text-primary"></i>
          </button>
        </div>

        {disciplines.length === 0 ? (
          <p className="text-muted small m-0">
            Nenhuma disciplina cadastrada para o semestre {activeSemester}.
          </p>
        ) : (
          <div className="row g-2">
            {disciplines.map((d) => {
              const dayName = getDayName(d.date) || d.dayOfWeek || ''
              const locationStr = [d.building, d.room || d.location].filter(Boolean).join(' - ')
              const idToUse = d.id || d._id

              return (
                <div key={idToUse} className="col-12 col-md-6 col-lg-4">
                  <div className="p-3 bg-light rounded-3 border d-flex flex-column justify-content-between h-100">
                    <div>
                      <div className="d-flex justify-content-between align-items-start mb-1">
                        <span className="badge bg-secondary text-white fw-bold me-2">
                          {d.subjectCode || 'S/ CÓD'}
                        </span>
                        <div className="btn-group btn-group-sm">
                          <button 
                            onClick={() => onEditDiscipline(d)} 
                            className="btn btn-link text-primary p-0 me-2" 
                            title="Editar"
                          >
                            <i className="bi bi-pencil-fill"></i>
                          </button>
                          <button 
                            onClick={() => onDeleteDiscipline(idToUse)} 
                            className="btn btn-link text-danger p-0" 
                            title="Excluir"
                          >
                            <i className="bi bi-x-circle-fill"></i>
                          </button>
                        </div>
                      </div>

                      <h6 className="fw-bold text-dark m-0 mb-2">{d.title}</h6>

                      {dayName && (
                        <div className="small text-muted mb-1">
                          <i className="bi bi-calendar-week me-1 text-primary"></i>
                          <strong>{dayName}</strong>
                        </div>
                      )}

                      <div className="small text-muted mb-1">
                        <i className="bi bi-clock me-1 text-success"></i>
                        {d.time} {d.endTime ? `- ${d.endTime}` : ''}
                      </div>

                      {locationStr && (
                        <div className="small text-secondary">
                          <i className="bi bi-geo-alt me-1 text-danger"></i>
                          {locationStr}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default DisciplinesCard