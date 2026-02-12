// --- Firebase Configuration ---
const firebaseConfig = {
    apiKey: "AIzaSyAq-9_EZA7xQBQccb6rHHOlhfiu3qXJywg",
    authDomain: "finance-tracker-91c63.firebaseapp.com",
    projectId: "finance-tracker-91c63",
    storageBucket: "finance-tracker-91c63.firebasestorage.app",
    messagingSenderId: "195063442419",
    appId: "1:195063442419:web:8d8663e5366b883bf0c086",
    measurementId: "G-PYNF64Y6Y0"
};

// Initialize Firebase
let db = null;
let auth = null;
let currentUser = null;

try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    auth = firebase.auth();
} catch (error) {
    console.error("Firebase initialization failed:", error.message);
}

// --- State Management ---
let transactions = [];
let currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
let editingId = null;


// --- Selectors ---
const balanceEl = document.getElementById('balance');
const incomeEl = document.getElementById('total-income');
const expenseEl = document.getElementById('total-expense');
const listEl = document.getElementById('transaction-list');
const formEl = document.getElementById('transaction-form');
const titleInp = document.getElementById('title');
const amountInp = document.getElementById('amount');

const themeToggleBtn = document.getElementById('theme-toggle');
const sunIcon = document.getElementById('sun-icon');
const moonIcon = document.getElementById('moon-icon');
const authBtn = document.getElementById('auth-btn');
const dateInp = document.getElementById('current-date');
const resetDayBtn = document.getElementById('reset-day-btn');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const submitBtn = document.getElementById('submit-btn');


// --- Initialization ---
async function init() {
    // 1. Theme Setup
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcons(savedTheme);

    // 2. Date Setup
    dateInp.value = currentDate;

    // 3. Auth State Listener
    if (auth) {
        auth.onAuthStateChanged(async (user) => {
            currentUser = user;
            updateAuthUI(user);
            await loadData();
        });
    } else {
        await loadData();
    }
}

// --- Data Persistence Logic ---

async function loadData() {
    if (currentUser && db) {
        try {
            const snapshot = await db.collection('users')
                .doc(currentUser.uid)
                .collection('transactions')
                .get();

            transactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error("Firestore error:", error);
            loadLocal();
        }
    } else {
        loadLocal();
    }

    // Normalize data (ensure dateStr exists)
    transactions.forEach(t => {
        if (!t.dateStr) {
            t.dateStr = new Date(t.date).toISOString().split('T')[0];
        }
    });

    updateUI();
}

function loadLocal() {
    const stored = JSON.parse(localStorage.getItem('transactions'));
    transactions = stored || [];
}

async function saveData() {
    if (currentUser && db) {
        // Handled individually
    } else {
        localStorage.setItem('transactions', JSON.stringify(transactions));
    }
}

// --- Core Actions ---

// Helper to evaluate simple math expressions (e.g. "10+20+5")
function evaluateMathExpression(str) {
    // 1. Remove anything that isn't a digit, dot, +, -, *, /, (, or )
    //    We also allow spaces which we can strip
    const cleanStr = str.replace(/[^0-9+\-*/().]/g, '');

    if (!cleanStr) return NaN;

    try {
        // 2. Use Function constructor for safe evaluation
        //    "return " + cleanStr => "return 10+20"
        return new Function('return ' + cleanStr)();
    } catch (e) {
        return NaN;
    }
}

async function addTransaction(e) {

    e.preventDefault();

    const title = titleInp.value.trim();
    const amount = evaluateMathExpression(amountInp.value);

    const type = document.querySelector('input[name="type"]:checked').value;


    if (title === '' || isNaN(amount)) return;

    if (editingId) {
        // --- UPDATE MODE ---
        const transactionIndex = transactions.findIndex(t => t.id.toString() === editingId.toString());
        if (transactionIndex > -1) {

            const oldT = transactions[transactionIndex];
            const updatedT = { ...oldT, title, amount, type }; // Keep original date

            if (currentUser && db) {
                try {
                    await db.collection('users')
                        .doc(currentUser.uid)
                        .collection('transactions')
                        .doc(editingId)
                        .update({ title, amount, type });

                    transactions[transactionIndex] = updatedT;
                } catch (error) {
                    console.error("Update failed:", error);
                }
            } else {
                transactions[transactionIndex] = updatedT;
                saveData();
            }
            cancelEdit(); // Reset form state
        }
    } else {
        // --- ADD MODE ---
        // Use currently selected date
        const transactionData = {
            title,
            amount,
            type,
            date: new Date().getTime(), // Keep timestamp for sorting order
            dateStr: currentDate // Use selected date for filtering
        };

        if (currentUser && db) {
            try {
                const docRef = await db.collection('users')
                    .doc(currentUser.uid)
                    .collection('transactions')
                    .add(transactionData);

                transactions.push({ id: docRef.id, ...transactionData });
            } catch (error) {
                console.error("Add failed:", error);
            }
        } else {
            const id = Math.floor(Math.random() * 100000000).toString();
            transactions.push({ id, ...transactionData });
            saveData();
        }
    }

    updateUI();
    if (!editingId) formEl.reset(); // Only clear if not already cleared by cancelEdit
}

function startEdit(id) {
    const t = transactions.find(trans => trans.id.toString() === id.toString());

    if (!t) return;

    // Populate Form
    titleInp.value = t.title;
    amountInp.value = t.amount;

    // Select radio
    const radio = document.querySelector(`input[name="type"][value="${t.type}"]`);
    if (radio) radio.checked = true;

    // Update State
    editingId = id.toString();
    submitBtn.textContent = "Update Transaction";
    cancelEditBtn.classList.remove('hidden');

    // Scroll to form (optional, for mobile)
    formEl.scrollIntoView({ behavior: 'smooth' });
}

