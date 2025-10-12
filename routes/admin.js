const express = require('express');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const User = require('../models/User');
const Service = require('../models/Service');
const { isAuthenticated } = require('../middleware/auth');

const router = express.Router();

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Admin login page
router.get('/login', (req, res) => {
  res.render('admin-login');
});

// Admin login POST
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    let user = await User.findOne({ username });
    
    // Create default admin if doesn't exist
    if (!user) {
      user = new User({
        username: 'Ntando',
        password: 'Ntando'
      });
      await user.save();
    }

    const isMatch = await user.comparePassword(password);
    
    if (isMatch) {
      req.session.isAdmin = true;
      req.session.userId = user._id;
      res.redirect('/admin/dashboard');
    } else {
      res.render('admin-login', { error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.render('admin-login', { error: 'Login failed' });
  }
});

// Admin dashboard
router.get('/dashboard', isAuthenticated, async (req, res) => {
  try {
    const services = await Service.find();
    const user = await User.findById(req.session.userId);
    res.render('admin', { services, user });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.render('admin', { services: [], user: null });
  }
});

// Update admin credentials
router.post('/update-credentials', isAuthenticated, async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findById(req.session.userId);
    
    user.username = username;
    if (password) {
      user.password = password;
    }
    
    await user.save();
    res.json({ success: true, message: 'Credentials updated successfully' });
  } catch (error) {
    console.error('Update credentials error:', error);
    res.json({ success: false, message: 'Failed to update credentials' });
  }
});

// Add service
router.post('/add-service', isAuthenticated, async (req, res) => {
  try {
    const { name, description, price, category, features, duration } = req.body;
    
    const service = new Service({
      name,
      description,
      price,
      category,
      features: features.split(',').map(f => f.trim()),
      duration: duration || '1 month'
    });
    
    await service.save();
    res.json({ success: true, message: 'Service added successfully' });
  } catch (error) {
    console.error('Add service error:', error);
    res.json({ success: false, message: 'Failed to add service' });
  }
});

// Update service
router.post('/update-service/:id', isAuthenticated, async (req, res) => {
  try {
    const { name, description, price, category, features, duration, active } = req.body;
    
    await Service.findByIdAndUpdate(req.params.id, {
      name,
      description,
      price,
      category,
      features: features.split(',').map(f => f.trim()),
      duration: duration || '1 month',
      active: active === 'true'
    });
    
    res.json({ success: true, message: 'Service updated successfully' });
  } catch (error) {
    console.error('Update service error:', error);
    res.json({ success: false, message: 'Failed to update service' });
  }
});

// Delete service
router.delete('/delete-service/:id', isAuthenticated, async (req, res) => {
  try {
    await Service.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Delete service error:', error);
    res.json({ success: false, message: 'Failed to delete service' });
  }
});

// Upload logo
router.post('/upload-logo', isAuthenticated, upload.single('logo'), (req, res) => {
  try {
    if (req.file) {
      res.json({ success: true, logoUrl: `/uploads/${req.file.filename}` });
    } else {
      res.json({ success: false, message: 'No file uploaded' });
    }
  } catch (error) {
    console.error('Upload logo error:', error);
    res.json({ success: false, message: 'Failed to upload logo' });
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
});

module.exports = router;
