// Telegram WebApp initialization
const tg = window.Telegram.WebApp;
tg.expand();
tg.enableClosingConfirmation();

// Game state
let gameState = {
    userId: null,
    balance: 0,
    energy: 1000,
    maxEnergy: 1000,
    energyPerClick: 1,
    coinsPerClick: 1,
    totalClicks: 0,
    lastEnergyUpdate: Date.now()
};

// API base URL
const API_URL = window.location.origin;

// DOM elements
const balanceEl = document.getElementById('balance');
const energyEl = document.getElementById('energy');
const maxEnergyEl = document.getElementById('maxEnergy');
const coinsPerClickEl = document.getElementById('coinsPerClick');
const totalClicksEl = document.getElementById('totalClicks');
const clickZone = document.getElementById('clickZone');
const clickCounter = document.getElementById('clickCounter');
const floatingCoins = document.getElementById('floatingCoins');
const navBtns = document.querySelectorAll('.nav-btn');
const upgradesPage = document.getElementById('upgradesPage');
const leaderboardPage = document.getElementById('leaderboardPage');
const mainArea = document.querySelector('.main-area');
const statsArea = document.querySelector('.stats');

// Initialize
async function init() {
    // Get user from Telegram
    const user = tg.initDataUnsafe.user;
    if (user) {
        gameState.userId = user.id;
        await loadGameState();
    } else {
        // For testing without Telegram
        gameState.userId = 'test_user';
        updateUI();
    }
    
    setupEventListeners();
    startEnergyRestore();
}

// Load game state from server
async function loadGameState() {
    try {
        const response = await fetch(`${API_URL}/api/user/${gameState.userId}`);
        if (response.ok) {
            const data = await response.json();
            gameState = { ...gameState, ...data };
            updateUI();
        }
    } catch (error) {
        console.error('Error loading game state:', error);
    }
}

