import React, { useState, useEffect } from 'react'
import Swal from 'sweetalert2'

// Categorias ordenadas alfabeticamente
const OPCOES_CATEGORIA = [
  'ACADEMIA',
  'ANIVERSÁRIO',
  'AVALIAÇÃO UFCSPA',
  'CINEMA',
  'ENSAIO FOTOGRÁFICO',
  'ENVIO DE E-MAIL',
  'EVENTO',
  'EXAME LABORATORIAL',
  'EXAME MÉDICO',
  'FESTA / COMEMORAÇÃO',
  'HAPPY HOUR',
  'OUTRO / GERAL',
  'PASSEIO',
  'REUNIÃO',
  'VIAGEM'
].sort()

const OPCOES_AVALIACAO = [
  'AVALIAÇÃO 1',
  'AVALIAÇÃO 2',
  'AVALIAÇÃO 3',
  'AVALIAÇÃO 4',
  'EXAME FINAL',
  'RECUPERAÇÃO'
]

const OPCOES_ENSAIO = [
  'Aniversário Infantil',
  'Batizado',
  'Newborn',
  'Ensaio Praça',
  'Temático',
  'Formatura'
]

function AppointmentModal({ 
  show, 
  onClose, 
  onSave, 
  onDelete, 
  appointmentToEdit, 
  mode = 'geral', 
  disciplinesList = [],
  showDisciplinesCard,
  setShowDisciplinesCard
}) {
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
    time: '09:00',
    endTime: '10:00',
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
    photoShootType: 'Aniversário Infantil',
    clientName: '',
    phone: '',
    shift: 'Manhã',
    contactsList: [{ name: '', email: '', phone: '', contactCategory: '' }],
    isExam: false
  })

  useEffect(() => {
    if (!show) return

    if (appointmentToEdit) {
      const hasRealId = Boolean(appointmentToEdit.id || appointmentToEdit._id)

      let loadedContacts = appointmentToEdit.contactsList || []
      if (!Array.isArray(loadedContacts) || loadedContacts.length === 0) {
        loadedContacts = [{ name: appointmentToEdit.clientName || '', email: '', phone: appointmentToEdit.phone || '', contactCategory: '' }]
      }

      setFormData({
        ...appointmentToEdit,
        title: appointmentToEdit.title || '',
        date: appointmentToEdit.date || getTodayIso(),
        time: appointmentToEdit.time || '09:00',
        endTime: appointmentToEdit.endTime || '10:00',
        category: appointmentToEdit.category || (mode === 'disciplina' ? 'DISCIPLINA' : 'OUTRO / GERAL'),
        building: appointmentToEdit.building || '',
        room: appointmentToEdit.room || appointmentToEdit.location || '',
        periodDuration: appointmentToEdit.periodDuration || '50',
        priority: appointmentToEdit.priority || 'SEM PRIORIDADE',
        relatedSubjectId: appointmentToEdit.relatedSubjectId || (disciplinesList[0]?.id || disciplinesList[0]?._id || ''),
        examType: appointmentToEdit.examType || 'AVALIAÇÃO 1',
        examWeight: appointmentToEdit.examWeight || '30%',
        photoShootType: appointmentToEdit.photoShootType || 'Aniversário Infantil',
        clientName: appointmentToEdit.clientName || '',
        phone: appointmentToEdit.phone || '',
        shift: appointmentToEdit.shift || 'Manhã',
        contactsList: loadedContacts
      })

      setIsEditing(!hasRealId)
    } else {
      setFormData({
        title: '',
        date: getTodayIso(),
        time: '09:00',
        endTime: '10:00',
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
        photoShootType: 'Aniversário Infantil',
        clientName: '',
        phone: '',
        shift: 'Manhã',
        contactsList: [{ name: '', email: '', phone: '', contactCategory: '' }],
        isExam: false
      })
      setIsEditing(true)
    }
  }, [show, appointmentToEdit, mode])

  if (!show) return null

  // Gestão de Contatos
  const handleAddContact = () => {
    setFormData(prev => ({
      ...prev,
      contactsList: [...(prev.contactsList || []), { name: '', email: '', phone: '', contactCategory: '' }]
    }))
  }

  const handleRemoveContact = (index) => {
    const updated = (formData.contactsList || []).filter((_, i) => i !== index)
    setFormData({ ...formData, contactsList: updated.length ? updated : [{ name: '', email: '', phone: '', contactCategory: '' }] })
  }

  const handleContactChange = (index, field, value) => {
    const updated = [...(formData.contactsList || [])]
    if (!updated[index]) updated[index] = { name: '', email: '', phone: '', contactCategory: '' }
    updated[index][field] = value
    setFormData({ ...formData, contactsList: updated })
  }

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

    let finalTitle = formData.title
    let sanitizedContacts = []

    // Só envia contactsList preenchido se for ENVIO DE E-MAIL
    if (formData.category === 'ENVIO DE E-MAIL') {
      sanitizedContacts = (formData.contactsList || []).filter(c => c && c.name && c.name.trim() !== '')
      
      if (sanitizedContacts.length === 0) {
        Swal.fire({
          icon: 'warning',
          title: 'Contato Obrigatório',
          text: 'Informe ao menos o Nome do destinatário para o envio de e-mail.',
          confirmButtonColor: '#10b981'
        })
        return
      }

      if (!finalTitle.trim()) {
        const firstContact = sanitizedContacts[0]?.name || 'Contato'
        finalTitle = `Envio de E-mail - ${firstContact}`
      }
    } else if (formData.category === 'ENSAIO FOTOGRÁFICO') {
      if (!formData.clientName.trim()) {
        Swal.fire({
          icon: 'warning',
          title: 'Nome do Contratante',
          text: 'Por favor, preencha o nome do contratante do ensaio.',
          confirmButtonColor: '#10b981'
        })
        return
      }
      if (!finalTitle.trim()) {
        finalTitle = `Ensaio ${formData.photoShootType} - ${formData.clientName}`
      }
    } else if (!formData.title.trim() && formData.category !== 'AVALIAÇÃO UFCSPA') {
      Swal.fire({
        icon: 'warning',
        title: 'Campos Incompletos',
        text: 'Por favor, preencha o Título do compromisso.',
        confirmButtonColor: '#10b981'
      })
      return
    }

    let calculatedEnd = formData.endTime

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
      contactsList: sanitizedContacts, // Array limpo (vazio se não for ENVIO DE E-MAIL)
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

  const activeContacts = (formData.contactsList || []).filter(c => c && (c.name || c.email || c.phone))

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content border-0 shadow rounded-4">
          
          {/* Cabeçalho */}
          <div className="modal-header bg-light border-0">
            <h5 className="modal-title fw-bold text-dark m-0 d-flex align-items-center gap-2">
              {mode === 'disciplina' ? (
                <><i className="bi bi-mortarboard-fill text-primary"></i> Disciplina UFCSPA</>
              ) : (
                <><i className="bi bi-journal-text text-success"></i> Compromisso a Agendar</>
              )}
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>

          {!isEditing ? (
            /* VISUALIZAÇÃO DE DETALHES */
            <div className="modal-body p-4">
              <div className="mb-3">
                <h3 className="fw-bold text-dark mb-1">{formData.title}</h3>
                <div className="d-flex gap-2 align-items-center mt-2 flex-wrap">
                  <span className="badge bg-light text-dark border">{formData.category}</span>
                  {formData.shift && formData.category === 'ENVIO DE E-MAIL' && (
                    <span className="badge bg-primary text-white">Turno: {formData.shift}</span>
                  )}
                  {formData.photoShootType && formData.category === 'ENSAIO FOTOGRÁFICO' && (
                    <span className="badge bg-info text-dark">{formData.photoShootType}</span>
                  )}
                </div>
              </div>

              {/* LISTA DE CONTATOS DE E-MAIL */}
              {formData.category === 'ENVIO DE E-MAIL' && (
                <div className="p-3 bg-light rounded-3 border mb-3">
                  <h6 className="fw-bold text-dark mb-3">
                    <i className="bi bi-people-fill me-2 text-primary"></i> 
                    Destinatários para Envio
                  </h6>

                  {activeContacts.length === 0 ? (
                    <p className="text-muted small m-0">Nenhum contato especificado.</p>
                  ) : (
                    <div className="d-flex flex-column gap-2">
                      {activeContacts.map((c, i) => (
                        <div key={i} className="p-3 bg-white rounded border d-flex justify-content-between align-items-center flex-wrap gap-2">
                          <div>
                            <div className="fw-bold text-dark">
                              {c.name || 'Sem nome'}
                              {c.contactCategory && (
                                <span className="badge bg-secondary-subtle text-secondary border ms-2" style={{ fontSize: '0.7rem' }}>
                                  {c.contactCategory}
                                </span>
                              )}
                            </div>
                            <div className="small text-muted mt-1">
                              {c.email && <span className="me-3"><i className="bi bi-envelope me-1"></i>{c.email}</span>}
                              {c.phone && <span><i className="bi bi-whatsapp me-1 text-success"></i>{c.phone}</span>}
                            </div>
                          </div>

                          {c.email && (
                            <a 
                              href={`mailto:${c.email}?subject=${encodeURIComponent(formData.title || 'Envio de E-mail')}`}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="btn btn-sm btn-outline-primary fw-semibold d-flex align-items-center gap-1"
                            >
                              <i className="bi bi-send-fill"></i> Escrever E-mail
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* DETALHES DE ENSAIO FOTOGRÁFICO */}
              {formData.category === 'ENSAIO FOTOGRÁFICO' && formData.clientName && (
                <div className="p-3 bg-light rounded mb-3">
                  <p className="m-0"><strong>Contratante:</strong> {formData.clientName}</p>
                  {formData.phone && <p className="m-0"><strong>WhatsApp/Tel:</strong> {formData.phone}</p>}
                </div>
              )}

              <div className="row g-3 py-3 border-top border-bottom my-3">
                <div className="col-6 col-md-4">
                  <small className="text-muted d-block">Data</small>
                  <strong className="fs-6">{formData.date}</strong>
                </div>
                <div className="col-6 col-md-4">
                  <small className="text-muted d-block">Horário</small>
                  <strong className="fs-6">{formData.time} - {formData.endTime}</strong>
                </div>
                {formData.location && (
                  <div className="col-12 col-md-4">
                    <small className="text-muted d-block">Local</small>
                    <strong className="fs-6">{formData.location}</strong>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* FORMULÁRIO DE EDIÇÃO / CRIAÇÃO DIRECTO */
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

                    {setShowDisciplinesCard && (
                      <div className="form-check form-switch mb-3 p-2 bg-light rounded border ps-5">
                        <input 
                          className="form-check-input ms-n4" 
                          type="checkbox" 
                          id="toggleDisciplinesCard"
                          checked={showDisciplinesCard}
                          onChange={(e) => setShowDisciplinesCard(e.target.checked)}
                        />
                        <label className="form-check-label fw-semibold text-dark cursor-pointer" htmlFor="toggleDisciplinesCard">
                          <i className="bi bi-mortarboard-fill text-primary me-1"></i> Exibir painel de Disciplinas na página principal
                        </label>
                      </div>
                    )}

                    {/* CAMPOS ESPECÍFICOS PARA ENVIO DE E-MAIL */}
                    {formData.category === 'ENVIO DE E-MAIL' ? (
                      <div className="p-3 bg-light rounded-3 border mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h6 className="fw-bold text-primary m-0">
                            <i className="bi bi-envelope-at-fill me-2"></i>
                            Tarefa de Envio de E-mail
                          </h6>
                          <select 
                            className="form-select form-select-sm w-auto fw-semibold border-primary"
                            value={formData.shift}
                            onChange={(e) => setFormData({...formData, shift: e.target.value})}
                          >
                            <option value="Manhã">🌅 Turno Manhã</option>
                            <option value="Tarde">☀️ Turno Tarde</option>
                            <option value="Noite">🌙 Turno Noite</option>
                          </select>
                        </div>

                        <div className="mb-3">
                          <label className="form-label fw-semibold">Assunto / Título do E-mail</label>
                          <input 
                            type="text" 
                            className="form-control" 
                            placeholder="Ex: Cotação de Luvas Médicas - Lote Outubro"
                            value={formData.title}
                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                          />
                        </div>

                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <label className="form-label fw-semibold m-0">Contatos para Envio</label>
                          <button 
                            type="button" 
                            className="btn btn-sm btn-outline-primary rounded-circle p-0 d-flex align-items-center justify-content-center" 
                            style={{ width: '28px', height: '28px' }}
                            onClick={handleAddContact}
                            title="Adicionar Contato"
                          >
                            <i className="bi bi-plus-lg"></i>
                          </button>
                        </div>

                        {(formData.contactsList || []).map((contact, index) => (
                          <div key={index} className="p-2 mb-2 bg-white rounded border position-relative">
                            {formData.contactsList.length > 1 && (
                              <button 
                                type="button" 
                                className="btn-close position-absolute top-0 end-0 m-2"
                                style={{ fontSize: '0.75rem' }}
                                onClick={() => handleRemoveContact(index)}
                              ></button>
                            )}

                            <div className="row g-2 mb-2">
                              <div className="col-md-6">
                                <input 
                                  type="text" 
                                  className="form-control form-control-sm" 
                                  placeholder="Nome do Contato *"
                                  value={contact.name || ''}
                                  onChange={(e) => handleContactChange(index, 'name', e.target.value)}
                                />
                              </div>
                              <div className="col-md-6">
                                <input 
                                  type="email" 
                                  className="form-control form-control-sm" 
                                  placeholder="E-mail *"
                                  value={contact.email || ''}
                                  onChange={(e) => handleContactChange(index, 'email', e.target.value)}
                                />
                              </div>
                            </div>

                            <div className="row g-2">
                              <div className="col-md-6">
                                <input 
                                  type="text" 
                                  className="form-control form-control-sm" 
                                  placeholder="WhatsApp / Telefone"
                                  value={contact.phone || ''}
                                  onChange={(e) => handleContactChange(index, 'phone', e.target.value)}
                                />
                              </div>
                              <div className="col-md-6">
                                <input 
                                  type="text" 
                                  className="form-control form-control-sm" 
                                  placeholder="Categoria (ex: Fornecedor Luvas Médicas)"
                                  value={contact.contactCategory || ''}
                                  onChange={(e) => handleContactChange(index, 'contactCategory', e.target.value)}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : formData.category === 'ENSAIO FOTOGRÁFICO' ? (
                      /* CAMPOS ESPECÍFICOS DE ENSAIO FOTOGRÁFICO */
                      <div className="p-3 bg-light rounded-3 border mb-3">
                        <h6 className="fw-bold text-success mb-3">
                          <i className="bi bi-camera-fill me-2"></i>
                          Detalhes do Ensaio Fotográfico
                        </h6>

                        <div className="row g-3 mb-3">
                          <div className="col-md-6">
                            <label className="form-label fw-semibold">Tipo de Ensaio *</label>
                            <select 
                              className="form-select border-success"
                              value={formData.photoShootType}
                              onChange={(e) => setFormData({...formData, photoShootType: e.target.value})}
                            >
                              {OPCOES_ENSAIO.map((tipo) => (
                                <option key={tipo} value={tipo}>{tipo}</option>
                              ))}
                            </select>
                          </div>

                          <div className="col-md-6">
                            <label className="form-label fw-semibold">Nome do Contratante *</label>
                            <input 
                              type="text" 
                              className="form-control" 
                              required
                              placeholder="Ex: Maria Silva"
                              value={formData.clientName}
                              onChange={(e) => setFormData({...formData, clientName: e.target.value})}
                            />
                          </div>
                        </div>

                        <div className="row g-3 mb-3">
                          <div className="col-md-6">
                            <label className="form-label fw-semibold">Telefone / WhatsApp</label>
                            <input 
                              type="text" 
                              className="form-control" 
                              placeholder="Ex: (51) 99999-8888"
                              value={formData.phone}
                              onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            />
                          </div>

                          <div className="col-md-6">
                            <label className="form-label fw-semibold">Título Personalizado (Opcional)</label>
                            <input 
                              type="text" 
                              className="form-control" 
                              placeholder="Ex: Ensaio Marina - Orla"
                              value={formData.title}
                              onChange={(e) => setFormData({...formData, title: e.target.value})}
                            />
                          </div>
                        </div>
                      </div>
                    ) : formData.category === 'AVALIAÇÃO UFCSPA' ? (
                      /* CAMPOS ESPECÍFICOS DE AVALIAÇÃO UFCSPA */
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
                        placeholder="Ex: Prédio 2 - Sala 304, Parque Redenção"
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
                  </>
                )}
              </div>

              <div className="modal-footer bg-light border-0">
                <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-success px-4">
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