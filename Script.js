// Utility functions are now globally available from utils-helpers.js

// Global state with better organization
const AppState = {
    // Data
    transactions: JSON.parse(localStorage.getItem('transactions')) || [],
    goals: JSON.parse(localStorage.getItem('goals')) || [],
    budgets: JSON.parse(localStorage.getItem('budgets')) || [],
    recurringTransactions: JSON.parse(localStorage.getItem('recurringTransactions')) || [],
    debts: JSON.parse(localStorage.getItem('debts')) || [],
    investments: JSON.parse(localStorage.getItem('investments')) || [],
    subscriptions: JSON.parse(localStorage.getItem('subscriptions')) || [],
    filteredTransactions: [],
    
    // UI State
    isLoading: false,
    currentEditIndex: null,
    currentTipIndex: 0,
    
    // Security & Privacy
    pinCode: localStorage.getItem('pinCode') || null,
    isPrivateMode: false,
    isLocked: false,
    pinLength: parseInt(localStorage.getItem('pinLength')) || 4,
    lockTimeout: parseInt(localStorage.getItem('lockTimeout')) || 300000,
    failedAttempts: 0,
    maxFailedAttempts: 5,
    
    // Settings
    notificationsEnabled: localStorage.getItem('notificationsEnabled') === 'true',
    theme: localStorage.getItem('theme') || 'light',
    
    // Performance
    lastUpdate: 0,
    updateThrottle: 100 // ms
};

// Timers and intervals
let tipInterval;
let inactivityTimer;
let performanceObserver;

// Optimized storage functions with error handling
function saveTransactions() {
    try {
        localStorage.setItem('transactions', JSON.stringify(AppState.transactions));
    } catch (error) {
        console.error('Failed to save transactions:', error);
        showNotification('❌', 'Erreur lors de la sauvegarde des transactions', 'error');
    }
}

function saveGoals() {
    try {
        localStorage.setItem('goals', JSON.stringify(AppState.goals));
    } catch (error) {
        console.error('Failed to save goals:', error);
        showNotification('❌', 'Erreur lors de la sauvegarde des objectifs', 'error');
    }
}

function saveBudgets() {
    try {
        localStorage.setItem('budgets', JSON.stringify(AppState.budgets));
    } catch (error) {
        console.error('Failed to save budgets:', error);
        showNotification('❌', 'Erreur lors de la sauvegarde des budgets', 'error');
    }
}

function saveRecurring() {
    try {
        localStorage.setItem('recurringTransactions', JSON.stringify(AppState.recurringTransactions));
    } catch (error) {
        console.error('Failed to save recurring transactions:', error);
        showNotification('❌', 'Erreur lors de la sauvegarde des récurrences', 'error');
    }
}

function saveDebts() {
    try {
        localStorage.setItem('debts', JSON.stringify(AppState.debts));
    } catch (error) {
        console.error('Failed to save debts:', error);
        showNotification('❌', 'Erreur lors de la sauvegarde des dettes', 'error');
    }
}

function saveInvestments() {
    try {
        localStorage.setItem('investments', JSON.stringify(AppState.investments));
    } catch (error) {
        console.error('Failed to save investments:', error);
        showNotification('❌', 'Erreur lors de la sauvegarde des investissements', 'error');
    }
}

function saveSubscriptions() {
    try {
        localStorage.setItem('subscriptions', JSON.stringify(AppState.subscriptions));
    } catch (error) {
        console.error('Failed to save subscriptions:', error);
        showNotification('❌', 'Erreur lors de la sauvegarde des abonnements', 'error');
    }
}

// Enhanced showNotification using the utility function
function showNotification(icon, message, type = 'info') {
    const notificationsContainer = document.querySelector('.notifications-container') || document.body;
    const toast = document.createElement('div');
    toast.className = `notification-toast notification-${type}`;
    toast.innerHTML = `
        <div class="notification-icon">${icon}</div>
        <div class="notification-text">${message}</div>
        <button class="notification-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    notificationsContainer.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.style.animation = 'slideInRight 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }
    }, 5000);
}

// Performance-optimized version using utilities
const debouncedSearch = debounce(applyFilters, 300);

// Optimized update function with throttling
function throttledUpdate() {
    const now = Date.now();
    if (now - AppState.lastUpdate < AppState.updateThrottle) {
        clearTimeout(throttledUpdate.timeout);
        throttledUpdate.timeout = setTimeout(() => {
            AppState.lastUpdate = Date.now();
            updateAll();
        }, AppState.updateThrottle);
    } else {
        AppState.lastUpdate = now;
        updateAll();
    }
}

// Enhanced notification system
function toggleNotifications() {
    AppState.notificationsEnabled = !AppState.notificationsEnabled;
    localStorage.setItem('notificationsEnabled', AppState.notificationsEnabled);
    showNotification('🔔', `Notifications ${AppState.notificationsEnabled ? 'activées' : 'désactivées'}`, 'success');
}

// Enhanced security functions with better error handling
function initSecurity() {
    try {
        lockApp();
        updatePinInputs();
        document.getElementById('pinLength').value = AppState.pinLength;
        document.getElementById('lockTimeout').value = AppState.lockTimeout;
        
        if (!AppState.pinCode) {
            document.getElementById('pinMessage').textContent = 'Créez votre code PIN';
        } else {
            document.getElementById('pinMessage').textContent = 'Entrez votre code PIN';
        }
    } catch (error) {
        console.error('Security initialization failed:', error);
        showNotification('❌', 'Erreur lors de l\'initialisation de la sécurité', 'error');
    }
}

function updatePinInputs() {
    const pinInputDisplay = document.getElementById('pinInputDisplay');
    if (!pinInputDisplay) return;

    pinInputDisplay.innerHTML = '';

    for (let i = 0; i < AppState.pinLength; i++) {
        const input = document.createElement('input');
        input.type = 'password';
        input.className = 'pin-digit';
        input.maxLength = 1;
        input.readOnly = true;
        input.setAttribute('autocomplete', 'off');
        pinInputDisplay.appendChild(input);
    }

    // Add keyboard support for PIN input
    document.addEventListener('keydown', handlePinKeyboardInput);
}

function handlePinKeyboardInput(event) {
    // Allow only numeric keys (0-9) and Backspace
    if ((event.key >= '0' && event.key <= '9') || event.key === 'Backspace') {
        const inputs = document.querySelectorAll('.pin-digit');
        if (!inputs.length) return;

        if (event.key === 'Backspace') {
            // Clear the last filled input
            for (let i = inputs.length - 1; i >= 0; i--) {
                if (inputs[i].value) {
                    inputs[i].value = '';
                    break;
                }
            }
        } else {
            // Fill the next empty input with the pressed key
            for (let i = 0; i < inputs.length; i++) {
                if (!inputs[i].value) {
                    inputs[i].value = event.key;
                    if (i === inputs.length - 1) {
                        setTimeout(validatePin, 300); // Validate PIN after the last digit
                    }
                    break;
                }
            }
        }
    }
}

function addPinDigit(digit) {
    const inputs = document.querySelectorAll('.pin-digit');
    for (let i = 0; i < inputs.length; i++) {
        if (!inputs[i].value) {
            inputs[i].value = digit;
            if (i === inputs.length - 1) {
                setTimeout(validatePin, 300);
            }
            break;
        }
    }
}

function clearPin() {
    const inputs = document.querySelectorAll('.pin-digit');
    for (let i = inputs.length - 1; i >= 0; i--) {
        if (inputs[i].value) {
            inputs[i].value = '';
            break;
        }
    }
}

function validatePin() {
    const inputs = document.querySelectorAll('.pin-digit');
    const enteredPin = Array.from(inputs).map(i => i.value).join('');
    
    // Prevent empty PIN validation
    if (!enteredPin || enteredPin.length < AppState.pinLength) {
        return;
    }
    
    try {
        if (!AppState.pinCode) {
            // First time PIN creation
            if (enteredPin.length < 4) {
                showNotification('❌', 'Le code PIN doit contenir au moins 4 chiffres', 'error');
                return;
            }
            
            AppState.pinCode = enteredPin;
            localStorage.setItem('pinCode', AppState.pinCode);
            document.getElementById('pinMessage').style.color = 'var(--accent-revenue)';
            document.getElementById('pinMessage').textContent = '✅ Code PIN créé avec succès !';
            
            setTimeout(() => {
                showNotification('✅', 'Code PIN enregistré avec succès', 'success');
                unlockApp();
            }, 1000);
        } else if (enteredPin === AppState.pinCode) {
            // Successful login
            AppState.failedAttempts = 0;
            document.getElementById('pinMessage').style.color = 'var(--accent-revenue)';
            document.getElementById('pinMessage').textContent = '✅ Code correct !';
            
            setTimeout(() => {
                unlockApp();
                showNotification('✅', 'Bienvenue !', 'success');
            }, 500);
        } else {
            // Failed attempt
            AppState.failedAttempts++;
            inputs.forEach(i => i.value = '');
            
            if (AppState.failedAttempts >= AppState.maxFailedAttempts) {
                document.getElementById('pinMessage').style.color = 'var(--accent-expense)';
                document.getElementById('pinMessage').textContent = `❌ Trop de tentatives. Verrouillé pour 5 minutes.`;
                
                // Lock for 5 minutes
                let lockMinutes = 5 * 60 * 1000;
                let remainingTime = lockMinutes;
                const lockInterval = setInterval(() => {
                    remainingTime -= 1000;
                    const minutes = Math.floor(remainingTime / 60000);
                    const seconds = Math.floor((remainingTime % 60000) / 1000);
                    document.getElementById('pinMessage').textContent = 
                        `🔒 Verrouillé. Dévérouillage dans ${minutes}:${seconds.toString().padStart(2, '0')}`;
                    
                    if (remainingTime <= 0) {
                        clearInterval(lockInterval);
                        AppState.failedAttempts = 0;
                        document.getElementById('pinMessage').textContent = 'Entrez votre code PIN';
                    }
                }, 1000);
                
                showNotification('🔒', 'Application verrouillée pour sécurité', 'error');
                return;
            }
            
            document.getElementById('pinMessage').style.color = 'var(--accent-expense)';
            document.getElementById('pinMessage').textContent = `❌ Code incorrect (${AppState.failedAttempts}/${AppState.maxFailedAttempts})`;
            
            setTimeout(() => {
                document.getElementById('pinMessage').style.color = 'var(--text-secondary)';
                document.getElementById('pinMessage').textContent = 'Entrez votre code PIN';
            }, 2000);
        }
    } catch (error) {
        console.error('PIN validation error:', error);
        showNotification('❌', 'Erreur lors de la validation du PIN', 'error');
    }
}

function skipPin() {
    if (!AppState.pinCode) {
        unlockApp();
        showNotification('ℹ️', 'Vous pourrez créer un code PIN plus tard dans les paramètres', 'info');
    } else {
        showNotification('🔒', 'Vous devez entrer le code PIN pour continuer', 'error');
    }
}

function lockApp() {
    AppState.isLocked = true;
    const pinOverlay = document.getElementById('pinOverlay');
    if (pinOverlay) {
        pinOverlay.classList.add('active');
    }
    
    const inputs = document.querySelectorAll('.pin-digit');
    inputs.forEach(i => i.value = '');
    
    if (!AppState.pinCode) {
        document.getElementById('pinMessage').style.color = 'var(--text-secondary)';
        document.getElementById('pinMessage').textContent = 'Créez votre code PIN';
    } else {
        document.getElementById('pinMessage').style.color = 'var(--text-secondary)';
        document.getElementById('pinMessage').textContent = 'Entrez votre code PIN';
    }
}

function unlockApp() {
    AppState.isLocked = false;
    const pinOverlay = document.getElementById('pinOverlay');
    if (pinOverlay) {
        pinOverlay.classList.remove('active');
    }
    
    const inputs = document.querySelectorAll('.pin-digit');
    inputs.forEach(i => i.value = '');
    resetInactivityTimer();
}

function togglePrivateMode() {
    AppState.isPrivateMode = !AppState.isPrivateMode;
    const btn = document.getElementById('privateModeBtn');
    if (btn) {
        btn.innerHTML = AppState.isPrivateMode ? '<span>🙈</span>' : '<span>👁️</span>';
    }
    
    const elementsToBlur = document.querySelectorAll(
        '.pin-amount, .transaction-amount, .goal-progress-fill, .budget-status, .expense-amount-display, .recurring-amount, .stat-value'
    );
    
    elementsToBlur.forEach(el => {
        if (AppState.isPrivateMode) {
            el.style.filter = 'blur(8px)';
        } else {
            el.style.filter = 'none';
        }
    });
    
    showNotification(
        AppState.isPrivateMode ? '🙈' : '👁️', 
        `Mode privé ${AppState.isPrivateMode ? 'activé' : 'désactivé'}`,
        'info'
    );
}

 function resetInactivityTimer() {
     clearTimeout(inactivityTimer);
     if (AppState.pinCode && !AppState.isLocked && AppState.lockTimeout > 0) {
         inactivityTimer = setTimeout(() => {
             lockApp();
             showNotification('🔒', 'Application verrouillée pour sécurité');
         }, AppState.lockTimeout);
     }
 }

 document.addEventListener('mousemove', resetInactivityTimer);
 document.addEventListener('keypress', resetInactivityTimer);
 document.addEventListener('click', resetInactivityTimer);
 document.addEventListener('touchstart', resetInactivityTimer);

 // Theme Management
 const themeToggle = document.getElementById('themeToggle');
 const themeIcon = document.getElementById('themeIcon');
 const currentTheme = localStorage.getItem('theme') || 'light';

 document.documentElement.setAttribute('data-theme', currentTheme);
 themeIcon.textContent = currentTheme === 'dark' ? '☀️' : '🌙';

 themeToggle.addEventListener('click', () => {
     const theme = document.documentElement.getAttribute('data-theme');
     const newTheme = theme === 'light' ? 'dark' : 'light';
     
     document.documentElement.setAttribute('data-theme', newTheme);
     localStorage.setItem('theme', newTheme);
     themeIcon.textContent = newTheme === 'dark' ? '☀️' : '🌙';
 });

 // Animation functions
 function animateValue(id, start, end, duration) {
     const element = document.getElementById(id);
     if (!element) return;
     
     const range = end - start;
     const increment = range / (duration / 16);
     let current = start;
     
     const timer = setInterval(() => {
         current += increment;
         if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
             current = end;
             clearInterval(timer);
         }
         element.textContent = formatCurrency(current);
     }, 16);
 }

 // Dashboard update
 function updateDashboard() {
     const totalRevenue = AppState.transactions
         .filter(t => t.type === 'revenue')
         .reduce((sum, t) => sum + t.amount, 0);

     const totalExpense = AppState.transactions
         .filter(t => t.type === 'expense')
         .reduce((sum, t) => sum + t.amount, 0);

     const balance = totalRevenue - totalExpense;

     animateValue('totalRevenue', 0, totalRevenue, 800);
     animateValue('totalExpense', 0, totalExpense, 800);
     animateValue('balance', 0, balance, 800);

     // Update balance color based on value
     const balanceElement = document.getElementById('balance');
     if (balanceElement) {
         balanceElement.className = 'pin-amount balance';
         if (balance >= 0) {
             balanceElement.classList.add('revenue');
         } else {
             balanceElement.classList.add('expense');
         }
     }
 }

 // Chart functions
// Optimized chart rendering
function updateCategoryChart() {
    const canvas = document.getElementById('pieChart');
    if (!canvas) return;

    try {
        const expenses = AppState.transactions.filter(t => t.type === 'expense');
        const categoryTotals = {};

        expenses.forEach(t => {
            categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
        });

        const ctx = canvas.getContext('2d');
        const width = canvas.width = canvas.offsetWidth * 2;
        const height = canvas.height = canvas.offsetHeight * 2;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 2.5;

        ctx.clearRect(0, 0, width, height);

        if (Object.keys(categoryTotals).length === 0) {
            ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary');
            ctx.font = 'bold 32px system-ui';
            ctx.textAlign = 'center';
            ctx.fillText('Aucune dépense', centerX, centerY);
            return;
        }

        const colors = ['#e60023', '#ff6b6b', '#ff9800', '#ffc107', '#4caf50', '#2196f3', '#9c27b0', '#e91e63'];
        const total = Object.values(categoryTotals).reduce((a, b) => a + b, 0);
        let currentAngle = -Math.PI / 2;

        Object.entries(categoryTotals).forEach(([category, amount], index) => {
            const sliceAngle = (amount / total) * 2 * Math.PI;

            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            ctx.closePath();
            ctx.fillStyle = colors[index % colors.length];
            ctx.fill();

            const midAngle = currentAngle + sliceAngle / 2;
            const labelX = centerX + Math.cos(midAngle) * (radius * 0.7);
            const labelY = centerY + Math.sin(midAngle) * (radius * 0.7);

            const percentage = ((amount / total) * 100).toFixed(0);
            if (percentage > 5) {
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 28px system-ui';
                ctx.textAlign = 'center';
                ctx.fillText(percentage + '%', labelX, labelY);
            }

            currentAngle += sliceAngle;
        });
    } catch (error) {
        console.error('Chart rendering error:', error);
        const container = canvas.parentElement;
        if (container) {
            container.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-secondary);">Erreur lors du rendu du graphique</div>';
        }
    }
}

 function updateTimeChart() {
     const days = parseInt(document.getElementById('timeFilter').value);
     const canvas = document.getElementById('lineChart');
     if (!canvas) return;

     const ctx = canvas.getContext('2d');
     const width = canvas.width = canvas.offsetWidth * 2;
     const height = canvas.height = 400;

     ctx.clearRect(0, 0, width, height);

     if (AppState.transactions.length === 0) {
         ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary');
         ctx.font = 'bold 32px system-ui';
         ctx.textAlign = 'center';
         ctx.fillText('Aucune donnée', width / 2, height / 2);
         return;
     }

     const now = new Date();
     const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

     const filteredTransactions = AppState.transactions.filter(t => {
         const transactionDate = new Date(t.date);
         return transactionDate >= startDate;
     });

     if (filteredTransactions.length === 0) {
         ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary');
         ctx.font = 'bold 32px system-ui';
         ctx.textAlign = 'center';
         ctx.fillText('Aucune donnée', width / 2, height / 2);
         return;
     }

     const periods = Math.min(days <= 7 ? 7 : days <= 30 ? 10 : 12, days);
     const periodLength = days / periods;
     const periodData = [];

     for (let i = 0; i < periods; i++) {
         const periodStart = new Date(startDate.getTime() + i * periodLength * 24 * 60 * 60 * 1000);
         const periodEnd = new Date(startDate.getTime() + (i + 1) * periodLength * 24 * 60 * 60 * 1000);

         const periodTransactions = filteredTransactions.filter(t => {
             const tDate = new Date(t.date);
             return tDate >= periodStart && tDate < periodEnd;
         });

         const revenue = periodTransactions
             .filter(t => t.type === 'revenue')
             .reduce((sum, t) => sum + t.amount, 0);

         const expense = periodTransactions
             .filter(t => t.type === 'expense')
             .reduce((sum, t) => sum + t.amount, 0);

         let label;
         if (days <= 7) {
             label = periodStart.toLocaleDateString('fr-FR', { weekday: 'short' });
         } else if (days <= 30) {
             label = periodStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
         } else {
             label = periodStart.toLocaleDateString('fr-FR', { month: 'short' });
         }

         periodData.push({ label, revenue, expense });
     }

     const padding = 80;
     const chartWidth = width - padding * 2;
     const chartHeight = height - padding * 2;
     const maxValue = Math.max(...periodData.map(p => Math.max(p.revenue, p.expense)));
     const stepX = chartWidth / (periods - 1);

     // Animation variables
     let animationProgress = 0;
     const animationDuration = 1000; // 1 second
     let animationStartTime = null;

     function drawChart(progress) {
         ctx.clearRect(0, 0, width, height);

         // Draw axes
         ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--border-color');
         ctx.lineWidth = 2;
         ctx.beginPath();
         ctx.moveTo(padding, padding);
         ctx.lineTo(padding, height - padding);
         ctx.lineTo(width - padding, height - padding);
         ctx.stroke();

         // Draw grid
         ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--border-color');
         ctx.lineWidth = 1;
         ctx.globalAlpha = 0.3;
         for (let i = 0; i <= 5; i++) {
             const y = padding + (chartHeight / 5) * i;
             ctx.beginPath();
             ctx.moveTo(padding, y);
             ctx.lineTo(width - padding, y);
             ctx.stroke();
         }
         ctx.globalAlpha = 1;

         // Calculate how many points to draw based on progress
         const pointsToDraw = Math.ceil(progress * periods);

         // Draw revenue line with animation
         ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent-revenue');
         ctx.lineWidth = 4;
         ctx.beginPath();
         for (let i = 0; i < pointsToDraw && i < periods; i++) {
             const x = padding + i * stepX;
             const y = height - padding - (periodData[i].revenue / maxValue) * chartHeight;
             if (i === 0) ctx.moveTo(x, y);
             else ctx.lineTo(x, y);
         }
         ctx.stroke();

         // Draw expense line with animation
         ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent-expense');
         ctx.lineWidth = 4;
         ctx.beginPath();
         for (let i = 0; i < pointsToDraw && i < periods; i++) {
             const x = padding + i * stepX;
             const y = height - padding - (periodData[i].expense / maxValue) * chartHeight;
             if (i === 0) ctx.moveTo(x, y);
             else ctx.lineTo(x, y);
         }
         ctx.stroke();

         // Draw points and labels (only for drawn points)
         for (let i = 0; i < pointsToDraw && i < periods; i++) {
             const x = padding + i * stepX;

             const yRev = height - padding - (periodData[i].revenue / maxValue) * chartHeight;
             ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent-revenue');
             ctx.beginPath();
             ctx.arc(x, yRev, 8, 0, 2 * Math.PI);
             ctx.fill();

             const yExp = height - padding - (periodData[i].expense / maxValue) * chartHeight;
             ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent-expense');
             ctx.beginPath();
             ctx.arc(x, yExp, 8, 0, 2 * Math.PI);
             ctx.fill();

             ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary');
             ctx.font = 'bold 20px system-ui';
             ctx.textAlign = 'center';
             ctx.fillText(periodData[i].label, x, height - padding + 30);
         }

         // Draw legend (only when animation is complete)
         if (progress >= 1) {
             ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent-revenue');
             ctx.fillRect(padding, padding - 40, 30, 10);
             ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-primary');
             ctx.font = 'bold 22px system-ui';
             ctx.textAlign = 'left';
             ctx.fillText('Revenus', padding + 40, padding - 30);

             ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent-expense');
             ctx.fillRect(padding + 200, padding - 40, 30, 10);
             ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-primary');
             ctx.fillText('Dépenses', padding + 240, padding - 30);
         }
     }

     function animate(currentTime) {
         if (!animationStartTime) {
             animationStartTime = currentTime;
         }

         const elapsed = currentTime - animationStartTime;
         animationProgress = Math.min(elapsed / animationDuration, 1);

         // Use easing function for smoother animation
         const easedProgress = 1 - Math.pow(1 - animationProgress, 3);

         drawChart(easedProgress);

         if (animationProgress < 1) {
             requestAnimationFrame(animate);
         }
     }

     // Start animation
     requestAnimationFrame(animate);
 }

 document.getElementById('timeFilter').addEventListener('change', updateTimeChart);

// Optimized transactions rendering with loading states
function renderTransactions() {
    const container = document.getElementById('transactionsContainer');
    if (!container) return;
    
    if (AppState.transactions.length === 0) {
        showEmptyState(
            container, 
            'Aucune transaction pour le moment', 
            '💰', 
            'Ajouter une transaction', 
            'document.getElementById(\'description\').focus()'
        );
        return;
    }

    // Show loading state for better UX
    showLoading(container, 'Chargement des transactions...');

    // Use requestAnimationFrame for smooth rendering
    requestAnimationFrame(() => {
        const transactionsToShow = AppState.transactions
            .slice()
            .reverse()
            .slice(0, 5);

        const transactionsHTML = transactionsToShow
            .map((t, index) => {
                const actualIndex = AppState.transactions.length - 1 - index;
                return `
                    <div class="masonry-item">
                        <div class="transaction-card" onclick="openEditModal(${actualIndex})" role="button" tabindex="0">
                            <div class="transaction-left">
                                <div class="transaction-desc">${escapeHtml(t.description)}</div>
                                <span class="transaction-category">${escapeHtml(t.category)}</span>
                                <div class="transaction-date">${DateUtils.formatDate(t.date, 'short')}</div>
                            </div>
                            <div class="transaction-right">
                                <div class="transaction-amount ${t.type}">
                                    ${formatCurrency(t.amount)}
                                </div>
                                <button class="transaction-delete"
                                        onclick="event.stopPropagation(); deleteTransaction(${actualIndex})"
                                        aria-label="Supprimer la transaction"
                                        title="Supprimer">🗑️</button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

        const viewAllButton = AppState.transactions.length > 5 ? `
            <div class="masonry-item">
                <div class="form-card" onclick="openAllTransactionsModal()" style="cursor: pointer; text-align: center; padding: 20px;" role="button" tabindex="0">
                    <div style="font-size: 1.2em; font-weight: 700; color: var(--text-primary); margin-bottom: 8px;">
                        📋 Voir toutes les transactions
                    </div>
                    <div style="font-size: 0.9em; color: var(--text-secondary);">
                        ${AppState.transactions.length} transactions au total
                    </div>
                </div>
            </div>
        ` : '';

        container.innerHTML = transactionsHTML + viewAllButton;
    });
}

