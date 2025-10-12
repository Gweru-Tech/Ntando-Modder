const express = require('express');
const Service = require('../models/Service');

const router = express.Router();

// Get all services
router.get('/services', async (req, res) => {
  try {
    const services = await Service.find({ active: true });
    res.json(services);
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// Get services by category
router.get('/services/:category', async (req, res) => {
  try {
    const services = await Service.find({ 
      category: req.params.category, 
      active: true 
    });
    res.json(services);
  } catch (error) {
    console.error('Get services by category error:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// Contact form (you can extend this)
router.post('/contact', async (req, res) => {
  try {
    const { name, email, message, service } = req.body;
    // Here you can add email functionality or save to database
    console.log('Contact form submission:', { name, email, message, service });
    res.json({ success: true, message: 'Message sent successfully' });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

module.exports = router;
