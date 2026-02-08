// Платёжная система для Food Wheel
// Поддержка: CloudPayments + СБП + Ручной перевод

const PAYMENT_CONFIG = {
    // CloudPayments (для карт)
    CLOUDPAYMENTS: {
        publicId: 'pk_ваш_public_id', // Замените на свой
        apiUrl: 'https://api.cloudpayments.ru'
    },
    
    // СБП (для переводов)
    SBP: {
        enabled: true,
        bankName: 'Тинькофф', // или Сбер, ВТБ и т.д.
        phoneNumber: '+79991234567', // Номер для СБП
        recipientName: 'Иван И.' // Имя получателя
    },
    
    // Ручной перевод (резервный вариант)
    MANUAL: {
        cardNumber: '4276 5500 1234 5678', // Номер карты
        phoneNumber: '+79991234567', // Телефон для перевода
        recipientName: 'Иван Иванов'
    }
};

// Инициализация платежной системы
class PaymentSystem {
    constructor() {
        this.currentMethod = null;
    }
    
    // Показать выбор способа оплаты
    showPaymentOptions(amount, spins) {
        const modal = document.createElement('div');
        modal.className = 'modal payment-modal active';
        modal.id = 'paymentOptionsModal';
        modal.innerHTML = `
            <div class="modal-content payment-content">
                <button class="modal-close" onclick="closePaymentModal()">×</button>
                
                <h2>💳 Выберите способ оплаты</h2>
                <p class="payment-amount">${amount} ₽ = ${spins} ${this.declineSpins(spins)}</p>
                
                <div class="payment-methods">
                    <button class="payment-method-card" onclick="paymentSystem.payByCard(${amount}, ${spins})">
                        <div class="method-icon">💳</div>
                        <div class="method-info">
                            <div class="method-title">Банковская карта</div>
                            <div class="method-desc">Visa, MasterCard, МИР</div>
                        </div>
                        <div class="method-arrow">→</div>
                    </button>
                    
                    <button class="payment-method-card sbp" onclick="paymentSystem.payBySBP(${amount}, ${spins})">
                        <div class="method-icon">⚡</div>
                        <div class="method-info">
                            <div class="method-title">СБП (Система быстрых платежей)</div>
                            <div class="method-desc">Перевод по номеру телефона</div>
                        </div>
                        <div class="method-arrow">→</div>
                    </button>
                    
                    <button class="payment-method-card manual" onclick="paymentSystem.payManual(${amount}, ${spins})">
                        <div class="method-icon">📱</div>
                        <div class="method-info">
                            <div class="method-title">Ручной перевод</div>
                            <div class="method-desc">На карту или по телефону</div>
                        </div>
                        <div class="method-arrow">→</div>
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    // Оплата картой через CloudPayments
    async payByCard(amount, spins) {
        this.closePaymentModal();
        
        // Показываем форму CloudPayments
        this.showCloudPaymentsWidget(amount, spins);
    }
    
    // CloudPayments Widget
    showCloudPaymentsWidget(amount, spins) {
        const modal = document.createElement('div');
        modal.className = 'modal payment-modal active';
        modal.innerHTML = `
            <div class="modal-content payment-content">
                <button class="modal-close" onclick="paymentSystem.closePaymentModal()">×</button>
                
                <h2>💳 Оплата картой</h2>
                <p class="payment-amount">К оплате: ${amount} ₽</p>
                
                <form id="cardPaymentForm" class="card-form">
                    <div class="form-group">
                        <label>Номер карты</label>
                        <input type="text" id="cardNumber" placeholder="0000 0000 0000 0000" maxlength="19">
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group half">
                            <label>Срок действия</label>
                            <input type="text" id="cardExpiry" placeholder="MM/YY" maxlength="5">
                        </div>
                        <div class="form-group half">
                            <label>CVC</label>
                            <input type="password" id="cardCVC" placeholder="123" maxlength="3">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>Email (для чека)</label>
                        <input type="email" id="cardEmail" placeholder="email@example.com">
                    </div>
                    
                    <button type="submit" class="btn btn-primary payment-submit">
                        <span>Оплатить ${amount} ₽</span>
                    </button>
                </form>
                
                <div class="payment-secure">
                    🔒 Безопасная оплата через CloudPayments
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Маска для номера карты
        const cardInput = modal.querySelector('#cardNumber');
        cardInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
            e.target.value = value;
        });
        
        // Маска для срока действия
        const expiryInput = modal.querySelector('#cardExpiry');
        expiryInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.slice(0, 2) + '/' + value.slice(2, 4);
            }
            e.target.value = value;
        });
        
        // Обработка отправки
        modal.querySelector('#cardPaymentForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = modal.querySelector('.payment-submit');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner"></span> Обработка...';
            
            // В реальном приложении здесь запрос к CloudPayments API
            // Для демо имитируем успешную оплату
            setTimeout(() => {
                this.processSuccessfulPayment(amount, spins, 'card');
                this.closePaymentModal();
            }, 2000);
        });
    }
    
    // Оплата через СБП
    payBySBP(amount, spins) {
        this.closePaymentModal();
        
        const modal = document.createElement('div');
        modal.className = 'modal payment-modal active';
        modal.innerHTML = `
            <div class="modal-content payment-content">
                <button class="modal-close" onclick="paymentSystem.closePaymentModal()">×</button>
                
                <h2>⚡ СБП Перевод</h2>
                <p class="payment-amount">${amount} ₽</p>
                
                <div class="sbp-instructions">
                    <p>1. Откройте приложение своего банка</p>
                    <p>2. Выберите "Перевод по СБП" или "Система быстрых платежей"</p>
                    <p>3. Введите номер телефона получателя:</p>
                </div>
                
                <div class="sbp-phone" onclick="this.copyToClipboard('${PAYMENT_CONFIG.SBP.phoneNumber}')">
                    <span class="phone-number">${PAYMENT_CONFIG.SBP.phoneNumber}</span>
                    <button class="copy-btn-small">📋 Копировать</button>
                </div>
                
                <div class="sbp-recipient">
                    Получатель: <strong>${PAYMENT_CONFIG.SBP.recipientName}</strong>
                </div>
                
                <div class="sbp-amount-hint">
                    Сумма перевода: <strong>${amount} ₽</strong>
                </div>
                
                <div class="payment-check">
                    <p>После оплаты нажмите кнопку:</p>
                    <button class="btn btn-success" onclick="paymentSystem.checkSBPTransfer(${amount}, ${spins})">
                        ✅ Я оплатил
                    </button>
                </div>
                
                <div class="payment-notice">
                    ⚠️ Пополнение происходит вручную после проверки
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Копирование в буфер
        modal.querySelector('.sbp-phone').addEventListener('click', function() {
            const phone = PAYMENT_CONFIG.SBP.phoneNumber;
            navigator.clipboard.writeText(phone).then(() => {
                showNotification('📋 Номер скопирован!');
            });
        });
    }
    
    // Ручной перевод
    payManual(amount, spins) {
        this.closePaymentModal();
        
        const modal = document.createElement('div');
        modal.className = 'modal payment-modal active';
        modal.innerHTML = `
            <div class="modal-content payment-content">
                <button class="modal-close" onclick="paymentSystem.closePaymentModal()">×</button>
                
                <h2>📱 Ручной перевод</h2>
                <p class="payment-amount">${amount} ₽</p>
                
                <div class="manual-tabs">
                    <button class="tab-btn active" onclick="paymentSystem.switchTab('card')">💳 На карту</button>
                    <button class="tab-btn" onclick="paymentSystem.switchTab('phone')">📱 По телефону</button>
                </div>
                
                <div id="tab-card" class="tab-content active">
                    <div class="manual-card">
                        <p>Номер карты для перевода:</p>
                        <div class="card-display" onclick="paymentSystem.copyToClipboard('${PAYMENT_CONFIG.MANUAL.cardNumber}')">
                            <span class="card-number">${PAYMENT_CONFIG.MANUAL.cardNumber}</span>
                            <button class="copy-btn-small">📋 Копировать</button>
                        </div>
                        <p class="recipient">Получатель: ${PAYMENT_CONFIG.MANUAL.recipientName}</p>
                    </div>
                </div>
                
                <div id="tab-phone" class="tab-content">
                    <div class="manual-phone">
                        <p>Телефон для перевода (СБП):</p>
                        <div class="phone-display" onclick="paymentSystem.copyToClipboard('${PAYMENT_CONFIG.MANUAL.phoneNumber}')">
                            <span class="phone-number">${PAYMENT_CONFIG.MANUAL.phoneNumber}</span>
                            <button class="copy-btn-small">📋 Копировать</button>
                        </div>
                        <p class="recipient">Получатель: ${PAYMENT_CONFIG.MANUAL.recipientName}</p>
                    </div>
                </div>
                
                <div class="manual-amount">
                    Сумма: <strong>${amount} ₽</strong>
                </div>
                
                <div class="payment-check">
                    <p>После оплаты нажмите:</p>
                    <button class="btn btn-success" onclick="paymentSystem.checkManualTransfer(${amount}, ${spins})">
                        ✅ Я оплатил
                    </button>
                </div>
                
                <div class="payment-notice">
                    ⏰ Пополнение в течение 15 минут после проверки
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    // Переключение табов
    switchTab(tab) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        event.target.classList.add('active');
        document.getElementById(`tab-${tab}`).classList.add('active');
    }
    
    // Проверка СБП перевода
    checkSBPTransfer(amount, spins) {
        this.showTransferConfirmation(amount, spins, 'sbp');
    }
    
    // Проверка ручного перевода
    checkManualTransfer(amount, spins) {
        this.showTransferConfirmation(amount, spins, 'manual');
    }
    
    // Форма подтверждения перевода
    showTransferConfirmation(amount, spins, method) {
        this.closePaymentModal();
        
        const modal = document.createElement('div');
        modal.className = 'modal payment-modal active';
        modal.innerHTML = `
            <div class="modal-content payment-content">
                <button class="modal-close" onclick="paymentSystem.closePaymentModal()">×</button>
                
                <h2>✅ Подтверждение оплаты</h2>
                
                <p class="confirmation-text">
                    Отправьте скриншот квитанции об оплате администратору.
                    После проверки ${spins} ${this.declineSpins(spins)} будут начислены на ваш баланс.
                </p>
                
                <div class="confirmation-details">
                    <div class="detail-row">
                        <span>Сумма:</span>
                        <strong>${amount} ₽</strong>
                    </div>
                    <div class="detail-row">
                        <span>Способ:</span>
                        <strong>${method === 'sbp' ? 'СБП' : 'Ручной перевод'}</strong>
                    </div>
                    <div class="detail-row">
                        <span>Статус:</span>
                        <span class="status-pending">⏳ Ожидает проверки</span>
                    </div>
                </div>
                
                <button class="btn btn-primary" onclick="paymentSystem.closePaymentModal(); tg.openTelegramLink('https://t.me/admin_username');">
                    📨 Отправить чек админу
                </button>
                
                <p class="confirmation-notice">
                    Обычно проверка занимает 5-15 минут
                </p>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Сохраняем информацию о платеже
        this.savePendingPayment(amount, spins, method);
    }
    
    // Сохранение ожидающего платежа
    savePendingPayment(amount, spins, method) {
        const pending = {
            id: 'pay_' + Date.now(),
            amount: amount,
            spins: spins,
            method: method,
            status: 'pending',
            date: new Date().toISOString(),
            userId: userData.userId
        };
        
        let payments = JSON.parse(localStorage.getItem('pendingPayments') || '[]');
        payments.push(pending);
        localStorage.setItem('pendingPayments', JSON.stringify(payments));
        
        // Отправляем уведомление админу (в реальном приложении — через бота)
        this.notifyAdminAboutPayment(pending);
    }
    
    // Уведомление админа
    notifyAdminAboutPayment(payment) {
        console.log('🔔 Новый платёж:', payment);
        
        // В реальном приложении отправка в Telegram бота
        // fetch('https://your-server.com/notify', { method: 'POST', body: JSON.stringify(payment) })
    }
    
    // Обработка успешной оплаты
    processSuccessfulPayment(amount, spins, method) {
        userData.balance += amount;
        userData.spins += spins;
        saveUserData();
        updateUI();
        
        showNotification(`✅ Оплачено! +${spins} ${this.declineSpins(spins)}`);
        
        if (tg.HapticFeedback) {
            tg.HapticFeedback.notificationOccurred('success');
        }
    }
    
    // Склонение слова "вращение"
    declineSpins(n) {
        const words = ['вращение', 'вращения', 'вращений'];
        return words[(n % 100 > 4 && n % 100 < 20) ? 2 : [2, 0, 1, 1, 1, 2][(n % 10 < 5) ? n % 10 : 5]];
    }
    
    // Копирование в буфер
    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            showNotification('📋 Скопировано!');
        });
    }
    
    // Закрытие модалки
    closePaymentModal() {
        const modals = document.querySelectorAll('.payment-modal');
        modals.forEach(m => m.remove());
    }
}

// Создаём экземпляр
const paymentSystem = new PaymentSystem();

// Экспорт
window.paymentSystem = paymentSystem;
