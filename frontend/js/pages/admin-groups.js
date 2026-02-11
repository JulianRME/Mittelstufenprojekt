function renderAdminGroups() {
    return renderLayout(`
        <div class="page-header page-header-actions">
            <div>
                <h2>Gruppen</h2>
                <p>Abteilungen und Gruppen verwalten</p>
            </div>
            <button class="btn btn-primary" id="btn-add-group">+ Neue Gruppe</button>
        </div>
        <div class="card" id="groups-content"><div class="empty-state"><p>Lade Gruppen...</p></div></div>
    `);
}

async function bindAdminGroups() {
    bindSidebar();

    async function load() {
        try {
            const groups = await API.get('/api/admin/groups');
            if (!groups.length) {
                document.getElementById('groups-content').innerHTML = '<div class="empty-state"><div class="empty-icon">❖</div><p>Noch keine Gruppen erstellt</p></div>';
                return;
            }

            let html = `<div class="table-wrapper"><table>
                <thead><tr><th>Name</th><th>Mitglieder</th><th>Erstellt</th><th></th></tr></thead>
                <tbody>`;

            groups.forEach(g => {
                html += `<tr>
                    <td>${esc(g.name)}</td>
                    <td>${g.member_count} Mitarbeiter</td>
                    <td class="text-muted text-sm">${formatDate(g.created_at)}</td>
                    <td><button class="btn btn-ghost btn-sm del-group" data-id="${g.id}" style="color:var(--danger)">Löschen</button></td>
                </tr>`;
            });

            html += '</tbody></table></div>';
            document.getElementById('groups-content').innerHTML = html;

            document.querySelectorAll('.del-group').forEach(btn => {
                btn.addEventListener('click', async () => {
                    if (!confirm('Gruppe wirklich löschen? Mitglieder werden keiner Gruppe zugeordnet.')) return;
                    try {
                        await API.del(`/api/admin/groups/${btn.dataset.id}`);
                        toast('Gruppe gelöscht', 'success');
                        load();
                    } catch (err) { toast(err.message, 'error'); }
                });
            });
        } catch (err) { toast(err.message, 'error'); }
    }

    document.getElementById('btn-add-group').addEventListener('click', () => {
        showModal(`
            <div class="modal-header"><h3>Neue Gruppe</h3><button class="modal-close" onclick="closeModal()">✕</button></div>
            <div class="form-group"><label>Gruppenname</label><input class="form-control" id="group-name" placeholder="z.B. Entwicklung"></div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal()">Abbrechen</button>
                <button class="btn btn-primary" id="save-group">Erstellen</button>
            </div>
        `);

        document.getElementById('save-group').addEventListener('click', async () => {
            const name = document.getElementById('group-name').value.trim();
            if (!name) { toast('Name erforderlich', 'error'); return; }
            try {
                await API.post('/api/admin/groups', { name });
                toast('Gruppe erstellt', 'success');
                closeModal();
                load();
            } catch (err) { toast(err.message, 'error'); }
        });
    });

    await load();
}
