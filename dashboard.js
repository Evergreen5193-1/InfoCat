// dashboard.js
const SUPABASE_URL = 'YOUR_SUPABASE_PROJECT_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_PUBLIC_KEY';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const loadingState = document.getElementById('loading-state');
const dashboardContent = document.getElementById('dashboard-content');
const logoutButton = document.getElementById('logout-button');
const accountSelector = document.getElementById('account-selector');

let speedupChart = null; // To hold the chart instance

/**
 * Fetches data and renders the main dashboard content.
 * @param {object} user - The authenticated user object from Supabase.
 */
async function renderDashboard(user) {
    document.getElementById('welcome-message').textContent = `Welcome, ${user.user_metadata.full_name}!`;
    document.getElementById('user-avatar').src = user.user_metadata.avatar_url;

    const { data: accounts, error } = await supabase.from('accounts').select('*');

    if (error) {
        console.error('Error fetching accounts:', error);
        document.getElementById('accounts-section').innerHTML = '<p class="text-red-400">Could not load account data.</p>';
    } else {
        accountSelector.innerHTML = ''; // Clear previous options
        if (accounts && accounts.length > 0) {
            accounts.forEach(account => {
                const option = document.createElement('option');
                option.value = account.id; // Use the internal ID as the value
                option.textContent = `${account.alias || `Gov ${account.governor_id}`} (${account.account_type})`;
                accountSelector.appendChild(option);
            });
            // Automatically load data for the first account
            fetchAndDisplaySpeedups(accounts[0].id);
        } else {
            const option = document.createElement('option');
            option.textContent = 'No accounts found. Bind one with the bot!';
            option.disabled = true;
            accountSelector.appendChild(option);
        }
    }

    loadingState.classList.add('hidden');
    dashboardContent.classList.remove('hidden');
}

/**
 * Fetches and displays speedup data for a selected account.
 * @param {number} accountId - The internal ID of the account.
 */
async function fetchAndDisplaySpeedups(accountId) {
    const speedupSection = document.getElementById('speedup-details');
    speedupSection.classList.remove('hidden');

    const { data: speedups, error } = await supabase
        .from('gov_speedups')
        .select('*')
        .eq('account_id', accountId)
        .order('recorded_at', { ascending: true });

    if (error) {
        console.error('Error fetching speedups:', error);
        return;
    }

    renderSummaryCards(speedups);
    renderChart(speedups);
}

/**
 * Renders the summary cards with the latest speedup data.
 * @param {Array} speedupData - The array of speedup records.
 */
function renderSummaryCards(speedupData) {
    const container = document.getElementById('summary-cards-container');
    container.innerHTML = ''; // Clear old cards

    if (speedupData.length === 0) {
        container.innerHTML = '<p class="col-span-full">No speedup data found for this account.</p>';
        return;
    }

    const latest = speedupData[speedupData.length - 1];
    const previous = speedupData.length > 1 ? speedupData[speedupData.length - 2] : null;

    const cards = [
        { title: 'Universal', value: latest.universal_days, gain: previous ? latest.universal_days - previous.universal_days : 0 },
        { title: 'Training', value: latest.training_days, gain: previous ? latest.training_days - previous.training_days : 0 },
        { title: 'Healing', value: latest.healing_days, gain: previous ? latest.healing_days - previous.healing_days : 0 },
    ];

    cards.forEach(card => {
        const gainSign = card.gain >= 0 ? '+' : '';
        const gainColor = card.gain >= 0 ? 'text-green-400' : 'text-red-400';
        const cardEl = document.createElement('div');
        cardEl.className = 'bg-gray-800 p-6 rounded-lg';
        cardEl.innerHTML = `
            <h4 class="text-gray-400 text-lg">${card.title}</h4>
            <p class="text-3xl font-bold text-white">${card.value.toLocaleString()}d</p>
            <p class="text-md ${gainColor}">${gainSign}${card.gain.toLocaleString()}d since last scan</p>
        `;
        container.appendChild(cardEl);
    });
}

/**
 * Renders the speedup history chart.
 * @param {Array} data - The array of speedup records.
 */
function renderChart(data) {
    const ctx = document.getElementById('speedup-chart').getContext('2d');
    
    if (speedupChart) {
        speedupChart.destroy(); // Destroy the old chart instance before creating a new one
    }

    speedupChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(d => new Date(d.recorded_at)),
            datasets: [
                { label: 'Universal', data: data.map(d => d.universal_days), borderColor: '#BE40E5', tension: 0.1 },
                { label: 'Training', data: data.map(d => d.training_days), borderColor: '#34D399', tension: 0.1 },
                { label: 'Healing', data: data.map(d => d.healing_days), borderColor: '#F87171', tension: 0.1 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { type: 'time', time: { unit: 'day' }, ticks: { color: '#9CA3AF' }, grid: { color: 'rgba(156, 163, 175, 0.1)' } },
                y: { ticks: { color: '#9CA3AF' }, grid: { color: 'rgba(156, 163, 175, 0.1)' } }
            },
            plugins: { legend: { labels: { color: '#D1D5DB' } } }
        }
    });
}

// --- Event Listeners ---
logoutButton.addEventListener('click', async () => {
    await supabase.auth.signOut();
});

accountSelector.addEventListener('change', (e) => {
    fetchAndDisplaySpeedups(e.target.value);
});

document.addEventListener('DOMContentLoaded', () => {
    supabase.auth.onAuthStateChange((event, session) => {
        if (session) {
            if (event === 'SIGNED_IN') {
                window.history.replaceState({}, document.title, window.location.pathname);
            }
            renderDashboard(session.user);
        } else {
            window.location.replace('/index.html');
        }
    });
});
