// Telegram Web App init
const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

// User data
let userData = {
    balance: 0,
    spins: 0,
    userId: tg.initDataUnsafe?.user?.id || 'demo_' + Date.now(),
    username: tg.initDataUnsafe?.user?.username || 'Гость',
    firstName: tg.initDataUnsafe?.user?.first_name || 'Пользователь'
};

// Game state
let gameState = {
    isSpinning: false,
    currentRotation: 0,
    history: []
};

// Initialize
function init() {
    loadConfig();
    loadUserData();
    renderWheel();
    renderPrizesList();
    updateUI();
    
    // Set Telegram theme colors
    tg.setHeaderColor('#1a1a2e');
    tg.setBackgroundColor('#1a1a2e');
}

// Load user data from storage
function loadUserData() {
    const saved = localStorage.getItem('foodWheelUser_' + userData.userId);
    if (saved) {
        const parsed = JSON.parse(saved);
        userData.balance = parsed.balance || 0;
        userData.spins = parsed.spins || 0;
        gameState.history = parsed.history || [];
    }
}

// Save user data
function saveUserData() {
    localStorage.setItem('foodWheelUser_' + userData.userId, JSON.stringify({
        balance: userData.balance,
        spins: userData.spins,
        history: gameState.history
    }));
}

// Render wheel segments
function renderWheel() {
    const wheel = document.getElementById('wheel');
    wheel.innerHTML = '';
    
    const sectors = CONFIG.SECTORS;
    const anglePerSector = 360 / sectors.length;
    
    sectors.forEach((sector, index) => {
        const segment = document.createElement('div');
        segment.className = 'wheel-segment' + (sector.winner ? ' winner-segment' : ' loser-segment');
        segment.style.transform = `rotate(${index * anglePerSector}deg)`;
        segment.style.background = `linear-gradient(135deg, ${sector.color}, ${adjustColor(sector.color, -20)})`;
        
        segment.innerHTML = `
            <div class="segment-content">
                <span class="segment-icon">${sector.icon}</span>
                <span class="segment-text">${sector.name}</span>
            </div>
        `;
        
        wheel.appendChild(segment);
    });
}

// Helper to darken color
function adjustColor(color, amount) {
    const num = parseInt(color.replace('#', ''), 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + amount));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
    const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
    return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

// Render prizes list
function renderPrizesList() {
    const list = document.getElementById('prizesList');
    const winners = CONFIG.SECTORS.filter(s => s.winner);
    
    list.innerHTML = winners.map(sector => `
        <div class="prize-card">
            <div class="prize-icon">${sector.icon}</div>
            <div class="prize-name">${sector.name}</div>
        </div>
    `).join('') + `
        <div class="prize-card loser">
            <div class="prize-icon">❌</div>
            <div class="prize-name">Пустой сектор</div>
        </div>
    `;
}

// Spin the wheel
function spinWheel() {
    if (gameState.isSpinning) return;
    
    if (userData.spins <= 0 && userData.balance < CONFIG.SPIN_PRICE) {
        showModal('addBalanceModal');
        return;
    }
    
    // Deduct spin or money
    if (userData.spins > 0) {
        userData.spins--;
    } else {
        userData.balance -= CONFIG.SPIN_PRICE;
    }
    
    saveUserData();
    updateUI();
    
    gameState.isSpinning = true;
    const wheel = document.getElementById('wheel');
    const spinBtn = document.getElementById('spinBtn');
    
    wheel.classList.add('spinning');
    spinBtn.disabled = true;
    
    // Random sector
    const winningIndex = Math.floor(Math.random() * CONFIG.SECTORS.length);
    const sector = CONFIG.SECTORS[winningIndex];
    
    // Calculate rotation
    const anglePerSector = 360 / CONFIG.SECTORS.length;
    const targetAngle = 360 - (winningIndex * anglePerSector) - (anglePerSector / 2);
    const spins = 5 + Math.floor(Math.random() * 3); // 5-7 spins
    const totalRotation = gameState.currentRotation + (spins * 360) + targetAngle - (gameState.currentRotation % 360);
    
    gameState.currentRotation = totalRotation;
    wheel.style.transform = `rotate(${totalRotation}deg)`;
    
    // Haptic feedback
    if (tg.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('heavy');
    }
    
    // Result after animation
    setTimeout(() => {
        gameState.isSpinning = false;
        wheel.classList.remove('spinning');
        spinBtn.disabled = false;
        
        if (sector.winner) {
            handleWin(sector);
        } else {
            handleLose();
        }
    }, 4500);
}

