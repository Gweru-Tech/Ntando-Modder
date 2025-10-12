const express = require('express');
const router = express.Router();
const Service = require('../models/Service');

// Fallback data when database is not available
const fallbackServices = [
    {
        _id: '1',
        name: 'Premium Modded Apps',
        category: 'modded-apps',
        price: '$15',
        duration: '1 month',
        description: 'Get access to premium modded applications',
        features: ['Ad-free experience', 'Premium features unlocked', 'Regular updates'],
        active: true,
        createdAt: new Date()
    },
    {
        _id: '2',
        name: 'Custom Website Creation',
        category: 'website-creation',
        price: '$99',
        duration: '1-2 weeks',
        description: 'Professional website development services',
        features: ['Responsive design', 'SEO optimized', 'Admin panel'],
        active: true,
        createdAt: new Date()
    },
    {
        _id: '3',
        name: 'WhatsApp Bot Development',
        category: 'whatsapp-bots',
        price: '$49',
        duration: '3-5 days',
        description: 'Custom WhatsApp bot for your business',
        features: ['Auto-reply', 'Custom commands', 'Easy setup'],
        active: true,
        createdAt: new Date()
    }
];

router.get('/', async (req, res) => {
    try {
        let services;
        
        if (global.useInMemoryData) {
            // Use fallback data if database is not available
            services = fallbackServices;
        } else {
            // Try to get services from database
            services = await Service.find({ active: true }).sort({ createdAt: -1 });
        }
        
        res.render('index', { 
            title: 'Ntando Modder Pro - Your Ultimate Tech Solution',
            services: services
        });
    } catch (error) {
        console.error('Error loading homepage:', error);
        // Fallback to in-memory data on error
        res.render('index', { 
            title: 'Ntando Modder Pro - Your Ultimate Tech Solution',
            services: fallbackServices
        });
    }
});

module.exports = router;
