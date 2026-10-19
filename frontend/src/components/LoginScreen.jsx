import React from 'react'
import LoginButton from './LoginButton'
import bgDesktop from '../assets/fundo-desktop.png'
import bgMobile from '../assets/fundo-mobile.png'

function LoginScreen({ user, onLoginSuccess, onLogout }) {
  return (
    <div className="login-screen-wrapper min-vh-100 d-flex align-items-center justify-content-center px-3">
      {/* CSS Responsivo para alternar as imagens de fundo */}
      <style>{`
        .login-screen-wrapper {
          background-image: url(${bgMobile});
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          transition: background-image 0.3s ease-in-out;
        }

        /* Telas a partir de 768px (Tablets e Desktops) usam a imagem horizontal */
        @media (min-width: 768px) {
          .login-screen-wrapper {
            background-image: url(${bgDesktop});
          }
        }
      `}</style>

      {/* Cartão de Login com efeito translúcido (Glassmorphism) */}
      <div 
        className="card shadow-lg p-4 p-md-5 text-center border-0 rounded-4" 
        style={{ 
          maxWidth: '440px', 
          width: '100%',
          backgroundColor: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(10px)'
        }}
      >
        <div className="mb-3">
          <i className="bi bi-calendar-event-fill text-success" style={{ fontSize: '3.5rem' }}></i>
        </div>
        <h3 className="fw-bold text-dark mb-1">APP Minha Semana</h3>
        <p className="text-muted small mb-4">
          Acesse com sua conta do Google para gerenciar sua rotina organizando sua semana.
        </p>
        
        <div className="d-flex justify-content-center">
          <LoginButton 
            user={user} 
            onLoginSuccess={onLoginSuccess} 
            onLogout={onLogout} 
          />
        </div>
      </div>
    </div>
  )
}

export default LoginScreen