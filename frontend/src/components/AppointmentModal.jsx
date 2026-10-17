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

function AppointmentModal({ show, onClose, onSave, appointmentToEdit, mode = 'geral' }) {
  const getTodayIso = () => {
    const today = new Date()
    const y = today.getFullYear()
    const m = String(today.getMonth() + 1).padStart(2, '0')
    const d = String(today.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

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

    // Validação SweetAlert2 - Campos Gerais
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
      // Validação SweetAlert2 - Código da Disciplina
      if (!formData.subjectCode.trim()) {
        Swal.fire({
          icon: 'warning',
          title: 'Código Obrigatório!',
          text: 'Informe o código da disciplina (ex: INF06001) para exibi-la corretamente.',
          confirmButtonColor: '#10b981'
        })
        return
      }
      calculatedEnd = calculateEndTime(formData.time, formData.creditPeriods, formData.periodDuration)
    } else {
      if (!formData.endTime) {
        Swal.fire({
          icon: 'warning',
          title: 'Horário Final em Falta',
          text: 'Por favor, informe o horário final do compromisso.',
          confirmButtonColor: '#10b981'
        })
        return
      }
    }

    // Validação se Horário Final é maior que Inicial
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

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content border-0 shadow">
          <div className="modal-header bg-light">
            <h5 className="modal-title fw-bold text-dark m-0 d-flex align-items-center gap-2">
              {mode === 'geral' ? (
                <>
                  <i className="bi bi-journal-text text-success"></i>
                  {appointmentToEdit ? 'Editar Compromisso' : 'Novo Compromisso'}
                </>
              ) : (
                <>
                  <i className="bi bi-mortarboard-fill text-primary"></i>
                  {appointmentToEdit ? 'Editar Disciplina' : 'Cadastrar Disciplina UFCSPA'}
                </>
              )}
            </h5>
            <button type="button" className="btn-close ms-auto" onClick={onClose}></button>
          </div>

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
                      placeholder="Ex: Reunião de Monitoria, Aniversário do João"
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
                        placeholder="Ex: Prédio 2 - Sala 304"
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
                        placeholder="Ex: Introdução à Epidemiologia"
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
                        placeholder="Ex: INF06001"
                      />
                    </div>
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-md-5">
                      <label className="form-label fw-semibold">Data de Início / Dia *</label>
                      <input 
                        type="date" 
                        className="form-control" 
                        required 
                        value={formData.date}
                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label fw-semibold">Horário de Início *</label>
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
                        placeholder="Ex: Prédio 2"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Sala</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={formData.room || ''}
                        onChange={(e) => setFormData({...formData, room: e.target.value})}
                        placeholder="Ex: Sala 200b"
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
                        placeholder="Ex: Prof. Dr. Silva"
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

            <div className="modal-footer bg-light">
              <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Cancelar</button>
              <button type="submit" className={`btn ${mode === 'geral' ? 'btn-success' : 'btn-primary'} px-4`}>
                Salvar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AppointmentModal