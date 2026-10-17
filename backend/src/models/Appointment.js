const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: [true, 'O título é obrigatório'] 
  },
  description: String,
  date: { 
    type: String, 
    required: [true, 'A data é obrigatória'] 
  }, // Formato YYYY-MM-DD
  time: { 
    type: String, 
    required: [true, 'O horário de início é obrigatório'] 
  }, // Formato HH:MM
  endTime: { 
    type: String, 
    required: [true, 'O horário final é obrigatório'],
    validate: {
      validator: function(v) {
        if (!this.time || !v) return true;
        return v > this.time; // Garante que endTime seja posterior a time
      },
      message: 'O horário final deve ser posterior ao horário inicial'
    }
  }, // Formato HH:MM
  duration: { type: Number, default: 60 },
  location: String,
  phone: String,

  // Campos Acadêmicos UFCSPA
  semester: String,
  subjectCode: String,
  professor: String,
  creditPeriods: String,

  // Flags, Status e Prioridade
  priority: { 
    type: String, 
    enum: ['SEM PRIORIDADE', 'BAIXA', 'MÉDIA', 'ALTA', 'MUITO ALTA'], 
    default: 'SEM PRIORIDADE' 
  },
  isExam: { type: Boolean, default: false },
  isCanceled: { type: Boolean, default: false },
  isCompleted: { type: Boolean, default: false },
  holidayName: String
}, { 
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      ret.id = ret._id.toString(); // Converte o _id do MongoDB para id no formato string do Frontend
      delete ret._id;
      delete ret.__v;
    }
  }
});

module.exports = mongoose.model('Appointment', appointmentSchema);