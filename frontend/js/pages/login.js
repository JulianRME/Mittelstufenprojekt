function renderLogin() {
    return `
    <div class="login-wrapper">
        <div class="login-card">
            <div class="logo-text">
                <div class="logo-icon">⏱</div>
                <div class="logo-name">ZeitStempel</div>
            </div>
            <h1>Willkommen</h1>
            <p class="subtitle">Melde dich an, um fortzufahren</p>
            <div class="form-group">
                <label>E-Mail</label>
                <input type="email" class="form-control" id="login-email" placeholder="name@firma.de" autocomplete="email">
            </div>
            <div class="form-group">
                <label>Passwort</label>
                <input type="password" class="form-control" id="login-password" placeholder="Passwort eingeben" autocomplete="current-password">
            </div>
            <button class="btn btn-primary btn-block mt-8" id="login-btn">Anmelden</button>
            <p id="login-error" class="text-center mt-16 text-sm" style="color:var(--danger);display:none"></p>
        </div>
    </div>`;
}

function bindLogin() {
    const btn = document.getElementById('login-btn');
    const emailInput = document.getElementById('login-email');
    const passInput = document.getElementById('login-password');
    const errorEl = document.getElementById('login-error');

    async function doLogin() {
        const email = emailInput.value.trim();
        const password = passInput.value;
        if (!email || !password) { errorEl.textContent = 'Bitte alle Felder ausfüllen'; errorEl.style.display = 'block'; return; }

        btn.disabled = true;
        btn.textContent = 'Wird angemeldet...';
        errorEl.style.display = 'none';

        try {
            const data = await API.post('/api/auth/login', { email, password });
            API.setAuth(data.token, data.user);
            connectSocket();
            window.location.hash = '#/dashboard';
        } catch (err) {
            errorEl.textContent = err.message;
            errorEl.style.display = 'block';
            btn.disabled = false;
            btn.textContent = 'Anmelden';
        }
    }

    btn.addEventListener('click', doLogin);
    passInput.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
    emailInput.addEventListener('keydown', e => { if (e.key === 'Enter') passInput.focus(); });
}
