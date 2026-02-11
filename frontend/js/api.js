const API = {
    base: '',
    token: localStorage.getItem('zs_token'),
    user: JSON.parse(localStorage.getItem('zs_user') || 'null'),

    setAuth(token, user) {
        this.token = token;
        this.user = user;
        localStorage.setItem('zs_token', token);
        localStorage.setItem('zs_user', JSON.stringify(user));
    },

    logout() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('zs_token');
        localStorage.removeItem('zs_user');
    },

    isLoggedIn() { return !!this.token && !!this.user; },

    async request(method, path, body) {
        const opts = {
            method,
            headers: { 'Content-Type': 'application/json' }
        };
        if (this.token) opts.headers['Authorization'] = `Bearer ${this.token}`;
        if (body) opts.body = JSON.stringify(body);

        const res = await fetch(`${this.base}${path}`, opts);
        const data = await res.json();

        if (res.status === 401) {
            this.logout();
            window.location.hash = '#/login';
            throw new Error('Session abgelaufen');
        }

        if (!res.ok) throw new Error(data.error || 'Anfrage fehlgeschlagen');
        return data;
    },

    get(path) { return this.request('GET', path); },
    post(path, body) { return this.request('POST', path, body); },
    put(path, body) { return this.request('PUT', path, body); },
    del(path) { return this.request('DELETE', path); }
};
