function renderSettings() {
    return renderLayout(`
        <div class="page-header">
            <h2>Einstellungen</h2>
            <p>Profil und Arbeitszeitregeln</p>
        </div>
        <div class="grid-2">
            <div class="card">
                <div class="card-title mb-16">Passwort ändern</div>
                <div class="form-group"><label>Aktuelles Passwort</label><input type="password" class="form-control" id="pw-current"></div>
                <div class="form-group"><label>Neues Passwort</label><input type="password" class="form-control" id="pw-new"></div>
                <div class="form-group"><label>Neues Passwort bestätigen</label><input type="password" class="form-control" id="pw-confirm"></div>
                <button class="btn btn-primary mt-8" id="btn-change-pw">Passwort ändern</button>
            </div>
            <div class="card">
                <div class="card-title mb-16">Meine Arbeitszeiten</div>
                <div id="work-rules-display"></div>
            </div>
        </div>
    `);
}

async function bindSettings() {
    bindSidebar();

    document.getElementById('btn-change-pw').addEventListener('click', async () => {
        const current = document.getElementById('pw-current').value;
        const newPw = document.getElementById('pw-new').value;
        const confirm = document.getElementById('pw-confirm').value;

        if (!current || !newPw) { toast('Alle Felder ausfüllen', 'error'); return; }
        if (newPw !== confirm) { toast('Passwörter stimmen nicht überein', 'error'); return; }
        if (newPw.length < 6) { toast('Mindestens 6 Zeichen', 'error'); return; }

        try {
            await API.put('/api/auth/password', { currentPassword: current, newPassword: newPw });
            toast('Passwort geändert', 'success');
            document.getElementById('pw-current').value = '';
            document.getElementById('pw-new').value = '';
            document.getElementById('pw-confirm').value = '';
        } catch (err) { toast(err.message, 'error'); }
    });

    try {
        const data = await API.get(`/api/admin/work-rules/${API.user.id}`);
        let html = '<table><thead><tr><th>Tag</th><th>Kernzeit</th><th>Max. Stunden</th><th>Erlaubt</th></tr></thead><tbody>';

        WEEKDAYS.forEach((day, i) => {
            const rule = data.rules.find(r => r.weekday === i);
            if (rule) {
                html += `<tr>
                    <td>${day}</td>
                    <td class="text-sm">${rule.core_start && rule.core_end ? `${rule.core_start.substring(0,5)} — ${rule.core_end.substring(0,5)}` : '—'}</td>
                    <td class="text-sm">${formatMinutes(rule.max_daily_minutes)}h</td>
                    <td>${rule.work_allowed ? '<span class="badge badge-approved">Ja</span>' : '<span class="badge badge-denied">Nein</span>'}</td>
                </tr>`;
            }
        });

        html += '</tbody></table>';

        if (data.limits) {
            html += `<div class="mt-16 text-sm text-muted">
                Max. Wochenstunden: ${formatMinutes(data.limits.max_weekly_minutes)}h |
                Max. Überstunden: ${formatMinutes(data.limits.max_overtime_minutes)}h |
                Max. Minusstunden: ${formatMinutes(data.limits.max_undertime_minutes)}h
            </div>`;
        }

        document.getElementById('work-rules-display').innerHTML = html;
    } catch (err) {
        document.getElementById('work-rules-display').innerHTML = '<p class="text-muted">Keine Regeln konfiguriert</p>';
    }
}
