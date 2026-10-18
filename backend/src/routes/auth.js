const express = require('express');
const router = express.Router();
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Middleware para autenticar e validar o Token JWT nas rotas do backend
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'ufcspa_secreta', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido ou expirado.' });
    }
    req.user = user;
    next();
  });
};

// Rota de login / verificação de credencial Google OAuth
router.post('/google', async (req, res) => {
  const { credential } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    let user = await User.findOne({ googleId });
    if (!user) {
      user = await User.create({ googleId, email, name, picture });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email }, 
      process.env.JWT_SECRET || 'ufcspa_secreta', 
      { expiresIn: '7d' }
    );

    res.json({ 
      token, 
      user: { id: user._id, name: user.name, email: user.email, picture: user.picture } 
    });
  } catch (err) {
    console.error('Erro na autenticação Google:', err);
    res.status(401).json({ error: 'Token inválido ou expirado' });
  }
});

module.exports = {
  router,
  authenticateToken
};