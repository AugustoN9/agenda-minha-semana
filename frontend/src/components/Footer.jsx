import React from 'react'

function Footer() {
  return (
    <footer className="app-footer-dark bg-dark text-white mt-5 py-4 border-top border-secondary border-opacity-25">
      <div className="container main-container">
        <div className="row align-items-center gy-3">
          <div className="col-md-6 text-center text-md-start">
            <div className="d-flex align-items-center justify-content-center justify-content-md-start mb-1">
              <span className="fw-bold text-white fs-6 me-2">Minha Semana</span>
              <span className="badge bg-secondary text-light border border-secondary rounded-pill px-2 py-1 small">v1.0.0</span>
            </div>
            <p className="text-secondary small m-0">
              Desenvolvido por <strong className="text-white">@augustoN9</strong> &copy; {new Date().getFullYear()} UFCSPA
            </p>
          </div>
          <div className="col-md-6 text-center text-md-end">
            <div className="d-inline-flex gap-2 flex-wrap justify-content-center justify-content-md-end">
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="btn btn-outline-light btn-sm rounded-circle social-icon-btn-dark" title="LinkedIn"><i className="bi bi-linkedin"></i></a>
              <a href="https://instagram.com/augustoN9" target="_blank" rel="noopener noreferrer" className="btn btn-outline-light btn-sm rounded-circle social-icon-btn-dark" title="Instagram"><i className="bi bi-instagram"></i></a>
              <a href="https://wa.me/5551999999999" target="_blank" rel="noopener noreferrer" className="btn btn-outline-light btn-sm rounded-circle social-icon-btn-dark" title="WhatsApp"><i className="bi bi-whatsapp"></i></a>
              <a href="mailto:contato@ufcspa.edu.br" className="btn btn-outline-light btn-sm rounded-circle social-icon-btn-dark" title="E-mail de Contato"><i className="bi bi-envelope-fill"></i></a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer