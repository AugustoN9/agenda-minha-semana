import React, { useState, useEffect } from 'react'
import Swal from 'sweetalert2'

const OPCOES_CATEGORIA = [
  'OUTRO / GERAL',
  'PROVA',
  'EXAME MÉDICO',
  'EXAME LABORATORIAL',
  'ANIVERSÁRIO',
  'FESTA / COMEMORAÇÃO',
  'HAPPY HOUR',
  'CINEMA',
  'VIAGEM',
  'PASSEIO',
  'EVENTO'
]

function AppointmentModal({ show, onClose, onSave, onDelete, appointmentToEdit, mode = 'geral' }) {
  const getTodayIso = () => {
    const today = new Date()
    const y = today.getFullYear()
    const m = String(today.getMonth() + 1).padStart(2, '0')
    const d = String(today.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    date: getTodayIso(),
    time: '18:20',
    endTime: '20:00',
    location: '',
    building: '',
    room: '',
    description: '',
    category: 'OUTRO / GERAL',
    semester: '2026/2',
    subjectCode: '',
    professor: '',
    creditPeriods: '2',
    periodDuration: '50',
    isExam: false
  })

  useEffect(() => {
    if (appointmentToEdit) {
      setFormData({
        ...appointmentToEdit,
        building: appointmentToEdit.building || '',
        room: appointmentToEdit.room || appointmentToEdit.location || '',
        periodDuration: appointmentToEdit.periodDuration || '50'
      })
      // Se abriu com um item existente, inicia no modo visualização de detalhes
      setIsEditing(false)
    } else {
      setFormData({
        title: '',
        date: getTodayIso(),
        time: '18:20',
        endTime: '20:00',
        location: '',
        building: '',
        room: '',
        description: '',
        category: mode === 'disciplina' ? 'DISCIPLINA' : 'OUTRO / GERAL',
        semester: '2026/2',
        subjectCode: '',
        professor: '',
        creditPeriods: '2',
        periodDuration: '50',
        isExam: false
      })
      // Se é um item novo, abre diretamente no formulário de edição/criação
      setIsEditing(true)
    }
  }, [appointmentToEdit, show, mode])

  if (!show) return null

  const calculateEndTime = (startTimeStr, periods, durationMinutes) => {
    if (!startTimeStr) return '00:00'
    const [h, m] = startTimeStr.split(':').map(Number)
    const totalMinutesToAdd = (parseInt(periods) || 1) * (parseInt(durationMinutes) || 50)
    
    const date = new Date()
    date.setHours(h, m + totalMinutesToAdd)
    
    const endH = String(date.getHours()).padStart(2, '0')
    const endM = String(date.getMinutes()).padStart(2, '0')
    return `${endH}:${endM}`
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!formData.title.trim() || !formData.date || !formData.time) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos Incompletos',
        text: 'Por favor, preencha o Título, a Data e o Horário Inicial.',
        confirmButtonColor: '#10b981'
      })
      return
    }

    let calculatedEnd = formData.endTime
    if (mode === 'disciplina') {
      if (!formData.subjectCode.trim()) {
        Swal.fire({
          icon: 'warning',
          title: 'Código Obrigatório!',
          text: 'Informe o código da disciplina (ex: INF06001).',
          confirmButtonColor: '#10b981'
        })
        return
      }
      calculatedEnd = calculateEndTime(formData.time, formData.creditPeriods, formData.periodDuration)
    } else if (!formData.endTime) {
      Swal.fire({
        icon: 'warning',
        title: 'Horário Final em Falta',
        text: 'Por favor, informe o horário final do compromisso.',
        confirmButtonColor: '#10b981'
      })
      return
    }

    if (calculatedEnd <= formData.time) {
      Swal.fire({
        icon: 'warning',
        title: 'Horário Inválido',
        text: 'O horário final deve ser posterior ao horário de início.',
        confirmButtonColor: '#10b981'
      })
      return
    }

    const dataToSave = {
      ...formData,
      endTime: calculatedEnd,
      category: mode === 'disciplina' ? 'DISCIPLINA' : formData.category,
      isExam: formData.category === 'PROVA',
      location: formData.room || formData.location
    }
    onSave(dataToSave)
  }

  const handleDeleteClick = () => {
    const idToUse = formData.id || formData._id
    if (idToUse) {
      onDelete(idToUse)
      onClose()
    }
  }

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content border-0 shadow rounded-4">
          
          {/* CABEÇALHO */}
          <div className="modal-header bg-light border-0">
            <h5 className="modal-title fw-bold text-dark m-0 d-flex align-items-center gap-2">
              {mode === 'disciplina' ? (
                <><i className="bi bi-mortarboard-fill text-primary"></i> Disciplina UFCSPA</>
              ) : (
                <><i className="bi bi-journal-text text-success"></i> Compromisso</>
              )}
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>

          {/* VISUALIZAÇÃO DE DETALHES (READ-ONLY) */}
          {!isEditing ? (
            <div className="modal-body p-4">
              <div className="mb-3">
                {formData.subjectCode && (
                  <span className="badge bg-secondary mb-2 fs-6">{formData.subjectCode}</span>
                )}
                <h3 className="fw-bold text-dark mb-1">{formData.title}</h3>
                <span className="badge bg-light text-dark border">{formData.category}</span>
              </div>

              <div className="row g-3 py-3 border-top border-bottom my-3">
                <div className="col-6 col-md-3">
                  <small className="text-muted d-block">Data</small>
                  <strong className="fs-6">{formData.date}</strong>
                </div>
                <div className="col-6 col-md-3">
                  <small className="text-muted d-block">Horário</small>
                  <strong className="fs-6">{formData.time} - {formData.endTime}</strong>
                </div>
                <div className="col-6 col-md-3">
                  <small className="text-muted d-block">Local / Sala</small>
                  <strong className="fs-6">{formData.room || formData.location || 'Não informado'}</strong>
                </div>
                <div className="col-6 col-md-3">
                  <small className="text-muted d-block">Prédio / Local</small>
                  <strong className="fs-6">{formData.building || 'UFCSPA'}</strong>
                </div>
              </div>

              {mode === 'disciplina' && (
                <div className="row g-3 mb-3">
                  <div className="col-6">
                    <small className="text-muted d-block">Professor(a)</small>
                    <span>{formData.professor || 'Não informado'}</span>
                  </div>
                  <div className="col-6">
                    <small className="text-muted d-block">Semestre</small>
                    <span>{formData.semester}</span>
                  </div>
                </div>
              )}

              {formData.description && (
                <div className="mb-2">
                  <small className="text-muted d-block">Observações</small>
                  <p className="text-secondary mb-0">{formData.description}</p>
                </div>
              )}
            </div>
          ) : (
            /* FORMULÁRIO DE EDIÇÃO / CRIAÇÃO */
            <form onSubmit={handleSubmit}>
              <div className="modal-body p-4">
                {mode === 'geral' ? (
                  <>
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Título do Compromisso *</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        required 
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                      />
                    </div>

                    <div className="row g-3 mb-3">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Data *</label>
                        <input 
                          type="date" 
                          className="form-control" 
                          required 
                          value={formData.date}
                          onChange={(e) => setFormData({...formData, date: e.target.value})}
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label fw-semibold">Início *</label>
                        <input 
                          type="time" 
                          className="form-control" 
                          required 
                          value={formData.time}
                          onChange={(e) => setFormData({...formData, time: e.target.value})}
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label fw-semibold">Fim *</label>
                        <input 
                          type="time" 
                          className="form-control" 
                          required
                          value={formData.endTime || ''}
                          onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="row g-3 mb-3">
                      <div className="col-md-7">
                        <label className="form-label fw-semibold">Local / Sala</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          value={formData.location || ''}
                          onChange={(e) => setFormData({...formData, location: e.target.value})}
                        />
                      </div>
                      <div className="col-md-5">
                        <label className="form-label fw-semibold">Tipo / Categoria *</label>
                        <select 
                          className="form-select border-success border-opacity-50 fw-semibold"
                          value={formData.category || 'OUTRO / GERAL'}
                          onChange={(e) => setFormData({...formData, category: e.target.value})}
                        >
                          {OPCOES_CATEGORIA.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="row g-3 mb-3">
                      <div className="col-md-8">
                        <label className="form-label fw-semibold">Nome da Disciplina *</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          required 
                          value={formData.title}
                          onChange={(e) => setFormData({...formData, title: e.target.value})}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-semibold">Código da Cadeira *</label>
                        <input 
                          type="text" 
                          className="form-control border-primary border-opacity-50" 
                          required
                          value={formData.subjectCode || ''}
                          onChange={(e) => setFormData({...formData, subjectCode: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="row g-3 mb-3">
                      <div className="col-md-5">
                        <label className="form-label fw-semibold">Data de Início *</label>
                        <input 
                          type="date" 
                          className="form-control" 
                          required 
                          value={formData.date}
                          onChange={(e) => setFormData({...formData, date: e.target.value})}
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label fw-semibold">Horário Início *</label>
                        <input 
                          type="time" 
                          className="form-control" 
                          required 
                          value={formData.time}
                          onChange={(e) => setFormData({...formData, time: e.target.value})}
                        />
                      </div>
                      <div className="col-md-2">
                        <label className="form-label fw-semibold">Qtd. Períodos</label>
                        <input 
                          type="number" 
                          min="1" 
                          max="10" 
                          className="form-control" 
                          value={formData.creditPeriods || '2'}
                          onChange={(e) => setFormData({...formData, creditPeriods: e.target.value})}
                        />
                      </div>
                      <div className="col-md-2">
                        <label className="form-label fw-semibold">Carga Período</label>
                        <select 
                          className="form-select"
                          value={formData.periodDuration || '50'}
                          onChange={(e) => setFormData({...formData, periodDuration: e.target.value})}
                        >
                          <option value="45">45 min</option>
                          <option value="50">50 min</option>
                          <option value="60">60 min</option>
                        </select>
                      </div>
                    </div>

                    <div className="row g-3 mb-3">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Prédio</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          value={formData.building || ''}
                          onChange={(e) => setFormData({...formData, building: e.target.value})}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Sala</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          value={formData.room || ''}
                          onChange={(e) => setFormData({...formData, room: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="row g-3">
                      <div className="col-md-7">
                        <label className="form-label fw-semibold">Professor(a)</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          value={formData.professor || ''}
                          onChange={(e) => setFormData({...formData, professor: e.target.value})}
                        />
                      </div>
                      <div className="col-md-5">
                        <label className="form-label fw-semibold">Semestre Letivo</label>
                        <select 
                          className="form-select"
                          value={formData.semester || '2026/2'}
                          onChange={(e) => setFormData({...formData, semester: e.target.value})}
                        >
                          <option value="2026/1">2026/1</option>
                          <option value="2026/2">2026/2</option>
                          <option value="2027/1">2027/1</option>
                          <option value="2027/2">2027/2</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="modal-footer bg-light border-0">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setIsEditing(false)}>
                  Cancelar
                </button>
                <button type="submit" className={`btn ${mode === 'geral' ? 'btn-success' : 'btn-primary'} px-4`}>
                  Salvar
                </button>
              </div>
            </form>
          )}

          {/* RODAPÉ DO MODO VISUALIZAÇÃO COM BOTÕES EDITAR E EXCLUIR */}
          {!isEditing && (
            <div className="modal-footer bg-light border-0 d-flex justify-content-between">
              <button type="button" className="btn btn-outline-danger" onClick={handleDeleteClick}>
                <i className="bi bi-trash me-1"></i> Excluir
              </button>
              <div className="d-flex gap-2">
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  Fechar
                </button>
                <button type="button" className="btn btn-primary" onClick={() => setIsEditing(true)}>
                  <i className="bi bi-pencil me-1"></i> Editar
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default AppointmentModal