function cancelEdit() {
    editingId = null;
    formEl.reset();
    submitBtn.textContent = "Append Transaction";
    cancelEditBtn.classList.add('hidden');

    // Reset radio to expense default if you want, or leave as is
    document.querySelector('input[value="expense"]').checked = true;
}


async function removeTransaction(id, event) {
    if (event) event.stopPropagation(); // Prevent edit mode trigger

    if (currentUser && db) {

        try {
            await db.collection('users')
                .doc(currentUser.uid)
                .collection('transactions')
                .doc(id.toString())
                .delete();

            transactions = transactions.filter(t => t.id.toString() !== id.toString());
        } catch (error) {
            console.error("Delete failed:", error);
        }
    } else {
        transactions = transactions.filter(t => t.id.toString() !== id.toString());
        saveData();
    }

    updateUI();
}

async function resetDay() {
    if (confirm(`Are you sure you want to delete ALL transactions for ${currentDate}?`)) {
        const toDelete = transactions.filter(t => t.dateStr === currentDate);

        if (currentUser && db) {
            const batch = db.batch();
            toDelete.forEach(t => {
                const ref = db.collection('users').doc(currentUser.uid).collection('transactions').doc(t.id);
                batch.delete(ref);
            });
            await batch.commit();
            transactions = transactions.filter(t => t.dateStr !== currentDate);
        } else {
            transactions = transactions.filter(t => t.dateStr !== currentDate);
            saveData();
        }
        updateUI();
    }
}

// --- Auth Handling ---

async function toggleAuth() {
    if (!auth) {
        alert("Firebase config missing.");
        return;
    }

    if (currentUser) {
        await auth.signOut();
    } else {
        const provider = new firebase.auth.GoogleAuthProvider();
        try {
            await auth.signInWithPopup(provider);
        } catch (error) {
            console.error("Login failed:", error.message);
            alert("Login failed: " + error.message);
        }
    }
}

function updateAuthUI(user) {
    const span = authBtn.querySelector('span');
    if (user) {
        span.textContent = user.displayName.split(' ')[0];
        authBtn.classList.add('user-active');
    } else {
        span.textContent = 'Login';
        authBtn.classList.remove('user-active');
    }
}

// --- UI Updates ---

function updateUI() {
    listEl.innerHTML = '';

    // Filter by Current Date
    const filteredTransactions = transactions.filter(t => t.dateStr === currentDate);

    if (filteredTransactions.length === 0) {
        listEl.innerHTML = '<li class="empty-state">No records for this date.</li>';
    } else {
        filteredTransactions.sort((a, b) => b.date - a.date);

        filteredTransactions.forEach(t => {
            const li = document.createElement('li');
            li.classList.add(t.type, 'animate-in');

            li.onclick = () => startEdit(t.id);

            li.innerHTML = `
                <div class="li-info" onclick="startEdit('${t.id}')">
                    <span class="li-title">${t.title}</span>
                    <span class="li-amount">${t.type === 'expense' ? '-' : '+'}$${Math.abs(t.amount).toFixed(2)}</span>
                </div>
                <div class="action-btn-group">
                    <button class="edit-btn" onclick="startEdit('${t.id}')" title="Edit">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button class="delete-btn" onclick="removeTransaction('${t.id}', event)" title="Delete">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>
            `;

            listEl.appendChild(li);
        });
    }

    updateTotals(filteredTransactions);
}


function updateTotals(filteredTransactions) {
    // 1. Persistent Money Received
    // Find the latest date (<= current) that has an income entry
    const incomeTransactions = transactions
        .filter(t => t.type === 'income' && t.dateStr <= currentDate)
        .sort((a, b) => b.date - a.date); // Newest first

    let moneyReceived = 0;

    if (incomeTransactions.length > 0) {
        // Get the date of the very last income
        const lastIncomeDate = incomeTransactions[0].dateStr;

        // Sum ALL income from that specific date
        moneyReceived = incomeTransactions
            .filter(t => t.dateStr === lastIncomeDate)
            .reduce((acc, t) => acc + t.amount, 0);
    }

    // 2. Daily Expense (Strictly for selected date)
    const dailyExpense = filteredTransactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => acc + t.amount, 0);


    // 2. Cumulative Balance (All transactions <= currentDate)
    // We need to check 'transactions' (global state) not just filtered
    const cumulativeBalance = transactions
        .filter(t => t.dateStr <= currentDate)
        .reduce((acc, t) => {
            return t.type === 'income' ? acc + t.amount : acc - t.amount;
        }, 0);

    balanceEl.textContent = `$${cumulativeBalance.toFixed(2)}`;
    incomeEl.textContent = `$${moneyReceived.toFixed(2)}`;

    expenseEl.textContent = `$${dailyExpense.toFixed(2)}`;
}

// --- Theme Toggle ---

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcons(newTheme);
}

function updateThemeIcons(theme) {
    if (theme === 'dark') {
        sunIcon.classList.add('hidden');
        moonIcon.classList.remove('hidden');
    } else {
        sunIcon.classList.remove('hidden');
        moonIcon.classList.add('hidden');
    }
}

// --- Event Listeners ---
formEl.addEventListener('submit', addTransaction);
themeToggleBtn.addEventListener('click', toggleTheme);
authBtn.addEventListener('click', toggleAuth);
cancelEditBtn.addEventListener('click', cancelEdit);

window.removeTransaction = removeTransaction;

dateInp.addEventListener('change', (e) => {
    currentDate = e.target.value;
    updateUI();
});
resetDayBtn.addEventListener('click', resetDay);

window.removeTransaction = removeTransaction;

init();
