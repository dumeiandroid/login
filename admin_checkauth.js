/**
 * admin_checkauth.js v3.0.0
 * Sisipkan di halaman manapun:
 *   <script src="https://login.lidan.co.id/admin_checkauth.js"></script>
 *
 * Override config (opsional, taruh SEBELUM tag script):
 *   window.CHECKAUTH_CONFIG = { loginUrl: '...', sessionHours: 8 }
 */
(function () {
  const VERSION = '3.0.0';
  console.log('%c[admin_checkauth.js] v' + VERSION, 'color:#e94560;font-weight:bold;font-size:13px');

  const CONFIG = Object.assign({
    loginUrl: 'https://login.lidan.co.id/admin_login.html',
    sessionHours: 8,
    localStorageKey: 'admin_auth_session',
    logoutBtnId: '__admin_logout_btn',
  }, window.CHECKAUTH_CONFIG || {});

  // ─── URL Helpers ───────────────────────────────────────────────
  // . → |   / → ~   (hilangkan protokol)
  function urlToP(url) {
    try {
      const parsed = new URL(url);
      const raw = parsed.host + parsed.pathname.replace(/\/$/, '');
      return raw.replace(/\./g, '|').replace(/\//g, '~');
    } catch {
      return url.replace(/^https?:\/\//, '').replace(/\./g, '|').replace(/\//g, '~');
    }
  }

  // | → .   ~ → /   deteksi http vs https otomatis
  function pToUrl(p) {
    const path = p.replace(/\|/g, '.').replace(/~/g, '/');
    const isLocal = /^localhost(:\d+)?$/.test(path.split('/')[0])
                 || /^127\./.test(path)
                 || /^192\.168\./.test(path)
                 || /^10\./.test(path);
    return (isLocal ? 'http://' : 'https://') + path;
  }

  function getCurrentP() {
    const clean = window.location.href.split('?')[0].split('#')[0];
    return urlToP(clean);
  }

  // ─── localStorage (safe) ───────────────────────────────────────
  function lsGet(key) {
    try { return localStorage.getItem(key); }
    catch (e) { console.warn('[checkauth] localStorage.getItem error:', e); return null; }
  }

  function lsSet(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.warn('[checkauth] localStorage.setItem error:', e);
      return false;
    }
  }

  function lsRemove(key) {
    try { localStorage.removeItem(key); } catch (e) { /* ignore */ }
  }

  // ─── Session ───────────────────────────────────────────────────
  function getSession() {
    const raw = lsGet(CONFIG.localStorageKey);
    if (!raw) return null;
    try {
      const session = JSON.parse(raw);
      // Validasi struktur
      if (!session || typeof session !== 'object') { lsRemove(CONFIG.localStorageKey); return null; }
      if (!session.expiry || typeof session.expiry !== 'number') { lsRemove(CONFIG.localStorageKey); return null; }
      if (!session.username) { lsRemove(CONFIG.localStorageKey); return null; }
      // Cek expired
      if (Date.now() > session.expiry) {
        console.log('%c[checkauth] Session expired, hapus.', 'color:#aaa');
        lsRemove(CONFIG.localStorageKey);
        return null;
      }
      return session;
    } catch (e) {
      console.warn('[checkauth] Session JSON corrupt, hapus:', e);
      lsRemove(CONFIG.localStorageKey);
      return null;
    }
  }

  function saveSession(sessionData) {
    // Pastikan expiry dari token TIDAK dipakai ulang jika sudah expired
    if (!sessionData || Date.now() > (sessionData.expiry || 0)) {
      console.warn('[checkauth] Token sudah expired, tidak disimpan.');
      return false;
    }
    // Simpan apa adanya (expiry sudah dihitung di login.html)
    const ok = lsSet(CONFIG.localStorageKey, JSON.stringify(sessionData));
    if (ok) {
      console.log('%c[checkauth] Session berhasil disimpan untuk: ' + sessionData.username, 'color:#4caf88');
    } else {
      console.error('[checkauth] GAGAL simpan session ke localStorage! (Private mode?)');
    }
    return ok;
  }

  function clearSession() {
    lsRemove(CONFIG.localStorageKey);
  }

  // ─── Token Hash ────────────────────────────────────────────────
  // admin_login.html redirect ke: halaman.html#auth=TOKEN
  // Token = base64url(JSON(session))
  function extractTokenFromHash() {
    const hash = window.location.hash;
    if (!hash.startsWith('#auth=')) return null;
    try {
      const encoded = hash.slice(6); // hapus '#auth='
      // Decode: encodeURIComponent → decodeURIComponent, lalu atob
      const b64 = decodeURIComponent(encoded);
      // Decode unicode-safe
      const jsonStr = decodeURIComponent(escape(atob(b64)));
      const session = JSON.parse(jsonStr);
      // Validasi minimal
      if (!session || !session.username || !session.expiry) {
        console.warn('[checkauth] Token tidak lengkap:', session);
        return null;
      }
      return session;
    } catch (e) {
      console.warn('[checkauth] Gagal decode token hash:', e);
      return null;
    }
  }

  function clearHashFromUrl() {
    try {
      const cleanUrl = window.location.pathname + window.location.search;
      window.history.replaceState(null, '', cleanUrl);
    } catch (e) { /* ignore jika history API tidak tersedia */ }
  }

  // ─── Redirect ──────────────────────────────────────────────────
  function redirectToLogin() {
    const p = getCurrentP();
    const loginUrl = CONFIG.loginUrl + '?p=' + encodeURIComponent(p);
    console.log('%c[checkauth] Redirect ke login → ' + loginUrl, 'color:#e94560');
    window.location.replace(loginUrl); // pakai replace agar tidak menumpuk history
  }

  // ─── Logout ────────────────────────────────────────────────────
  function logout() {
    clearSession();
    redirectToLogin();
  }
  window.adminLogout = logout;

  // ─── Floating Logout Button ────────────────────────────────────
  function injectLogoutButton(session) {
    if (document.getElementById(CONFIG.logoutBtnId)) return;
    const btn = document.createElement('button');
    btn.id = CONFIG.logoutBtnId;
    btn.title = 'Klik untuk logout';
    btn.innerHTML = '🔒 Logout <span style="opacity:0.6;font-size:11px">(' + (session.username || '') + ')</span>';
    btn.style.cssText = `
      position:fixed; bottom:20px; right:20px; z-index:2147483647;
      background:#1a1a2e; color:#e0e0e0;
      border:1.5px solid #e94560; border-radius:8px;
      padding:8px 16px; font-size:13px;
      font-family:'Courier New',monospace; cursor:pointer;
      box-shadow:0 4px 20px rgba(233,69,96,0.35);
      transition:all 0.2s ease; letter-spacing:0.5px;
    `;
    btn.onmouseover = () => { btn.style.background='#e94560'; btn.style.color='#fff'; };
    btn.onmouseout  = () => { btn.style.background='#1a1a2e'; btn.style.color='#e0e0e0'; };
    btn.onclick = () => { if (confirm('Yakin ingin logout?')) logout(); };
    document.body.appendChild(btn);
  }

  function whenReady(fn, arg) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => fn(arg));
    } else {
      fn(arg);
    }
  }

  // ─── Main ──────────────────────────────────────────────────────
  function checkAuth() {

    // STEP 1: Ada token di hash? (baru redirect dari login)
    const tokenSession = extractTokenFromHash();
    if (tokenSession) {
      const saved = saveSession(tokenSession);
      clearHashFromUrl();
      if (saved) {
        console.log('%c[checkauth] ✓ Login via token berhasil.', 'color:#4caf88;font-weight:bold');
        whenReady(injectLogoutButton, tokenSession);
        return;
      } else {
        // Gagal simpan (misal private mode) → tetap izinkan akses sesi ini
        // tapi simpan di memori saja
        console.warn('[checkauth] localStorage tidak bisa dipakai, session hanya di memori.');
        window.__adminSessionMem = tokenSession;
        whenReady(injectLogoutButton, tokenSession);
        return;
      }
    }

    // STEP 2: Cek memori (fallback private mode)
    if (window.__adminSessionMem && Date.now() < window.__adminSessionMem.expiry) {
      whenReady(injectLogoutButton, window.__adminSessionMem);
      return;
    }

    // STEP 3: Cek localStorage
    const session = getSession();
    if (session) {
      console.log('%c[checkauth] ✓ Session valid: ' + session.username, 'color:#4caf88;font-weight:bold');
      whenReady(injectLogoutButton, session);
      return;
    }

    // STEP 4: Tidak ada session → redirect login
    redirectToLogin();
  }

  checkAuth();

})();