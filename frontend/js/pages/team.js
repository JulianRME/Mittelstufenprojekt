function renderTeam() {
    return renderLayout(`
        <div class="page-header">
            <h2>Team-Übersicht</h2>
            <p>Anwesenheit und Status deiner Mitarbeiter</p>
        </div>
        <div id="team-content"><div class="card"><div class="empty-state"><p>Lade Team...</p></div></div></div>
    `);
}

async function bindTeam() {
    bindSidebar();

    try {
        const data = await API.get('/api/admin/team/online');
        const online = data.filter(u => u.type === 'in');
        const offline = data.filter(u => u.type !== 'in');

        let html = `
        <div class="stats-grid">
            <div class="stat-card"><div class="stat-icon green"><span>◉</span></div><div class="stat-value">${online.length}</div><div class="stat-label">Anwesend</div></div>
            <div class="stat-card"><div class="stat-icon red"><span>◎</span></div><div class="stat-value">${offline.length}</div><div class="stat-label">Abwesend</div></div>
            <div class="stat-card"><div class="stat-icon purple"><span>⚇</span></div><div class="stat-value">${data.length}</div><div class="stat-label">Gesamt</div></div>
        </div>
        <div class="card">
            <div class="card-title mb-16">Mitarbeiter</div>
            <div class="table-wrapper"><table>
                <thead><tr><th>Name</th><th>Status</th><th>Letzte Aktion</th></tr></thead>
                <tbody>`;

        data.forEach(u => {
            const isOnline = u.type === 'in';
            html += `<tr>
                <td>${esc(u.first_name)} ${esc(u.last_name)}</td>
                <td><span class="badge ${isOnline ? 'badge-online' : 'badge-offline'}">${isOnline ? 'Anwesend' : 'Abwesend'}</span></td>
                <td class="text-muted text-sm">${u.stamp_time ? `${u.type === 'in' ? 'Ein' : 'Aus'} um ${formatTime(u.stamp_time)}` : 'Heute nicht gestempelt'}</td>
            </tr>`;
        });

        html += '</tbody></table></div></div>';
        document.getElementById('team-content').innerHTML = html;
    } catch (err) {
        document.getElementById('team-content').innerHTML = `<div class="card"><div class="empty-state"><p>${esc(err.message)}</p></div></div>`;
    }
}
