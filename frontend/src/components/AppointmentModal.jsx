import React, { useState, useEffect } from 'react'
import Swal from 'sweetalert2'

const OPCOES_CATEGORIA = [
  'OUTRO / GERAL',
  'ACADEMIA',
  'ANIVERSÁRIO',
  'AVALIAÇÃO UFCSPA',
  'CINEMA',
  'EVENTO',
  'EXAME LABORATORIAL',
  'EXAME MÉDICO',
  'FESTA / COMEMORAÇÃO',
  'HAPPY HOUR',
  'PASSEIO',
  'VIAGEM'
]

const OPCOES_AVALIACAO = [
  'AVALIAÇÃO 1',
  'AVALIAÇÃO 2',
  'AVALIAÇÃO 3',
  'AVALIAÇÃO 4',
  'EXAME FINAL',
  'RECUPERAÇÃO'
]

function AppointmentModal({ show, onClose, onSave, onDelete, appointmentToEdit, mode = 'geral', disciplinesList = [] }) {
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
    priority: 'SEM PRIORIDADE',
    semester: '2026/2',
    subjectCode: '',
    professor: '',
    creditPeriods: '2',
    periodDuration: '50',
    relatedSubjectId: '',
    examType: 'AVALIAÇÃO 1',
    examWeight: '30%',
    isExam: false
  })

  useEffect(() => {
    if (appointmentToEdit) {
      setFormData({
        ...appointmentToEdit,
        building: appointmentToEdit.building || '',
        room: appointmentToEdit.room || appointmentToEdit.location || '',
        periodDuration: appointmentToEdit.periodDuration || '50',
        priority: appointmentToEdit.priority || 'SEM PRIORIDADE',
        relatedSubjectId: appointmentToEdit.relatedSubjectId || (disciplinesList[0]?.id || disciplinesList[0]?._id || ''),
        examType: appointmentToEdit.examType || 'AVALIAÇÃO 1',
        examWeight: appointmentToEdit.examWeight || '30%'
      })
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
        priority: 'SEM PRIORIDADE',
        semester: '2026/2',
        subjectCode: '',
        professor: '',
        creditPeriods: '2',
        periodDuration: '50',
        relatedSubjectId: disciplinesList[0]?.id || disciplinesList[0]?._id || '',
        examType: 'AVALIAÇÃO 1',
        examWeight: '30%',
        isExam: false
      })
      setIsEditing(true)
    }
  }, [appointmentToEdit, show, mode, disciplinesList])

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

    if (!formData.title.trim() && formData.category !== 'AVALIAÇÃO UFCSPA') {
      Swal.fire({
        icon: 'warning',
        title: 'Campos Incompletos',
        text: 'Por favor, preencha o Título do compromisso.',
        confirmButtonColor: '#10b981'
      })
      return
    }

    let calculatedEnd = formData.endTime
    let finalTitle = formData.title

    if (formData.category === 'AVALIAÇÃO UFCSPA') {
      if (!formData.relatedSubjectId) {
        Swal.fire({
          icon: 'warning',
          title: 'Selecione a Disciplina',
          text: 'Você precisa escolher a qual disciplina esta avaliação pertence.',
          confirmButtonColor: '#10b981'
        })
        return
      }
      const selectedSub = disciplinesList.find(d => (d.id || d._id) === formData.relatedSubjectId)
      finalTitle = `${formData.examType} - ${selectedSub ? selectedSub.title : 'Disciplina'}`
    }

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

    const dataToSave = {
      ...formData,
      title: finalTitle,
      endTime: calculatedEnd,
      category: mode === 'disciplina' ? 'DISCIPLINA' : formData.category,
      isExam: formData.category === 'AVALIAÇÃO UFCSPA' || formData.category === 'PROVA',
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
          
          <div className="modal-header bg-light border-0">
            <h5 className="modal-title fw-bold text-dark m-0 d-flex align-items-center gap-2">
              {mode === 'disciplina' ? (
                <><i className="bi bi-mortarboard-fill text-primary"></i> Disciplina UFCSPA</>
              ) : (
                <><i className="bi bi-journal-text text-success"></i> Compromisso / Avaliação</>
              )}
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>

          {!isEditing ? (
            /* VISUALIZAÇÃO DE DETALHES */
            <div className="modal-body p-4">
              <div className="mb-3">
                <h3 className="fw-bold text-dark mb-1">{formData.title}</h3>
                <div className="d-flex gap-2 align-items-center mt-2">
                  <span className="badge bg-light text-dark border">{formData.category}</span>
                  {formData.examWeight && (
                    <span className="badge bg-danger text-white">Peso: {formData.examWeight}</span>
                  )}
                </div>
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
                  <small className="text-muted d-block">Local</small>
                  <strong className="fs-6">{formData.room || formData.location || 'Não informado'}</strong>
                </div>
              </div>
            </div>
          ) : (
            /* FORMULÁRIO DE EDIÇÃO / CRIAÇÃO */
            <form onSubmit={handleSubmit}>
              <div className="modal-body p-4">
                {mode === 'geral' ? (
                  <>
                    <div className="row g-3 mb-3">
                      <div className="col-md-7">
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

                      <div className="col-md-5">
                        <label className="form-label fw-semibold">Prioridade</label>
                        <select 
                          className="form-select fw-semibold"
                          value={formData.priority || 'SEM PRIORIDADE'}
                          onChange={(e) => setFormData({...formData, priority: e.target.value})}
                        >
                          <option value="SEM PRIORIDADE">⚪ Sem Prioridade</option>
                          <option value="BAIXA">🟢 Prioridade Baixa</option>
                          <option value="MÉDIA">🟡 Prioridade Média</option>
                          <option value="ALTA">🟠 Prioridade Alta</option>
                          <option value="MUITO ALTA">🔴 Prioridade Muito Alta</option>
                        </select>
                      </div>
                    </div>

                    {/* CAMPOS ESPECÍFICOS DE AVALIAÇÃO UFCSPA */}
                    {formData.category === 'AVALIAÇÃO UFCSPA' ? (
                      <div className="p-3 bg-light rounded-3 border mb-3">
                        <h6 className="fw-bold text-primary mb-3">
                          <i className="bi bi-file-earmark-check-fill me-2"></i>
                          Configuração da Avaliação Acadêmica
                        </h6>

                        <div className="mb-3">
                          <label className="form-label fw-semibold">Disciplina Correspondente *</label>
                          <select 
                            className="form-select border-primary"
                            value={formData.relatedSubjectId}
                            onChange={(e) => {
                              const sub = disciplinesList.find(d => (d.id || d._id) === e.target.value)
                              setFormData({
                                ...formData, 
                                relatedSubjectId: e.target.value,
                                time: sub?.time || formData.time,
                                endTime: sub?.endTime || formData.endTime
                              })
                            }}
                          >
                            <option value="">-- Selecione uma Disciplina --</option>
                            {disciplinesList.map((disc) => (
                              <option key={disc.id || disc._id} value={disc.id || disc._id}>
                                {disc.subjectCode} - {disc.title}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="row g-3">
                          <div className="col-md-6">
                            <label className="form-label fw-semibold">Tipo de Avaliação *</label>
                            <select 
                              className="form-select"
                              value={formData.examType}
                              onChange={(e) => setFormData({...formData, examType: e.target.value})}
                            >
                              {OPCOES_AVALIACAO.map((type) => (
                                <option key={type} value={type}>{type}</option>
                              ))}
                            </select>
                          </div>

                          <div className="col-md-6">
                            <label className="form-label fw-semibold">Peso da Nota (Ex: 30%)</label>
                            <input 
                              type="text" 
                              className="form-control" 
                              placeholder="Ex: 30%, 25%"
                              value={formData.examWeight}
                              onChange={(e) => setFormData({...formData, examWeight: e.target.value})}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mb-3">
                        <label className="form-label fw-semibold">Título do Compromisso *</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          required 
                          value={formData.title}
                          onChange={(e) => setFormData({...formData, title: e.target.value})}
                          placeholder="Ex: Reunião, Consulta Unimed"
                        />
                      </div>
                    )}

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

                    <div className="mb-3">
                      <label className="form-label fw-semibold">Local / Sala</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={formData.location || ''}
                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                        placeholder="Ex: Prédio 2 - Sala 304"
                      />
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