function renderDashboard() {
    return renderLayout(`
        <div class="page-header">
            <h2>Dashboard</h2>
            <p>Willkommen zurück, ${esc(API.user.firstName)}</p>
        </div>
        <div id="admin-stats"></div>
        <div class="grid-2">
            <div class="card">
                <div class="card-header"><span class="card-title">Zeiterfassung</span><span id="current-clock" class="text-muted text-sm"></span></div>
                <div class="stamp-section">
                    <button class="stamp-btn" id="stamp-btn">
                        <span class="stamp-icon">⏱</span>
                        <span class="stamp-label" id="stamp-label">Laden...</span>
                    </button>
                    <div class="stamp-status">
                        <div class="status-text" id="stamp-status-text">--</div>
                        <div class="status-time" id="stamp-today-time">0:00</div>
                        <div class="text-sm text-muted mt-8">Heute gearbeitet</div>
                    </div>
                </div>
            </div>
            <div>
                <div class="stat-card mb-16">
                    <div class="stat-icon" id="balance-icon"><span>⚖</span></div>
                    <div class="stat-value" id="balance-value">--</div>
                    <div class="stat-label">Zeitkonto (Monat)</div>
                </div>
                <div class="card">
                    <div class="card-title mb-16">Heutige Stempel</div>
                    <div id="today-stamps-list"></div>
                </div>
            </div>
        </div>
    `);
}

async function bindDashboard() {
    bindSidebar();

    const clockEl = document.getElementById('current-clock');
    function updateClock() {
        const now = new Date();
        clockEl.textContent = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
    }
    updateClock();
    const clockInterval = setInterval(updateClock, 1000);

    if (API.user.role === 'admin') {
        try {
            const stats = await API.get('/api/admin/stats');
            document.getElementById('admin-stats').innerHTML = `
                <div class="stats-grid">
                    <div class="stat-card"><div class="stat-icon purple"><span>⚇</span></div><div class="stat-value">${stats.totalUsers}</div><div class="stat-label">Mitarbeiter</div></div>
                    <div class="stat-card"><div class="stat-icon green"><span>◉</span></div><div class="stat-value">${stats.stampedIn}</div><div class="stat-label">Eingestempelt</div></div>
                    <div class="stat-card"><div class="stat-icon yellow"><span>✉</span></div><div class="stat-value">${stats.pendingRequests}</div><div class="stat-label">Offene Anträge</div></div>
                    <div class="stat-card"><div class="stat-icon blue"><span>⬡</span></div><div class="stat-value">${stats.activeDevices}</div><div class="stat-label">Aktive Geräte</div></div>
                </div>`;
        } catch {}
    }

    try {
        const data = await API.get('/api/stamp/today');
        updateStampUI(data);
    } catch {}

    document.getElementById('stamp-btn').addEventListener('click', async function() {
        this.disabled = true;
        try {
            const result = await API.post('/api/stamp', { source: 'web' });
            if (!result.success && result.warning) {
                toast(result.warning, 'error');
                return;
            }
            if (result.warning) toast(result.warning, 'info');
            toast(result.type === 'in' ? 'Eingestempelt' : 'Ausgestempelt', 'success');

            const data = await API.get('/api/stamp/today');
            updateStampUI(data);
        } catch (err) {
            toast(err.message, 'error');
        } finally {
            this.disabled = false;
        }
    });

    window._dashboardCleanup = () => clearInterval(clockInterval);
}

function updateStampUI(data) {
    const btn = document.getElementById('stamp-btn');
    const label = document.getElementById('stamp-label');
    const statusText = document.getElementById('stamp-status-text');
    const todayTime = document.getElementById('stamp-today-time');
    const balanceValue = document.getElementById('balance-value');
    const balanceIcon = document.getElementById('balance-icon');
    const stampsList = document.getElementById('today-stamps-list');

    if (data.isStampedIn) {
        btn.classList.add('stamped-in');
        label.textContent = 'Ausstempeln';
        statusText.textContent = 'Du bist eingestempelt';
        statusText.style.color = 'var(--success)';
    } else {
        btn.classList.remove('stamped-in');
        label.textContent = 'Einstempeln';
        statusText.textContent = 'Du bist ausgestempelt';
        statusText.style.color = 'var(--text-secondary)';
    }

    todayTime.textContent = formatMinutes(data.todayMinutes) + 'h';

    const bal = data.balance;
    balanceValue.textContent = (bal >= 0 ? '+' : '') + formatMinutes(bal) + 'h';
    balanceValue.className = `stat-value ${bal >= 0 ? 'positive' : 'negative'}`;
    balanceIcon.className = `stat-icon ${bal >= 0 ? 'green' : 'red'}`;

    if (data.stamps && data.stamps.length) {
        let html = '<table><thead><tr><th>Typ</th><th>Zeit</th><th>Quelle</th></tr></thead><tbody>';
        data.stamps.forEach(s => {
            html += `<tr>
                <td><span class="badge ${s.type === 'in' ? 'badge-approved' : 'badge-denied'}">${s.type === 'in' ? 'Ein' : 'Aus'}</span></td>
                <td>${formatTime(s.stamp_time)}</td>
                <td class="text-muted text-sm">${esc(s.source)}</td>
            </tr>`;
        });
        html += '</tbody></table>';
        stampsList.innerHTML = html;
    } else {
        stampsList.innerHTML = '<div class="empty-state"><p>Heute noch keine Stempel</p></div>';
    }
}
