// dashboard.js
const SUPABASE_URL = 'https://pozkpfnyscbnmafkgqyz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvemtwZm55c2Nibm1hZmtncXl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NzUyNzgsImV4cCI6MjA2ODU1MTI3OH0.EsEIdX25oH-gTb14XLTm3eYfsb8xEueLDn6ACPPMkeg';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const loadingState = document.getElementById('loading-state');
const dashboardContent = document.getElementById('dashboard-content');
const logoutButton = document.getElementById('logout-button');

/**
 * Fetches data and renders the main dashboard content.
 * @param {object} user - The authenticated user object from Supabase.
 */
async function renderDashboard(user) {
    // Display user info
    document.getElementById('welcome-message').textContent = `Welcome, ${user.user_metadata.full_name}!`;
    document.getElementById('user-avatar').src = user.user_metadata.avatar_url;

    // Fetch the user's game accounts from the 'accounts' table
    // RLS ensures we only get the accounts for the logged-in user.
    const { data: accounts, error } = await supabase
        .from('accounts')
        .select('*');

    if (error) {
        console.error('Error fetching accounts:', error);
        document.getElementById('accounts-container').innerHTML = '<p class="text-red-400">Could not load account data.</p>';
    } else {
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
    }

    // Show the dashboard and hide loading
    loadingState.classList.add('hidden');
    dashboardContent.classList.remove('hidden');
}

// Handle logout
logoutButton.addEventListener('click', async () => {
    logoutButton.textContent = 'Logging out...';
    await supabase.auth.signOut();
    // The onAuthStateChange listener will handle the redirect below.
});

// This is the main entry point for the dashboard.
// It should be the ONLY auth-related code that runs on page load.
document.addEventListener('DOMContentLoaded', () => {
    // onAuthStateChange is the key. It fires when:
    // 1. The page loads and the user is already logged in.
    // 2. The user logs in (e.g., after redirecting from Discord).
    // 3. The user logs out.
    supabase.auth.onAuthStateChange((event, session) => {
        if (session) {
            // A user is logged in.
            // The `SIGNED_IN` event is useful for one-time actions after login.
            if (event === 'SIGNED_IN') {
                // Clean the ugly tokens from the URL for a cleaner look.
                window.history.replaceState({}, document.title, window.location.pathname);
            }
            // Render the dashboard for the logged-in user.
            renderDashboard(session.user);
        } else {
            // The user is not logged in. Redirect to the login page.
            window.location.replace('/index.html');
        }
    });
});
