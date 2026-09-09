require('dotenv').config();
const express = require('express');
const path = require('path');
const UserDatabase = require('./database');

const app = express();
const db = new UserDatabase();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// API Routes

// Get user data
app.get('/api/user/:userId', (req, res) => {
    const userId = req.params.userId;
    let user = db.getUser(userId);
    
    if (!user) {
        user = db.createUser(userId, 'Player');
    }
    
    // Restore energy before sending
    db.restoreEnergy(userId);
    user = db.getUser(userId);
    
    res.json({
        userId: user.user_id,
        username: user.username,
        balance: user.coins,
        energy: user.energy,
        maxEnergy: user.max_energy,
        energyPerClick: user.energy_per_click,
        coinsPerClick: user.coins_per_click,
        totalClicks: user.total_clicks,
        lastEnergyUpdate: user.last_energy_update
    });
});

// Save user data
app.post('/api/user/:userId', (req, res) => {
    const userId = req.params.userId;
    const data = req.body;
    
    let user = db.getUser(userId);
    if (!user) {
        user = db.createUser(userId, data.username || 'Player');
    }
    
    // Update user data
    user.coins = data.balance || user.coins;
    user.energy = data.energy || user.energy;
    user.max_energy = data.maxEnergy || user.max_energy;
    user.coins_per_click = data.coinsPerClick || user.coins_per_click;
    user.total_clicks = data.totalClicks || user.total_clicks;
    user.last_energy_update = data.lastEnergyUpdate || user.last_energy_update;
    
    db.save();
    
    res.json({ success: true });
});

// Get leaderboard
app.get('/api/leaderboard', (req, res) => {
    const top = db.getTopUsers(10);
    res.json(top.map(u => ({
        username: u.username,
        balance: u.coins,
        totalClicks: u.total_clicks
    })));
});

// Upgrade income
app.post('/api/upgrade/income/:userId', (req, res) => {
    const userId = req.params.userId;
    const success = db.upgradeCoinsPerClick(userId);
    
    if (success) {
        const user = db.getUser(userId);
        res.json({ 
            success: true,
            balance: user.coins,
            coinsPerClick: user.coins_per_click
        });
    } else {
        res.json({ success: false, message: 'Недостаточно монет' });
    }
});

// Upgrade energy
app.post('/api/upgrade/energy/:userId', (req, res) => {
    const userId = req.params.userId;
    const success = db.upgradeMaxEnergy(userId);
    
    if (success) {
        const user = db.getUser(userId);
        res.json({ 
            success: true,
            balance: user.coins,
            maxEnergy: user.max_energy
        });
    } else {
        res.json({ success: false, message: 'Недостаточно монет' });
    }
});

// Serve the web app
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 Mini App URL: http://localhost:${PORT}`);
    console.log(`🌐 Public URL: ${process.env.MINI_APP_URL || 'Not set'}`);
});

module.exports = app;
