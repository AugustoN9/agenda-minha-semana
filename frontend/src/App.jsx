import React, { useState, useEffect } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'

import Header from './components/Header'
import CalendarWidget from './components/CalendarWidget'
import DisciplinesCard from './components/DisciplinesCard'
import DayCard from './components/DayCard'
import AppointmentModal from './components/AppointmentModal'
import Footer from './components/Footer'
import LoginScreen from './components/LoginScreen'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/agendamentos'
const DIAS_NOMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0
  const [hours, minutes] = timeStr.split(':').map(Number)
  return hours * 60 + minutes
}

const checkTimeConflict = (newApp, existingAppointments) => {
  if (newApp.category === 'AVALIAÇÃO UFCSPA') return null

  const newStart = timeToMinutes(newApp.time)
  const newEnd = timeToMinutes(newApp.endTime)
  const idToIgnore = newApp.id || newApp._id

  return existingAppointments.find((app) => {
    if (app.category === 'AVALIAÇÃO UFCSPA') return false
    const appId = app.id || app._id
    if (idToIgnore && appId === idToIgnore) return false
    if (app.date !== newApp.date) return false

    const existingStart = timeToMinutes(app.time)
    const existingEnd = timeToMinutes(app.endTime)

    return newStart < existingEnd && newEnd > existingStart
  })
}

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user')
    return savedUser ? JSON.parse(savedUser) : null
  })

  const [agendamentos, setAgendamentos] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('geral')
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  
  // Data selecionada no calendário
  const [selectedDate, setSelectedDate] = useState(new Date())

  const getAuthConfig = () => {
    const token = localStorage.getItem('token')
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {}
  }

  const fetchAgendamentos = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      setAgendamentos([])
      return
    }

    try {
      const res = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setAgendamentos(res.data)
    } catch (err) {
      console.error('Erro ao carregar dados:', err)
      setAgendamentos([])
    }
  }

  useEffect(() => {
    if (user) {
      fetchAgendamentos()
    }
  }, [user])

  const handleLoginSuccess = (userData) => {
    setAgendamentos([])
    setUser(userData)
    fetchAgendamentos()
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setAgendamentos([])
  }

  const activeYear = selectedDate.getFullYear()
  const activeMonth = selectedDate.getMonth()
  const activeSemester = `${activeYear}/${activeMonth >= 7 ? '2' : '1'}`

  // Abre o formulário de criação para uma data específica (via clique no DayCard / +)
  const handleOpenAddForDate = (isoDate) => {
    setSelectedAppointment({
      title: '',
      category: 'OUTRO / GERAL',
      priority: 'SEM PRIORIDADE',
      date: isoDate,
      time: '',
      endTime: '',
      location: '',
      description: ''
    })
    setModalMode('geral')
    setShowModal(true)
  }

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

  // Apenas navega para a data clicada no Calendário (atualiza o bloco de 7 dias sem abrir modal)
  const handleSelectDateFromCalendar = (date) => {
    setSelectedDate(date)
  }

  const handleSaveAppointment = async (formData) => {
    const conflict = checkTimeConflict(formData, agendamentos)
    if (conflict) {
      Swal.fire({
        icon: 'error',
        title: 'Conflito de Agenda!',
        text: `O horário informado (${formData.time} - ${formData.endTime}) sobrepõe o compromisso "${conflict.title}" (${conflict.time} - ${conflict.endTime}).`,
        confirmButtonColor: '#ef4444'
      })
      return
    }

    try {
      const idToUse = formData.id || formData._id
      const config = getAuthConfig()

      if (idToUse) {
        await axios.put(`${API_URL}/${idToUse}`, formData, config)
      } else {
        await axios.post(API_URL, formData, config)
      }
      setShowModal(false)
      fetchAgendamentos()
      Swal.fire({ icon: 'success', title: 'Salvo com sucesso!', timer: 1200, showConfirmButton: false })
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Não foi possível salvar o agendamento.'
      Swal.fire('Erro no Servidor!', errorMsg, 'error')
    }
  }

  const handleToggleComplete = async (appointment) => {
    try {
      const idToUse = appointment.id || appointment._id
      const updatedStatus = !appointment.isCompleted

      setAgendamentos(prev => prev.map(item => {
        const itemId = item.id || item._id
        return itemId === idToUse ? { ...item, isCompleted: updatedStatus } : item
      }))

      await axios.put(`${API_URL}/${idToUse}`, {
        ...appointment,
        isCompleted: updatedStatus
      }, getAuthConfig())
    } catch (err) {
      console.error('Erro ao atualizar status de conclusão:', err)
      fetchAgendamentos()
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
        await axios.delete(`${API_URL}/${id}`, getAuthConfig())
        fetchAgendamentos()
        Swal.fire('Excluído!', 'Removido com sucesso.', 'success')
      } catch (err) {
        Swal.fire('Erro!', 'Não foi possível excluir.', 'error')
      }
    }
  }

  // Gera os 7 dias dinâmicos: COMEÇANDO NO DIA SELECIONADO NO CALENDÁRIO + 6 SEGUINTES
  const getWeekDays = () => {
    const start = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate())
    const todayReal = new Date()
    todayReal.setHours(0, 0, 0, 0)

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start)
      d.setDate(start.getDate() + i)

      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      const iso = `${year}-${month}-${day}`
      const dateStr = `${day}/${month}/${String(year).slice(-2)}`

      const isSelectedDay = i === 0 // O primeiro card é sempre a data selecionada no calendário
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

  if (!user) {
    return (
      <LoginScreen 
        user={user} 
        onLoginSuccess={handleLoginSuccess} 
        onLogout={handleLogout} 
      />
    )
  }

  const weekDays = getWeekDays()
  const activeDayData = weekDays[0]

  const getAppointmentsForDay = (dia) => {
    return agendamentos.filter((a) => {
      if (a.date === dia.iso && !a.subjectCode) return true

      if (a.subjectCode) {
        const itemSemester = a.semester || `${activeYear}/2`
        if (itemSemester !== activeSemester) return false

        if (a.date) {
          const dateParts = a.date.split('-')
          if (dateParts.length === 3) {
            const startDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2])
            startDate.setHours(0, 0, 0, 0)

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

  const activeDisciplines = agendamentos.filter(a => {
    if (!a.subjectCode) return false
    const itemSemester = a.semester || `${activeYear}/2`
    return itemSemester === activeSemester
  })

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      <div className="container py-4 main-container flex-grow-1">
        <Header 
          onOpenModal={() => handleOpenGeralModal(null)} 
          user={user}
          onLoginSuccess={handleLoginSuccess}
          onLogout={handleLogout}
        />

        <div className="row g-3 mb-3">
          <div className="col-12 col-lg-6">
            <CalendarWidget selectedDate={selectedDate} onSelectDate={handleSelectDateFromCalendar} />
          </div>
          <div className="col-12 col-lg-6">
            {/* Card Principal do Dia Selecionado */}
            <DayCard 
              dayName={activeDayData.name}
              dateStr={activeDayData.dateStr}
              isoDate={activeDayData.iso}
              isToday={activeDayData.isSelectedDay}
              appointments={getAppointmentsForDay(activeDayData)}
              allAppointments={agendamentos}
              onAddNew={() => handleOpenAddForDate(activeDayData.iso)}
              onEdit={(item) => {
                if (item.subjectCode) {
                  handleEditDiscipline(item)
                } else {
                  handleOpenGeralModal(item)
                }
              }}
              onToggleComplete={handleToggleComplete}
            />
          </div>
        </div>

        <DisciplinesCard 
          activeSemester={activeSemester} 
          disciplines={activeDisciplines} 
          onAddDiscipline={handleOpenDisciplineModal}
          onEditDiscipline={handleEditDiscipline}
        />

        {/* Os 6 dias subsequentes */}
        <div className="row g-3">
          {weekDays.slice(1).map((dia) => (
            <div key={dia.iso} className="col-12 col-md-6">
              <DayCard 
                dayName={dia.name}
                dateStr={dia.dateStr}
                isoDate={dia.iso}
                isPassed={dia.isPassed}
                appointments={getAppointmentsForDay(dia)}
                allAppointments={agendamentos}
                onAddNew={() => handleOpenAddForDate(dia.iso)}
                onEdit={(item) => {
                  if (item.subjectCode) {
                    handleEditDiscipline(item)
                  } else {
                    handleOpenGeralModal(item)
                  }
                }}
                onToggleComplete={handleToggleComplete}
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
        onDelete={handleDelete}
        appointmentToEdit={selectedAppointment}
        disciplinesList={activeDisciplines}
      />

      <Footer />
    </div>
  )
}

export default App