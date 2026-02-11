function renderSidebar() {
    const user = API.user;
    if (!user) return '';

    const isAdmin = user.role === 'admin';
    const isSupervisor = user.role === 'vorgesetzter' || isAdmin;
    const initials = (user.firstName?.[0] || '') + (user.lastName?.[0] || '');

    let nav = `
        <div class="nav-section">
            <div class="nav-section-title">Allgemein</div>
            <div class="nav-item" data-page="dashboard"><span class="icon">⊞</span> Dashboard</div>
            <div class="nav-item" data-page="calendar"><span class="icon">▦</span> Kalender</div>
            <div class="nav-item" data-page="requests"><span class="icon">✉</span> Anträge</div>
        </div>`;

    if (isSupervisor) {
        nav += `
        <div class="nav-section">
            <div class="nav-section-title">Vorgesetzter</div>
            <div class="nav-item" data-page="team"><span class="icon">◉</span> Team</div>
        </div>`;
    }

    if (isAdmin) {
        nav += `
        <div class="nav-section">
            <div class="nav-section-title">Administration</div>
            <div class="nav-item" data-page="admin-users"><span class="icon">⚇</span> Benutzer</div>
            <div class="nav-item" data-page="admin-groups"><span class="icon">❖</span> Gruppen</div>
            <div class="nav-item" data-page="admin-devices"><span class="icon">⬡</span> Stempeluhren</div>
        </div>`;
    }

    return `
    <button class="mobile-menu-btn" id="mobile-menu-btn">☰</button>
    <div class="sidebar-overlay" id="sidebar-overlay"></div>
    <aside class="sidebar" id="sidebar">
        <div class="sidebar-header">
            <div class="logo">⏱</div>
            <div class="brand">ZeitStempel</div>
        </div>
        <nav class="sidebar-nav">${nav}</nav>
        <div class="sidebar-footer">
            <div class="sidebar-user" id="sidebar-user">
                <div class="avatar">${esc(initials)}</div>
                <div class="user-info">
                    <div class="user-name">${esc(user.firstName)} ${esc(user.lastName)}</div>
                    <div class="user-role">${esc(roleLabel(user.role))}</div>
                </div>
            </div>
            <div class="nav-item mt-8" id="btn-settings" data-page="settings"><span class="icon">⚙</span> Einstellungen</div>
            <div class="nav-item" id="btn-logout"><span class="icon">⏻</span> Abmelden</div>
        </div>
    </aside>`;
}

function bindSidebar() {
    document.querySelectorAll('.nav-item[data-page]').forEach(el => {
        el.addEventListener('click', () => {
            window.location.hash = `#/${el.dataset.page}`;
            document.getElementById('sidebar')?.classList.remove('open');
            document.getElementById('sidebar-overlay')?.classList.remove('open');
        });
    });

    document.getElementById('btn-logout')?.addEventListener('click', () => {
        API.logout();
        if (window.socket) window.socket.disconnect();
        window.location.hash = '#/login';
    });

    document.getElementById('mobile-menu-btn')?.addEventListener('click', () => {
        document.getElementById('sidebar')?.classList.toggle('open');
        document.getElementById('sidebar-overlay')?.classList.toggle('open');
    });

    document.getElementById('sidebar-overlay')?.addEventListener('click', () => {
        document.getElementById('sidebar')?.classList.remove('open');
        document.getElementById('sidebar-overlay')?.classList.remove('open');
    });

    const currentPage = window.location.hash.replace('#/', '') || 'dashboard';
    document.querySelectorAll('.nav-item[data-page]').forEach(el => {
        el.classList.toggle('active', el.dataset.page === currentPage);
    });
}

function renderLayout(content) {
    return `
    <div class="app-layout">
        ${renderSidebar()}
        <main class="main-content">${content}</main>
    </div>`;
}
