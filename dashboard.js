// dashboard.js
const SUPABASE_URL = 'YOUR_SUPABASE_PROJECT_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_PUBLIC_KEY';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const loadingState = document.getElementById('loading-state');
const dashboardContent = document.getElementById('dashboard-content');
const logoutButton = document.getElementById('logout-button');

/**
 * Main function to handle authentication and rendering.
 */
const handleAuthentication = async () => {
    // First, check if there's an active session when the page loads
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
        // If a session exists, the user is already logged in.
        await renderDashboard(session.user);
    }

    // Now, set up a listener for any future auth changes.
    // This is crucial for catching the user after they are redirected back from Discord.
    supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
            // This event fires after a successful login.
            await renderDashboard(session.user);
        } else if (event === 'SIGNED_OUT') {
            // This event fires after a successful logout.
            window.location.replace('/index.html');
        }
    });

    // Final check: If after a moment there's still no session, redirect to login.
    // This handles the case where a non-logged-in user lands on the dashboard directly.
    setTimeout(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session && !dashboardContent.classList.contains('hidden')) {
            // The dashboard is not visible, and there's no session, so redirect.
             window.location.replace('/index.html');
        }
    }, 2500); // Check after 2.5 seconds
};


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

// Start the authentication process when the page loads.
document.addEventListener('DOMContentLoaded', handleAuthentication);
