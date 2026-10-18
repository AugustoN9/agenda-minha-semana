import React from 'react'
import LoginButton from './LoginButton'

function Header({ onOpenModal, user, onLoginSuccess, onLogout }) {
  return (
    <header className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
      <div>
        <h2 className="fw-bold text-dark m-0 d-flex align-items-center gap-2">
          <i className="bi bi-calendar-event-fill text-success"></i>
          Minha Semana
        </h2>
        <small className="text-muted">Agenda Acadêmica UFCSPA</small>
      </div>

      <div className="d-flex align-items-center gap-3">
        <button 
          className="btn btn-success rounded-pill px-3 py-2 d-flex align-items-center gap-2 fw-semibold shadow-sm" 
          onClick={onOpenModal}
        >
          <i className="bi bi-plus-lg fs-5"></i>
          <span className="d-none d-sm-inline">Novo Compromisso</span>
        </button>

        <LoginButton 
          user={user} 
          onLoginSuccess={onLoginSuccess} 
          onLogout={onLogout} 
        />
      </div>
    </header>
  )
}

export default Header