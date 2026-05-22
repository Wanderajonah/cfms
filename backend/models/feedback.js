const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    // Customer-facing fields
    name: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },

    // Feedback content
  ticketNumber: { type: Number, unique: true, sparse: true, index: true },
    category: {
      type: String,
      enum: ['Food Quality', 'Service', 'Ambiance', 'Cleanliness', 'Pricing', 'Menu', 'Value', 'Other'],
      default: 'Other',
      index: true,
    },
    type: {
      type: String,
      enum: ['compliment', 'suggestion', 'complaint'],
      default: 'suggestion',
      index: true,
    },
    rating: { type: Number, min: 1, max: 5 },
    message: { type: String, required: true, trim: true },

    // Staff workflow fields
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'resolved', 'escalated'],
      default: 'pending',
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
      index: true,
    },
    assignedTo: { type: String, trim: true },
    staffNotes: { type: String, trim: true },
    response: { type: String, trim: true },
    respondedAt: { type: Date },
    resolvedAt: { type: Date },

    // AI + automated SMS (Comms) audit trail
    automatedSmsAt: { type: Date },
    automatedSmsBody: { type: String, trim: true },
    automatedSmsError: { type: String, trim: true },
    automatedSmsSkipped: {
      type: String,
      enum: ['disabled', 'no_phone', 'invalid_phone', 'no_groq', 'complaint_policy'],
    },
  },
  { timestamps: true }
);

feedbackSchema.index({ message: 'text', name: 'text', email: 'text' });

module.exports = mongoose.model('Feedback', feedbackSchema);