// Enhanced transaction deletion with confirmation
function deleteTransaction(index) {
    if (index < 0 || index >= AppState.transactions.length) {
        showNotification('❌', 'Transaction introuvable', 'error');
        return;
    }

    const transaction = AppState.transactions[index];
    const confirmMessage = `Supprimer la transaction "${transaction.description}" de ${formatCurrency(transaction.amount)} ?`;
    
    if (confirm(confirmMessage)) {
        try {
            AppState.transactions.splice(index, 1);
            saveTransactions();
            throttledUpdate(); // Use throttled update for performance
            showNotification('✅', 'Transaction supprimée avec succès', 'success');
        } catch (error) {
            console.error('Failed to delete transaction:', error);
            showNotification('❌', 'Erreur lors de la suppression', 'error');
        }
    }
}

// HTML escaping for security
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Enhanced transactions summary with AppState and carousel
function updateTransactionsSummary() {
    try {
        const revenues = AppState.transactions.filter(t => t.type === 'revenue');
        const expenses = AppState.transactions.filter(t => t.type === 'expense');
        const total = AppState.transactions.length;

        const summaryElements = {
            revenues: document.getElementById('summaryRevenues'),
            expenses: document.getElementById('summaryExpenses'),
            total: document.getElementById('summaryTotal')
        };

        if (summaryElements.revenues) summaryElements.revenues.textContent = revenues.length;
        if (summaryElements.expenses) summaryElements.expenses.textContent = expenses.length;
        if (summaryElements.total) summaryElements.total.textContent = total;

        // Initialize carousel if not already done
        initializeTransactionsSummaryCarousel();
    } catch (error) {
        console.error('Failed to update transactions summary:', error);
    }
}

// Transactions summary carousel
let transactionsSummaryInterval;
let currentTransactionsSummaryIndex = 0;

function initializeTransactionsSummaryCarousel() {
    const wrapper = document.getElementById('transactionsSummaryWrapper');
    const navigation = document.getElementById('transactionsSummaryNavigation');

    if (!wrapper || !navigation) return;

    // Clear existing navigation
    navigation.innerHTML = '';

    // Create navigation dots
    const slides = wrapper.querySelectorAll('.transaction-summary-slide');
    slides.forEach((_, index) => {
        const dot = document.createElement('div');
        dot.className = `transaction-summary-dot ${index === 0 ? 'active' : ''}`;
        dot.onclick = () => goToTransactionsSummarySlide(index);
        navigation.appendChild(dot);
    });

    // Start carousel if there are multiple slides
    if (slides.length > 1) {
        if (transactionsSummaryInterval) clearInterval(transactionsSummaryInterval);
        transactionsSummaryInterval = setInterval(() => {
            currentTransactionsSummaryIndex = (currentTransactionsSummaryIndex + 1) % slides.length;
            updateTransactionsSummaryPosition();
        }, 5000);
    }
}

function goToTransactionsSummarySlide(index) {
    currentTransactionsSummaryIndex = index;
    updateTransactionsSummaryPosition();

    if (transactionsSummaryInterval) clearInterval(transactionsSummaryInterval);
    const slides = document.querySelectorAll('.transaction-summary-slide');
    if (slides.length > 1) {
        transactionsSummaryInterval = setInterval(() => {
            currentTransactionsSummaryIndex = (currentTransactionsSummaryIndex + 1) % slides.length;
            updateTransactionsSummaryPosition();
        }, 5000);
    }
}

