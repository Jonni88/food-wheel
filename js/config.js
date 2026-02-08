// Конфигурация приложения
const CONFIG = {
    // РЕЖИМ ТЕСТИРОВАНИЯ: бесплатные прокрутки
    TEST_MODE: true,
    FREE_SPINS: 999, // Количество бесплатных прокруток
    
    // Цена одной прокрутки (не используется в тестовом режиме)
    SPIN_PRICE: 100,
    
    // Адрес заведения (показывается при выигрыше)
    VENUE_ADDRESS: 'г. Москва, ул. Примерная, 1\nЕжедневно 10:00-22:00',
    
    // Контакт для связи
    CONTACT_PHONE: '+7 (999) 123-45-67',
    
    // Пароль для админ-панели (в продакшене использовать хеш!)
    ADMIN_PASSWORD: 'admin123',
    
    // Настройки платежей (отключены в тестовом режиме)
    PAYMENT: {
        CLOUDPAYMENTS_PUBLIC_ID: 'pk_ваш_public_id',
        SBP_PHONE: '+7 (999) 123-45-67',
        SBP_RECIPIENT: 'Иван И.',
        SBP_BANK: 'Тинькофф',
        CARD_NUMBER: '4276 5500 1234 5678',
        CARD_RECIPIENT: 'Иван Иванов',
        TRANSFER_PHONE: '+7 (999) 123-45-67',
        ADMIN_USERNAME: 'admin_username'
    },
    
    // Секторы барабана (9 секторов)
    // 3 выигрышных: бургер, пицца, фри (разделены через 2 пустых)
    // 6 пустых
    // Процент выигрыша: 3/9 = 33.3%
    SECTORS: [
        { id: 1, name: 'Бургер Классический', icon: '🍔', winner: true, color: '#ff6b35' },
        { id: 2, name: 'Пусто', icon: '❌', winner: false, color: '#2d3436' },
        { id: 3, name: 'Пусто', icon: '❌', winner: false, color: '#2d3436' },
        { id: 4, name: 'Пицца Маргарита', icon: '🍕', winner: true, color: '#ff6b35' },
        { id: 5, name: 'Пусто', icon: '❌', winner: false, color: '#2d3436' },
        { id: 6, name: 'Пусто', icon: '❌', winner: false, color: '#2d3436' },
        { id: 7, name: 'Картошка Фри', icon: '🍟', winner: true, color: '#ff6b35' },
        { id: 8, name: 'Пусто', icon: '❌', winner: false, color: '#2d3436' },
        { id: 9, name: 'Пусто', icon: '❌', winner: false, color: '#2d3436' }
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