// Handle win
function handleWin(sector) {
    const winCode = generateWinCode();
    
    // Add to history
    const winRecord = {
        type: 'win',
        prize: sector.name,
        icon: sector.icon,
        code: winCode,
        date: new Date().toISOString()
    };
    
    gameState.history.unshift(winRecord);
    saveUserData();
    updateHistory();
    
    // Show win modal
    document.getElementById('winIcon').textContent = sector.icon;
    document.getElementById('winPrizeName').textContent = sector.name;
    document.getElementById('winCode').textContent = winCode;
    document.getElementById('venueAddress').innerHTML = CONFIG.VENUE_ADDRESS.replace(/\n/g, '<br>');
    
    showModal('winModal');
    
    // Send notification to user
    if (tg.showPopup) {
        tg.showPopup({
            title: '🎉 Поздравляем!',
            message: `Вы выиграли: ${sector.name}\nКод: ${winCode}`,
            buttons: [{ id: 'ok', type: 'ok', text: 'Отлично!' }]
        });
    }
    
    // Haptic feedback
    if (tg.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('success');
    }
    
    // Send message to owner (in production, use bot API)
    notifyOwner(winRecord);
}

// Handle lose
function handleLose() {
    const loseRecord = {
        type: 'lose',
        date: new Date().toISOString()
    };
    
    gameState.history.unshift(loseRecord);
    saveUserData();
    updateHistory();
    
    showModal('loseModal');
    
    if (tg.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('error');
    }
}

// Notify owner about win (demo version)
function notifyOwner(winRecord) {
    // In production, this should send actual message to bot
    console.log('🎉 Новый выигрыш:', {
        user: userData.firstName,
        userId: userData.userId,
        prize: winRecord.prize,
        code: winRecord.code,
        time: new Date().toLocaleString('ru-RU')
    });
    
    // Show notification to user that admin notified
    showNotification('📨 Уведомление отправлено администратору');
}

// Update history display
function updateHistory() {
    const list = document.getElementById('historyList');
    
    if (gameState.history.length === 0) {
        list.innerHTML = '<p class="empty-history">Пока нет розыгрышей</p>';
        return;
    }
    
    list.innerHTML = gameState.history.slice(0, 10).map(record => {
        const date = new Date(record.date).toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        if (record.type === 'win') {
            return `
                <div class="history-item win">
                    <div class="history-info">
                        <div class="history-time">${date}</div>
                        <div class="history-result">${record.icon} ${record.prize}</div>
                    </div>
                    <div class="history-code">${record.code}</div>
                </div>
            `;
        } else {
            return `
                <div class="history-item lose">
                    <div class="history-info">
                        <div class="history-time">${date}</div>
                        <div class="history-result">❌ Не повезло</div>
                    </div>
                </div>
            `;
        }
    }).join('');
}

// Update UI
function updateUI() {
    document.getElementById('userBalance').textContent = userData.balance + ' ₽';
    document.getElementById('spinsCount').textContent = userData.spins;
}

// Add balance
function addBalance(amount, spins) {
    // In production, integrate with payment system
    // For demo, just add balance
    userData.balance += amount;
    userData.spins += spins;
    saveUserData();
    updateUI();
    closeModal('addBalanceModal');
    
    showNotification(`✅ Пополнено! +${spins} попыток`);
    
    if (tg.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('success');
    }
}

// Copy win code
function copyCode() {
    const code = document.getElementById('winCode').textContent;
    navigator.clipboard.writeText(code).then(() => {
        showNotification('📋 Код скопирован!');
    });
}

// Share app
function shareApp() {
    const text = '🍔🍕 Крути барабан и выигрывай бургеры и пиццу!';
    const url = 'https://t.me/YourBot';
    
    if (tg.openTelegramLink) {
        tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`);
    }
}

// Modal functions
function showModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Admin functions
function showAdminLogin() {
    showModal('adminLoginModal');
}

function checkAdminPassword() {
    const password = document.getElementById('adminPassword').value;
    
    if (password === CONFIG.ADMIN_PASSWORD) {
        closeModal('adminLoginModal');
        window.location.href = 'admin/';
    } else {
        showNotification('❌ Неверный пароль!');
        document.getElementById('adminPassword').value = '';
    }
}

// Notification helper
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--surface);
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        border: 1px solid rgba(255,255,255,0.1);
        z-index: 10000;
        animation: slideDown 0.3s ease;
        font-weight: 600;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideUp 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 2500);
}

// Add animations CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
        to { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
    @keyframes slideUp {
        from { opacity: 1; transform: translateX(-50%) translateY(0); }
        to { opacity: 0; transform: translateX(-50%) translateY(-20px); }
    }
`;
document.head.appendChild(style);

// Initialize on load
document.addEventListener('DOMContentLoaded', init);

// Close modals on outside click
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal && !modal.classList.contains('win-modal')) {
            modal.classList.remove('active');
        }
    });
});
