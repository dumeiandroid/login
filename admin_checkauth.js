/**
 * admin_checkauth.js
 * Sisipkan di halaman manapun: <script src="admin_checkauth.js"></script>
 * 
 * Konfigurasi bisa di-override sebelum tag script:
 *   window.CHECKAUTH_CONFIG = { loginUrl: '...', sessionHours: 8 }
 */
(function () {
  const VERSION = '2.0.0';
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
  //   hilangkan https:// atau http://
  // Contoh: http://localhost/aplikasi/login/coba.html
  //       → localhost~aplikasi~login~coba|html
  function urlToP(url) {
    try {
      const parsed = new URL(url);
      // host + pathname (tanpa trailing slash)
      const raw = parsed.host + parsed.pathname.replace(/\/$/, '');
      return raw.replace(/\./g, '|').replace(/\//g, '~');
    } catch {
      return url.replace(/^https?:\/\//, '').replace(/\./g, '|').replace(/\//g, '~');
    }
  }

  // Konversi p → URL:
  //   pipa  (|) → titik (.)
  //   tilde (~) → slash (/)
  function pToUrl(p) {
    const path = p.replace(/\|/g, '.').replace(/~/g, '/');
    // Deteksi apakah localhost atau IP (tidak pakai https)
    const isLocal = /^localhost/.test(path) || /^127\./.test(path) || /^192\./.test(path);
    return (isLocal ? 'http://' : 'https://') + path;
  }

  function getCurrentP() {
    // Ambil full URL tanpa query string dan hash
    const clean = window.location.href.split('?')[0].split('#')[0];
    return urlToP(clean);
  }

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
  }

  function clearSession() {
    localStorage.removeItem(CONFIG.localStorageKey);
  }

  function redirectToLogin(p) {
    const loginUrl = CONFIG.loginUrl + '?p=' + encodeURIComponent(p);
    window.location.href = loginUrl;
  }

  // --- Logout ---
  function logout() {
    const p = getCurrentP();
    clearSession();
    redirectToLogin(p);
  }

  // Expose logout globally supaya bisa dipanggil manual juga
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
    btn.onmouseover = () => {
      btn.style.background = '#e94560';
      btn.style.color = '#fff';
    };
    btn.onmouseout = () => {
      btn.style.background = '#1a1a2e';
      btn.style.color = '#e0e0e0';
    };
    btn.onclick = () => {
      if (confirm('Yakin ingin logout?')) logout();
    };

    document.body.appendChild(btn);
  }

  // --- Main Auth Check ---
  function checkAuth() {
    const session = getSession();

    if (session) {
      // Sudah login & session valid → inject logout button
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectLogoutButton);
      } else {
        injectLogoutButton();
      }
      return; // Akses diizinkan
    }

    // Belum login → redirect ke login dengan parameter p
    const p = getCurrentP();
    redirectToLogin(p);
  }

  // --- Jalankan ---
  checkAuth();

})();