const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  date: { type: String, required: true }, // Formato YYYY-MM-DD
  time: { type: String, required: true }, // Formato HH:MM
  endTime: String,
  duration: { type: Number, default: 60 },
  location: String,
  phone: String,

  // Campos Acadêmicos UFCSPA
  semester: String,
  subjectCode: String,
  professor: String,
  creditPeriods: String,

  // Flags e Status
  isExam: { type: Boolean, default: false },
  isCanceled: { type: Boolean, default: false },
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