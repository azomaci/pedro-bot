const fs = require('fs');
const path = require('path');

class UserDatabase {
  constructor() {
    this.dbPath = path.join(__dirname, 'users.json');
    this.users = {};
    this.init();
  }

  init() {
    if (fs.existsSync(this.dbPath)) {
      try {
        const data = fs.readFileSync(this.dbPath, 'utf8');
        this.users = JSON.parse(data);
      } catch (err) {
        this.users = {};
      }
    }
  }

  save() {
    fs.writeFileSync(this.dbPath, JSON.stringify(this.users, null, 2));
  }

  getUser(userId) {
    return this.users[userId] || null;
  }

  createUser(userId, username) {
    this.users[userId] = {
      user_id: userId,
      username: username,
      coins: 0,
      total_clicks: 0,
      energy: 1000,
      max_energy: 1000,
      energy_per_click: 1,
      coins_per_click: 1,
      last_energy_update: Date.now(),
      created_at: Date.now()
    };
    this.save();
    return this.users[userId];
  }

  updateCoins(userId, coinsToAdd, energyUsed) {
    const user = this.getUser(userId);
    if (!user) return false;

    user.coins += coinsToAdd;
    user.total_clicks += 1;
    user.energy = Math.max(0, user.energy - energyUsed);
    
    this.save();
    return true;
  }

  restoreEnergy(userId) {
    const user = this.getUser(userId);
    if (!user) return false;

    const now = Date.now();
    const timePassed = now - user.last_energy_update;
    const energyToRestore = Math.floor(timePassed / 1000);
    user.energy = Math.min(user.max_energy, user.energy + energyToRestore);
    user.last_energy_update = now;
    
    this.save();
    return user.energy;
  }

  getTopUsers(limit = 10) {
    return Object.values(this.users)
      .sort((a, b) => b.coins - a.coins)
      .slice(0, limit)
      .map(u => ({
        user_id: u.user_id,
        username: u.username,
        coins: u.coins,
        total_clicks: u.total_clicks
      }));
  }

  upgradeCoinsPerClick(userId) {
    const user = this.getUser(userId);
    if (!user) return false;

    const upgradeCost = user.coins_per_click * 100;
    if (user.coins < upgradeCost) return false;

    user.coins_per_click += 1;
    user.coins -= upgradeCost;
    
    this.save();
    return true;
  }

  upgradeMaxEnergy(userId) {
    const user = this.getUser(userId);
    if (!user) return false;

    const upgradeCost = Math.floor(user.max_energy / 10);
    if (user.coins < upgradeCost) return false;

    user.max_energy += 100;
    user.coins -= upgradeCost;
    
    this.save();
    return true;
  }
}

module.exports = UserDatabase;
