function renderAdminUsers() {
    return renderLayout(`
        <div class="page-header page-header-actions">
            <div>
                <h2>Benutzerverwaltung</h2>
                <p>Mitarbeiter verwalten und Rollen zuweisen</p>
            </div>
            <button class="btn btn-primary" id="btn-add-user">+ Benutzer anlegen</button>
        </div>
        <div class="card" id="users-content"><div class="empty-state"><p>Lade Benutzer...</p></div></div>
    `);
}

async function bindAdminUsers() {
    bindSidebar();
    let users = [], groups = [];

    async function load() {
        try {
            [users, groups] = await Promise.all([API.get('/api/admin/users'), API.get('/api/admin/groups')]);
            renderTable();
        } catch (err) { toast(err.message, 'error'); }
    }

    function renderTable() {
        if (!users.length) {
            document.getElementById('users-content').innerHTML = '<div class="empty-state"><p>Keine Benutzer</p></div>';
            return;
        }

        let html = `<div class="table-wrapper"><table>
            <thead><tr><th>Name</th><th>E-Mail</th><th>Rolle</th><th>Gruppe</th><th>Vorgesetzter</th><th>NFC</th><th>Status</th><th></th></tr></thead>
            <tbody>`;

        users.forEach(u => {
            html += `<tr>
                <td>${esc(u.first_name)} ${esc(u.last_name)}</td>
                <td class="text-muted text-sm">${esc(u.email)}</td>
                <td><span class="badge badge-${u.role}">${roleLabel(u.role)}</span></td>
                <td class="text-sm">${u.group_name ? esc(u.group_name) : '—'}</td>
                <td class="text-sm">${u.supervisor_name ? esc(u.supervisor_name) : '—'}</td>
                <td class="text-sm">${u.nfc_uid ? '<span class="badge badge-approved">✓</span>' : '—'}</td>
                <td>${u.active ? '<span class="badge badge-online">Aktiv</span>' : '<span class="badge badge-offline">Inaktiv</span>'}</td>
                <td class="flex gap-8">
                    <button class="btn btn-ghost btn-sm edit-user" data-id="${u.id}">Bearbeiten</button>
                    ${u.active ? `<button class="btn btn-ghost btn-sm del-user" data-id="${u.id}" style="color:var(--danger)">Deaktivieren</button>` : ''}
                </td>
            </tr>`;
        });

        html += '</tbody></table></div>';
        document.getElementById('users-content').innerHTML = html;

        document.querySelectorAll('.edit-user').forEach(btn => {
            btn.addEventListener('click', () => openUserModal(users.find(u => u.id === parseInt(btn.dataset.id))));
        });

        document.querySelectorAll('.del-user').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!confirm('Benutzer deaktivieren?')) return;
                try {
                    await API.del(`/api/admin/users/${btn.dataset.id}`);
                    toast('Benutzer deaktiviert', 'success');
                    load();
                } catch (err) { toast(err.message, 'error'); }
            });
        });
    }

    function supervisorOptions(selected) {
        return users.filter(u => u.role !== 'arbeiter' && u.active).map(u =>
            `<option value="${u.id}" ${u.id === selected ? 'selected' : ''}>${esc(u.first_name)} ${esc(u.last_name)}</option>`
        ).join('');
    }

    function groupOptions(selected) {
        return groups.map(g =>
            `<option value="${g.id}" ${g.id === selected ? 'selected' : ''}>${esc(g.name)}</option>`
        ).join('');
    }

    function openUserModal(user) {
        const isEdit = !!user;
        showModal(`
            <div class="modal-header"><h3>${isEdit ? 'Benutzer bearbeiten' : 'Neuer Benutzer'}</h3><button class="modal-close" onclick="closeModal()">✕</button></div>
            <div class="grid-2">
                <div class="form-group"><label>Vorname</label><input class="form-control" id="u-first" value="${isEdit ? esc(user.first_name) : ''}"></div>
                <div class="form-group"><label>Nachname</label><input class="form-control" id="u-last" value="${isEdit ? esc(user.last_name) : ''}"></div>
            </div>
            <div class="form-group"><label>E-Mail</label><input type="email" class="form-control" id="u-email" value="${isEdit ? esc(user.email) : ''}"></div>
            <div class="form-group"><label>Passwort${isEdit ? ' (leer = unverändert)' : ''}</label><input type="password" class="form-control" id="u-pass" placeholder="${isEdit ? 'Leer lassen für keine Änderung' : 'Mindestens 6 Zeichen'}"></div>
            <div class="grid-2">
                <div class="form-group"><label>Rolle</label>
                    <select class="form-control" id="u-role">
                        <option value="arbeiter" ${isEdit && user.role === 'arbeiter' ? 'selected' : ''}>Mitarbeiter</option>
                        <option value="vorgesetzter" ${isEdit && user.role === 'vorgesetzter' ? 'selected' : ''}>Vorgesetzter</option>
                        <option value="admin" ${isEdit && user.role === 'admin' ? 'selected' : ''}>Administrator</option>
                    </select>
                </div>
                <div class="form-group"><label>Gruppe</label>
                    <select class="form-control" id="u-group"><option value="">Keine</option>${groupOptions(isEdit ? user.group_id : null)}</select>
                </div>
            </div>
            <div class="form-group"><label>Vorgesetzter</label>
                <select class="form-control" id="u-supervisor"><option value="">Keiner</option>${supervisorOptions(isEdit ? user.supervisor_id : null)}</select>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal()">Abbrechen</button>
                <button class="btn btn-primary" id="save-user">${isEdit ? 'Speichern' : 'Erstellen'}</button>
            </div>
        `);

        document.getElementById('save-user').addEventListener('click', async () => {
            const data = {
                firstName: document.getElementById('u-first').value.trim(),
                lastName: document.getElementById('u-last').value.trim(),
                email: document.getElementById('u-email').value.trim(),
                role: document.getElementById('u-role').value,
                groupId: document.getElementById('u-group').value ? parseInt(document.getElementById('u-group').value) : null,
                supervisorId: document.getElementById('u-supervisor').value ? parseInt(document.getElementById('u-supervisor').value) : null
            };

            const pass = document.getElementById('u-pass').value;
            if (!isEdit && !pass) { toast('Passwort erforderlich', 'error'); return; }
            if (pass) data.password = pass;
            if (!data.firstName || !data.lastName || !data.email) { toast('Pflichtfelder ausfüllen', 'error'); return; }

            try {
                if (isEdit) {
                    await API.put(`/api/admin/users/${user.id}`, data);
                    toast('Benutzer aktualisiert', 'success');
                } else {
                    await API.post('/api/admin/users', data);
                    toast('Benutzer erstellt', 'success');
                }
                closeModal();
                load();
            } catch (err) { toast(err.message, 'error'); }
        });
    }

    document.getElementById('btn-add-user').addEventListener('click', () => openUserModal(null));
    await load();
}
