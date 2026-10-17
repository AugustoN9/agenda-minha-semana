import React from 'react'

function Header({ onOpenModal }) {
  return (
    <header className="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h1 className="fw-bold m-0 text-dark">Minha Semana</h1>
        <p className="text-muted small m-0">Organizando seus compromissos</p>
      </div>
      <button 
        className="btn p-0 border-0 bg-transparent" 
        title="Novo Compromisso"
        onClick={() => onOpenModal(null)}
      >
        <i className="bi bi-plus-circle-fill display-5 text-success"></i>
      </button>
    </header>
  )
}

export default Header