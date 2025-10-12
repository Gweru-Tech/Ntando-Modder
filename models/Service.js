const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['modded-apps', 'website-creation', 'premium-apps', 'whatsapp-bots', 'modifications', 'deployment'],
    required: true
  },
  features: [{
    type: String
  }],
  duration: {
    type: String,
    default: '1 month'
  },
  active: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Service', serviceSchema);
