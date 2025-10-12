const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const adminRoutes = require('./routes/admin');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(cors());

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'ntando-modder-pro-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ntando-modder-pro';
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

// Routes
app.use('/admin', adminRoutes);
app.use('/api', apiRoutes);

// Main route
app.get('/', async (req, res) => {
  try {
    const Service = require('./models/Service');
    const services = await Service.find({ active: true });
    
    // Default settings
    const settings = {
      logoUrl: '/images/logo.png',
      backgroundMusic: '',
      siteName: 'Ntando Modder Pro',
      description: 'Your ultimate destination for modded apps, technology solutions, and premium services'
    };

    res.render('index', { services, settings });
  } catch (error) {
    console.error('Error loading homepage:', error);
    res.render('index', { services: [], settings: {} });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// 404 handler
app.use((req, res) => {
  res.status(404).send('Page not found');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