function updateTransactionsSummaryPosition() {
    const wrapper = document.getElementById('transactionsSummaryWrapper');
    const dots = document.querySelectorAll('.transaction-summary-dot');

    if (wrapper) {
        const offset = currentTransactionsSummaryIndex * 100;
        wrapper.style.transform = `translateX(-${offset}%)`;
    }

    dots.forEach((dot, index) => {
        if (index === currentTransactionsSummaryIndex) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
}

// Stats summary carousel
let statsSummaryInterval;
let currentStatsSummaryIndex = 0;

function initializeStatsSummaryCarousel() {
    const wrapper = document.getElementById('statsSummaryWrapper');
    const navigation = document.getElementById('statsSummaryNavigation');

    if (!wrapper || !navigation) return;

    // Clear existing navigation
    navigation.innerHTML = '';

    // Create navigation dots
    const slides = wrapper.querySelectorAll('.stats-summary-slide');
    slides.forEach((_, index) => {
        const dot = document.createElement('div');
        dot.className = `stats-summary-dot ${index === 0 ? 'active' : ''}`;
        dot.onclick = (event) => {
            event.stopPropagation();
            goToStatsSummarySlide(index);
        };
        navigation.appendChild(dot);
    });

    // Start carousel if there are multiple slides
    if (slides.length > 1) {
        if (statsSummaryInterval) clearInterval(statsSummaryInterval);
        statsSummaryInterval = setInterval(() => {
            currentStatsSummaryIndex = (currentStatsSummaryIndex + 1) % slides.length;
            updateStatsSummaryPosition();
        }, 5000);
    }
}

function goToStatsSummarySlide(index) {
    currentStatsSummaryIndex = index;
    updateStatsSummaryPosition();

    if (statsSummaryInterval) clearInterval(statsSummaryInterval);
    const slides = document.querySelectorAll('.stats-summary-slide');
    if (slides.length > 1) {
        statsSummaryInterval = setInterval(() => {
            currentStatsSummaryIndex = (currentStatsSummaryIndex + 1) % slides.length;
            updateStatsSummaryPosition();
        }, 5000);
    }
}

function updateStatsSummaryPosition() {
    const wrapper = document.getElementById('statsSummaryWrapper');
    const dots = document.querySelectorAll('.stats-summary-dot');

    if (wrapper) {
        const offset = currentStatsSummaryIndex * 100;
        wrapper.style.transform = `translateX(-${offset}%)`;
    }

    dots.forEach((dot, index) => {
        if (index === currentStatsSummaryIndex) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
}

 // Financial tips
 function updateFinancialTips() {
     const totalRevenue = AppState.transactions
         .filter(t => t.type === 'revenue')
         .reduce((sum, t) => sum + t.amount, 0);
     
     const totalExpense = AppState.transactions
         .filter(t => t.type === 'expense')
         .reduce((sum, t) => sum + t.amount, 0);

     const balance = totalRevenue - totalExpense;
     const savingsRate = totalRevenue > 0 ? ((balance / totalRevenue) * 100).toFixed(1) : 0;

     const tips = [];

     if (savingsRate < 10) {
         tips.push({
             icon: '⚠️',
             title: 'Taux d\'épargne faible',
             description: `Votre taux d'épargne est de ${savingsRate}%. Essayez de viser au moins 20% de vos revenus.`
         });
     } else if (savingsRate >= 10 && savingsRate < 20) {
         tips.push({
             icon: '👍',
             title: 'Bon début d\'épargne',
             description: `Vous épargnez ${savingsRate}% de vos revenus. Continuez et essayez d'augmenter progressivement.`
         });
     } else {
         tips.push({
             icon: '🌟',
             title: 'Excellent taux d\'épargne',
             description: `Bravo! Vous épargnez ${savingsRate}% de vos revenus. Vous êtes sur la bonne voie!`
         });
     }

     const expenses = AppState.transactions.filter(t => t.type === 'expense');
     if (expenses.length > 0) {
         const categoryTotals = {};
         expenses.forEach(t => {
             categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
         });
         
         const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
         if (topCategory) {
             const percentage = ((topCategory[1] / totalExpense) * 100).toFixed(1);
             tips.push({
                 icon: '📊',
                 title: 'Catégorie principale',
                 description: `${topCategory[0]} représente ${percentage}% de vos dépenses. Analysez si vous pouvez optimiser cette catégorie.`
             });
         }
     }

     tips.push({
         icon: '🎯',
         title: 'Règle 50/30/20',
         description: '50% pour les besoins essentiels, 30% pour les envies, 20% pour l\'épargne et les dettes.'
     });

     tips.push({
         icon: '🦺',
         title: 'Fonds d\'urgence',
         description: 'Constituez un fonds d\'urgence équivalent à 3-6 mois de dépenses pour faire face aux imprévus.'
     });

     if (balance < 0) {
         tips.unshift({
             icon: '🚨',
             title: 'Attention: Solde négatif',
             description: 'Vos dépenses dépassent vos revenus. Identifiez les dépenses non essentielles à réduire.'
         });
     }

     const tipsContainer = document.getElementById('tipsContainer');
     const tipsNavigation = document.getElementById('tipsNavigation');
     
     let tipsHTML = '<div class="tips-wrapper" id="tipsWrapper">';
     tips.forEach(tip => {
         tipsHTML += `
             <div class="tip-card">
                 <div class="tip-icon">${tip.icon}</div>
                 <div class="tip-title">${tip.title}</div>
                 <div class="tip-description">${tip.description}</div>
             </div>
         `;
     });
     tipsHTML += '</div>';

     tipsContainer.innerHTML = tipsHTML;

     let dotsHTML = '';
     tips.forEach((_, index) => {
         dotsHTML += `<div class="tip-dot ${index === 0 ? 'active' : ''}" onclick="goToTip(${index})"></div>`;
     });
     tipsNavigation.innerHTML = dotsHTML;

     AppState.currentTipIndex = 0;
     if (tipInterval) clearInterval(tipInterval);
     
     if (tips.length > 1) {
         tipInterval = setInterval(() => {
             AppState.currentTipIndex = (AppState.currentTipIndex + 1) % tips.length;
             updateTipPosition();
         }, 5000);
     }
 }

 function goToTip(index) {
     AppState.currentTipIndex = index;
     updateTipPosition();
     
     if (tipInterval) clearInterval(tipInterval);
     const tips = document.querySelectorAll('.tip-card');
     if (tips.length > 1) {
         tipInterval = setInterval(() => {
             AppState.currentTipIndex = (AppState.currentTipIndex + 1) % tips.length;
             updateTipPosition();
         }, 5000);
     }
 }

 function updateTipPosition() {
     const wrapper = document.getElementById('tipsWrapper');
     const dots = document.querySelectorAll('.tip-dot');

     if (wrapper) {
         const offset = AppState.currentTipIndex * 100;
         wrapper.style.transform = `translateX(-${offset}%)`;
     }

     dots.forEach((dot, index) => {
         if (index === AppState.currentTipIndex) {
             dot.classList.add('active');
         } else {
             dot.classList.remove('active');
         }
     });
 }

 function goToTransactionSlide(index) {
     currentTransactionSlide = index;
     updateTransactionSlidePosition();

     if (transactionInterval) clearInterval(transactionInterval);
     const totalSlides = Math.ceil(AppState.transactions.length / 3);
     if (totalSlides > 1) {
         transactionInterval = setInterval(() => {
             currentTransactionSlide = (currentTransactionSlide + 1) % totalSlides;
             updateTransactionSlidePosition();
         }, 5000);
     }
 }


 // Goals functions
 function updateGoals() {
     const container = document.getElementById('goalsContainer');
     
     if (AppState.goals.length === 0) {
         container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🎯</div><p>Aucun objectif</p></div>';
         return;
     }

     const totalRevenue = AppState.transactions
         .filter(t => t.type === 'revenue')
         .reduce((sum, t) => sum + t.amount, 0);
     
     const totalExpense = AppState.transactions
         .filter(t => t.type === 'expense')
         .reduce((sum, t) => sum + t.amount, 0);
     
     const currentSavings = totalRevenue - totalExpense;

     let goalsHTML = '';
     AppState.goals.forEach((goal, index) => {
         const progress = Math.min((currentSavings / goal.target) * 100, 100);
         const remaining = Math.max(goal.target - currentSavings, 0);
         
         goalsHTML += `
             <div class="goal-item">
                 <div class="goal-header">
                     <div class="goal-name">${goal.name}</div>
                     <button class="goal-delete" onclick="deleteGoal(${index})">🗑️</button>
                 </div>
                 <div class="goal-amount">
                     <span>${formatCurrency(currentSavings)} / ${formatCurrency(goal.target)}</span>
                     <span>Reste: ${formatCurrency(remaining)}</span>
                 </div>
                 <div class="goal-progress-bar">
                     <div class="goal-progress-fill" style="width: ${progress}%">
                         ${progress >= 10 ? progress.toFixed(0) + '%' : ''}
                     </div>
                 </div>
             </div>
         `;
     });

     container.innerHTML = goalsHTML;
 }

 function deleteGoal(index) {
     if (confirm('Supprimer cet objectif ?')) {
         AppState.goals.splice(index, 1);
         saveGoals();
         updateGoals();
     }
 }

 function openGoalModal() {
     document.getElementById('goalModal').classList.add('active');
 }

 function closeGoalModal() {
     document.getElementById('goalModal').classList.remove('active');
     document.getElementById('goalForm').reset();
 }

 document.getElementById('goalModal').addEventListener('click', (e) => {
     if (e.target.id === 'goalModal') {
         closeGoalModal();
     }
 });

 document.getElementById('goalForm').addEventListener('submit', (e) => {
     e.preventDefault();
     
     const name = document.getElementById('goalName').value.trim();
     const target = parseFloat(document.getElementById('goalAmount').value);

     if (!name || !target || target <= 0) {
         alert('Veuillez remplir tous les champs correctement');
         return;
     }

     const goal = {
         id: Date.now(),
         name,
         target,
         achieved: false,
         createdAt: new Date().toISOString()
     };

     AppState.goals.push(goal);
     saveGoals();
     closeGoalModal();
     updateGoals();
     showNotification('🎯', `Objectif "${name}" créé avec succès !`);
 });

 // Budgets functions
 function updateBudgets() {
     const container = document.getElementById('budgetsContainer');
     
     if (AppState.budgets.length === 0) {
         container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">💰</div><p>Aucun budget</p></div>';
         return;
     }
 
     const now = new Date();
     const currentMonth = now.getMonth();
     const currentYear = now.getFullYear();

     const monthlyExpenses = AppState.transactions.filter(t => {
         const tDate = new Date(t.date);
         return t.type === 'expense' && 
                tDate.getMonth() === currentMonth && 
                tDate.getFullYear() === currentYear;
     });

     let budgetsHTML = '';
     AppState.budgets.forEach((budget, index) => {
         const categoryExpenses = monthlyExpenses.filter(t => t.category === budget.category);
         const spent = categoryExpenses.reduce((sum, t) => sum + t.amount, 0);
         const remaining = budget.amount - spent;
         const percentage = Math.min((spent / budget.amount) * 100, 100);
         
         let statusClass = 'budget-remaining';
         let statusText = `Reste: ${formatCurrency(remaining)}`;
         
         if (spent > budget.amount) {
             statusClass = 'budget-warning';
             statusText = `Dépassé de ${formatCurrency(Math.abs(remaining))}`;
         } else if (percentage >= 80) {
             statusClass = 'budget-warning';
             statusText = `Reste: ${formatCurrency(remaining)}`;
         }

         budgetsHTML += `
             <div class="budget-item">
                 <div class="budget-header">
                     <div class="budget-category">${budget.category}</div>
                     <button class="goal-delete" onclick="deleteBudget(${index})">🗑️</button>
                 </div>
                 <div class="budget-status">
                     <span class="budget-spent">${formatCurrency(spent)} dépensé</span>
                     <span class="${statusClass}">${statusText}</span>
                 </div>
                 <div class="goal-progress-bar">
                     <div class="goal-progress-fill" style="width: ${percentage}%; background: ${spent > budget.amount ? 'linear-gradient(90deg, var(--accent-expense), #bd081c)' : percentage >= 80 ? 'linear-gradient(90deg, #ff9800, #f57c00)' : 'linear-gradient(90deg, var(--accent-revenue), #10b981)'}">
                         ${percentage >= 10 ? percentage.toFixed(0) + '%' : ''}
                     </div>
                 </div>
                 <div style="text-align: center; margin-top: 8px; font-size: 0.85em; color: var(--text-secondary);">
                     Budget: ${formatCurrency(budget.amount)}
                 </div>
             </div>
         `;
     });

     container.innerHTML = budgetsHTML;
 }

 function deleteBudget(index) {
     if (confirm('Supprimer ce budget ?')) {
         AppState.budgets.splice(index, 1);
         saveBudgets();
         updateBudgets();
     }
 }

 function openBudgetModal() {
     document.getElementById('budgetModal').classList.add('active');
 }

 function closeBudgetModal() {
     document.getElementById('budgetModal').classList.remove('active');
     document.getElementById('budgetForm').reset();
 }

 document.getElementById('budgetModal').addEventListener('click', (e) => {
     if (e.target.id === 'budgetModal') {
         closeBudgetModal();
     }
 });

 document.getElementById('budgetForm').addEventListener('submit', (e) => {
     e.preventDefault();
     
     const category = document.getElementById('budgetCategory').value;
     const amount = parseFloat(document.getElementById('budgetAmount').value);

     if (!category || !amount || amount <= 0) {
         alert('Veuillez remplir tous les champs correctement');
         return;
     }

     const existingBudget = AppState.budgets.find(b => b.category === category);
     if (existingBudget) {
         alert('Un budget existe déjà pour cette catégorie. Supprimez-le d\'abord.');
         return;
     }

     const budget = {
         id: Date.now(),
         category,
         amount,
         createdAt: new Date().toISOString()
     };

     AppState.budgets.push(budget);
     saveBudgets();
     closeBudgetModal();
     updateBudgets();
 });

 // Recurring transactions
 function updateRecurring() {
     const container = document.getElementById('recurringContainer');
     
     if (AppState.recurringTransactions.length === 0) {
         container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🔄</div><p>Aucune transaction récurrente</p></div>';
         return;
     }

     let recurringHTML = '';
     AppState.recurringTransactions.forEach((recurring, index) => {
         const frequencyText = {
             'weekly': 'Hebdomadaire',
             'monthly': 'Mensuel',
             'yearly': 'Annuel'
         }[recurring.frequency];

         recurringHTML += `
             <div class="recurring-item">
                 <div class="recurring-info">
                     <div class="recurring-desc">${recurring.description}</div>
                     <div class="recurring-details">
                         ${recurring.category} • ${frequencyText} • ${recurring.type === 'revenue' ? 'Revenu' : 'Dépense'}
                     </div>
                 </div>
                 <div class="recurring-actions">
                     <div class="recurring-amount ${recurring.type}">
                         ${recurring.type === 'revenue' ? '+' : '-'}${formatCurrency(recurring.amount)}
                     </div>
                     <button class="goal-delete" onclick="deleteRecurring(${index})">🗑️</button>
                 </div>
             </div>
         `;
     });

     container.innerHTML = recurringHTML;
 }

 function deleteRecurring(index) {
     if (confirm('Supprimer cette transaction récurrente ?')) {
         AppState.recurringTransactions.splice(index, 1);
         saveRecurring();
         updateRecurring();
     }
 }

 function openRecurringModal() {
     document.getElementById('recurringModal').classList.add('active');
 }

 function closeRecurringModal() {
     document.getElementById('recurringModal').classList.remove('active');
     document.getElementById('recurringForm').reset();
 }

 document.getElementById('recurringModal').addEventListener('click', (e) => {
     if (e.target.id === 'recurringModal') {
         closeRecurringModal();
     }
 });

 document.getElementById('recurringForm').addEventListener('submit', (e) => {
     e.preventDefault();
     
     const description = document.getElementById('recurringDescription').value.trim();
     const amount = parseFloat(document.getElementById('recurringAmount').value);
     const category = document.getElementById('recurringCategory').value;
     const type = document.getElementById('recurringType').value;
     const frequency = document.getElementById('recurringFrequency').value;

     if (!description || !amount || amount <= 0 || !category) {
         alert('Veuillez remplir tous les champs correctement');
         return;
     }

     const recurring = {
         id: Date.now(),
         description,
         amount,
         category,
         type,
         frequency,
         createdAt: new Date().toISOString()
     };

     AppState.recurringTransactions.push(recurring);
     saveRecurring();
     closeRecurringModal();
     updateRecurring();
 });

 // ==================== DEBTS & LOANS ====================
 function updateDebts() {
     const container = document.getElementById('debtsContainer');
     
     if (AppState.debts.length === 0) {
         container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">💳</div><p>Aucun prêt/en dette</p></div>';
         return;
     }

     const now = new Date();
     let debtsHTML = '';
     
     // Separate debts by type
     const owedToMe = AppState.debts.filter(d => d.type === 'owed_to_me');
     const iOwe = AppState.debts.filter(d => d.type === 'i_owe');
     
     const totalOwedToMe = owedToMe.reduce((sum, d) => sum + d.amount, 0);
     const totalIOwe = iOwe.reduce((sum, d) => sum + d.amount, 0);

     debtsHTML += `
         <div class="stat-grid" style="margin-bottom: 20px;">
             <div class="stat-box">
                 <div class="stat-label">On me doit</div>
                 <div class="stat-value" style="color: var(--accent-revenue);">${formatCurrency(totalOwedToMe)}</div>
             </div>
             <div class="stat-box">
                 <div class="stat-label">Je dois</div>
                 <div class="stat-value" style="color: var(--accent-expense);">${formatCurrency(totalIOwe)}</div>
             </div>
         </div>
     `;

     AppState.debts.forEach((debt, index) => {
         const dueDate = new Date(debt.dueDate);
         const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
         const isOverdue = daysUntilDue < 0;
         
         let statusClass = 'budget-remaining';
         let statusText = `${daysUntilDue > 0 ? daysUntilDue + ' jours' : 'En retard'}`;
         
         if (isOverdue) {
             statusClass = 'budget-warning';
             statusText = 'En retard';
         } else if (daysUntilDue <= 7) {
             statusClass = 'budget-warning';
         }

         const typeLabel = debt.type === 'owed_to_me' ? 'On me doit' : 'Je dois';
         const typeColor = debt.type === 'owed_to_me' ? 'var(--accent-revenue)' : 'var(--accent-expense)';

         debtsHTML += `
             <div class="budget-item">
                 <div class="budget-header">
                     <div class="budget-category" style="color: ${typeColor};">${debt.description}</div>
                     <button class="goal-delete" onclick="deleteDebt(${index})">🗑️</button>
                 </div>
                 <div class="budget-status">
                     <span style="color: ${typeColor}; font-weight: 600;">${typeLabel}</span>
                     <span class="${statusClass}">${statusText}</span>
                 </div>
                 <div style="display: flex; justify-content: space-between; margin-top: 8px; font-size: 0.85em; color: var(--text-secondary);">
                     <span>👤 ${debt.person}</span>
                     <span>📅 ${dueDate.toLocaleDateString('fr-FR')}</span>
                 </div>
                 <div class="goal-progress-bar">
                     <div class="goal-progress-fill" style="width: 100%; background: ${typeColor};">
                         ${formatCurrency(debt.amount)}
                     </div>
                 </div>
             </div>
         `;
     });

     container.innerHTML = debtsHTML;
 }

 function deleteDebt(index) {
     if (confirm('Supprimer cette dette ?')) {
         AppState.debts.splice(index, 1);
         saveDebts();
         updateDebts();
     }
 }

 function openDebtModal() {
     document.getElementById('debtModal').classList.add('active');
     // Set default date to 30 days from now
     const defaultDate = new Date();
     defaultDate.setDate(defaultDate.getDate() + 30);
     document.getElementById('debtDueDate').value = defaultDate.toISOString().split('T')[0];
 }

 function closeDebtModal() {
     document.getElementById('debtModal').classList.remove('active');
     document.getElementById('debtForm').reset();
 }

 document.getElementById('debtModal').addEventListener('click', (e) => {
     if (e.target.id === 'debtModal') {
         closeDebtModal();
     }
 });

 document.getElementById('debtForm').addEventListener('submit', (e) => {
     e.preventDefault();
     
     const description = document.getElementById('debtDescription').value.trim();
     const amount = parseFloat(document.getElementById('debtAmount').value);
     const type = document.getElementById('debtType').value;
     const person = document.getElementById('debtPerson').value.trim();
     const dueDate = document.getElementById('debtDueDate').value;
     const interest = parseFloat(document.getElementById('debtInterest').value) || 0;

     if (!description || !amount || amount <= 0 || !person || !dueDate) {
         alert('Veuillez remplir tous les champs correctement');
         return;
     }

     const debt = {
         id: Date.now(),
         description,
         amount,
         type,
         person,
         dueDate,
         interest,
         createdAt: new Date().toISOString()
     };

     AppState.debts.push(debt);
     saveDebts();
     closeDebtModal();
     updateDebts();
     showNotification('💳', `Dette/emprunt "${description}" ajouté avec succès`);
 });

 // ==================== INVESTMENTS ====================
 function updateInvestments() {
     const container = document.getElementById('investmentsContainer');
     
     if (AppState.investments.length === 0) {
         container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📈</div><p>Aucun investissement</p></div>';
         return;
     }

     let totalInvested = 0;
     let totalCurrentValue = 0;

     AppState.investments.forEach(inv => {
         totalInvested += inv.amount;
         totalCurrentValue += inv.currentValue;
     });

     const totalGain = totalCurrentValue - totalInvested;
     const gainPercentage = totalInvested > 0 ? ((totalGain / totalInvested) * 100) : 0;
     const gainColor = totalGain >= 0 ? 'var(--accent-revenue)' : 'var(--accent-expense)';

     let investmentsHTML = `
         <div class="stat-grid" style="margin-bottom: 15px;">
             <div class="stat-box">
                 <div class="stat-label">Total Investi</div>
                 <div class="stat-value">${formatCurrency(totalInvested)}</div>
             </div>
             <div class="stat-box">
                 <div class="stat-label">Valeur Actuelle</div>
                 <div class="stat-value" style="color: ${gainColor};">${formatCurrency(totalCurrentValue)}</div>
             </div>
         </div>
         <div style="text-align: center; padding: 10px; background: var(--bg-secondary); border-radius: 10px; margin-bottom: 15px;">
             <span style="color: ${gainColor}; font-weight: 700; font-size: 1.2em;">
                 ${totalGain >= 0 ? '+' : ''}${formatCurrency(totalGain)} (${gainPercentage >= 0 ? '+' : ''}${gainPercentage.toFixed(2)}%)
             </span>
         </div>
     `;

     // Group by type
     const typeGroups = {};
     AppState.investments.forEach(inv => {
         if (!typeGroups[inv.type]) {
             typeGroups[inv.type] = { invested: 0, current: 0 };
         }
         typeGroups[inv.type].invested += inv.amount;
         typeGroups[inv.type].current += inv.currentValue;
     });

     Object.entries(typeGroups).forEach(([type, data]) => {
         const typeGain = data.current - data.invested;
         const typeGainPercent = data.invested > 0 ? ((typeGain / data.invested) * 100) : 0;
         const typeName = {
             'stock': 'Actions/ETF',
             'crypto': 'Crypto',
             'savings': 'Épargne',
             'real_estate': 'Immobilier',
             'other': 'Autre'
         }[type] || type;

         investmentsHTML += `
             <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: var(--bg-secondary); border-radius: 8px; margin-bottom: 8px;">
                 <span>${typeName}</span>
                 <span style="color: ${typeGain >= 0 ? 'var(--accent-revenue)' : 'var(--accent-expense)'}; font-weight: 600;">
                     ${typeGain >= 0 ? '+' : ''}${typeGainPercent.toFixed(1)}%
                 </span>
             </div>
         `;
     });

     container.innerHTML = investmentsHTML;
 }

 function deleteInvestment(index) {
     if (confirm('Supprimer cet investissement ?')) {
         AppState.investments.splice(index, 1);
         saveInvestments();
         updateInvestments();
     }
 }

 function openInvestmentModal() {
     document.getElementById('investmentModal').classList.add('active');
     document.getElementById('investmentDate').value = new Date().toISOString().split('T')[0];
 }

 function closeInvestmentModal() {
     document.getElementById('investmentModal').classList.remove('active');
     document.getElementById('investmentForm').reset();
 }

 document.getElementById('investmentModal').addEventListener('click', (e) => {
     if (e.target.id === 'investmentModal') {
         closeInvestmentModal();
     }
 });

 document.getElementById('investmentForm').addEventListener('submit', (e) => {
     e.preventDefault();
     
     const name = document.getElementById('investmentName').value.trim();
     const type = document.getElementById('investmentType').value;
     const amount = parseFloat(document.getElementById('investmentAmount').value);
     const currentValue = parseFloat(document.getElementById('investmentCurrentValue').value);
     const date = document.getElementById('investmentDate').value;

     if (!name || !amount || amount <= 0 || !currentValue || !date) {
         alert('Veuillez remplir tous les champs correctement');
         return;
     }

     const investment = {
         id: Date.now(),
         name,
         type,
         amount,
         currentValue,
         date,
         createdAt: new Date().toISOString()
     };

     AppState.investments.push(investment);
     saveInvestments();
     closeInvestmentModal();
     updateInvestments();
     showNotification('📈', `Investissement "${name}" ajouté avec succès`);
 });

 function updateInvestmentSummary() {
     if (AppState.investments.length === 0) {
         showNotification('ℹ️', 'Aucun investissement à afficher', 'info');
         return;
     }

     const totalInvested = AppState.investments.reduce((sum, inv) => sum + inv.amount, 0);
     const totalCurrent = AppState.investments.reduce((sum, inv) => sum + inv.currentValue, 0);
     const totalGain = totalCurrent - totalInvested;
     const gainPercent = ((totalGain / totalInvested) * 100).toFixed(2);

     // Group by type
     const typeGroups = {};
     AppState.investments.forEach(inv => {
         if (!typeGroups[inv.type]) {
             typeGroups[inv.type] = [];
         }
         typeGroups[inv.type].push(inv);
     });

     let modalHTML = `
         <div class="stat-grid" style="margin-bottom: 25px;">
             <div class="stat-box">
                 <div class="stat-label">Total Investi</div>
                 <div class="stat-value">${formatCurrency(totalInvested)}</div>
             </div>
             <div class="stat-box">
                 <div class="stat-label">Valeur Actuelle</div>
                 <div class="stat-value">${formatCurrency(totalCurrent)}</div>
             </div>
             <div class="stat-box">
                 <div class="stat-label">Plus/Moins Value</div>
                 <div class="stat-value" style="color: ${totalGain >= 0 ? 'var(--accent-revenue)' : 'var(--accent-expense)'};">
                     ${totalGain >= 0 ? '+' : ''}${formatCurrency(totalGain)}
                 </div>
             </div>
             <div class="stat-box">
                 <div class="stat-label">Performance</div>
                 <div class="stat-value" style="color: ${gainPercent >= 0 ? 'var(--accent-revenue)' : 'var(--accent-expense)'};">
                     ${gainPercent >= 0 ? '+' : ''}${gainPercent}%
                 </div>
             </div>
         </div>
     `;

     Object.entries(typeGroups).forEach(([type, investments]) => {
         const typeInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
         const typeCurrent = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
         const typeGain = typeCurrent - typeInvested;
         const typePercent = ((typeGain / typeInvested) * 100).toFixed(2);
         const typeName = {
             'stock': '📊 Actions / ETF',
             'crypto': '🪙 Cryptomonnaie',
             'savings': '🏦 Livret / Épargne',
             'real_estate': '🏠 Immobilier',
             'other': '📦 Autre'
         }[type] || type;

         modalHTML += `
             <h3 style="margin: 20px 0 15px 0; color: var(--text-primary);">${typeName}</h3>
         `;

         investments.forEach(inv => {
             const invGain = inv.currentValue - inv.amount;
             const invPercent = ((invGain / inv.amount) * 100).toFixed(2);
             
             modalHTML += `
                 <div class="budget-item" style="margin-bottom: 10px;">
                     <div class="budget-header">
                         <div class="budget-category">${inv.name}</div>
                         <div style="color: ${invGain >= 0 ? 'var(--accent-revenue)' : 'var(--accent-expense)'}; font-weight: 600;">
                             ${invGain >= 0 ? '+' : ''}${invPercent}%
                         </div>
                     </div>
                     <div style="display: flex; justify-content: space-between; font-size: 0.9em; color: var(--text-secondary);">
                         <span>Investi: ${formatCurrency(inv.amount)}</span>
                         <span>Actuel: ${formatCurrency(inv.currentValue)}</span>
                     </div>
                 </div>
             `;
         });
     });

     document.getElementById('investmentSummaryContent').innerHTML = modalHTML;
     document.getElementById('investmentSummaryModal').classList.add('active');
 }

 function closeInvestmentSummaryModal() {
     document.getElementById('investmentSummaryModal').classList.remove('active');
 }

 document.getElementById('investmentSummaryModal').addEventListener('click', (e) => {
     if (e.target.id === 'investmentSummaryModal') {
         closeInvestmentSummaryModal();
     }
 });

 // ==================== SUBSCRIPTIONS ====================
 function updateSubscriptions() {
     const container = document.getElementById('subscriptionsContainer');
     
     if (AppState.subscriptions.length === 0) {
         container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🔔</div><p>Aucun abonnement détecté</p></div>';
         return;
     }

     const now = new Date();
     let totalMonthly = 0;
     let totalYearly = 0;
     let upcomingCount = 0;

     const categoryIcons = {
         'streaming': '🎬',
         'cloud': '☁️',
         'software': '💻',
         'gaming': '🎮',
         'fitness': '💪',
         'news': '📰',
         'other': '📦'
     };

     let subscriptionsHTML = '';
     AppState.subscriptions.forEach((sub, index) => {
         const nextDate = new Date(sub.nextDate);
         const daysUntil = Math.ceil((nextDate - now) / (1000 * 60 * 60 * 24));
         
         // Calculate monthly/yearly cost
         let monthlyCost = sub.amount;
         let yearlyCost = sub.amount * 12;
         
         if (sub.frequency === 'weekly') {
             monthlyCost = sub.amount * 4.33;
             yearlyCost = sub.amount * 52;
         } else if (sub.frequency === 'quarterly') {
             monthlyCost = sub.amount / 3;
             yearlyCost = sub.amount * 4;
         } else if (sub.frequency === 'yearly') {
             monthlyCost = sub.amount / 12;
             yearlyCost = sub.amount;
         }

         totalMonthly += monthlyCost;
         totalYearly += yearlyCost;

         if (daysUntil <= 7 && daysUntil >= 0) {
             upcomingCount++;
         }

         let statusClass = '';
         let statusText = `Dans ${daysUntil} jours`;
         
         if (daysUntil < 0) {
             statusClass = 'budget-warning';
             statusText = 'En retard';
         } else if (daysUntil === 0) {
             statusClass = 'budget-warning';
             statusText = 'Aujourd\'hui';
         } else if (daysUntil <= 3) {
             statusClass = 'budget-warning';
         }

         const icon = categoryIcons[sub.category] || '📦';

         subscriptionsHTML += `
             <div class="budget-item">
                 <div class="budget-header">
                     <div class="budget-category">${icon} ${sub.name}</div>
                     <button class="goal-delete" onclick="deleteSubscription(${index})">🗑️</button>
                 </div>
                 <div class="budget-status">
                     <span>${formatCurrency(sub.amount)}</span>
                     <span class="${statusClass}">${statusText}</span>
                 </div>
                 <div style="display: flex; justify-content: space-between; margin-top: 8px; font-size: 0.85em; color: var(--text-secondary);">
                     <span>📅 ${nextDate.toLocaleDateString('fr-FR')}</span>
                     <span>📊 ${monthlyCost.toFixed(0)}/mois</span>
                 </div>
             </div>
         `;
     });

     container.innerHTML = `
         <div class="stat-grid" style="margin-bottom: 15px;">
             <div class="stat-box">
                 <div class="stat-label">Mensuel</div>
                 <div class="stat-value">${formatCurrency(totalMonthly)}</div>
             </div>
             <div class="stat-box">
                 <div class="stat-label">Annuel</div>
                 <div class="stat-value">${formatCurrency(totalYearly)}</div>
             </div>
         </div>
         ${upcomingCount > 0 ? `<div style="text-align: center; padding: 10px; background: #ff980020; border-radius: 8px; margin-bottom: 15px; color: #ff9800; font-weight: 600;">⚠️ ${upcomingCount} prélèvement(s) imminent(s)</div>` : ''}
         ${subscriptionsHTML}
     `;

     // Check for upcoming subscriptions and notify
     checkSubscriptionAlerts();
 }

 function deleteSubscription(index) {
     if (confirm('Supprimer cet abonnement ?')) {
         AppState.subscriptions.splice(index, 1);
         saveSubscriptions();
         updateSubscriptions();
     }
 }

 function openSubscriptionModal() {
     document.getElementById('subscriptionModal').classList.add('active');
     
     // Set default date to next month
     const defaultDate = new Date();
     defaultDate.setMonth(defaultDate.getMonth() + 1);
     document.getElementById('subscriptionNextDate').value = defaultDate.toISOString().split('T')[0];
 }

 function closeSubscriptionModal() {
     document.getElementById('subscriptionModal').classList.remove('active');
     document.getElementById('subscriptionForm').reset();
 }

 document.getElementById('subscriptionModal').addEventListener('click', (e) => {
     if (e.target.id === 'subscriptionModal') {
         closeSubscriptionModal();
     }
 });

 document.getElementById('subscriptionForm').addEventListener('submit', (e) => {
     e.preventDefault();
     
     const name = document.getElementById('subscriptionName').value.trim();
     const amount = parseFloat(document.getElementById('subscriptionAmount').value);
     const frequency = document.getElementById('subscriptionFrequency').value;
     const nextDate = document.getElementById('subscriptionNextDate').value;
     const category = document.getElementById('subscriptionCategory').value;
     const notify = document.getElementById('subscriptionNotify').checked;

     if (!name || !amount || amount <= 0 || !nextDate) {
         alert('Veuillez remplir tous les champs correctement');
         return;
     }

     const subscription = {
         id: Date.now(),
         name,
         amount,
         frequency,
         nextDate,
         category,
         notify,
         createdAt: new Date().toISOString()
     };

     AppState.subscriptions.push(subscription);
     saveSubscriptions();
     closeSubscriptionModal();
     updateSubscriptions();
     showNotification('🔔', `Abonnement "${name}" ajouté avec succès`);
 });

 function checkSubscriptionAlerts() {
     const now = new Date();
     AppState.subscriptions.forEach(sub => {
         const nextDate = new Date(sub.nextDate);
         const daysUntil = Math.ceil((nextDate - now) / (1000 * 60 * 60 * 24));
         
         if (daysUntil === 1 && sub.notify) {
             showNotification('🔔', `Rappel: ${sub.name} sera prélevé demain (${formatCurrency(sub.amount)})`, 'warning');
         } else if (daysUntil === 3 && sub.notify) {
             showNotification('🔔', `Rappel: ${sub.name} dans 3 jours (${formatCurrency(sub.amount)})`, 'info');
         }
     });
 }

 // ==================== CURRENCY CONVERTER ====================
 const exchangeRates = {
     'XOF': { 'EUR': 0.001524, 'USD': 0.00165, 'GBP': 0.00130, 'XOF': 1 },
     'EUR': { 'XOF': 655.96, 'USD': 1.08, 'GBP': 0.86, 'EUR': 1 },
     'USD': { 'XOF': 607.00, 'EUR': 0.93, 'GBP': 0.80, 'USD': 1 },
     'GBP': { 'XOF': 760.00, 'EUR': 1.16, 'USD': 1.25, 'GBP': 1 }
 };

 function convertCurrency() {
     const amount = parseFloat(document.getElementById('convertAmount').value) || 0;
     const fromCurrency = document.getElementById('fromCurrency').value;
     const toCurrency = document.getElementById('toCurrency').value;
     
     if (amount <= 0) {
         showNotification('❌', 'Veuillez entrer un montant valide', 'error');
         return;
     }

     const rate = exchangeRates[fromCurrency][toCurrency];
     const result = amount * rate;
     const inverseRate = exchangeRates[toCurrency][fromCurrency];

     document.getElementById('conversionResult').textContent = `${result.toFixed(2)} ${toCurrency}`;
     document.getElementById('conversionRate').textContent = `1 ${fromCurrency} = ${rate.toFixed(4)} ${toCurrency}`;
     
     showNotification('💱', `${formatCurrency(amount)} ${fromCurrency} = ${result.toFixed(2)} ${toCurrency}`, 'success');
 }

 // Update conversion when currency changes
 document.getElementById('fromCurrency').addEventListener('change', convertCurrency);
 document.getElementById('toCurrency').addEventListener('change', convertCurrency);
 document.getElementById('convertAmount').addEventListener('input', convertCurrency);

 // Advanced stats
 function updateAdvancedStats() {
     if (AppState.transactions.length === 0) {
         document.getElementById('avgPerDay').textContent = '0 FCFA';
         document.getElementById('avgPerMonth').textContent = '0 FCFA';
         return;
     }

     const expenses = AppState.transactions.filter(t => t.type === 'expense');
     const revenues = AppState.transactions.filter(t => t.type === 'revenue');
     const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);
     const totalRevenue = revenues.reduce((sum, t) => sum + t.amount, 0);

     const dates = expenses.map(t => new Date(t.date).toDateString());
     const uniqueDates = [...new Set(dates)];
     const daysWithExpenses = uniqueDates.length;

     const avgPerDay = daysWithExpenses > 0 ? totalExpense / daysWithExpenses : 0;
     document.getElementById('avgPerDay').textContent = formatCurrency(avgPerDay);

     const oldestDate = new Date(Math.min(...AppState.transactions.map(t => new Date(t.date))));
     const newestDate = new Date(Math.max(...AppState.transactions.map(t => new Date(t.date))));
     const monthsDiff = Math.max(1, (newestDate - oldestDate) / (1000 * 60 * 60 * 24 * 30));
     const avgPerMonth = totalExpense / monthsDiff;
     document.getElementById('avgPerMonth').textContent = formatCurrency(avgPerMonth);

     // Calculate additional stats for carousel
     const avgRevenuePerDay = daysWithExpenses > 0 ? totalRevenue / daysWithExpenses : 0;
     const avgRevenuePerMonth = totalRevenue / monthsDiff;
     const totalTransactions = AppState.transactions.length;
     const avgTransactionAmount = totalTransactions > 0 ? (totalRevenue + totalExpense) / totalTransactions : 0;

     // Update stats summary carousel slides
     const statsSlide1 = document.querySelector('.stats-summary-slide:nth-child(1)');
     const statsSlide2 = document.querySelector('.stats-summary-slide:nth-child(2)');

     if (statsSlide1) {
         statsSlide1.innerHTML = `
             <div class="transaction-summary-box">
                 <div class="transaction-summary-label">Dépense/Jour</div>
                 <div class="transaction-summary-value expense-color">${formatCurrency(avgPerDay)}</div>
             </div>
             <div class="transaction-summary-box">
                 <div class="transaction-summary-label">Revenu/Jour</div>
                 <div class="transaction-summary-value revenue-color">${formatCurrency(avgRevenuePerDay)}</div>
             </div>
             <div class="transaction-summary-box">
                 <div class="transaction-summary-label">Total Transactions</div>
                 <div class="transaction-summary-value total-color">${totalTransactions}</div>
             </div>
         `;
     }

     if (statsSlide2) {
         statsSlide2.innerHTML = `
             <div class="transaction-summary-box">
                 <div class="transaction-summary-label">Dépense/Mois</div>
                 <div class="transaction-summary-value expense-color">${formatCurrency(avgPerMonth)}</div>
             </div>
             <div class="transaction-summary-box">
                 <div class="transaction-summary-label">Revenu/Mois</div>
                 <div class="transaction-summary-value revenue-color">${formatCurrency(avgRevenuePerMonth)}</div>
             </div>
             <div class="transaction-summary-box">
                 <div class="transaction-summary-label">Montant Moyen</div>
                 <div class="transaction-summary-value total-color">${formatCurrency(avgTransactionAmount)}</div>
             </div>
         `;
     }

     // Initialize carousel after DOM update
     setTimeout(() => {
         initializeStatsSummaryCarousel();
     }, 50);
 }

 // Filter functions
 function populateFilterCategories() {
     const filterCategory = document.getElementById('filterCategory');
     const categories = [...new Set(AppState.transactions.map(t => t.category))];
     
     let options = '<option value="all">Toutes les catégories</option>';
     categories.forEach(cat => {
         options += `<option value="${cat}">${cat}</option>`;
     });
     
     filterCategory.innerHTML = options;
 }

 function applyFilters() {
     const searchTerm = document.getElementById('searchInput').value.toLowerCase();
     const typeFilter = document.getElementById('filterType').value;
     const categoryFilter = document.getElementById('filterCategory').value;

     AppState.filteredTransactions = AppState.transactions.filter(t => {
         const matchSearch = t.description.toLowerCase().includes(searchTerm);
         const matchType = typeFilter === 'all' || t.type === typeFilter;
         const matchCategory = categoryFilter === 'all' || t.category === categoryFilter;
         
         return matchSearch && matchType && matchCategory;
     });

     renderFilteredTransactions();
 }

 function resetFilters() {
     document.getElementById('searchInput').value = '';
     document.getElementById('filterType').value = 'all';
     document.getElementById('filterCategory').value = 'all';
     AppState.filteredTransactions = [];
     renderTransactions();
 }

 function renderFilteredTransactions() {
     const container = document.getElementById('transactionsContainer');

     if (AppState.filteredTransactions.length === 0) {
         container.innerHTML = '<div class="masonry-item"><div class="form-card"><div class="empty-state"><div class="empty-state-icon">🔍</div><p>Aucun résultat</p></div></div></div>';
         return;
     }

     const transactionsHTML = AppState.filteredTransactions
         .slice()
         .reverse()
         .map(t => {
             const index = AppState.transactions.indexOf(t);
             return `
                 <div class="masonry-item">
                     <div class="transaction-card" onclick="openEditModal(${index})">
                         <div class="transaction-left">
                             <div class="transaction-desc">${t.description}</div>
                             <span class="transaction-category">${t.category}</span>
                         </div>
                         <div class="transaction-right">
                             <div class="transaction-amount ${t.type}">
                                 ${formatCurrency(t.amount)}
                             </div>
                             <button class="transaction-delete" onclick="event.stopPropagation(); deleteTransaction(${index})" aria-label="Supprimer">🗑️</button>
                         </div>
                     </div>
                 </div>
             `;
         }).join('');

     container.innerHTML = transactionsHTML;
 }

 document.getElementById('searchInput').addEventListener('input', debouncedSearch);

// Modal functions
function openSettingsModal() {
    try {
        document.getElementById('totalTransactions').textContent = AppState.transactions.length;
        document.getElementById('totalGoals').textContent = AppState.goals.length;
        document.getElementById('totalBudgets').textContent = AppState.budgets.length;
        document.getElementById('settingsModal').classList.add('active');
    } catch (error) {
        console.error('Failed to open settings modal:', error);
        showNotification('❌', 'Erreur lors de l\'ouverture des paramètres', 'error');
    }
}

 function closeSettingsModal() {
     document.getElementById('settingsModal').classList.remove('active');
 }

 document.getElementById('settingsModal').addEventListener('click', (e) => {
     if (e.target.id === 'settingsModal') {
         closeSettingsModal();
     }
 });

 //function qui permet de demander le code  actuel avant d'actualiser 
 function updatePinLength() {
     const newLength = parseInt(document.getElementById('pinLength').value);
     
     if (AppState.pinCode) {
         const enteredPin = prompt('⚠️ Entrez votre code PIN actuel pour modifier la longueur :');
         
         if (!enteredPin) {
             document.getElementById('pinLength').value = pinLength;
             return;
         }
         
         if (enteredPin !== pinCode) {
             alert('❌ Code PIN incorrect');
             document.getElementById('pinLength').value = pinLength;
             return;
         }
         
         if (confirm(`Changer la longueur du code PIN à ${newLength} chiffres ?\n\n⚠️ Cela réinitialisera votre code actuel.`)) {
             AppState.pinLength = newLength;
             localStorage.setItem('pinLength', AppState.pinLength);
             AppState.pinCode = null;
             localStorage.removeItem('pinCode');
             updatePinInputs();
             showNotification('✅', `Longueur du PIN modifiée à ${newLength} chiffres. Créez un nouveau code.`);
             closeSettingsModal();
             lockApp();
         } else {
             document.getElementById('pinLength').value = pinLength;
         }
     } else {
         AppState.pinLength = newLength;
         localStorage.setItem('pinLength', AppState.pinLength);
         updatePinInputs();
         showNotification('✅', `Longueur du PIN définie à ${newLength} chiffres`);
     }
 }

 


 function updateLockTimeout() {
     const newTimeout = parseInt(document.getElementById('lockTimeout').value);
     AppState.lockTimeout = newTimeout;
     localStorage.setItem('lockTimeout', AppState.lockTimeout);
     showNotification('✅', 'Durée de verrouillage modifiée');
     resetInactivityTimer();
 }

 function resetPinCode() {
     if (!AppState.pinCode) {
         showNotification('ℹ️', 'Aucun code PIN n\'est défini actuellement');
         return;
     }
     
     const enteredPin = prompt('🔒 Entrez votre code PIN actuel pour le réinitialiser :');
     
     if (!enteredPin) {
         showNotification('❌', 'Opération annulée');
         return;
     }
     
     if (enteredPin !== AppState.pinCode) {
         showNotification('❌', 'Code PIN incorrect');
         return;
     }
     
     if (confirm('⚠️ Êtes-vous sûr de vouloir réinitialiser votre code PIN ?\n\nVous devrez en créer un nouveau lors de votre prochaine connexion.')) {
         AppState.pinCode = null;
         localStorage.removeItem('pinCode');
         showNotification('✅', 'Code PIN réinitialisé avec succès');
         closeSettingsModal();
         lockApp();
     }
 }

 function clearAllData() {
    if (AppState.pinCode) {
        const enteredPin = prompt('⚠️ Entrez votre code PIN actuel pour continuer ');
        
        if (!enteredPin) {
            document.getElementById('pinLength').value = AppState.pinLength;
            return;
        }
        
        if (enteredPin !== AppState.pinCode) {
            alert('❌ Code PIN incorrect');
            document.getElementById('pinLength').value = AppState.pinLength;
            return;
        }
    }
     if (confirm('⚠️ ATTENTION : Cette action supprimera TOUTES vos données (transactions, objectifs, budgets). Cette action est irréversible. Êtes-vous sûr ?')) {
         if (confirm('Confirmez-vous vraiment vouloir supprimer toutes vos données ?')) {
             AppState.transactions = [];
             AppState.goals = [];
             AppState.budgets = [];
             AppState.recurringTransactions = [];
             localStorage.clear();
             
             localStorage.setItem('pinLength', AppState.pinLength);
             localStorage.setItem('lockTimeout', AppState.lockTimeout);
             
             showNotification('✅', 'Toutes les données ont été supprimées');
             closeSettingsModal();
             updateAll();
             
             setTimeout(() => {
                 location.reload();
             }, 1500);
         }
     }
 }

 function openCategoryModal() {
     const expenses = AppState.transactions.filter(t => t.type === 'expense');
     
     if (expenses.length === 0) {
         alert('Aucune dépense à analyser');
         return;
     }

     const categoryTotals = {};
     const categoryCount = {};

     expenses.forEach(t => {
         categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
         categoryCount[t.category] = (categoryCount[t.category] || 0) + 1;
     });

     const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
     const avgExpense = totalExpenses / expenses.length;
     const categoriesCount = Object.keys(categoryTotals).length;
     const mostExpensiveCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];

     let modalHTML = `
         <div class="stat-grid">
             <div class="stat-box">
                 <div class="stat-label">Total Dépenses</div>
                 <div class="stat-value" style="color: var(--accent-expense);">${formatCurrency(totalExpenses)}</div>
             </div>
             <div class="stat-box">
                 <div class="stat-label">Moyenne par Transaction</div>
                 <div class="stat-value">${formatCurrency(avgExpense)}</div>
             </div>
             <div class="stat-box">
                 <div class="stat-label">Nombre de Catégories</div>
                 <div class="stat-value">${categoriesCount}</div>
             </div>
             <div class="stat-box">
                 <div class="stat-label">Plus Grande Catégorie</div>
                 <div class="stat-value" style="font-size: 1em;">${mostExpensiveCategory[0]}</div>
             </div>
         </div>
         <h3 style="margin: 20px 0 15px 0; color: var(--text-primary);">Détails par Catégorie</h3>
     `;

     Object.entries(categoryTotals)
         .sort((a, b) => b[1] - a[1])
         .forEach(([category, amount]) => {
             const percentage = ((amount / totalExpenses) * 100).toFixed(1);
             const count = categoryCount[category];
             const avgForCategory = amount / count;

             modalHTML += `
                 <div class="category-detail-item">
                     <div class="category-detail-header">
                         <div class="category-detail-name">${category}</div>
                         <div class="category-detail-amount">${formatCurrency(amount)}</div>
                     </div>
                     <div class="progress-bar" style="margin: 10px 0;">
                         <div class="progress-fill" style="width: ${percentage}%"></div>
                     </div>
                     <div class="category-detail-stats">
                         <div class="category-detail-stat">
                             <div class="category-detail-stat-label">% du Total</div>
                             <div class="category-detail-stat-value">${percentage}%</div>
                         </div>
                         <div class="category-detail-stat">
                             <div class="category-detail-stat-label">Transactions</div>
                             <div class="category-detail-stat-value">${count}</div>
                         </div>
                         <div class="category-detail-stat">
                             <div class="category-detail-stat-label">Moyenne</div>
                             <div class="category-detail-stat-value">${formatCurrency(avgForCategory)}</div>
                         </div>
                     </div>
                 </div>
             `;
         });

     document.getElementById('categoryModalContent').innerHTML = modalHTML;
     document.getElementById('categoryModal').classList.add('active');
 }

 function closeCategoryModal() {
     document.getElementById('categoryModal').classList.remove('active');
 }

 document.getElementById('categoryModal').addEventListener('click', (e) => {
     if (e.target.id === 'categoryModal') {
         closeCategoryModal();
     }
 });

 function openAllTransactionsModal() {
     if (AppState.transactions.length === 0) {
         alert('Aucune transaction à afficher');
         return;
     }

     const sortedTransactions = [...AppState.transactions].sort((a, b) => new Date(b.date) - new Date(a.date));

     const revenues = AppState.transactions.filter(t => t.type === 'revenue');
     const expenses = AppState.transactions.filter(t => t.type === 'expense');
     const totalRevenue = revenues.reduce((sum, t) => sum + t.amount, 0);
     const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);

     let modalHTML = `
         <div class="stat-grid" style="margin-bottom: 20px;">
             <div class="stat-box">
                 <div class="stat-label">Total Revenus</div>
                 <div class="stat-value" style="color: var(--accent-revenue);">${formatCurrency(totalRevenue)}</div>
             </div>
             <div class="stat-box">
                 <div class="stat-label">Total Dépenses</div>
                 <div class="stat-value" style="color: var(--accent-expense);">${formatCurrency(totalExpense)}</div>
             </div>
             <div class="stat-box">
                 <div class="stat-label">Nombre Revenus</div>
                 <div class="stat-value">${revenues.length}</div>
             </div>
             <div class="stat-box">
                 <div class="stat-label">Nombre Dépenses</div>
                 <div class="stat-value">${expenses.length}</div>
             </div>
         </div>
         <h3 style="margin: 20px 0 15px 0; color: var(--text-primary);">Liste Complète des Transactions</h3>
         <div id="transactionsContainer" style="overflow: hidden; position: relative; height: 400px;">
             <div class="transactions-wrapper" id="transactionsWrapper" style="display: flex; transition: transform 0.6s ease-in-out; height: 100%;">
     `;

     // Group transactions into slides (3 transactions per slide)
     const transactionsPerSlide = 3;
     const totalSlides = Math.ceil(sortedTransactions.length / transactionsPerSlide);

     for (let slideIndex = 0; slideIndex < totalSlides; slideIndex++) {
         const startIndex = slideIndex * transactionsPerSlide;
         const endIndex = Math.min(startIndex + transactionsPerSlide, sortedTransactions.length);
         const slideTransactions = sortedTransactions.slice(startIndex, endIndex);

         modalHTML += `<div class="transaction-slide" style="min-width: 100%; flex: 0 0 100%; padding: 10px; box-sizing: border-box;">`;

         slideTransactions.forEach(transaction => {
             const date = new Date(transaction.date);
             const formattedDate = date.toLocaleDateString('fr-FR', {
                 day: '2-digit',
                 month: 'short',
                 year: 'numeric',
                 hour: '2-digit',
                 minute: '2-digit'
             });

             const isRevenue = transaction.type === 'revenue';
             const amountColor = isRevenue ? 'var(--accent-revenue)' : 'var(--accent-expense)';
             const amountPrefix = isRevenue ? '+' : '-';

             modalHTML += `
                 <div class="expense-list-item">
                     <div class="expense-info">
                         <div class="expense-desc">${transaction.description}</div>
                         <div class="expense-meta">
                             <div class="expense-date">
                                 <span>📅</span>
                                 <span>${formattedDate}</span>
                             </div>
                             <div class="expense-cat">
                                 <span>🏷️</span>
                                 <span>${transaction.category}</span>
                             </div>
                             <div class="expense-cat">
                                 <span>${isRevenue ? '💰' : '💳'}</span>
                                 <span>${isRevenue ? 'Revenu' : 'Dépense'}</span>
                             </div>
                         </div>
                     </div>
                     <div class="expense-amount-display" style="color: ${amountColor};">
                         ${amountPrefix}${formatCurrency(transaction.amount)}
                     </div>
                 </div>
             `;
         });

         modalHTML += '</div>';
     }

     modalHTML += `
             </div>
         </div>
         <div class="transactions-navigation" id="transactionsNavigation" style="display: flex; justify-content: center; gap: 8px; padding: 15px 0;">
     `;

     for (let i = 0; i < totalSlides; i++) {
         modalHTML += `<div class="transaction-dot ${i === 0 ? 'active' : ''}" onclick="goToTransactionSlide(${i})"></div>`;
     }

     modalHTML += '</div>';

     document.getElementById('allTransactionsModalContent').innerHTML = modalHTML;
     document.getElementById('allTransactionsModal').classList.add('active');

     // Initialize transaction carousel
     currentTransactionSlide = 0;
     if (totalSlides > 1) {
         startTransactionCarousel();
     }
 }

 function closeAllTransactionsModal() {
     document.getElementById('allTransactionsModal').classList.remove('active');
     // Clear carousel interval when closing modal
     if (transactionInterval) {
         clearInterval(transactionInterval);
         transactionInterval = null;
     }
 }

 document.getElementById('allTransactionsModal').addEventListener('click', (e) => {
     if (e.target.id === 'allTransactionsModal') {
         closeAllTransactionsModal();
     }
 });

 // Transaction carousel variables
 let transactionInterval;
 let currentTransactionSlide = 0;

function startTransactionCarousel() {
    const wrapper = document.getElementById('transactionsWrapper');
    const navigation = document.getElementById('transactionsNavigation');

    if (!wrapper || !navigation) return;

    // Clear existing interval
    if (transactionInterval) clearInterval(transactionInterval);

    // Clear existing navigation
    navigation.innerHTML = '';

    // Create navigation dots
    const slides = wrapper.querySelectorAll('.transaction-slide');
    slides.forEach((_, index) => {
        const dot = document.createElement('div');
        dot.className = `transaction-dot ${index === 0 ? 'active' : ''}`;
        dot.onclick = () => goToTransactionSlide(index);
        navigation.appendChild(dot);
    });

    // Start carousel if there are multiple slides
    if (slides.length > 1) {
        transactionInterval = setInterval(() => {
            currentTransactionSlide = (currentTransactionSlide + 1) % slides.length;
            updateTransactionSlidePosition();
        }, 5000);
    }
}



 function updateTransactionSlidePosition() {
     const wrapper = document.getElementById('transactionsWrapper');
     const dots = document.querySelectorAll('.transaction-dot');

     if (wrapper) {
         const offset = currentTransactionSlide * 100;
         wrapper.style.transform = `translateX(-${offset}%)`;
     }

     dots.forEach((dot, index) => {
         if (index === currentTransactionSlide) {
             dot.classList.add('active');
         } else {
             dot.classList.remove('active');
         }
     });
 }

 function openTimeAnalysisModal() {
     if (AppState.transactions.length === 0) {
         alert('Aucune transaction pour analyser');
         return;
     }

     const days = parseInt(document.getElementById('timeFilter').value);
     const now = new Date();
     const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
     
     const filteredTransactions = AppState.transactions.filter(t => {
         const transactionDate = new Date(t.date);
         return transactionDate >= startDate;
     });

     if (filteredTransactions.length === 0) {
         alert('Aucune transaction dans cette période');
         return;
     }

     const periods = Math.min(days <= 7 ? 7 : days <= 30 ? 10 : 12, days);
     const periodLength = days / periods;
     const periodData = [];

     for (let i = 0; i < periods; i++) {
         const periodStart = new Date(startDate.getTime() + i * periodLength * 24 * 60 * 60 * 1000);
         const periodEnd = new Date(startDate.getTime() + (i + 1) * periodLength * 24 * 60 * 60 * 1000);
         
         const periodTransactions = filteredTransactions.filter(t => {
             const tDate = new Date(t.date);
             return tDate >= periodStart && tDate < periodEnd;
         });

         const revenues = periodTransactions.filter(t => t.type === 'revenue');
         const expenses = periodTransactions.filter(t => t.type === 'expense');
         
         const totalRevenue = revenues.reduce((sum, t) => sum + t.amount, 0);
         const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);
         const balance = totalRevenue - totalExpense;

         let label;
         let fullLabel;
         if (days <= 7) {
             label = periodStart.toLocaleDateString('fr-FR', { weekday: 'short' });
             fullLabel = periodStart.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
         } else if (days <= 30) {
             label = periodStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
             fullLabel = periodStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
         } else {
             label = periodStart.toLocaleDateString('fr-FR', { month: 'short' });
             fullLabel = periodStart.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
         }

         const categoryBreakdown = {};
         expenses.forEach(t => {
             categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + t.amount;
         });

         periodData.push({
             label,
             fullLabel,
             revenue: totalRevenue,
             expense: totalExpense,
             balance,
             revenueCount: revenues.length,
             expenseCount: expenses.length,
             categories: categoryBreakdown
         });
     }

     const totalRevenue = periodData.reduce((sum, p) => sum + p.revenue, 0);
     const totalExpense = periodData.reduce((sum, p) => sum + p.expense, 0);
     const totalBalance = totalRevenue - totalExpense;
     const avgRevenuePerPeriod = totalRevenue / periods;
     const avgExpensePerPeriod = totalExpense / periods;

     const bestPeriod = periodData.reduce((best, current) => 
         current.balance > best.balance ? current : best
     );
     const worstPeriod = periodData.reduce((worst, current) => 
         current.balance < worst.balance ? current : worst
     );

     let modalHTML = `
         <div class="stat-grid" style="margin-bottom: 25px;">
             <div class="stat-box">
                 <div class="stat-label">Total Revenus</div>
                 <div class="stat-value" style="color: var(--accent-revenue);">${formatCurrency(totalRevenue)}</div>
             </div>
             <div class="stat-box">
                 <div class="stat-label">Total Dépenses</div>
                 <div class="stat-value" style="color: var(--accent-expense);">${formatCurrency(totalExpense)}</div>
             </div>
             <div class="stat-box">
                 <div class="stat-label">Balance Totale</div>
                 <div class="stat-value" style="color: ${totalBalance >= 0 ? 'var(--accent-revenue)' : 'var(--accent-expense)'};">${formatCurrency(totalBalance)}</div>
             </div>
             <div class="stat-box">
                 <div class="stat-label">Transactions</div>
                 <div class="stat-value">${filteredTransactions.length}</div>
             </div>
         </div>

         <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px;">
             <div style="background: linear-gradient(135deg, var(--accent-revenue), #059669); padding: 20px; border-radius: 12px; color: white;">
                 <div style="font-size: 1.5em; margin-bottom: 8px;">🏆</div>
                 <div style="font-weight: 700; font-size: 1.1em; margin-bottom: 8px;">Meilleure Période</div>
                 <div style="font-size: 0.9em; opacity: 0.9; margin-bottom: 5px;">${bestPeriod.fullLabel}</div>
                 <div style="font-size: 1.3em; font-weight: 800;">+${formatCurrency(bestPeriod.balance)}</div>
             </div>
             <div style="background: linear-gradient(135deg, var(--accent-expense), #bd081c); padding: 20px; border-radius: 12px; color: white;">
                 <div style="font-size: 1.5em; margin-bottom: 8px;">⚠️</div>
                 <div style="font-weight: 700; font-size: 1.1em; margin-bottom: 8px;">Période à Améliorer</div>
                 <div style="font-size: 0.9em; opacity: 0.9; margin-bottom: 5px;">${worstPeriod.fullLabel}</div>
                 <div style="font-size: 1.3em; font-weight: 800;">${formatCurrency(worstPeriod.balance)}</div>
             </div>
         </div>

         <h3 style="margin: 25px 0 15px 0; color: var(--text-primary); font-size: 1.2em;">📅 Détails par Période</h3>
     `;

     periodData.forEach((period) => {
         const topCategory = Object.entries(period.categories).sort((a, b) => b[1] - a[1])[0];
         const isPositive = period.balance >= 0;
         
         modalHTML += `
             <div class="category-detail-item" style="margin-bottom: 15px;">
                 <div class="category-detail-header">
                     <div>
                         <div class="category-detail-name" style="margin-bottom: 5px;">${period.fullLabel}</div>
                         <div style="font-size: 0.85em; color: var(--text-secondary);">
                             ${period.revenueCount + period.expenseCount} transactions
                         </div>
                     </div>
                     <div class="category-detail-amount" style="color: ${isPositive ? 'var(--accent-revenue)' : 'var(--accent-expense)'};">
                         ${isPositive ? '+' : ''}${formatCurrency(period.balance)}
                     </div>
                 </div>
                 
                 <div class="category-detail-stats" style="margin-top: 15px;">
                     <div class="category-detail-stat">
                         <div class="category-detail-stat-label">Revenus</div>
                         <div class="category-detail-stat-value" style="color: var(--accent-revenue);">
                             ${formatCurrency(period.revenue)}
                         </div>
                     </div>
                     <div class="category-detail-stat">
                         <div class="category-detail-stat-label">Dépenses</div>
                         <div class="category-detail-stat-value" style="color: var(--accent-expense);">
                             ${formatCurrency(period.expense)}
                         </div>
                     </div>
                     <div class="category-detail-stat">
                         <div class="category-detail-stat-label">Catégorie #1</div>
                         <div class="category-detail-stat-value">
                             ${topCategory ? topCategory[0] : 'N/A'}
                         </div>
                     </div>
                 </div>
             </div>
         `;
     });

     document.getElementById('timeAnalysisModalContent').innerHTML = modalHTML;
     document.getElementById('timeAnalysisModal').classList.add('active');
 }

 function closeTimeAnalysisModal() {
     document.getElementById('timeAnalysisModal').classList.remove('active');
 }

 document.getElementById('timeAnalysisModal').addEventListener('click', (e) => {
     if (e.target.id === 'timeAnalysisModal') {
         closeTimeAnalysisModal();
     }
 });

 function openExportModal() {
     document.getElementById('exportModal').classList.add('active');
 }

 function closeExportModal() {
     document.getElementById('exportModal').classList.remove('active');
 }

 document.getElementById('exportModal').addEventListener('click', (e) => {
     if (e.target.id === 'exportModal') {
         closeExportModal();
     }
 });

 function exportToJSON() {
     const dataStr = JSON.stringify(AppState.transactions, null, 2);
     const dataBlob = new Blob([dataStr], { type: 'application/json' });
     const url = URL.createObjectURL(dataBlob);
     const link = document.createElement('a');
     link.href = url;
     link.download = `finance-tracker-${new Date().toISOString().split('T')[0]}.json`;
     link.click();
     URL.revokeObjectURL(url);
     
     showNotification('✅', 'Données exportées avec succès en JSON !');
 }

