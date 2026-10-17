import React from 'react'

const MESES = [
  'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
  'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
]

const CORES_MESES = [
  'linear-gradient(135deg, #2b5876 0%, #4e4376 100%)',
  'linear-gradient(135deg, #ff0844 0%, #ffb199 100%)',
  'linear-gradient(135deg, #00b09b 0%, #96c93d 100%)',
  'linear-gradient(135deg, #4ac29a 0%, #bdfff3 100%)',
  'linear-gradient(135deg, #f857a6 0%, #ff5858 100%)',
  'linear-gradient(135deg, #ff9966 0%, #ff5e62 100%)',
  'linear-gradient(135deg, #56ccf2 0%, #2f80ed 100%)',
  'linear-gradient(135deg, #f2994a 0%, #f2c94c 100%)',
  'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
  'linear-gradient(135deg, #20c997 0%, #198754 100%)',
  'linear-gradient(135deg, #8e2de2 0%, #4a00e0 100%)',
  'linear-gradient(135deg, #e52d27 0%, #b31217 100%)'
]

function CalendarWidget({ selectedDate, onSelectDate }) {
  const year = selectedDate.getFullYear()
  const month = selectedDate.getMonth()
  const todayNum = selectedDate.getDate()

  const handleMonthChange = (offset) => {
    const newDate = new Date(selectedDate)
    newDate.setMonth(month + offset)
    onSelectDate(newDate)
  }

  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const calendarDays = []
  for (let i = 0; i < firstDayOfMonth; i++) calendarDays.push(null)
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i)

  const backgroundAtual = CORES_MESES[month] || CORES_MESES[0]

  return (
    <div className="card shadow-sm border-0 rounded-4 overflow-hidden bg-white h-100">
      <div className="row g-0 h-100">
        
        <div 
          className="col-12 col-md-5 text-white p-4 d-flex flex-column justify-content-between text-center min-vh-25"
          style={{ 
            background: backgroundAtual,
            transition: 'background 0.4s ease-in-out'
          }}
        >
          <div className="fs-5 fw-bold opacity-90">{year}</div>
          
          <div className="my-auto py-2">
            <span className="fw-bolder display-1 d-block lh-1" style={{ fontSize: '4.5rem', letterSpacing: '-2px' }}>
              {todayNum}
            </span>
          </div>

          <div className="d-flex justify-content-between align-items-center fw-bold fs-6 pt-2 border-top border-white border-opacity-25">
            <button onClick={() => handleMonthChange(-1)} className="btn btn-link text-white p-0 shadow-none">
              <i className="bi bi-chevron-left fs-5"></i>
            </button>
            <span className="small tracking-wider">{MESES[month]}</span>
            <button onClick={() => handleMonthChange(1)} className="btn btn-link text-white p-0 shadow-none">
              <i className="bi bi-chevron-right fs-5"></i>
            </button>
          </div>
        </div>

        <div className="col-12 col-md-7 p-3 p-xl-4 d-flex flex-column justify-content-center">
          <div 
            style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(7, 1fr)', 
              textAlign: 'center' 
            }} 
            className="fw-bold text-muted small mb-2"
          >
            <div>Dom</div>
            <div>Seg</div>
            <div>Ter</div>
            <div>Qua</div>
            <div>Qui</div>
            <div>Sex</div>
            <div>Sáb</div>
          </div>

          <div 
            style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(7, 1fr)', 
              rowGap: '6px', 
              justifyItems: 'center', 
              alignItems: 'center' 
            }}
          >
            {calendarDays.map((day, idx) => {
              if (!day) return <div key={idx} style={{ width: '32px', height: '32px' }}></div>

              const isSelected = day === todayNum
              return (
                <button
                  key={idx}
                  onClick={() => {
                    const newD = new Date(year, month, day)
                    onSelectDate(newD)
                  }}
                  className={`btn calendar-day-btn border-0 d-flex justify-content-center align-items-center ${
                    isSelected ? 'active-day' : 'text-dark fw-medium'
                  }`}
                >
                  {day}
                </button>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}

export default CalendarWidget