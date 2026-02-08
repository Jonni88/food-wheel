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
    console.log('Initializing app...');
    
    loadConfig();
    console.log('Config loaded:', CONFIG);
    
    loadUserData();
    console.log('User data loaded:', userData);
    
    // В тестовом режиме даём бесплатные прокрутки
    if (CONFIG.TEST_MODE) {
        console.log('Test mode enabled');
        userData.spins = CONFIG.FREE_SPINS;
        saveUserData();
        setupTestModeUI();
    }
    
    console.log('Rendering wheel...');
    renderWheel();
    
    console.log('Rendering prizes list...');
    renderPrizesList();
    
    console.log('Updating UI...');
    updateUI();
    
    console.log('Updating history...');
    updateHistory();
    
    // Set Telegram theme colors
    if (tg.setHeaderColor) {
        tg.setHeaderColor('#1a1a2e');
    }
    if (tg.setBackgroundColor) {
        tg.setBackgroundColor('#1a1a2e');
    }
    
    console.log('Initialization complete!');
}

// Setup Test Mode UI
function setupTestModeUI() {
    // Показываем бейдж тестового режима
    const testBadge = document.getElementById('testBadge');
    if (testBadge) testBadge.style.display = 'block';
    
    // Показываем информацию о бесплатных прокрутках
    const testInfo = document.getElementById('testInfo');
    if (testInfo) testInfo.style.display = 'flex';
    
    // Скрываем баланс
    const balanceCard = document.getElementById('balanceCard');
    if (balanceCard) balanceCard.style.display = 'none';
    
    // Обновляем инструкцию
    const howToGet = document.getElementById('howToGet');
    if (howToGet) {
        howToGet.innerHTML = `
            <h3>📍 Как получить приз?</h3>
            <ol>
                <li>Крутите барабан бесплатно!</li>
                <li>Если стрелка попадает на приз — вы выиграли!</li>
                <li>Получите сообщение с кодом выигрыша</li>
                <li>Покажите код в нашем заведении</li>
                <li>Получите ваш приз! 🎉</li>
            </ol>
        `;
    }
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

// Render wheel using SVG for proper sectors
function renderWheel() {
    const wheel = document.getElementById('wheel');
    if (!wheel) {
        console.error('Wheel element not found!');
        return;
    }
    
    wheel.innerHTML = '';
    
    const sectors = CONFIG.SECTORS;
    const anglePerSector = 360 / sectors.length;
    const radius = 160; // Half of 320px
    const center = 160;
    
    // Create SVG element
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('viewBox', '0 0 320 320');
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    
    sectors.forEach((sector, index) => {
        const startAngle = index * anglePerSector;
        const endAngle = (index + 1) * anglePerSector;
        
        // Calculate path coordinates
        const startRad = (startAngle - 90) * Math.PI / 180;
        const endRad = (endAngle - 90) * Math.PI / 180;
        
        const x1 = center + radius * Math.cos(startRad);
        const y1 = center + radius * Math.sin(startRad);
        const x2 = center + radius * Math.cos(endRad);
        const y2 = center + radius * Math.sin(endRad);
        
        // Create sector path
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const d = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`;
        path.setAttribute('d', d);
        path.setAttribute('fill', sector.color);
        path.setAttribute('stroke', '#1a1a2e');
        path.setAttribute('stroke-width', '3');
        svg.appendChild(path);
        
        // Calculate text position (middle of sector)
        const midAngle = (startAngle + endAngle) / 2 - 90;
        const midRad = midAngle * Math.PI / 180;
        const textRadius = radius * 0.65;
        const textX = center + textRadius * Math.cos(midRad);
        const textY = center + textRadius * Math.sin(midRad);
        
        // Create text group
        const textGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        textGroup.setAttribute('transform', `rotate(${midAngle + 90}, ${textX}, ${textY})`);
        
        // Icon
        const iconText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        iconText.setAttribute('x', textX);
        iconText.setAttribute('y', textY - 5);
        iconText.setAttribute('text-anchor', 'middle');
        iconText.setAttribute('font-size', '24');
        iconText.textContent = sector.icon;
        textGroup.appendChild(iconText);
        
        // Label
        const labelText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        labelText.setAttribute('x', textX);
        labelText.setAttribute('y', textY + 15);
        labelText.setAttribute('text-anchor', 'middle');
        labelText.setAttribute('font-size', '10');
        labelText.setAttribute('fill', 'white');
        labelText.setAttribute('font-weight', 'bold');
        labelText.textContent = sector.name;
        textGroup.appendChild(labelText);
        
        svg.appendChild(textGroup);
    });
    
    wheel.appendChild(svg);
    
    console.log('Wheel rendered with', sectors.length, 'sectors');
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
    console.log('Spin button clicked!');
    
    if (gameState.isSpinning) {
        console.log('Already spinning, returning');
        return;
    }
    
    // В тестовом режиме просто проверяем есть ли прокрутки
    if (CONFIG.TEST_MODE) {
        if (userData.spins <= 0) {
            userData.spins = CONFIG.FREE_SPINS; // Перезаряжаем бесплатные прокрутки
        }
        userData.spins--;
    } else {
        // Режим оплаты
        if (userData.spins <= 0 && userData.balance < CONFIG.SPIN_PRICE) {
            showModal('addBalanceModal');
            return;
        }
        
        if (userData.spins > 0) {
            userData.spins--;
        } else {
            userData.balance -= CONFIG.SPIN_PRICE;
        }
    }
    
    saveUserData();
    updateUI();
    
    gameState.isSpinning = true;
    const wheel = document.getElementById('wheel');
    const spinBtn = document.getElementById('spinBtn');
    
    if (!wheel) {
        console.error('Wheel element not found!');
        gameState.isSpinning = false;
        return;
    }
    
    console.log('Starting spin animation');
    
    wheel.classList.add('spinning');
    spinBtn.disabled = true;
    
    // Random sector
    const winningIndex = Math.floor(Math.random() * CONFIG.SECTORS.length);
    const sector = CONFIG.SECTORS[winningIndex];
    
    console.log('Winning sector:', sector);
    
    // Calculate rotation
    const anglePerSector = 360 / CONFIG.SECTORS.length;
    const targetAngle = 360 - (winningIndex * anglePerSector) - (anglePerSector / 2);
    const spins = 5 + Math.floor(Math.random() * 3); // 5-7 spins
    const totalRotation = (gameState.currentRotation || 0) + (spins * 360) + targetAngle - ((gameState.currentRotation || 0) % 360);
    
    gameState.currentRotation = totalRotation;
    
    console.log('Rotating to:', totalRotation);
    
    // Apply rotation
    wheel.style.transform = `rotate(${totalRotation}deg)`;
    
    // Haptic feedback
    if (tg.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('heavy');
    }
    
    // Result after animation
    setTimeout(() => {
        console.log('Spin completed');
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
    const balanceEl = document.getElementById('userBalance');
    const spinsEl = document.getElementById('spinsCount');
    const spinBtn = document.getElementById('spinBtn');
    
    if (CONFIG.TEST_MODE) {
        // В тестовом режиме показываем ∞ и убираем цену
        if (balanceEl) balanceEl.textContent = '∞';
        if (spinsEl) spinsEl.textContent = '∞';
        if (spinBtn) {
            spinBtn.innerHTML = `
                <span class="spin-text">КРУТИТЬ</span>
                <span class="spin-price">БЕСПЛАТНО</span>
            `;
        }
    } else {
        if (balanceEl) balanceEl.textContent = userData.balance + ' ₽';
        if (spinsEl) spinsEl.textContent = userData.spins;
        if (spinBtn) {
            spinBtn.innerHTML = `
                <span class="spin-text">КРУТИТЬ</span>
                <span class="spin-price">100 ₽</span>
            `;
        }
    }
}

// Add balance - now uses payment system
function addBalance(amount, spins) {
    paymentSystem.showPaymentOptions(amount, spins);
}

// Old function kept for compatibility
function addBalanceOld(amount, spins) {
    // Demo mode - just add balance
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
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded');
    
    try {
        init();
        
        // Добавляем обработчик клика на кнопку напрямую
        const spinBtn = document.getElementById('spinBtn');
        if (spinBtn) {
            console.log('Spin button found, adding click listener');
            spinBtn.addEventListener('click', function(e) {
                console.log('Spin button clicked via addEventListener');
                e.preventDefault();
                spinWheel();
            });
        } else {
            console.error('Spin button not found!');
        }
    } catch (error) {
        console.error('Error during initialization:', error);
    }
});

// Close modals on outside click
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal && !modal.classList.contains('win-modal')) {
            modal.classList.remove('active');
        }
    });
});
