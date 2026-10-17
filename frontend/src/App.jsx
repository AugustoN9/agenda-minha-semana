import React, { useState, useEffect } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'

import Header from './components/Header'
import CalendarWidget from './components/CalendarWidget'
import DisciplinesCard from './components/DisciplinesCard'
import DayCard from './components/DayCard'
import AppointmentModal from './components/AppointmentModal'
import Footer from './components/Footer'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/agendamentos'
const DIAS_NOMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

function App() {
  const [agendamentos, setAgendamentos] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('geral')
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  
  // Data inicial selecionada no calendário
  const [selectedDate, setSelectedDate] = useState(new Date(2026, 6, 15)) // 15 de Julho de 2026

  const fetchAgendamentos = async () => {
    try {
      const res = await axios.get(API_URL)
      setAgendamentos(res.data)
    } catch (err) {
      console.error('Erro ao carregar dados:', err)
    }
  }

  useEffect(() => {
    fetchAgendamentos()
  }, [])

  // CORREÇÃO DO SEMESTRE:
  // Janeiro (0) a Julho (6) = Semestre 1 (ex: 2026/1)
  // Agosto (7) a Dezembro (11) = Semestre 2 (ex: 2026/2)
  const activeYear = selectedDate.getFullYear()
  const activeMonth = selectedDate.getMonth()
  const activeSemester = `${activeYear}/${activeMonth >= 7 ? '2' : '1'}`

  const handleOpenGeralModal = (app = null) => {
    setSelectedAppointment(app)
    setModalMode('geral')
    setShowModal(true)
  }

  const handleOpenDisciplineModal = () => {
    setSelectedAppointment(null)
    setModalMode('disciplina')
    setShowModal(true)
  }

  const handleEditDiscipline = (disc) => {
    setSelectedAppointment(disc)
    setModalMode('disciplina')
    setShowModal(true)
  }

  const handleSaveAppointment = async (formData) => {
    try {
      const idToUse = formData.id || formData._id
      if (idToUse) {
        await axios.put(`${API_URL}/${idToUse}`, formData)
      } else {
        await axios.post(API_URL, formData)
      }
      setShowModal(false)
      fetchAgendamentos()
      Swal.fire({ icon: 'success', title: 'Salvo com sucesso!', timer: 1200, showConfirmButton: false })
    } catch (err) {
      Swal.fire('Erro!', 'Não foi possível salvar.', 'error')
    }
  }

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: 'Deseja excluir?',
      text: 'Esta ação não poderá ser desfeita!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim, excluir',
      cancelButtonText: 'Cancelar'
    })

    if (confirm.isConfirmed) {
      try {
        await axios.delete(`${API_URL}/${id}`)
        fetchAgendamentos()
        Swal.fire('Excluído!', 'Removido com sucesso.', 'success')
      } catch (err) {
        Swal.fire('Erro!', 'Não foi possível excluir.', 'error')
      }
    }
  }

  // Monta os 7 dias da semana
  const getWeekDays = () => {
    const current = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate())
    const dayOfWeek = current.getDay()
    
    const sunday = new Date(current)
    sunday.setDate(current.getDate() - dayOfWeek)

    const todayReal = new Date()
    todayReal.setHours(0, 0, 0, 0)

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(sunday)
      d.setDate(sunday.getDate() + i)

      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      const iso = `${year}-${month}-${day}`
      const dateStr = `${day}/${month}/${String(year).slice(-2)}`

      const isSelectedDay = d.toDateString() === selectedDate.toDateString()
      const dZero = new Date(d)
      dZero.setHours(0, 0, 0, 0)
      const isPassed = dZero < todayReal

      return {
        name: DIAS_NOMES[d.getDay()],
        dateStr,
        iso,
        fullDate: dZero,
        dayIndex: d.getDay(),
        isSelectedDay,
        isPassed
      }
    })
  }

  const weekDays = getWeekDays()
  const activeDayData = weekDays.find(d => d.isSelectedDay) || weekDays[0]

  // Filtro de compromissos para cada card do dia
  const getAppointmentsForDay = (dia) => {
    return agendamentos.filter((a) => {
      // 1. Compromisso geral por data exata (YYYY-MM-DD)
      if (a.date === dia.iso && !a.subjectCode) return true

      // 2. Disciplinas acadêmicas
      if (a.subjectCode) {
        const itemSemester = a.semester || `${activeYear}/2`
        // Só exibe se a disciplina pertencer ao semestre do mês visualizado
        if (itemSemester !== activeSemester) return false

        if (a.date) {
          const dateParts = a.date.split('-')
          if (dateParts.length === 3) {
            const startDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2])
            startDate.setHours(0, 0, 0, 0)

            // A aula só aparece se a data do card for igual ou posterior à data de início da disciplina
            if (dia.fullDate >= startDate && startDate.getDay() === dia.dayIndex) {
              return true
            }
          }
        } else if (a.dayOfWeek && a.dayOfWeek.toLowerCase().startsWith(dia.name.toLowerCase())) {
          return true
        }
      }

      return false
    })
  }

  // Disciplinas exibidas no card horizontal de "Disciplinas do Semestre Ativo"
  const activeDisciplines = agendamentos.filter(a => {
    if (!a.subjectCode) return false
    const itemSemester = a.semester || `${activeYear}/2`
    
    // Deve pertencer ao semestre ativo E ter data de início dentro do ano/mês vigente
    return itemSemester === activeSemester
  })

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      <div className="container py-4 main-container flex-grow-1">
        <Header onOpenModal={() => handleOpenGeralModal(null)} />

        {/* Linha Superior: Widget do Calendário + Card do Dia Selecionado */}
        <div className="row g-3 mb-3">
          <div className="col-12 col-lg-6">
            <CalendarWidget selectedDate={selectedDate} onSelectDate={setSelectedDate} />
          </div>
          <div className="col-12 col-lg-6">
            <DayCard 
              dayName={activeDayData.name}
              dateStr={activeDayData.dateStr}
              isToday={activeDayData.isSelectedDay}
              appointments={getAppointmentsForDay(activeDayData)}
              onEdit={(item) => {
                if (item.subjectCode) {
                  handleEditDiscipline(item)
                } else {
                  handleOpenGeralModal(item)
                }
              }}
              onDelete={handleDelete}
            />
          </div>
        </div>

        {/* Banner de Disciplinas do Semestre Ativo */}
        <DisciplinesCard 
          activeSemester={activeSemester} 
          disciplines={activeDisciplines} 
          onAddDiscipline={handleOpenDisciplineModal}
          onEditDiscipline={handleEditDiscipline}
          onDeleteDiscipline={handleDelete}
        />

        {/* Grid dos Restantes Dias da Semana */}
        <div className="row g-3">
          {weekDays.filter(d => !d.isSelectedDay).map((dia) => (
            <div key={dia.name} className="col-12 col-md-6">
              <DayCard 
                dayName={dia.name}
                dateStr={dia.dateStr}
                isPassed={dia.isPassed}
                holidayName={dia.holiday}
                appointments={getAppointmentsForDay(dia)}
                onEdit={(item) => {
                  if (item.subjectCode) {
                    handleEditDiscipline(item)
                  } else {
                    handleOpenGeralModal(item)
                  }
                }}
                onDelete={handleDelete}
              />
            </div>
          ))}
        </div>
      </div>

      <AppointmentModal 
        show={showModal} 
        mode={modalMode}
        onClose={() => setShowModal(false)} 
        onSave={handleSaveAppointment}
        appointmentToEdit={selectedAppointment}
      />

      <Footer />
    </div>
  )
}

export default App