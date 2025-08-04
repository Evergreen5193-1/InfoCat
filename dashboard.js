// dashboard.js
const SUPABASE_URL = 'https://pozkpfnyscbnmafkgqyz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvemtwZm55c2Nibm1hZmtncXl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NzUyNzgsImV4cCI6MjA2ODU1MTI3OH0.EsEIdX25oH-gTb14XLTm3eYfsb8xEueLDn6ACPPMkeg';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const loadingState = document.getElementById('loading-state');
const dashboardContent = document.getElementById('dashboard-content');
const logoutButton = document.getElementById('logout-button');

// This function runs as soon as the page loads
document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
        console.error('Error getting session:', sessionError);
        loadingState.textContent = 'Could not get session.';
        return;
    }

    if (!session) {
        // If no session, redirect to login page
        window.location.replace('/index.html');
        return;
    }

    // If we have a session, render the page
    renderDashboard(session.user);
});

async function renderDashboard(user) {
    // Display user info
    const welcomeMessage = document.getElementById('welcome-message');
    const userAvatar = document.getElementById('user-avatar');
    welcomeMessage.textContent = `Welcome, ${user.user_metadata.full_name}!`;
    userAvatar.src = user.user_metadata.avatar_url;

    // Fetch the user's game accounts from the 'accounts' table
    const { data: accounts, error } = await supabase
        .from('accounts')
        .select('*');

    if (error) {
        console.error('Error fetching accounts:', error);
        return;
    }

    // Render the account cards
    const accountsContainer = document.getElementById('accounts-container');
    accountsContainer.innerHTML = ''; // Clear loading/old content

    if (accounts && accounts.length > 0) {
        accounts.forEach(account => {
            const card = document.createElement('div');
            card.className = 'bg-gray-800 p-6 rounded-lg';
            card.innerHTML = `
                <h3 class="text-xl font-bold">${account.alias || `Account ${account.governor_id}`}</h3>
                <p class="text-purple-400 capitalize">${account.account_type} Account</p>
                <p class="text-gray-400">Governor ID: ${account.governor_id}</p>
            `;
            accountsContainer.appendChild(card);
        });
    } else {
        accountsContainer.innerHTML = '<p>You have no accounts linked yet. Use the Discord bot to bind one!</p>';
    }

    // Show the dashboard and hide loading
    loadingState.classList.add('hidden');
    dashboardContent.classList.remove('hidden');
}

// Handle logout
logoutButton.addEventListener('click', async () => {
    logoutButton.textContent = 'Logging out...';
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Error logging out:', error);
    } else {
        // Redirect to login page after logout
        window.location.replace('/index.html');
    }
});
