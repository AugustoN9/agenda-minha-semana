require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dns = require('dns');
const Appointment = require('./models/Appointment');

// Força o Node.js a usar os servidores DNS do Google para resolver os registros SRV do MongoDB Atlas
dns.setServers(['8.8.8.8', '8.8.4.4']);

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Conexão com MongoDB Atlas
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('ERRO: MONGODB_URI não foi definida no arquivo .env!');
} else {
  mongoose.connect(MONGODB_URI)
    .then(() => console.log('MongoDB Atlas conectado com sucesso!'))
    .catch(err => console.error('Erro ao conectar no MongoDB:', err));
}

// Rota de Teste
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'API Agenda UFCSPA (MongoDB) ativa!' });
});

// GET - Listar Agendamentos
app.get('/agendamentos', async (req, res) => {
  try {
    const appointments = await Appointment.find().sort({ date: 1, time: 1 });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar agendamentos' });
  }
});

// POST - Criar Agendamento
app.post('/agendamentos', async (req, res) => {
  try {
    const newAppointment = new Appointment(req.body);
    const saved = await newAppointment.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar agendamento' });
  }
});

// PUT - Editar Agendamento
app.put('/agendamentos/:id', async (req, res) => {
  try {
    const updated = await Appointment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar agendamento' });
  }
});

// DELETE - Remover Agendamento
app.delete('/agendamentos/:id', async (req, res) => {
  try {
    await Appointment.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover agendamento' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});