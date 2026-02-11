function esc(str) {
    if (str == null) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
}

function formatMinutes(min) {
    if (min == null) return '0:00';
    const neg = min < 0;
    const abs = Math.abs(Math.floor(min));
    const h = Math.floor(abs / 60);
    const m = abs % 60;
    return `${neg ? '-' : ''}${h}:${String(m).padStart(2, '0')}`;
}

function formatTime(dateStr) {
    if (!dateStr) return '--:--';
    const d = new Date(dateStr);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
}

function formatDateISO(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function toast(msg, type = 'info') {
    const container = document.getElementById('toasts');
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = msg;
    container.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 3500);
}

function showModal(html) {
    document.getElementById('modal-content').innerHTML = html;
    document.getElementById('modal-overlay').classList.add('active');
}

function closeModal() {
    document.getElementById('modal-overlay').classList.remove('active');
}

document.getElementById('modal-overlay').addEventListener('click', e => {
    if (e.target.id === 'modal-overlay') closeModal();
});

function roleLabel(role) {
    const labels = { admin: 'Administrator', vorgesetzter: 'Vorgesetzter', arbeiter: 'Mitarbeiter' };
    return labels[role] || role;
}

function typeLabel(type) {
    const labels = { urlaub: 'Urlaub', gleitzeit: 'Gleitzeit', homeoffice: 'Homeoffice', krank: 'Krank' };
    return labels[type] || type;
}

function statusLabel(status) {
    const labels = { pending: 'Ausstehend', approved: 'Genehmigt', denied: 'Abgelehnt' };
    return labels[status] || status;
}

const WEEKDAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
const WEEKDAYS_SHORT = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