function exportToCSV() {
    if (AppState.transactions.length === 0) {
        showNotification('❌', 'Aucune transaction à exporter', 'error');
        return;
    }

     let csv = 'Date,Description,Catégorie,Type,Montant (FCFA)\n';
     
     AppState.transactions.forEach(t => {
         const date = new Date(t.date).toLocaleDateString('fr-FR');
         const description = `"${t.description.replace(/"/g, '""')}"`;
         const category = t.category;
         const type = t.type === 'revenue' ? 'Revenu' : 'Dépense';
         const amount = t.amount;
         
         csv += `${date},${description},${category},${type},${amount}\n`;
     });

     const csvBlob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
     const url = URL.createObjectURL(csvBlob);
     const link = document.createElement('a');
     link.href = url;
     link.download = `finance-tracker-${new Date().toISOString().split('T')[0]}.csv`;
     link.click();
     URL.revokeObjectURL(url);
     
     showNotification('✅', 'Données exportées avec succès en CSV !');
 }

 function importData(event) {
     const file = event.target.files[0];
     if (!file) return;

     const reader = new FileReader();
     reader.onload = function(e) {
         try {
             const importedData = JSON.parse(e.target.result);
             
             if (!Array.isArray(importedData)) {
                 alert('❌ Format de fichier invalide');
                 return;
             }

             const validTransactions = importedData.filter(t => 
                 t.description && t.amount && t.category && t.type && t.date
             );

             if (validTransactions.length === 0) {
                 alert('❌ Aucune transaction valide trouvée dans le fichier');
                 return;
             }

             const confirmMsg = `Voulez-vous importer ${validTransactions.length} transaction(s) ?\n\n⚠️ Attention : Cela remplacera vos données actuelles !`;
             
             if (confirm(confirmMsg)) {
                 AppState.transactions = validTransactions;
                 saveTransactions();
                 updateAll();
                 closeExportModal();
                 showNotification('✅', `${validTransactions.length} transaction(s) importée(s) avec succès !`);
             }
         } catch (error) {
             alert('❌ Erreur lors de la lecture du fichier : ' + error.message);
         }
     };
     reader.readAsText(file);
     event.target.value = '';
 }

