function renderAdminDevices() {
    return renderLayout(`
        <div class="page-header page-header-actions">
            <div>
                <h2>Stempeluhren</h2>
                <p>Geräte verwalten und NFC-Tags zuweisen</p>
            </div>
            <button class="btn btn-primary" id="btn-add-device">+ Gerät registrieren</button>
        </div>
        <div class="card" id="devices-content"><div class="empty-state"><p>Lade Geräte...</p></div></div>
        <div class="card mt-24">
            <div class="card-title mb-16">NFC-Tag zuweisen</div>
            <p class="text-muted text-sm mb-16">Wähle ein Gerät und einen Mitarbeiter, dann halte den NFC-Tag an die gewählte Stempeluhr.</p>
            <div class="grid-2">
                <div class="form-group"><label>Stempeluhr</label><select class="form-control" id="assign-device"></select></div>
                <div class="form-group"><label>Mitarbeiter</label><select class="form-control" id="assign-user"></select></div>
            </div>
            <button class="btn btn-primary" id="btn-assign-nfc">Zuweisungsmodus aktivieren</button>
            <div id="assign-status" class="mt-16"></div>
        </div>
    `);
}

async function bindAdminDevices() {
    bindSidebar();
    let devices = [], users = [];

    async function load() {
        try {
            [devices, users] = await Promise.all([API.get('/api/admin/devices'), API.get('/api/admin/users')]);
            renderDevices();
            fillSelects();
        } catch (err) { toast(err.message, 'error'); }
    }

    function renderDevices() {
        if (!devices.length) {
            document.getElementById('devices-content').innerHTML = '<div class="empty-state"><div class="empty-icon">⬡</div><p>Keine Stempeluhren registriert</p></div>';
            return;
        }

        let html = `<div class="table-wrapper"><table>
            <thead><tr><th>ID</th><th>Name</th><th>Standort</th><th>Modus</th><th>Zuletzt gesehen</th><th>Status</th></tr></thead>
            <tbody>`;

        devices.forEach(d => {
            const fiveMin = new Date(Date.now() - 300000);
            const online = d.last_seen && new Date(d.last_seen) > fiveMin;
            html += `<tr>
                <td class="text-sm" style="font-family:monospace">${esc(d.id)}</td>
                <td>${esc(d.name)}</td>
                <td class="text-muted text-sm">${d.location ? esc(d.location) : '—'}</td>
                <td><span class="badge ${d.mode === 'assign' ? 'badge-pending' : 'badge-approved'}">${d.mode === 'assign' ? 'Zuweisung' : 'Stempeln'}</span></td>
                <td class="text-muted text-sm">${d.last_seen ? formatTime(d.last_seen) : 'Nie'}</td>
                <td><span class="badge ${online ? 'badge-online' : 'badge-offline'}">${online ? 'Online' : 'Offline'}</span></td>
            </tr>`;
        });

        html += '</tbody></table></div>';
        document.getElementById('devices-content').innerHTML = html;
    }

    function fillSelects() {
        const deviceSelect = document.getElementById('assign-device');
        const userSelect = document.getElementById('assign-user');

        deviceSelect.innerHTML = '<option value="">Gerät wählen...</option>' +
            devices.map(d => `<option value="${esc(d.id)}">${esc(d.name)}</option>`).join('');

        userSelect.innerHTML = '<option value="">Mitarbeiter wählen...</option>' +
            users.filter(u => u.active).map(u =>
                `<option value="${u.id}">${esc(u.first_name)} ${esc(u.last_name)} ${u.nfc_uid ? '(NFC vorhanden)' : ''}</option>`
            ).join('');
    }

    document.getElementById('btn-add-device').addEventListener('click', () => {
        showModal(`
            <div class="modal-header"><h3>Gerät registrieren</h3><button class="modal-close" onclick="closeModal()">✕</button></div>
            <div class="form-group"><label>Geräte-ID</label><input class="form-control" id="dev-id" placeholder="z.B. stempeluhr-1"></div>
            <div class="form-group"><label>Name</label><input class="form-control" id="dev-name" placeholder="z.B. Eingang Hauptgebäude"></div>
            <div class="form-group"><label>Standort (optional)</label><input class="form-control" id="dev-location" placeholder="z.B. Erdgeschoss"></div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal()">Abbrechen</button>
                <button class="btn btn-primary" id="save-device">Registrieren</button>
            </div>
        `);

        document.getElementById('save-device').addEventListener('click', async () => {
            const id = document.getElementById('dev-id').value.trim();
            const name = document.getElementById('dev-name').value.trim();
            const location = document.getElementById('dev-location').value.trim();
            if (!id || !name) { toast('ID und Name erforderlich', 'error'); return; }
            try {
                await API.post('/api/admin/devices', { id, name, location: location || null });
                toast('Gerät registriert', 'success');
                closeModal();
                load();
            } catch (err) { toast(err.message, 'error'); }
        });
    });

    document.getElementById('btn-assign-nfc').addEventListener('click', async () => {
        const deviceId = document.getElementById('assign-device').value;
        const userId = document.getElementById('assign-user').value;
        if (!deviceId || !userId) { toast('Gerät und Mitarbeiter wählen', 'error'); return; }

        try {
            await API.put(`/api/admin/devices/${deviceId}/assign`, { userId: parseInt(userId) });
            document.getElementById('assign-status').innerHTML =
                '<p style="color:var(--warning)">⏳ Zuweisungsmodus aktiv — NFC-Tag jetzt an die Stempeluhr halten</p>';
            toast('Zuweisungsmodus aktiviert', 'info');
        } catch (err) { toast(err.message, 'error'); }
    });

    if (window.socket) {
        window.socket.on('nfc:assigned', (data) => {
            document.getElementById('assign-status').innerHTML =
                '<p style="color:var(--success)">✓ NFC-Tag erfolgreich zugewiesen!</p>';
            toast('NFC-Tag zugewiesen', 'success');
            load();
        });
    }

    await load();
}
