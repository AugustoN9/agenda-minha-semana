import React from 'react'
import { GoogleLogin } from '@react-oauth/google'
import axios from 'axios'
import Swal from 'sweetalert2'

const AUTH_URL = import.meta.env.VITE_AUTH_URL || 'http://localhost:3000/auth/google'

function LoginButton({ user, onLoginSuccess, onLogout }) {
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await axios.post(AUTH_URL, {
        credential: credentialResponse.credential
      })

      const { token, user: userData } = res.data

      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(userData))

      onLoginSuccess(userData)

      Swal.fire({
        icon: 'success',
        title: `Bem-vindo, ${userData.name}!`,
        timer: 1500,
        showConfirmButton: false
      })
    } catch (error) {
      console.error('Erro no login com o Google:', error)
      Swal.fire('Erro', 'Não foi possível autenticar com o Google.', 'error')
    }
  }

  // Se o utilizador NÃO estiver autenticado
  if (!user) {
    return (
      <GoogleLogin
        onSuccess={handleGoogleSuccess}
        onError={() => Swal.fire('Erro', 'Falha ao conectar ao Google', 'error')}
        useOneTap
        shape="pill"
      />
    )
  }

  // Obter inicial do nome para o avatar fallback
  const userInitial = user.name ? user.name.charAt(0).toUpperCase() : 'U'

  // Se o utilizador ESTIVER autenticado -> Exibe o Avatar com Menu Dropdown
  return (
    <div className="dropdown">
      <button
        className="btn btn-link p-0 border-0 text-decoration-none shadow-none"
        type="button"
        id="dropdownUserMenu"
        data-bs-toggle="dropdown"
        aria-expanded="false"
        style={{ cursor: 'pointer' }}
      >
        {user.picture ? (
          <img
            src={user.picture}
            alt={user.name}
            className="rounded-circle border border-2 border-success shadow-sm"
            width="42"
            height="42"
            referrerPolicy="no-referrer"
            onError={(e) => {
              // Se o Google bloquear a imagem por CORS/Referrer, oculta a tag e mostra as iniciais
              e.target.style.display = 'none'
              if (e.target.nextSibling) {
                e.target.nextSibling.style.display = 'flex'
              }
            }}
            style={{ objectFit: 'cover' }}
          />
        ) : null}

        {/* Fallback de Avatar caso a imagem não carregue */}
        <div
          className="rounded-circle bg-success text-white fw-bold align-items-center justify-content-center shadow-sm"
          style={{
            width: '42px',
            height: '42px',
            fontSize: '1.1rem',
            display: user.picture ? 'none' : 'flex'
          }}
        >
          {userInitial}
        </div>
      </button>

      <ul
        className="dropdown-menu dropdown-menu-end shadow-lg border-0 rounded-3 mt-2 p-2"
        aria-labelledby="dropdownUserMenu"
        style={{ minWidth: '220px' }}
      >
        <li className="px-3 py-2 border-bottom mb-1">
          <div className="fw-bold text-dark text-truncate">{user.name}</div>
          <div className="text-muted small text-truncate">{user.email}</div>
        </li>

        <li>
          <button
            className="dropdown-menu-item btn btn-light w-100 text-start text-danger fw-semibold d-flex align-items-center gap-2 rounded-2 mt-1 py-2 px-3"
            onClick={onLogout}
          >
            <i className="bi bi-box-arrow-right fs-5"></i>
            Sair / Trocar de Conta
          </button>
        </li>
      </ul>
    </div>
  )
}

export default LoginButton