function openStatsModal() {
    if (AppState.transactions.length === 0) {
        showNotification('❌', 'Aucune transaction pour générer des statistiques', 'error');
        return;
    }

     const expenses = AppState.transactions.filter(t => t.type === 'expense');
     const revenues = AppState.transactions.filter(t => t.type === 'revenue');
     
     const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);
     const totalRevenue = revenues.reduce((sum, t) => sum + t.amount, 0);

     const dates = expenses.map(t => new Date(t.date).toDateString());
     const uniqueDates = [...new Set(dates)];
     const daysWithExpenses = uniqueDates.length;
     const avgPerDay = daysWithExpenses > 0 ? totalExpense / daysWithExpenses : 0;

     const oldestDate = new Date(Math.min(...AppState.transactions.map(t => new Date(t.date))));
     const newestDate = new Date(Math.max(...AppState.transactions.map(t => new Date(t.date))));
     const monthsDiff = Math.max(1, (newestDate - oldestDate) / (1000 * 60 * 60 * 24 * 30));
     const avgPerMonth = totalExpense / monthsDiff;
     const avgPerWeek = totalExpense / (monthsDiff * 4);

     const topExpenses = [...expenses].sort((a, b) => b.amount - a.amount).slice(0, 5);

     let modalHTML = `
         <div class="stat-grid" style="margin-bottom: 20px;">
             <div class="stat-box">
                 <div class="stat-label">Dépense/Jour</div>
                 <div class="stat-value" style="color: var(--accent-expense);">${formatCurrency(avgPerDay)}</div>
             </div>
             <div class="stat-box">
                 <div class="stat-label">Dépense/Semaine</div>
                 <div class="stat-value" style="color: var(--accent-expense);">${formatCurrency(avgPerWeek)}</div>
             </div>
             <div class="stat-box">
                 <div class="stat-label">Dépense/Mois</div>
                 <div class="stat-value" style="color: var(--accent-expense);">${formatCurrency(avgPerMonth)}</div>
             </div>
             <div class="stat-box">
                 <div class="stat-label">Jours avec dépenses</div>
                 <div class="stat-value">${daysWithExpenses}</div>
             </div>
         </div>

         <h3 style="margin: 20px 0 15px 0; color: var(--text-primary);">🔝 Top 5 des plus grosses dépenses</h3>
         <div style="margin-bottom: 25px;">
     `;

     topExpenses.forEach((expense, index) => {
         const date = new Date(expense.date).toLocaleDateString('fr-FR');
         modalHTML += `
             <div class="top-expense-item">
                 <div class="top-expense-rank">${index + 1}</div>
                 <div class="top-expense-info">
                     <div class="top-expense-desc">${expense.description}</div>
                     <div class="top-expense-cat">${expense.category} • ${date}</div>
                 </div>
                 <div class="top-expense-amount">${formatCurrency(expense.amount)}</div>
             </div>
         `;
     });

     modalHTML += '</div>';

     document.getElementById('statsModalContent').innerHTML = modalHTML;
     document.getElementById('statsModal').classList.add('active');
 }

 function closeStatsModal() {
     document.getElementById('statsModal').classList.remove('active');
 }

 document.getElementById('statsModal').addEventListener('click', (e) => {
     if (e.target.id === 'statsModal') {
         closeStatsModal();
     }
 });

 function openEditModal(index) {
     currentEditIndex = index;
     const transaction = AppState.transactions[index];

     document.getElementById('editDescription').value = transaction.description;
     document.getElementById('editAmount').value = transaction.amount;
     document.getElementById('editCategory').value = transaction.category;
     document.getElementById('editType').value = transaction.type;

     // Set initial color based on type
     const editAmountInput = document.getElementById('editAmount');
     editAmountInput.style.color = transaction.type === 'revenue' ? 'var(--accent-revenue)' : 'var(--accent-expense)';

     document.getElementById('editModal').classList.add('active');
 }

 function closeEditModal() {
     document.getElementById('editModal').classList.remove('active');
     currentEditIndex = null;
 }

 document.getElementById('editForm').addEventListener('submit', (e) => {
     e.preventDefault();
     
     if (currentEditIndex === null) return;

     const description = document.getElementById('editDescription').value.trim();
     const amount = parseFloat(document.getElementById('editAmount').value);
     const category = document.getElementById('editCategory').value;
     const type = document.getElementById('editType').value;

     if (!description || !amount || amount <= 0 || !category) {
         alert('Veuillez remplir tous les champs correctement');
         return;
     }

     AppState.transactions[currentEditIndex] = {
         ...AppState.transactions[currentEditIndex],
         description,
         amount,
         category,
         type,
         date: new Date().toISOString()
     };

     saveTransactions();
     closeEditModal();
     updateAll();
     showNotification('✅', 'Transaction modifiée avec succès');
 });

 document.getElementById('editModal').addEventListener('click', (e) => {
     if (e.target.id === 'editModal') {
         closeEditModal();
     }
 });

 // Form submission
 const form = document.getElementById('transactionForm');
 const buttons = document.querySelectorAll('.btn-group button');
 const amountInput = document.getElementById('amount');

 // Add click handlers for button color indication
 buttons.forEach(button => {
     button.addEventListener('click', (e) => {
         e.preventDefault();

         const description = document.getElementById('description').value.trim();
         const amount = parseFloat(document.getElementById('amount').value);
         const category = document.getElementById('category').value;
         const type = e.target.dataset.type;

         if (!description || !amount || amount <= 0 || !category) {
             alert('Veuillez remplir tous les champs correctement');
             return;
         }

         const transaction = {
             id: Date.now(),
             description,
             amount,
             category,
             type,
             date: new Date().toISOString()
         };

         AppState.transactions.push(transaction);
         saveTransactions();
         form.reset();
         // Keep amount input color after form reset to indicate last selected type
         amountInput.style.color = type === 'revenue' ? 'var(--accent-revenue)' : 'var(--accent-expense)';
         updateAll();

         showNotification(type === 'revenue' ? '💰' : '💳', `${type === 'revenue' ? 'Revenu' : 'Dépense'} ajouté : ${formatCurrency(amount)}`);

         if (type === 'expense') {
             checkBudgetAlerts(category, amount);
         }
     });

     // Add color indication on button hover/click
     button.addEventListener('mouseenter', () => {
         const type = button.dataset.type;
         amountInput.style.color = type === 'revenue' ? 'var(--accent-revenue)' : 'var(--accent-expense)';
     });

     button.addEventListener('mouseleave', () => {
         // Only reset color if no type was selected (no persistent color)
         if (!amountInput.style.color || amountInput.style.color === '') {
             amountInput.style.color = '';
         }
     });
 });

 function checkBudgetAlerts(category, amount) {
     const budget = AppState.budgets.find(b => b.category === category);
     if (!budget) return;

     const now = new Date();
     const monthExpenses = AppState.transactions.filter(t => {
         const tDate = new Date(t.date);
         return t.type === 'expense' && 
                t.category === category &&
                tDate.getMonth() === now.getMonth() && 
                tDate.getFullYear() === now.getFullYear();
     });

     const spent = monthExpenses.reduce((sum, t) => sum + t.amount, 0);
     const percentage = (spent / budget.amount) * 100;

     if (spent > budget.amount) {
         showNotification('⚠️', `Budget ${category} dépassé ! ${formatCurrency(spent)} / ${formatCurrency(budget.amount)}`);
     } else if (percentage >= 80) {
         showNotification('🟡', `Attention : ${percentage.toFixed(0)}% du budget ${category} utilisé`);
     }
 }

