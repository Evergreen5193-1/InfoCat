// auth.js

// IMPORTANT: These are public keys, it is safe to expose them in your frontend code.
const SUPABASE_URL = 'YOUR_SUPABASE_PROJECT_URL';
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
