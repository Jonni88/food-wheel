// Конфигурация приложения
const CONFIG = {
    // Цена одной прокрутки
    SPIN_PRICE: 100,
    
    // Адрес заведения (показывается при выигрыше)
    VENUE_ADDRESS: 'г. Москва, ул. Примерная, 1\nЕжедневно 10:00-22:00',
    
    // Контакт для связи
    CONTACT_PHONE: '+7 (999) 123-45-67',
    
    // Пароль для админ-панели (в продакшене использовать хеш!)
    ADMIN_PASSWORD: 'admin123',
    
    // Секторы барабана (8 секторов)
    // winner: true - выигрышный сектор
    SECTORS: [
        { id: 1, name: 'Бургер Классический', icon: '🍔', winner: true, color: '#00c853' },
        { id: 2, name: 'Пицца Маргарита', icon: '🍕', winner: true, color: '#00c853' },
        { id: 3, name: 'Картошка Фри', icon: '🍟', winner: true, color: '#00c853' },
        { id: 4, name: 'Кола', icon: '🥤', winner: true, color: '#00c853' },
        { id: 5, name: 'Не повезло', icon: '❌', winner: false, color: '#424242' },
        { id: 6, name: 'Не повезло', icon: '❌', winner: false, color: '#424242' },
        { id: 7, name: 'Не повезло', icon: '❌', winner: false, color: '#424242' },
        { id: 8, name: 'Не повезло', icon: '❌', winner: false, color: '#424242' }
    ]
};

// Сохранение конфигурации в localStorage
function saveConfig() {
    localStorage.setItem('foodWheelConfig', JSON.stringify(CONFIG));
}

// Загрузка конфигурации
function loadConfig() {
    const saved = localStorage.getItem('foodWheelConfig');
    if (saved) {
        const parsed = JSON.parse(saved);
        Object.assign(CONFIG, parsed);
    }
}

// Генерация кода выигрыша
function generateWinCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// Экспорт для использования в app.js
window.CONFIG = CONFIG;
window.saveConfig = saveConfig;
window.loadConfig = loadConfig;
window.generateWinCode = generateWinCode;