// Enhanced main update function with error handling and performance optimization
function updateAll() {
    if (AppState.isLoading) return; // Prevent concurrent updates
    
    AppState.isLoading = true;
    
    try {
        // Batch DOM updates for better performance
        const updates = [
            () => updateDashboard(),
            () => ChartRenderer.queueUpdate('categoryChart', updateCategoryChart),
            () => renderTransactions(),
            () => ChartRenderer.queueUpdate('timeChart', updateTimeChart),
            () => updateFinancialTips(),
            () => updateTransactionsSummary(),
            () => updateGoals(),
            () => updateBudgets(),
            () => updateRecurring(),
            () => updateDebts(),
            () => updateInvestments(),
            () => updateSubscriptions(),
            () => populateFilterCategories(),
            () => updateAdvancedStats()
        ];
        
        batchDOMUpdates(updates);
        
        // Process chart updates after DOM is updated
        setTimeout(() => {
            ChartRenderer.processQueue();
            AppState.isLoading = false;
        }, 100);
        
    } catch (error) {
        console.error('Update error:', error);
        showNotification('❌', 'Erreur lors de la mise à jour', 'error');
        AppState.isLoading = false;
    }
}

 // Initialize app
 initSecurity();
 updateAll();
 checkFirstVisit();

 // Intersection observer for lazy loading charts
 const observer = new IntersectionObserver((entries) => {
     entries.forEach(entry => {
         if (entry.isIntersecting) {
             if (entry.target.id === 'pieChart') updateCategoryChart();
             if (entry.target.id === 'lineChart') updateTimeChart();
         }
     });
 });

 const pieChart = document.getElementById('pieChart');
 const lineChart = document.getElementById('lineChart');
 if (pieChart) observer.observe(pieChart);
 if (lineChart) observer.observe(lineChart);

 // Welcome message for first-time users
 setTimeout(() => {
     if (transactions.length === 0) {
         showNotification('👋', 'Bienvenue ! Commencez par ajouter votre première transaction.');
     }
 }, 1000);

 // Keyboard shortcuts
 document.addEventListener('keydown', (e) => {
     if (e.ctrlKey || e.metaKey) {
         if (e.key === 'k') {
             e.preventDefault();
             document.getElementById('searchInput').focus();
         }
         if (e.key === 'e') {
             e.preventDefault();
             openExportModal();
         }
         if (e.key === 'n') {
             e.preventDefault();
             document.getElementById('description').focus();
         }
     }
 });

 // Service Worker for PWA (optional)
 if ('serviceWorker' in navigator) {
     navigator.serviceWorker.register('data:text/javascript;base64,c2VsZi5hZGRFdmVudExpc3RlbmVyKCdpbnN0YWxsJywgZnVuY3Rpb24oZXZlbnQpIHsgY29uc29sZS5sb2coJ1NlcnZpY2UgV29ya2VyIGluc3RhbGxlZCcpOyB9KTs=')
         .catch(err => console.log('SW registration failed'));
 }

 // Backup reminder (weekly)
 setInterval(() => {
     if (transactions.length > 0) {
         const lastSave = localStorage.getItem('lastBackupReminder');
         const now = Date.now();
         if (!lastSave || (now - parseInt(lastSave)) > 7 * 24 * 60 * 60 * 1000) {
             showNotification('💾', 'N\'oubliez pas de faire une sauvegarde de vos données !');
             localStorage.setItem('lastBackupReminder', now.toString());
         }
     }
 }, 24 * 60 * 60 * 1000);

 

