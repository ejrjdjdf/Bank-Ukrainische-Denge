import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase, ref, set, get, child } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

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

window.switchTab = function(mode) {
    window.currentMode = mode;
    document.getElementById('tab-login').classList.toggle('active', mode === 'login');
    document.getElementById('tab-register').classList.toggle('active', mode === 'register');
    document.getElementById('auth-title').innerText = mode === 'login' ? 'Вхід у систему' : 'Створення акаунта';
}

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

function showBankScreen(username, balance) {
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('bank-screen').classList.remove('hidden');
    document.getElementById('user-display-name').innerText = username.toUpperCase();
    document.getElementById('balance-value').innerText = balance;
}

window.logout = function() {
    localStorage.removeItem('bank_user');
    document.getElementById('auth-screen').classList.remove('hidden');
    document.getElementById('bank-screen').classList.add('hidden');
}

const savedUser = localStorage.getItem('bank_user');
if(savedUser) {
    get(child(ref(db), `users/${savedUser}`)).then((snapshot) => {
        if (snapshot.exists()) {
            showBankScreen(savedUser, snapshot.val().balance);
        }
    });
}