const routes = {
    'login':          { render: renderLogin, bind: bindLogin, auth: false },
    'dashboard':      { render: renderDashboard, bind: bindDashboard, auth: true },
    'calendar':       { render: renderCalendar, bind: bindCalendar, auth: true },
    'requests':       { render: renderRequests, bind: bindRequests, auth: true },
    'team':           { render: renderTeam, bind: bindTeam, auth: true, roles: ['vorgesetzter', 'admin'] },
    'admin-users':    { render: renderAdminUsers, bind: bindAdminUsers, auth: true, roles: ['admin'] },
    'admin-groups':   { render: renderAdminGroups, bind: bindAdminGroups, auth: true, roles: ['admin'] },
    'admin-devices':  { render: renderAdminDevices, bind: bindAdminDevices, auth: true, roles: ['admin'] },
    'settings':       { render: renderSettings, bind: bindSettings, auth: true }
};

function navigateTo(page) {
    const route = routes[page];
    if (!route) { navigateTo('dashboard'); return; }

    if (route.auth && !API.isLoggedIn()) { window.location.hash = '#/login'; return; }
    if (!route.auth && page === 'login' && API.isLoggedIn()) { window.location.hash = '#/dashboard'; return; }
    if (route.roles && !route.roles.includes(API.user?.role)) { window.location.hash = '#/dashboard'; return; }

    if (window._dashboardCleanup) { window._dashboardCleanup(); window._dashboardCleanup = null; }

    const app = document.getElementById('app');
    app.innerHTML = route.render();
    route.bind();
}

window.addEventListener('hashchange', () => {
    const page = window.location.hash.replace('#/', '') || 'dashboard';
    navigateTo(page);
});
