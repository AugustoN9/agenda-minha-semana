require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dns = require('dns');
const Appointment = require('./models/Appointment');
const { router: authRoutes, authenticateToken } = require('./routes/auth');

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

// Rotas de Autenticação Google OAuth2
app.use('/auth', authRoutes);

// Helper: Converte "HH:MM" para minutos totais do dia
const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

// Helper: Verifica conflito de horários no banco apenas entre os compromissos do próprio utilizador
const checkTimeConflict = async (date, newTime, newEndTime, category, ignoreId = null, userId = null) => {
  // Avaliações UFCSPA não geram conflito de horário pois vinculam-se à disciplina
  if (category === 'AVALIAÇÃO UFCSPA') return null;

  const query = { date, isCanceled: false };
  if (userId) query.userId = userId;

  const existingAppointments = await Appointment.find(query);

  const newStart = timeToMinutes(newTime);
  const newEnd = timeToMinutes(newEndTime);

  return existingAppointments.find(app => {
    if (ignoreId && app._id.toString() === ignoreId.toString()) return false;
    if (app.category === 'AVALIAÇÃO UFCSPA') return false;
    if (!app.time || !app.endTime) return false;

    const existingStart = timeToMinutes(app.time);
    const existingEnd = timeToMinutes(app.endTime);

    // Condição de sobreposição: NovoInicio < ExistenteFim E NovoFim > ExistenteInicio
    return newStart < existingEnd && newEnd > existingStart;
  });
};

// Rota de Teste Publica
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'API Agenda UFCSPA (MongoDB) ativa!' });
});

// GET - Listar Agendamentos (Isolado por utilizador)
app.get('/agendamentos', authenticateToken, async (req, res) => {
  try {
    const appointments = await Appointment.find({ userId: req.userId }).sort({ date: 1, time: 1 });
    res.json(appointments);
  } catch (error) {
    console.error('Erro ao buscar agendamentos:', error);
    res.status(500).json({ error: 'Erro ao buscar agendamentos' });
  }
});

// POST - Criar Agendamento (Vinculado ao utilizador logado)
app.post('/agendamentos', authenticateToken, async (req, res) => {
  try {
    const { date, time, endTime, category } = req.body;

    // Checa conflito de horário apenas no escopo do utilizador
    if (date && time && endTime) {
      const conflict = await checkTimeConflict(date, time, endTime, category, null, req.userId);
      if (conflict) {
        return res.status(400).json({ 
          error: `Conflito de agenda! O horário (${time} - ${endTime}) conflita com "${conflict.title}" (${conflict.time} - ${conflict.endTime}).` 
        });
      }
    }

    const newAppointment = new Appointment({
      ...req.body,
      userId: req.userId
    });

    const saved = await newAppointment.save();
    res.status(201).json(saved);
  } catch (error) {
    console.error('Erro ao criar agendamento:', error);
    res.status(400).json({ error: error.message || 'Erro ao criar agendamento' });
  }
});

// PUT - Editar Agendamento
app.put('/agendamentos/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { date, time, endTime, category } = req.body;

    // Checa conflito de horário ignorando o próprio agendamento atual
    if (date && time && endTime) {
      const conflict = await checkTimeConflict(date, time, endTime, category, id, req.userId);
      if (conflict) {
        return res.status(400).json({ 
          error: `Conflito de agenda! O horário (${time} - ${endTime}) conflita com "${conflict.title}" (${conflict.time} - ${conflict.endTime}).` 
        });
      }
    }

    const updated = await Appointment.findOneAndUpdate(
      { _id: id, userId: req.userId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Agendamento não encontrado ou não autorizado' });
    }

    res.json(updated);
  } catch (error) {
    console.error('Erro ao atualizar agendamento:', error);
    res.status(400).json({ error: error.message || 'Erro ao atualizar agendamento' });
  }
});

// DELETE - Remover Agendamento
app.delete('/agendamentos/:id', authenticateToken, async (req, res) => {
  try {
    const deleted = await Appointment.findOneAndDelete({ _id: req.params.id, userId: req.userId });

    if (!deleted) {
      return res.status(404).json({ error: 'Agendamento não encontrado ou não autorizado' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao remover agendamento:', error);
    res.status(500).json({ error: 'Erro ao remover agendamento' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});