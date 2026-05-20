import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase, ref, set, get, child, update } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

// Твій стабільний конфіг Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBd0gJFbyOIxvtW19oIW12lAJ9Cn61QAWc",
    authDomain: "bank-ukrainische-denge.firebaseapp.com",
    databaseURL: "https://bank-ukrainische-denge-default-rtdb.firebaseio.com",
    projectId: "bank-ukrainische-denge",
    storageBucket: "bank-ukrainische-denge.firebasestorage.app",
    messagingSenderId: "1050934436064",
    appId: "1:1050934436064:web:27fdb5bff9e78761d33085",
    measurementId: "G-54MNPKPCMX"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

window.currentMode = 'login'; 

// Перемикання вкладок Вхід / Реєстрація
window.switchTab = function(mode) {
    window.currentMode = mode;
    document.getElementById('tab-login').classList.toggle('active', mode === 'login');
    document.getElementById('tab-register').classList.toggle('active', mode === 'register');
    document.getElementById('auth-title').innerText = mode === 'login' ? 'Вхід у систему' : 'Створення акаунта';
}

// Реєстрація та Вхід
window.handleAuth = function() {
    const username = document.getElementById('username').value.trim().toLowerCase();
    const pin = document.getElementById('pin').value;

    if(!username || pin.length !== 4) {
        alert("Заповни нік та введи РІВНО 4 цифри паролю!");
        return;
    }

    const dbRef = ref(db);
    
    if(window.currentMode === 'register') {
        get(child(dbRef, `users/${username}`)).then((snapshot) => {
            if (snapshot.exists()) {
                alert("Цей нікнейм уже зайнятий!");
            } else {
                set(ref(db, 'users/' + username), {
                    username: username,
                    pin: pin,
                    balance: 0
                }).then(() => {
                    alert("Акаунт створено! Тепер увійдіть.");
                    window.switchTab('login');
                });
            }
        });
    } else {
        get(child(dbRef, `users/${username}`)).then((snapshot) => {
            if (snapshot.exists() && snapshot.val().pin === pin) {
                localStorage.setItem('bank_user', username);
                showBankScreen(username, snapshot.val().balance);
            } else {
                alert("Невірний нік або ПІН-код!");
            }
        });
    }
}

// Функція Переказу Коштів (ПОВНА ВЕРСІЯ)
window.makeTransfer = function() {
    const fromUser = localStorage.getItem('bank_user');
    const toUser = document.getElementById('transfer-to').value.trim().toLowerCase();
    const amountInput = document.getElementById('transfer-amount').value.trim();

    if (!toUser || !amountInput) {
        alert("Заповни нік отримувача та суму!");
        return;
    }

    if (fromUser === toUser) {
        alert("Ви не можете переказати кошти самому собі!");
        return;
    }

    const dbRef = ref(db);

    // 1. Перевіряємо, чи існує той, кому переказуємо
    get(child(dbRef, `users/${toUser}`)).then((recipientSnapshot) => {
        if (!recipientSnapshot.exists()) {
            alert("Користувача з таким нікнеймом не існує!");
            return;
        }

        // 2. Перевіряємо баланс відправника
        get(child(dbRef, `users/${fromUser}`)).then((senderSnapshot) => {
            const senderData = senderSnapshot.val();
            let senderBalance = Number(senderData.balance);
            const transferAmount = Number(amountInput);

            // Чіт-код для адмінських кастомних балансів (тексту типу "мазда міята")
            if (isNaN(senderBalance)) {
                senderBalance = 999999999; 
            }

            if (senderBalance < transferAmount) {
                alert("Недостатньо коштів на балансі!");
                return;
            }

            const recipientData = recipientSnapshot.val();
            let recipientBalance = Number(recipientData.balance);
            if (isNaN(recipientBalance)) recipientBalance = 0;

            const newSenderBalance = senderBalance - transferAmount;
            const newRecipientBalance = recipientBalance + transferAmount;

            // 3. Формуємо пакет оновлень для Firebase
            const updates = {};
            
            // Якщо баланс звичайне число — віднімаємо, якщо текст — залишаємо незмінним
            if (!isNaN(Number(senderData.balance))) {
                updates[`/users/${fromUser}/balance`] = newSenderBalance;
            }
            updates[`/users/${toUser}/balance`] = newRecipientBalance;

            // Створюємо запис транзакції для доказів у суді
            const txId = 'tx_' + Date.now();
            updates[`/transactions/${txId}`] = {
                from: fromUser,
                to: toUser,
                amount: transferAmount,
                timestamp: Date.now()
            };

            // Пушимо все в базу одним махом
            update(ref(db), updates).then(() => {
                alert(`Переказ ${transferAmount} DNG успішно надіслано користувачу ${toUser.toUpperCase()}!`);
                
                if (!isNaN(Number(senderData.balance))) {
                    document.getElementById('balance-value').innerText = newSenderBalance;
                }
                
                document.getElementById('transfer-to').value = '';
                document.getElementById('transfer-amount').value = '';
            }).catch((error) => {
                alert("Помилка під час транзакції!");
                console.error(error);
            });
        });
    });
}

// Показуємо інтерфейс банку після успішного входу
function showBankScreen(username, balance) {
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('bank-screen').classList.remove('hidden');
    document.getElementById('user-display-name').innerText = username.toUpperCase();
    document.getElementById('balance-value').innerText = balance;
}

// Вихід з акаунту
window.logout = function() {
    localStorage.removeItem('bank_user');
    document.getElementById('auth-screen').classList.remove('hidden');
    document.getElementById('bank-screen').classList.add('hidden');
}

// Перевірка пристрою при завантаженні сторінки (Авто-вхід)
const savedUser = localStorage.getItem('bank_user');
if(savedUser) {
    get(child(ref(db), `users/${savedUser}`)).then((snapshot) => {
        if (snapshot.exists()) {
            showBankScreen(savedUser, snapshot.val().balance);
        }
    });
}
