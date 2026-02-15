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
let editingId = null;

// --- Selectors ---
const balanceEl = document.getElementById('balance');
const incomeEl = document.getElementById('total-income');
const expenseEl = document.getElementById('total-expense');
const listEl = document.getElementById('transaction-list');
const formEl = document.getElementById('transaction-form');
const titleInp = document.getElementById('title');
const amountInp = document.getElementById('amount');
const categoryInp = document.getElementById('category');
const dateInp = document.getElementById('date');
const notesInp = document.getElementById('notes');

const themeToggleBtn = document.getElementById('theme-toggle');
const sunIcon = document.getElementById('sun-icon');
const moonIcon = document.getElementById('moon-icon');
const authBtn = document.getElementById('auth-btn');
const submitBtn = document.getElementById('submit-btn');
const cancelEditBtn = document.getElementById('cancel-edit-btn');

// --- Initialization ---
async function init() {
    // 1. Theme Setup
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcons(savedTheme);

    // 2. Date Setup (Default to today)
    dateInp.valueAsDate = new Date();

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

            transactions = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    date: data.date && typeof data.date.toMillis === 'function' ? data.date.toMillis() : data.date
                };
            });
        } catch (error) {
            console.error("Firestore loading error:", error);
            loadLocal();
        }
    } else {
        loadLocal();
    }

    // Sort by date desc
    transactions.sort((a, b) => new Date(b.dateStr || b.date) - new Date(a.dateStr || a.date));
    updateUI();
}

function loadLocal() {
    const stored = JSON.parse(localStorage.getItem('transactions'));
    transactions = stored || [];
    // Ensure compatibility with old data format if any
    transactions = transactions.map(t => ({
        ...t,
        category: t.category || 'Other',
        dateStr: t.dateStr || new Date(t.date).toISOString().split('T')[0]
    }));
}

async function saveData() {
    if (currentUser && db) {
        // Handled individually per action for cloud
    } else {
        localStorage.setItem('transactions', JSON.stringify(transactions));
    }
}

// --- Core Actions ---

function evaluateMathExpression(str) {
    // Basic safety: allow only numbers and math operators
    const cleanStr = str.replace(/[^0-9+\-*/().]/g, '');
    if (!cleanStr) return NaN;
    try {
        // eslint-disable-next-line no-new-func
        return new Function('return ' + cleanStr)();
    } catch (e) {
        return NaN;
    }
}

async function addTransaction(e) {
    if (e) e.preventDefault();

    const title = titleInp.value.trim();
    const amountStr = amountInp.value;
    const amount = evaluateMathExpression(amountStr);
    const category = categoryInp.value;
    const dateStr = dateInp.value;
    const notes = notesInp.value.trim();

    const typeChecked = document.querySelector('input[name="type"]:checked');
    const type = typeChecked ? typeChecked.value : 'expense';

    if (title === '' || isNaN(amount) || amount === 0 || !category || !dateStr) {
        alert("Please fill in all required fields.");
        return;
    }

    const originalBtnText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = "Processing...";

    const transactionData = {
        title,
        amount: Math.abs(amount), // Ensure positive
        type,
        category,
        date: new Date(dateStr).getTime(),
        dateStr,
        notes
    };

    if (editingId) {
        // --- UPDATE MODE ---
        const index = transactions.findIndex(t => t.id.toString() === editingId.toString());
        if (index > -1) {
            const oldT = transactions[index];
            const updatedT = { ...oldT, ...transactionData };

            transactions[index] = updatedT;
            // Re-sort
            transactions.sort((a, b) => new Date(b.dateStr) - new Date(a.dateStr));
            updateUI();

            if (currentUser && db) {
                try {
                    await db.collection('users')
                        .doc(currentUser.uid)
                        .collection('transactions')
                        .doc(editingId)
                        .update(transactionData);
                } catch (error) {
                    console.error("Cloud update failed:", error);
                    alert("Failed to sync with cloud. Changes saved locally in session.");
                }
            } else {
                saveData();
            }
            cancelEdit();
        }
    } else {
        // --- ADD MODE ---
        const tempId = "temp-" + Date.now();
        const optimisticT = { id: tempId, ...transactionData };

        transactions.unshift(optimisticT);
        // Re-sort
        transactions.sort((a, b) => new Date(b.dateStr) - new Date(a.dateStr));
        updateUI();

        // Reset form inputs but keep date
        titleInp.value = '';
        amountInp.value = '';
        notesInp.value = '';
        categoryInp.value = ''; // Reset category
        document.querySelector('input[value="expense"]').checked = true;

        if (currentUser && db) {
            try {
                const docRef = await db.collection('users')
                    .doc(currentUser.uid)
                    .collection('transactions')
                    .add(transactionData);

                // Update the temp ID with real ID
                const index = transactions.findIndex(t => t.id === tempId);
                if (index > -1) transactions[index].id = docRef.id;
            } catch (error) {
                console.error("Cloud add failed:", error);
                // Rollback UI if strictly cloud-based, or keep as pending?
                // For now, let's just alert.
                alert("Failed to save transaction to cloud.");
            }
        } else {
            // Local storage needs a simpler ID
            transactions = transactions.map(t => t.id === tempId ? { ...t, id: Date.now().toString() } : t);
            saveData();
        }
    }

    submitBtn.disabled = false;
    submitBtn.textContent = originalBtnText;
}

