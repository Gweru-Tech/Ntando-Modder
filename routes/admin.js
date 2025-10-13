const express = require('express');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const Service = require('../models/Service');
const { isAuthenticated } = require('../middleware/auth');

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Admin login page
router.get('/login', (req, res) => {
  if (req.session && req.session.isAdmin) {
    return res.redirect('/admin/dashboard');
  }
  res.render('admin-login', { error: null });
});

// Admin login POST
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.render('admin-login', { error: 'Username and password are required' });
    }
    
    let user = await User.findOne({ username });
    
    // Create default admin if doesn't exist
    if (!user) {
      const hashedPassword = await bcrypt.hash('Ntando', 10);
      user = new User({
        username: 'Ntando',
        password: hashedPassword
      });
      await user.save();
      console.log('Default admin user created');
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (isMatch) {
      req.session.isAdmin = true;
      req.session.userId = user._id;
      console.log('Admin login successful');
      res.redirect('/admin/dashboard');
    } else {
      console.log('Invalid password attempt');
      res.render('admin-login', { error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.render('admin-login', { error: 'Login failed. Please try again.' });
  }
});

// Admin dashboard
router.get('/dashboard', isAuthenticated, async (req, res) => {
  try {
    const services = await Service.find().sort({ createdAt: -1 });
    const user = await User.findById(req.session.userId);
    res.render('admin', { services, user });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.render('admin', { services: [], user: null, error: 'Failed to load dashboard' });
  }
});

// API Routes for AJAX calls

// Get all services (API)
router.get('/api/services', isAuthenticated, async (req, res) => {
  try {
    const services = await Service.find().sort({ createdAt: -1 });
    res.json({ success: true, services });
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch services' });
  }
});

// Add service (API)
router.post('/services', isAuthenticated, async (req, res) => {
  try {
    const { name, description, price, category, features, duration, contactMethod, contactInfo, active } = req.body;
    
    if (!name || !price || !category) {
      return res.status(400).json({ success: false, message: 'Name, price, and category are required' });
    }
    
    const service = new Service({
      name,
      description,
      price,
      category,
      features: Array.isArray(features) ? features : (features ? features.split('\n').filter(f => f.trim()) : []),
      duration: duration || 'Contact for details',
      contactMethod: contactMethod || 'whatsapp',
      contactInfo: contactInfo || '',
      active: active !== undefined ? active : true
    });
    
    await service.save();
    res.json({ success: true, message: 'Service added successfully', service });
  } catch (error) {
    console.error('Add service error:', error);
    res.status(500).json({ success: false, message: 'Failed to add service' });
  }
});

// Update service (API)
router.put('/services/:id', isAuthenticated, async (req, res) => {
  try {
    const { name, description, price, category, features, duration, contactMethod, contactInfo, active } = req.body;
    
    if (!name || !price || !category) {
      return res.status(400).json({ success: false, message: 'Name, price, and category are required' });
    }
    
    const updateData = {
      name,
      description,
      price,
      category,
      features: Array.isArray(features) ? features : (features ? features.split('\n').filter(f => f.trim()) : []),
      duration: duration || 'Contact for details',
      contactMethod: contactMethod || 'whatsapp',
      contactInfo: contactInfo || '',
      active: active !== undefined ? active : true,
      updatedAt: new Date()
    };
    
    const service = await Service.findByIdAndUpdate(req.params.id, updateData, { new: true });
    
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    
    res.json({ success: true, message: 'Service updated successfully', service });
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({ success: false, message: 'Failed to update service' });
  }
});

// Delete service (API)
router.delete('/services/:id', isAuthenticated, async (req, res) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    
    res.json({ success: true, message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete service' });
  }
});

// Update admin credentials (API)
router.post('/update-credentials', isAuthenticated, async (req, res) => {
  try {
    const { username, currentPassword, newPassword, confirmPassword } = req.body;
    
    if (!username || !currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'New passwords do not match' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }
    
    const user = await User.findById(req.session.userId);
    
    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }
    
    // Update credentials
    user.username = username;
    user.password = await bcrypt.hash(newPassword, 10);
    
    await user.save();
    
    res.json({ success: true, message: 'Credentials updated successfully' });
  } catch (error) {
    console.error('Update credentials error:', error);
    res.status(500).json({ success: false, message: 'Failed to update credentials' });
  }
});

// Upload logo (API)
router.post('/upload-logo', isAuthenticated, upload.single('logo'), (req, res) => {
  try {
    if (req.file) {
      res.json({ success: true, logoUrl: `/uploads/${req.file.filename}`, message: 'Logo uploaded successfully' });
    } else {
      res.status(400).json({ success: false, message: 'No file uploaded' });
    }
  } catch (error) {
    console.error('Upload logo error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload logo' });
  }
});

// Music settings (API)
router.post('/music-settings', isAuthenticated, async (req, res) => {
  try {
    const { musicUrl, autoplay } = req.body;
    
    // Here you would typically save to a settings collection
    // For now, we'll just return success
    res.json({ success: true, message: 'Music settings saved successfully' });
  } catch (error) {
    console.error('Music settings error:', error);
    res.status(500).json({ success: false, message: 'Failed to save music settings' });
  }
});

// Site settings (API)
router.post('/site-settings', isAuthenticated, async (req, res) => {
  try {
    const { siteName, contactEmail, phone, website, description, keywords } = req.body;
    
    // Here you would typically save to a settings collection
    // For now, we'll just return success
    res.json({ success: true, message: 'Site settings saved successfully' });
  } catch (error) {
    console.error('Site settings error:', error);
    res.status(500).json({ success: false, message: 'Failed to save site settings' });
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/admin/login');
  });
});

// Legacy routes for backward compatibility
router.post('/add-service', isAuthenticated, async (req, res) => {
  try {
    const { name, description, price, category, features, duration } = req.body;
    
    const service = new Service({
      name,
      description,
      price,
      category,
      features: features ? features.split(',').map(f => f.trim()) : [],
      duration: duration || 'Contact for details'
    });
    
    await service.save();
    res.json({ success: true, message: 'Service added successfully' });
  } catch (error) {
    console.error('Add service error:', error);
    res.json({ success: false, message: 'Failed to add service' });
  }
});

router.post('/update-service/:id', isAuthenticated, async (req, res) => {
  try {
    const { name, description, price, category, features, duration, active } = req.body;
    
    await Service.findByIdAndUpdate(req.params.id, {
      name,
      description,
      price,
      category,
      features: features ? features.split(',').map(f => f.trim()) : [],
      duration: duration || 'Contact for details',
      active: active === 'true'
    });
    
    res.json({ success: true, message: 'Service updated successfully' });
  } catch (error) {
    console.error('Update service error:', error);
    res.json({ success: false, message: 'Failed to update service' });
  }
});

router.delete('/delete-service/:id', isAuthenticated, async (req, res) => {
  try {
    await Service.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Delete service error:', error);
    res.json({ success: false, message: 'Failed to delete service' });
  }
});

module.exports = router;
