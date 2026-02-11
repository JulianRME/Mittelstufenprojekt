function renderRequests() {
    const isSupervisor = API.user.role === 'vorgesetzter' || API.user.role === 'admin';

    return renderLayout(`
        <div class="page-header page-header-actions">
            <div>
                <h2>Anträge</h2>
                <p>Verwalte deine Abwesenheiten</p>
            </div>
            <button class="btn btn-primary" id="btn-new-request">+ Neuer Antrag</button>
        </div>
        ${isSupervisor ? `
        <div class="tabs" id="request-tabs">
            <button class="tab active" data-tab="my">Meine Anträge</button>
            <button class="tab" data-tab="pending">Eingehend <span id="pending-badge"></span></button>
            <button class="tab" data-tab="all">Alle</button>
        </div>` : ''}
        <div id="requests-content"></div>
    `);
}

async function bindRequests() {
    bindSidebar();
    const isSupervisor = API.user.role === 'vorgesetzter' || API.user.role === 'admin';

    let activeTab = 'my';

    async function loadTab(tab) {
        activeTab = tab;
        const content = document.getElementById('requests-content');

        document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));

        try {
            if (tab === 'my') {
                const data = await API.get('/api/requests/my');
                if (!data.length) {
                    content.innerHTML = '<div class="card"><div class="empty-state"><div class="empty-icon">✉</div><p>Keine Anträge vorhanden</p></div></div>';
                    return;
                }
                content.innerHTML = `<div class="card"><div class="table-wrapper"><table>
                    <thead><tr><th>Typ</th><th>Von</th><th>Bis</th><th>Status</th><th>Bearbeitet von</th><th></th></tr></thead>
                    <tbody>${data.map(r => `<tr>
                        <td>${esc(typeLabel(r.type))}</td>
                        <td>${formatDate(r.date_from)}</td>
                        <td>${formatDate(r.date_to)}</td>
                        <td><span class="badge badge-${r.status}">${statusLabel(r.status)}</span></td>
                        <td class="text-muted text-sm">${r.reviewer_name ? esc(r.reviewer_name) : '—'}</td>
                        <td>${r.status === 'pending' ? `<button class="btn btn-ghost btn-sm cancel-req" data-id="${r.id}">Zurückziehen</button>` : ''}</td>
                    </tr>`).join('')}</tbody>
                </table></div></div>`;

                content.querySelectorAll('.cancel-req').forEach(btn => {
                    btn.addEventListener('click', async () => {
                        try {
                            await API.del(`/api/requests/${btn.dataset.id}`);
                            toast('Antrag zurückgezogen', 'success');
                            loadTab('my');
                        } catch (err) { toast(err.message, 'error'); }
                    });
                });
            } else if (tab === 'pending') {
                const data = await API.get('/api/requests/pending');
                if (!data.length) {
                    content.innerHTML = '<div class="card"><div class="empty-state"><div class="empty-icon">✓</div><p>Keine offenen Anträge</p></div></div>';
                    return;
                }
                content.innerHTML = `<div class="card"><div class="table-wrapper"><table>
                    <thead><tr><th>Mitarbeiter</th><th>Typ</th><th>Von</th><th>Bis</th><th>Notiz</th><th>Aktionen</th></tr></thead>
                    <tbody>${data.map(r => `<tr>
                        <td>${esc(r.user_name)}</td>
                        <td>${esc(typeLabel(r.type))}</td>
                        <td>${formatDate(r.date_from)}</td>
                        <td>${formatDate(r.date_to)}</td>
                        <td class="text-muted text-sm">${r.note ? esc(r.note) : '—'}</td>
                        <td class="flex gap-8">
                            <button class="btn btn-success btn-sm review-btn" data-id="${r.id}" data-action="approved">Genehmigen</button>
                            <button class="btn btn-danger btn-sm review-btn" data-id="${r.id}" data-action="denied">Ablehnen</button>
                        </td>
                    </tr>`).join('')}</tbody>
                </table></div></div>`;

                content.querySelectorAll('.review-btn').forEach(btn => {
                    btn.addEventListener('click', async () => {
                        try {
                            await API.put(`/api/requests/${btn.dataset.id}/review`, { status: btn.dataset.action });
                            toast(btn.dataset.action === 'approved' ? 'Antrag genehmigt' : 'Antrag abgelehnt', 'success');
                            loadTab('pending');
                        } catch (err) { toast(err.message, 'error'); }
                    });
                });
            } else if (tab === 'all') {
                const data = await API.get('/api/requests/all');
                if (!data.length) {
                    content.innerHTML = '<div class="card"><div class="empty-state"><p>Keine Anträge</p></div></div>';
                    return;
                }
                content.innerHTML = `<div class="card"><div class="table-wrapper"><table>
                    <thead><tr><th>Mitarbeiter</th><th>Typ</th><th>Von</th><th>Bis</th><th>Status</th><th>Bearbeitet von</th></tr></thead>
                    <tbody>${data.map(r => `<tr>
                        <td>${esc(r.user_name)}</td>
                        <td>${esc(typeLabel(r.type))}</td>
                        <td>${formatDate(r.date_from)}</td>
                        <td>${formatDate(r.date_to)}</td>
                        <td><span class="badge badge-${r.status}">${statusLabel(r.status)}</span></td>
                        <td class="text-muted text-sm">${r.reviewer_name ? esc(r.reviewer_name) : '—'}</td>
                    </tr>`).join('')}</tbody>
                </table></div></div>`;
            }
        } catch (err) { toast(err.message, 'error'); }
    }

    if (isSupervisor) {
        document.querySelectorAll('.tab').forEach(t => {
            t.addEventListener('click', () => loadTab(t.dataset.tab));
        });

        try {
            const pending = await API.get('/api/requests/pending');
            const badge = document.getElementById('pending-badge');
            if (pending.length) badge.textContent = `(${pending.length})`;
        } catch {}
    }

    await loadTab('my');

    document.getElementById('btn-new-request').addEventListener('click', () => {
        showModal(`
            <div class="modal-header"><h3>Neuer Antrag</h3><button class="modal-close" onclick="closeModal()">✕</button></div>
            <div class="form-group">
                <label>Typ</label>
                <select class="form-control" id="req-type">
                    <option value="urlaub">Urlaub</option>
                    <option value="gleitzeit">Gleitzeit</option>
                    <option value="homeoffice">Homeoffice</option>
                    <option value="krank">Krankmeldung</option>
                </select>
            </div>
            <div class="grid-2">
                <div class="form-group"><label>Von</label><input type="date" class="form-control" id="req-from"></div>
                <div class="form-group"><label>Bis</label><input type="date" class="form-control" id="req-to"></div>
            </div>
            <div class="form-group"><label>Notiz (optional)</label><textarea class="form-control" id="req-note" rows="3" placeholder="Zusätzliche Informationen..."></textarea></div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal()">Abbrechen</button>
                <button class="btn btn-primary" id="submit-request">Antrag stellen</button>
            </div>
        `);

        const today = formatDateISO(new Date());
        document.getElementById('req-from').value = today;
        document.getElementById('req-to').value = today;

        document.getElementById('submit-request').addEventListener('click', async () => {
            const type = document.getElementById('req-type').value;
            const dateFrom = document.getElementById('req-from').value;
            const dateTo = document.getElementById('req-to').value;
            const note = document.getElementById('req-note').value.trim();

            if (!dateFrom || !dateTo) { toast('Datum auswählen', 'error'); return; }

            try {
                await API.post('/api/requests', { type, dateFrom, dateTo, note: note || null });
                toast('Antrag eingereicht', 'success');
                closeModal();
                loadTab('my');
            } catch (err) { toast(err.message, 'error'); }
        });
    });
}
