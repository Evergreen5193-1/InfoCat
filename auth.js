// auth.js

// IMPORTANT: These are public keys, it is safe to expose them in your frontend code.
const SUPABASE_URL = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvemtwZm55c2Nibm1hZmtncXl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NzUyNzgsImV4cCI6MjA2ODU1MTI3OH0.EsEIdX25oH-gTb14XLTm3eYfsb8xEueLDn6ACPPMkeg';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_PUBLIC_KEY';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const loginButton = document.getElementById('login-button');
const errorMessage = document.getElementById('error-message');

loginButton.addEventListener('click', async () => {
    loginButton.textContent = 'Redirecting...';
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
    });

    if (error) {
        console.error('Error logging in:', error);
        errorMessage.textContent = `Error: ${error.message}`;
        loginButton.textContent = 'Login with Discord';
    }
});
