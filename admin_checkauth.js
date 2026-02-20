/**
 * admin_checkauth.js v2.1.0
 * Sisipkan di halaman manapun: <script src="https://login.lidan.co.id/admin_checkauth.js"></script>
 *ok
 * Konfigurasi bisa di-override sebelum tag script:
 *   window.CHECKAUTH_CONFIG = { loginUrl: '...', sessionHours: 8 }
 */
(function () {
  const VERSION = '2.1.0';
  console.log('%c[admin_checkauth.js] v' + VERSION, 'color:#e94560;font-weight:bold;font-size:13px');

  const CONFIG = Object.assign({
    loginUrl: 'https://login.lidan.co.id/admin_login.html',
    sessionHours: 8,
    localStorageKey: 'admin_auth_session',
    logoutBtnId: '__admin_logout_btn',
  }, window.CHECKAUTH_CONFIG || {});

  // --- Helpers ---
  // Konversi URL → p:
  //   titik  (.) → pipa  (|)
  //   slash  (/) → tilde (~)
  // Contoh: http://localhost/aplikasi/login/coba.html
  //       → localhost~aplikasi~login~coba|html
  function urlToP(url) {
    try {
      const parsed = new URL(url);
      const raw = parsed.host + parsed.pathname.replace(/\/$/, '');
      return raw.replace(/\./g, '|').replace(/\//g, '~');
    } catch {
      return url.replace(/^https?:\/\//, '').replace(/\./g, '|').replace(/\//g, '~');
    }
  }

  // Konversi p → URL
  function pToUrl(p) {
    const path = p.replace(/\|/g, '.').replace(/~/g, '/');
    const isLocal = /^localhost/.test(path) || /^127\./.test(path) || /^192\./.test(path);
    return (isLocal ? 'http://' : 'https://') + path;
  }

  function getCurrentP() {
    const clean = window.location.href.split('?')[0].split('#')[0];
    return urlToP(clean);
  }

  // --- Session ---
  function getSession() {
    try {
      const raw = localStorage.getItem(CONFIG.localStorageKey);
      if (!raw) return null;
      const session = JSON.parse(raw);
      if (!session || !session.expiry) return null;
      if (Date.now() > session.expiry) {
        localStorage.removeItem(CONFIG.localStorageKey);
        return null;
      }
      return session;
    } catch { return null; }
  }

  function saveSession(data) {
    const session = {
      ...data,
      expiry: Date.now() + CONFIG.sessionHours * 60 * 60 * 1000,
    };
    localStorage.setItem(CONFIG.localStorageKey, JSON.stringify(session));
    console.log('%c[admin_checkauth.js] Session disimpan di localStorage origin ini', 'color:#4caf88');
  }

  function clearSession() {
    localStorage.removeItem(CONFIG.localStorageKey);
  }

  function redirectToLogin(p) {
    const loginUrl = CONFIG.loginUrl + '?p=' + encodeURIComponent(p);
    console.log('%c[admin_checkauth.js] Redirect ke login: ' + loginUrl, 'color:#e94560');
    window.location.href = loginUrl;
  }

  // --- Token dari URL hash ---
  // Setelah login, admin_login.html redirect ke:
  //   http://localhost/halaman.html#auth=BASE64_SESSION
  // admin_checkauth.js membaca token ini, simpan ke localStorage lokal,
  // lalu hapus hash dari URL agar tidak terlihat.
  function extractTokenFromHash() {
    const hash = window.location.hash; // misal: #auth=eyJ1c2VybmFtZSI6...
    if (!hash.startsWith('#auth=')) return null;
    try {
      const b64 = decodeURIComponent(hash.slice(6));
      const session = JSON.parse(atob(b64));
      return session;
    } catch (e) {
      console.warn('[admin_checkauth.js] Token hash tidak valid:', e);
      return null;
    }
  }

  function clearHashFromUrl() {
    // Hapus hash dari URL tanpa reload halaman
    const cleanUrl = window.location.href.split('#')[0];
    window.history.replaceState(null, '', cleanUrl);
  }

  // --- Logout ---
  function logout() {
    const p = getCurrentP();
    clearSession();
    redirectToLogin(p);
  }

  window.adminLogout = logout;

  // --- Inject floating logout button ---
  function injectLogoutButton() {
    if (document.getElementById(CONFIG.logoutBtnId)) return;

    const btn = document.createElement('button');
    btn.id = CONFIG.logoutBtnId;
    btn.textContent = 'Logout Admin';
    btn.title = 'Logout dari sesi admin';
    btn.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 99999;
      background: #1a1a2e;
      color: #e0e0e0;
      border: 1.5px solid #e94560;
      border-radius: 8px;
      padding: 8px 18px;
      font-size: 13px;
      font-family: 'Courier New', monospace;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(233,69,96,0.3);
      transition: all 0.2s ease;
      letter-spacing: 0.5px;
    `;
    btn.onmouseover = () => { btn.style.background = '#e94560'; btn.style.color = '#fff'; };
    btn.onmouseout  = () => { btn.style.background = '#1a1a2e'; btn.style.color = '#e0e0e0'; };
    btn.onclick = () => { if (confirm('Yakin ingin logout?')) logout(); };

    document.body.appendChild(btn);
  }

  // --- Main Auth Check ---
  function checkAuth() {
    // 1. Cek apakah ada token di URL hash (baru redirect dari login)
    const tokenSession = extractTokenFromHash();
    if (tokenSession) {
      console.log('%c[admin_checkauth.js] Token ditemukan di hash, simpan session...', 'color:#4caf88');
      saveSession(tokenSession);
      clearHashFromUrl();
      // Lanjut tampilkan halaman
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectLogoutButton);
      } else {
        injectLogoutButton();
      }
      return;
    }

    // 2. Cek session di localStorage
    const session = getSession();
    if (session) {
      console.log('%c[admin_checkauth.js] Session valid: ' + session.username, 'color:#4caf88');
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectLogoutButton);
      } else {
        injectLogoutButton();
      }
      return;
    }

    // 3. Belum login → redirect ke login
    const p = getCurrentP();
    redirectToLogin(p);
  }

  checkAuth();

})();