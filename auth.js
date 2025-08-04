// auth.js

// IMPORTANT: These are public keys, it is safe to expose them in your frontend code.
const SUPABASE_URL = 'https://pozkpfnyscbnmafkgqyz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvemtwZm55c2Nibm1hZmtncXl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NzUyNzgsImV4cCI6MjA2ODU1MTI3OH0.EsEIdX25oH-gTb14XLTm3eYfsb8xEueLDn6ACPPMkeg';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const loginButton = document.getElementById('login-button');
const errorMessage = document.getElementById('error-message');

loginButton.addEventListener('click', async () => {
    loginButton.textContent = 'Redirecting...';

    // This tells Supabase where to send the user back after they log in.
    // It constructs the full URL to your dashboard page.
    const redirectTo = `${window.location.origin}/dashboard.html`;

    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
            redirectTo: redirectTo,
        }
    });

    if (error) {
        console.error('Error logging in:', error);
        errorMessage.textContent = `Error: ${error.message}`;
        loginButton.textContent = 'Login with Discord';
    }
});