console.log('%c🔒 Finance Tracker Pro - v2.0', 'color: #0095f6; font-size: 20px; font-weight: bold;');
console.log('%c⚠️ Attention : Cette application stocke vos données localement dans votre navigateur.', 'color: #ff9800; font-size: 14px;');
console.log('%c✅ Vos données sont privées et ne sont jamais envoyées à un serveur.', 'color: #10b981; font-size: 14px;');

// Service Worker Registration for PWA
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then((registration) => {
                    console.log('SW registered: ', registration);
                    
                    // Handle service worker updates
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                showNotification('🔄', 'Nouvelle version disponible. Rechargez la page.', 'info');
                            }
                        });
                    });
                })
                .catch((registrationError) => {
                    console.log('SW registration failed: ', registrationError);
                });
        });
        
        // Handle service worker messages
        navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'SW_UPDATE_AVAILABLE') {
                showNotification('🔄', 'Mise à jour disponible. Actualisez la page.', 'info');
            }
        });
    }
}

// PWA Installation Prompt
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    console.log('PWA install prompt available');
    e.preventDefault();
    deferredPrompt = e;
    
    // Show install button or notification
    setTimeout(() => {
        if (deferredPrompt) {
            showNotification('📱', 'Installez l\'application pour une meilleure expérience', 'info');
        }
    }, 10000); // Show after 10 seconds if user hasn't installed
});

