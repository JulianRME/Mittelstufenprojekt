function connectSocket() {
    if (!API.token) return;
    if (window.socket) window.socket.disconnect();

    window.socket = io({ auth: { token: API.token } });

    window.socket.on('stamp:update', (data) => {
        if (data.userId === API.user.id) return;
        if (window.location.hash === '#/dashboard' || window.location.hash === '' || window.location.hash === '#/') {
            API.get('/api/stamp/today').then(updateStampUI).catch(() => {});
        }
    });

    window.socket.on('request:new', (data) => {
        toast(`Neuer Antrag von ${data.userName}: ${typeLabel(data.type)}`, 'info');
    });

    window.socket.on('request:reviewed', (data) => {
        const status = data.status === 'approved' ? 'genehmigt' : 'abgelehnt';
        toast(`Dein Antrag wurde ${status}`, data.status === 'approved' ? 'success' : 'error');
    });
}

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
}

if (API.isLoggedIn()) connectSocket();

const startPage = window.location.hash.replace('#/', '') || (API.isLoggedIn() ? 'dashboard' : 'login');
window.location.hash = `#/${startPage}`;
navigateTo(startPage);
