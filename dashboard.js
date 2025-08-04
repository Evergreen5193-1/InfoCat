// dashboard.js
const SUPABASE_URL = 'YOUR_SUPABASE_PROJECT_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_PUBLIC_KEY';

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
    // The onAuthStateChange listener will handle the redirect.
});

// This is the main entry point for the dashboard
document.addEventListener('DOMContentLoaded', () => {
    // onAuthStateChange is the key. It fires when the user logs in, logs out,
    // or when the page loads and a session is detected from the URL.
    supabase.auth.onAuthStateChange(async (event, session) => {
        // The URL hash is only present after the redirect from Discord.
        // We only want to act on the SIGNED_IN event to avoid duplicate renders.
        if (event === "SIGNED_IN" && session) {
            // Clean the ugly tokens from the URL
            window.history.replaceState({}, document.title, window.location.pathname);
            await renderDashboard(session.user);
        } else if (event === "SIGNED_OUT") {
            // If user signs out, redirect to login
            window.location.replace('/index.html');
        }
    });

    // Also check for an existing session on initial page load, in case the
    // user was already logged in from a previous visit.
    const loadInitialSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            await renderDashboard(session.user);
        } else {
            // If no session is found after a short delay, redirect to login.
            // This handles users trying to access the dashboard directly without logging in.
            setTimeout(() => {
                if (dashboardContent.classList.contains('hidden')) {
                    window.location.replace('/index.html');
                }
            }, 1500);
        }
    };
    
    loadInitialSession();
});