function startEdit(id) {
    const t = transactions.find(trans => trans.id.toString() === id.toString());
    if (!t) return;

    titleInp.value = t.title;
    amountInp.value = t.amount;
    categoryInp.value = t.category || '';
    dateInp.value = t.dateStr;
    notesInp.value = t.notes || '';

    const radio = document.querySelector(`input[name="type"][value="${t.type}"]`);
    if (radio) radio.checked = true;

    editingId = id.toString();
    submitBtn.textContent = "Update Transaction";
    cancelEditBtn.classList.remove('hidden');

    // Scroll to form on mobile/desktop
    const formSection = document.querySelector('.form-section');
    formSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function cancelEdit() {
    editingId = null;
    formEl.reset();
    dateInp.valueAsDate = new Date(); // Reset to today
    submitBtn.textContent = "Add Transaction";
    cancelEditBtn.classList.add('hidden');
    document.querySelector('input[value="expense"]').checked = true;
}

async function removeTransaction(id, event) {
    if (event) event.stopPropagation();
    if (!confirm("Delete this transaction?")) return;

    const originalTransactions = [...transactions];
    transactions = transactions.filter(t => t.id.toString() !== id.toString());
    updateUI();

    if (currentUser && db) {
        try {
            await db.collection('users')
                .doc(currentUser.uid)
                .collection('transactions')
                .doc(id.toString())
                .delete();
        } catch (error) {
            console.error("Delete failed:", error);
            // Rollback
            transactions = originalTransactions;
            updateUI();
            alert("Failed to delete from cloud.");
        }
    } else {
        saveData();
    }
}

// --- Auth Handling ---
async function toggleAuth() {
    if (!auth) { alert("Firebase config missing."); return; }

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

function getCategoryIcon(category) {
    const icons = {
        'Food': '🍽️',
        'Transportation': '🚗',
        'Shopping': '🛍️',
        'Housing': '🏠',
        'Utilities': '💡',
        'Entertainment': '🎬',
        'Healthcare': '⚕️',
        'Personal': '💆',
        'Education': '📚',
        'Debt': '💳',
        'Savings': '💰',
        'Investment': '📈',
        'Other': '📦'
    };
    return icons[category] || '💸';
}

function updateUI() {
    listEl.innerHTML = '';

    if (transactions.length === 0) {
        listEl.innerHTML = `
            <div class="empty-state animate-in">
                <div class="empty-state-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><line x1="12" y1="22" x2="12" y2="7"></line><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path></svg>
                </div>
                <h3>Start Your Journey</h3>
                <p>Add your first transaction to begin tracking your finances.</p>
            </div>
        `;
    } else {
        // Group by Date
        const grouped = transactions.reduce((groups, t) => {
            const date = t.dateStr;
            if (!groups[date]) groups[date] = [];
            groups[date].push(t);
            return groups;
        }, {});

        // Sort dates desc
        const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a));

        sortedDates.forEach(date => {
            // Check for today/yesterday
            const d = new Date(date + 'T00:00:00'); // appended time to prevent timezone shift issues
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Format header
            let headerText;
            const dStr = d.toISOString().split('T')[0];
            const tStr = today.toISOString().split('T')[0];

            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            const yStr = yesterday.toISOString().split('T')[0];

            if (dStr === tStr) headerText = "Today";
            else if (dStr === yStr) headerText = "Yesterday";
            else {
                headerText = d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            }

            const header = document.createElement('h4');
            header.className = 'date-header animate-in';
            header.textContent = headerText;
            listEl.appendChild(header);

            grouped[date].forEach(t => {
                const li = document.createElement('li');
                li.classList.add(t.type, 'animate-in');
                li.onclick = () => startEdit(t.id);

                const icon = getCategoryIcon(t.category);
                const sign = t.type === 'expense' ? '-' : '+';

                li.innerHTML = `
                    <div class="li-left">
                        <div class="category-icon">${icon}</div>
                        <div class="li-info">
                            <span class="li-title">${t.title}</span>
                            <span class="li-category">${t.category || 'Uncategorized'}</span>
                        </div>
                    </div>
                    <div class="li-right">
                        <span class="li-amount">${sign}$${Number(t.amount).toFixed(2)}</span>
                        ${t.notes ? '<span class="li-date" title="Has Notes">📝</span>' : ''}
                    </div>
                `;

                const delBtn = document.createElement('button');
                delBtn.className = 'delete-btn';
                delBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>';
                delBtn.title = "Delete";
                delBtn.onclick = (e) => removeTransaction(t.id, e);

                li.appendChild(delBtn);
                listEl.appendChild(li);
            });
        });
    }

    updateTotals();
}


function updateTotals() {
    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((acc, t) => acc + Number(t.amount), 0);

    const totalExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => acc + Number(t.amount), 0);

    const balance = totalIncome - totalExpense;

    balanceEl.textContent = `$${balance.toFixed(2)}`;
    incomeEl.textContent = `$${totalIncome.toFixed(2)}`;
    expenseEl.textContent = `$${totalExpense.toFixed(2)}`;
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

window.init = init;
init();
