// dashboard.js
const SUPABASE_URL = 'YOUR_SUPABASE_PROJECT_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_PUBLIC_KEY';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const loadingState = document.getElementById('loading-state');
const dashboardContent = document.getElementById('dashboard-content');
const logoutButton = document.getElementById('logout-button');

// Use onAuthStateChange to handle login events
supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session) {
        // If a user signs in, render the dashboard
        renderDashboard(session.user);
    } else if (event === 'SIGNED_OUT') {
        // If a user signs out, redirect to the login page
        window.location.replace('/index.html');
    }
});

// Also check for a session when the page loads initially
document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        renderDashboard(session.user);
    } else {
        // If no session on page load, maybe the user needs to log in
        // We can wait for the onAuthStateChange or redirect
        // For now, we let the onAuthStateChange handle it, but if it fails,
        // the user might be stuck on the loading screen. A timeout could redirect.
        setTimeout(() => {
            if (loadingState.style.display !== 'none') {
                window.location.replace('/index.html');
            }
        }, 3000); // Redirect after 3 seconds if still loading
    }
});


async function renderDashboard(user) {
    // Display user info
    const welcomeMessage = document.getElementById('welcome-message');
    const userAvatar = document.getElementById('user-avatar');
    welcomeMessage.textContent = `Welcome, ${user.user_metadata.full_name}!`;
    userAvatar.src = user.user_metadata.avatar_url;

    // Fetch the user's game accounts from the 'accounts' table
    // RLS ensures we only get the accounts for the logged-in user.
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
    }
    // The onAuthStateChange listener will handle the redirect.
});
