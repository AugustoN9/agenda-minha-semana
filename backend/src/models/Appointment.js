const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: String,
  phone: String,
  contactCategory: String // ex: 'Fornecedor de Luvas Médicas'
});

const appointmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'O usuário é obrigatório']
  },

  title: { 
    type: String, 
    required: [true, 'O título é obrigatório'] 
  },
  description: String,
  date: { 
    type: String, 
    required: [true, 'A data é obrigatória'] 
  },
  time: { 
    type: String, 
    required: [true, 'O horário de início é obrigatório'] 
  },
  endTime: { 
    type: String, 
    required: [true, 'O horário final é obrigatório']
  },
  duration: { type: Number, default: 60 },
  location: String,
  phone: String,

  // Campos específicos para ENVIO DE E-MAIL
  shift: String, // 'Manhã', 'Tarde', 'Noite' ou 'Horário Específico'
  contactsList: [contactSchema],

  // Campos específicos para ENSAIO FOTOGRÁFICO
  photoShootType: String,
  clientName: String,

  // Campos Acadêmicos UFCSPA
  semester: String,
  subjectCode: String,
  professor: String,
  creditPeriods: String,

  // Campos específicos para AVALIAÇÃO UFCSPA
  category: String,
  relatedSubjectId: String,
  examType: String,
  examWeight: String,

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
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
    }
  }
});

module.exports = mongoose.model('Appointment', appointmentSchema);