// Save game state to server
async function saveGameState() {
    try {
        await fetch(`${API_URL}/api/user/${gameState.userId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(gameState)
        });
    } catch (error) {
        console.error('Error saving game state:', error);
    }
}

// Update UI
function updateUI() {
    balanceEl.textContent = formatNumber(gameState.balance);
    energyEl.textContent = gameState.energy;
    maxEnergyEl.textContent = gameState.maxEnergy;
    coinsPerClickEl.textContent = `${gameState.coinsPerClick} 🪙`;
    totalClicksEl.textContent = formatNumber(gameState.totalClicks);
    
    // Update upgrade costs
    document.getElementById('incomeCost').textContent = gameState.coinsPerClick * 100;
    document.getElementById('energyCost').textContent = Math.floor(gameState.maxEnergy / 10);
}

// Format large numbers
function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

// Handle click
function handleClick(event) {
    if (gameState.energy < gameState.energyPerClick) {
        tg.HapticFeedback.notificationOccurred('error');
        showMessage('Недостаточно энергии! ⚡');
        return;
    }
    
    // Update game state
    gameState.energy -= gameState.energyPerClick;
    gameState.balance += gameState.coinsPerClick;
    gameState.totalClicks += 1;
    
    // Haptic feedback
    tg.HapticFeedback.impactOccurred('medium');
    
    // Visual feedback
    showClickAnimation(event);
    createFloatingCoin(event);
    
    // Update UI
    updateUI();
    
    // Save to server (debounced)
    debouncedSave();
}

// Show click animation
function showClickAnimation(event) {
    const counter = clickCounter.cloneNode(true);
    counter.textContent = `+${gameState.coinsPerClick}`;
    counter.style.left = event.touches ? event.touches[0].clientX + 'px' : event.clientX + 'px';
    counter.style.opacity = '1';
    
    clickZone.appendChild(counter);
    setTimeout(() => counter.remove(), 600);
}

// Create floating coin
function createFloatingCoin(event) {
    const coin = document.createElement('div');
    coin.className = 'floating-coin';
    coin.textContent = '🪙';
    
    const x = event.touches ? event.touches[0].clientX : event.clientX;
    const y = event.touches ? event.touches[0].clientY : event.clientY;
    
    coin.style.left = x + 'px';
    coin.style.top = y + 'px';
    
    floatingCoins.appendChild(coin);
    setTimeout(() => coin.remove(), 1000);
}

// Show message
function showMessage(text) {
    tg.showPopup({ message: text });
}

// Energy restore
function startEnergyRestore() {
    setInterval(() => {
        if (gameState.energy < gameState.maxEnergy) {
            const now = Date.now();
            const timePassed = now - gameState.lastEnergyUpdate;
            const energyToRestore = Math.floor(timePassed / 1000); // 1 per second
            
            if (energyToRestore > 0) {
                gameState.energy = Math.min(gameState.maxEnergy, gameState.energy + energyToRestore);
                gameState.lastEnergyUpdate = now;
                updateUI();
            }
        }
    }, 1000);
}

// Debounced save
let saveTimeout;
function debouncedSave() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        saveGameState();
    }, 2000);
}

// Navigation
function setupNavigation() {
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const page = btn.dataset.page;
            
            // Update active button
            navBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Show/hide pages
            if (page === 'game') {
                mainArea.style.display = 'flex';
                statsArea.style.display = 'flex';
                upgradesPage.classList.remove('active');
                leaderboardPage.classList.remove('active');
            } else if (page === 'upgrades') {
                mainArea.style.display = 'none';
                statsArea.style.display = 'none';
                upgradesPage.classList.add('active');
                leaderboardPage.classList.remove('active');
            } else if (page === 'leaderboard') {
                mainArea.style.display = 'none';
                statsArea.style.display = 'none';
                upgradesPage.classList.remove('active');
                leaderboardPage.classList.add('active');
                loadLeaderboard();
            }
        });
    });
}

// Upgrades
function setupUpgrades() {
    document.getElementById('upgradeIncome').addEventListener('click', async () => {
        const cost = gameState.coinsPerClick * 100;
        if (gameState.balance >= cost) {
            gameState.balance -= cost;
            gameState.coinsPerClick += 1;
            
            tg.HapticFeedback.notificationOccurred('success');
            updateUI();
            await saveGameState();
            showMessage('Улучшение куплено! 🎉');
        } else {
            tg.HapticFeedback.notificationOccurred('error');
            showMessage(`Недостаточно монет! Нужно: ${cost} 🪙`);
        }
    });
    
    document.getElementById('upgradeEnergy').addEventListener('click', async () => {
        const cost = Math.floor(gameState.maxEnergy / 10);
        if (gameState.balance >= cost) {
            gameState.balance -= cost;
            gameState.maxEnergy += 100;
            
            tg.HapticFeedback.notificationOccurred('success');
            updateUI();
            await saveGameState();
            showMessage('Улучшение куплено! 🎉');
        } else {
            tg.HapticFeedback.notificationOccurred('error');
            showMessage(`Недостаточно монет! Нужно: ${cost} 🪙`);
        }
    });
}

// Leaderboard
async function loadLeaderboard() {
    const listEl = document.getElementById('leaderboardList');
    listEl.innerHTML = '<div class="loading">Загрузка...</div>';
    
    try {
        const response = await fetch(`${API_URL}/api/leaderboard`);
        const data = await response.json();
        
        if (data.length === 0) {
            listEl.innerHTML = '<div class="loading">Пока нет игроков</div>';
            return;
        }
        
        listEl.innerHTML = data.map((user, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
            return `
                <div class="leaderboard-item">
                    <div class="leader-rank">${medal}</div>
                    <div class="leader-info">
                        <div class="leader-name">${user.username || 'Игрок'}</div>
                        <div class="leader-stats">
                            💰 ${formatNumber(user.balance)} | 👆 ${formatNumber(user.totalClicks)} кликов
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        listEl.innerHTML = '<div class="loading">Ошибка загрузки</div>';
    }
}

// Setup event listeners
function setupEventListeners() {
    clickZone.addEventListener('click', handleClick);
    clickZone.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handleClick(e);
    });
    
    setupNavigation();
    setupUpgrades();
}

// Start the app
init();
