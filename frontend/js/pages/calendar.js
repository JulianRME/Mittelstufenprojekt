function renderCalendar() {
    return renderLayout(`
        <div class="page-header">
            <h2>Kalender</h2>
            <p>Übersicht deiner Arbeits- und Abwesenheitstage</p>
        </div>
        <div class="card">
            <div class="calendar-container">
                <div class="calendar-header">
                    <button class="btn btn-ghost" id="cal-prev">◄</button>
                    <h3 id="cal-title"></h3>
                    <button class="btn btn-ghost" id="cal-next">►</button>
                </div>
                <div class="calendar-grid" id="cal-grid"></div>
                <div class="calendar-legend">
                    <div class="legend-item"><div class="legend-dot" style="background:var(--success)"></div>Urlaub</div>
                    <div class="legend-item"><div class="legend-dot" style="background:var(--info)"></div>Homeoffice</div>
                    <div class="legend-item"><div class="legend-dot" style="background:var(--danger)"></div>Krank</div>
                    <div class="legend-item"><div class="legend-dot" style="background:var(--warning)"></div>Gleitzeit</div>
                </div>
            </div>
        </div>
    `);
}

async function bindCalendar() {
    bindSidebar();

    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();
    let requests = [];

    const MONTHS = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];

    async function loadRequests() {
        try {
            requests = await API.get('/api/requests/my');
            requests = requests.filter(r => r.status === 'approved' || r.status === 'pending');
        } catch {}
    }

    function getEventForDate(dateStr) {
        for (const req of requests) {
            if (dateStr >= req.date_from.split('T')[0] && dateStr <= req.date_to.split('T')[0]) {
                return req.type;
            }
        }
        return null;
    }

    function renderMonth() {
        document.getElementById('cal-title').textContent = `${MONTHS[currentMonth]} ${currentYear}`;

        const grid = document.getElementById('cal-grid');
        let html = '';
        WEEKDAYS_SHORT.forEach(d => { html += `<div class="calendar-day-header">${d}</div>`; });

        const firstDay = new Date(currentYear, currentMonth, 1);
        let startDay = (firstDay.getDay() + 6) % 7;
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const prevDays = new Date(currentYear, currentMonth, 0).getDate();
        const today = formatDateISO(new Date());

        for (let i = startDay - 1; i >= 0; i--) {
            html += `<div class="calendar-day other-month">${prevDays - i}</div>`;
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const isToday = dateStr === today;
            const event = getEventForDate(dateStr);
            const classes = ['calendar-day'];
            if (isToday) classes.push('today');
            if (event) { classes.push('has-event'); classes.push(event); }
            html += `<div class="${classes.join(' ')}" data-date="${dateStr}">${d}</div>`;
        }

        const totalCells = startDay + daysInMonth;
        const remaining = (7 - (totalCells % 7)) % 7;
        for (let i = 1; i <= remaining; i++) {
            html += `<div class="calendar-day other-month">${i}</div>`;
        }

        grid.innerHTML = html;
    }

    await loadRequests();
    renderMonth();

    document.getElementById('cal-prev').addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) { currentMonth = 11; currentYear--; }
        renderMonth();
    });

    document.getElementById('cal-next').addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) { currentMonth = 0; currentYear++; }
        renderMonth();
    });
}