// Install PWA function
function installPWA() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the install prompt');
                showNotification('✅', 'Application installée avec succès !', 'success');
            } else {
                console.log('User dismissed the install prompt');
            }
            deferredPrompt = null;
        });
    }
}

// PWA Update handling
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
    });
}

// ==================== SYSTÈME DE NOTIFICATIONS COMPLET ====================

// 1. Demander la permission pour les notifications
async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        showNotification('❌', 'Les notifications ne sont pas supportées sur cet appareil', 'error');
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            showNotification('✅', 'Notifications activées avec succès !', 'success');
            return true;
        }
    }

    showNotification('⚠️', 'Permission de notifications refusée', 'warning');
    return false;
}

// 2. Envoyer une notification système
function sendSystemNotification(title, options = {}) {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    const defaultOptions = {
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">💰</text></svg>',
        badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">💰</text></svg>',
        vibrate: [200, 100, 200],
        tag: 'finance-tracker',
        requireInteraction: false
    };

    const notification = new Notification(title, { ...defaultOptions, ...options });

    notification.onclick = function(event) {
        event.preventDefault();
        window.focus();
        notification.close();
    };

    return notification;
}

// 3. Vérifier et envoyer les notifications selon le contexte
function checkAndSendNotifications() {
    const settings = {
        enabled: localStorage.getItem('notificationsEnabled') === 'true',
        budgetAlerts: localStorage.getItem('budgetAlerts') === 'true',
        subscriptionReminders: localStorage.getItem('subscriptionReminders') === 'true',
        goalProgress: localStorage.getItem('goalProgress') === 'true',
        expenseReminders: localStorage.getItem('expenseReminders') === 'true'
    };

    if (!settings.enabled) return;

    // Vérifier les budgets
    if (settings.budgetAlerts) {
        checkBudgetNotifications();
    }

    // Vérifier les abonnements
    if (settings.subscriptionReminders) {
        checkSubscriptionNotifications();
    }

    // Vérifier les objectifs
    if (settings.goalProgress) {
        checkGoalNotifications();
    }
}

// 4. Notifications spécifiques pour les budgets
function checkBudgetNotifications() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    AppState.budgets.forEach(budget => {
        const monthlyExpenses = AppState.transactions.filter(t => {
            const tDate = new Date(t.date);
            return t.type === 'expense' && 
                   t.category === budget.category &&
                   tDate.getMonth() === currentMonth && 
                   tDate.getFullYear() === currentYear;
        });

        const spent = monthlyExpenses.reduce((sum, t) => sum + t.amount, 0);
        const percentage = (spent / budget.amount) * 100;

        // Notification à 80% du budget
        if (percentage >= 80 && percentage < 100) {
            const lastNotified = localStorage.getItem(`budget_notif_80_${budget.category}_${currentMonth}`);
            if (!lastNotified) {
                sendSystemNotification('⚠️ Budget Alert', {
                    body: `Vous avez utilisé ${percentage.toFixed(0)}% de votre budget ${budget.category}`,
                    tag: `budget-${budget.category}`
                });
                localStorage.setItem(`budget_notif_80_${budget.category}_${currentMonth}`, 'true');
            }
        }

        // Notification à 100% du budget
        if (percentage >= 100) {
            const lastNotified = localStorage.getItem(`budget_notif_100_${budget.category}_${currentMonth}`);
            if (!lastNotified) {
                sendSystemNotification('🚨 Budget Dépassé', {
                    body: `Votre budget ${budget.category} est dépassé de ${formatCurrency(spent - budget.amount)}`,
                    tag: `budget-exceeded-${budget.category}`
                });
                localStorage.setItem(`budget_notif_100_${budget.category}_${currentMonth}`, 'true');
            }
        }
    });
}

// 5. Notifications pour les abonnements
function checkSubscriptionNotifications() {
    const now = new Date();
    
    AppState.subscriptions.forEach(sub => {
        if (!sub.notify) return;

        const nextDate = new Date(sub.nextDate);
        const daysUntil = Math.ceil((nextDate - now) / (1000 * 60 * 60 * 24));

        // Notification 3 jours avant
        if (daysUntil === 3) {
            const lastNotified = localStorage.getItem(`sub_notif_3_${sub.id}`);
            if (!lastNotified || new Date(lastNotified).toDateString() !== now.toDateString()) {
                sendSystemNotification('📅 Rappel Abonnement', {
                    body: `${sub.name} sera prélevé dans 3 jours (${formatCurrency(sub.amount)})`,
                    tag: `subscription-${sub.id}`
                });
                localStorage.setItem(`sub_notif_3_${sub.id}`, now.toISOString());
            }
        }

        // Notification 1 jour avant
        if (daysUntil === 1) {
            const lastNotified = localStorage.getItem(`sub_notif_1_${sub.id}`);
            if (!lastNotified || new Date(lastNotified).toDateString() !== now.toDateString()) {
                sendSystemNotification('🔔 Rappel Abonnement', {
                    body: `${sub.name} sera prélevé demain (${formatCurrency(sub.amount)})`,
                    tag: `subscription-${sub.id}`,
                    requireInteraction: true
                });
                localStorage.setItem(`sub_notif_1_${sub.id}`, now.toISOString());
            }
        }
    });
}

// 6. Notifications pour les objectifs
function checkGoalNotifications() {
    const totalRevenue = AppState.transactions
        .filter(t => t.type === 'revenue')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpense = AppState.transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const currentSavings = totalRevenue - totalExpense;

    AppState.goals.forEach(goal => {
        const progress = (currentSavings / goal.target) * 100;

        // Notification à 50% de l'objectif
        if (progress >= 50 && progress < 75) {
            const lastNotified = localStorage.getItem(`goal_notif_50_${goal.id}`);
            if (!lastNotified) {
                sendSystemNotification('🎯 Progrès Objectif', {
                    body: `Vous avez atteint 50% de votre objectif "${goal.name}" !`,
                    tag: `goal-${goal.id}`
                });
                localStorage.setItem(`goal_notif_50_${goal.id}`, 'true');
            }
        }

        // Notification à 75% de l'objectif
        if (progress >= 75 && progress < 100) {
            const lastNotified = localStorage.getItem(`goal_notif_75_${goal.id}`);
            if (!lastNotified) {
                sendSystemNotification('🎯 Progrès Objectif', {
                    body: `Vous avez atteint 75% de votre objectif "${goal.name}" ! Encore un effort !`,
                    tag: `goal-${goal.id}`
                });
                localStorage.setItem(`goal_notif_75_${goal.id}`, 'true');
            }
        }

        // Notification à 100% de l'objectif
        if (progress >= 100) {
            const lastNotified = localStorage.getItem(`goal_notif_100_${goal.id}`);
            if (!lastNotified) {
                sendSystemNotification('🎉 Objectif Atteint !', {
                    body: `Félicitations ! Vous avez atteint votre objectif "${goal.name}" !`,
                    tag: `goal-achieved-${goal.id}`,
                    requireInteraction: true
                });
                localStorage.setItem(`goal_notif_100_${goal.id}`, 'true');
            }
        }
    });
}

// 7. Modifier la fonction updateNotificationSetting existante
function updateNotificationSetting(setting, value) {
    localStorage.setItem(setting, value);
    
    // Si on active les notifications, demander la permission
    if (setting === 'enabled' && value === true) {
        requestNotificationPermission().then(granted => {
            if (granted) {
                // Démarrer les vérifications périodiques
                startNotificationChecker();
            } else {
                // Désactiver le toggle si permission refusée
                document.getElementById('notificationsEnabled').checked = false;
                localStorage.setItem('enabled', 'false');
            }
        });
    }
    
    showNotification('✅', 'Paramètre de notification mis à jour', 'success');
}

// 8. Démarrer le système de vérification des notifications
let notificationInterval;

function startNotificationChecker() {
    // Vérifier immédiatement
    checkAndSendNotifications();
    
    // Vérifier toutes les heures
    if (notificationInterval) clearInterval(notificationInterval);
    notificationInterval = setInterval(() => {
        checkAndSendNotifications();
    }, 60 * 60 * 1000); // Toutes les heures
    
    // Vérifier aussi toutes les 5 minutes pour les cas urgents
    setInterval(() => {
        checkSubscriptionNotifications();
    }, 5 * 60 * 1000); // Toutes les 5 minutes
}

// 9. Initialiser au chargement de l'app
document.addEventListener('DOMContentLoaded', function() {
    const notificationsEnabled = localStorage.getItem('notificationsEnabled') === 'true';
    
    // Cocher le toggle selon l'état sauvegardé
    const notifToggle = document.getElementById('notificationsEnabled');
    if (notifToggle) {
        notifToggle.checked = notificationsEnabled;
    }
    
    // Démarrer les vérifications si activé
    if (notificationsEnabled && Notification.permission === 'granted') {
        startNotificationChecker();
    }
    
    // Charger les autres préférences
    ['budgetAlerts', 'subscriptionReminders', 'goalProgress', 'expenseReminders'].forEach(setting => {
        const toggle = document.getElementById(setting);
        if (toggle) {
            toggle.checked = localStorage.getItem(setting) === 'true';
        }
    });
    
    // Charger l'heure de rappel
    const reminderTime = document.getElementById('reminderTime');
    if (reminderTime) {
        reminderTime.value = localStorage.getItem('reminderTime') || '09:00';
    }
});

// ==================== SYSTÈME D'ONBOARDING ====================
let currentSlide = 1;
const totalSlides = 5;

// Feature carousel variables
let currentFeature = 1;
const totalFeatures = 4;
let featureInterval;

// Vérifier si c'est la première visite
function checkFirstVisit() {
    const hasVisited = localStorage.getItem('hasVisitedApp');
    if (!hasVisited) {
        document.getElementById('onboardingOverlay').style.display = 'flex';
    }
}

// Démarrer la visite guidée
function startTour() {
    document.getElementById('welcomeScreen').style.display = 'none';
    document.getElementById('tourScreen').style.display = 'block';
    updateTourUI();
}

// Navigation : Slide Suivante
function nextSlide() {
    if (currentSlide < totalSlides) {
        currentSlide++;
        updateTourUI();
    }
}

// Navigation : Slide Précédente
function previousSlide() {
    if (currentSlide > 1) {
        currentSlide--;
        updateTourUI();
    }
}

// Mettre à jour l'affichage du tutoriel
function updateTourUI() {
    // 1. Gérer l'affichage des slides
    const slides = document.querySelectorAll('.tour-slide');
    slides.forEach(slide => {
        const slideNum = parseInt(slide.getAttribute('data-slide'));
        slide.style.display = (slideNum === currentSlide) ? 'block' : 'none';
        slide.classList.toggle('active', slideNum === currentSlide);
    });

    // 2. Mettre à jour la barre de progression
    const progressBar = document.getElementById('tourProgressBar');
    if (progressBar) {
        const progress = (currentSlide / totalSlides) * 100;
        progressBar.style.width = `${progress}%`;
    }

    // 3. Gérer la visibilité des boutons
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const finishBtn = document.getElementById('finishBtn');

    if (prevBtn) prevBtn.style.visibility = (currentSlide === 1) ? 'hidden' : 'visible';
    
    if (currentSlide === totalSlides) {
        if (nextBtn) nextBtn.style.display = 'none';
        if (finishBtn) finishBtn.style.display = 'block';
    } else {
        if (nextBtn) nextBtn.style.display = 'block';
        if (finishBtn) finishBtn.style.display = 'none';
    }
}

// Passer ou Terminer le tutoriel
function skipOnboarding() {
    if (currentSlide < totalSlides) {
        if (!confirm('Voulez-vous vraiment passer l\'introduction ?')) return;
    }
    finishOnboarding();
}

function finishOnboarding() {
    // Stop feature carousel
    stopFeatureCarousel();

    localStorage.setItem('hasVisitedApp', 'true');
    // On cache l'overlay
    const overlay = document.getElementById('onboardingOverlay');
    overlay.style.opacity = '0';
    setTimeout(() => {
        overlay.style.display = 'none';

        // Afficher le PIN overlay si un PIN existe
        if (AppState.pinCode) {
            lockApp();
        }
        showNotification('🎉', 'Bienvenue ! Commencez à gérer vos finances dès maintenant.', 'success');
    }, 300);
}

// ==================== FEATURE CAROUSEL ====================

// Initialize feature carousel when onboarding starts
function initializeFeatureCarousel() {
    const carousel = document.getElementById('featureCarousel');
    const dots = document.querySelectorAll('.feature-dot');

    if (!carousel || !dots.length) return;

    // Start automatic carousel
    startFeatureCarousel();

    // Add click handlers to dots
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => goToFeature(index + 1));
    });
}

// Start automatic feature carousel
function startFeatureCarousel() {
    if (featureInterval) clearInterval(featureInterval);

    featureInterval = setInterval(() => {
        currentFeature = (currentFeature % totalFeatures) + 1;
        updateFeaturePosition();
    }, 3000); // Change every 3 seconds
}

// Go to specific feature
function goToFeature(featureNumber) {
    if (featureNumber < 1 || featureNumber > totalFeatures) return;

    currentFeature = featureNumber;
    updateFeaturePosition();

    // Reset timer when manually navigating
    if (featureInterval) {
        clearInterval(featureInterval);
        startFeatureCarousel();
    }
}

// Update feature carousel position
function updateFeaturePosition() {
    const features = document.querySelectorAll('.feature-item');
    const dots = document.querySelectorAll('.feature-dot');

    if (!features.length || !dots.length) return;

    // Update feature positions
    features.forEach((feature, index) => {
        const featureNum = index + 1;
        feature.className = 'feature-item'; // Reset classes

        if (featureNum === currentFeature) {
            feature.classList.add('active');
        } else if (featureNum === currentFeature - 1 ||
                   (currentFeature === 1 && featureNum === totalFeatures)) {
            feature.classList.add('prev');
        } else {
            feature.classList.add('next');
        }
    });

    // Update dot indicators
    dots.forEach((dot, index) => {
        if (index + 1 === currentFeature) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
}

// Stop feature carousel (when onboarding is finished)
function stopFeatureCarousel() {
    if (featureInterval) {
        clearInterval(featureInterval);
        featureInterval = null;
    }
}
