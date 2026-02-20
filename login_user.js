/**
 * login_user.js v1.0.0
 * Login overlay untuk USER
 * Cara pakai: <script src="login_user.js"></script>
 * Taruh di baris pertama dalam <body>
 */
(function () {
  const VERSION = '1.0.0';
  const API = 'https://lidan-co-id.pages.dev/api/contacts_filter_dinamis7';
  const SESSION_KEY = 'user_auth_session';
  const SESSION_HOURS = 8;
  const SECRET = 'admin';
  const ROLE = 'user';

  // ─── Session ───────────────────────────────────────────────────
  function getSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const s = JSON.parse(raw);
      if (!s || !s.expiry || !s.username) { localStorage.removeItem(SESSION_KEY); return null; }
      if (Date.now() > s.expiry) { localStorage.removeItem(SESSION_KEY); return null; }
      return s;
    } catch { localStorage.removeItem(SESSION_KEY); return null; }
  }

  function saveSession(username) {
    const s = { username, role: ROLE, expiry: Date.now() + SESSION_HOURS * 3600 * 1000 };
    try { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch (e) { console.warn('localStorage error:', e); }
  }

  function clearSession() {
    try { localStorage.removeItem(SESSION_KEY); } catch {}
  }

  // ─── Inject CSS ────────────────────────────────────────────────
  function injectCSS() {
    if (document.getElementById('__login_user_css')) return;
    const style = document.createElement('style');
    style.id = '__login_user_css';
    style.textContent = `
      #__login_user_overlay {
        position:fixed;inset:0;z-index:2147483647;
        background:rgba(8,15,25,0.97);
        display:flex;align-items:center;justify-content:center;
        font-family:'Segoe UI',sans-serif;
      }
      #__login_user_overlay * { box-sizing:border-box; }
      #__login_user_card {
        background:#0d1520;border:1px solid #1a2a3a;border-radius:14px;
        padding:40px 36px;width:100%;max-width:400px;
        box-shadow:0 0 60px rgba(30,120,255,0.12);
        position:relative;animation:__lu_slide .4s cubic-bezier(.16,1,.3,1) both;
      }
      #__login_user_card::before {
        content:'';position:absolute;top:0;left:20px;right:20px;height:2px;
        background:linear-gradient(90deg,transparent,#2979ff,transparent);border-radius:2px;
      }
      @keyframes __lu_slide { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
      #__login_user_card h2 {
        color:#fff;font-size:20px;font-weight:700;letter-spacing:3px;
        text-transform:uppercase;text-align:center;margin:0 0 6px;
      }
      #__login_user_card .sub {
        text-align:center;font-size:11px;color:#334466;letter-spacing:2px;
        font-family:'Courier New',monospace;margin-bottom:28px;
      }
      #__login_user_card label {
        display:block;font-size:11px;color:#334466;letter-spacing:1.5px;
        text-transform:uppercase;margin-bottom:6px;font-family:'Courier New',monospace;
      }
      #__login_user_card input {
        width:100%;background:#080f19;border:1px solid #1a2a3a;border-radius:7px;
        padding:11px 14px;color:#fff;font-size:14px;outline:none;
        transition:border-color .2s,box-shadow .2s;margin-bottom:16px;
        font-family:'Courier New',monospace;
      }
      #__login_user_card input:focus { border-color:#2979ff;box-shadow:0 0 0 3px rgba(41,121,255,.1); }
      #__login_user_card .secret-row {
        display:flex;align-items:center;gap:8px;margin-bottom:18px;cursor:pointer;
      }
      #__login_user_card .secret-row input { width:auto;margin:0;padding:0;accent-color:#2979ff; }
      #__login_user_card .secret-row span { font-size:11px;color:#334466;font-family:'Courier New',monospace; }
      #__lu_btn {
        width:100%;padding:13px;background:#2979ff;border:none;border-radius:7px;
        color:#fff;font-size:15px;font-weight:700;letter-spacing:2px;text-transform:uppercase;
        cursor:pointer;transition:all .2s;
      }
      #__lu_btn:hover:not(:disabled) { background:#448aff;box-shadow:0 0 24px rgba(41,121,255,.5); }
      #__lu_btn:disabled { opacity:.5;cursor:not-allowed; }
      #__lu_alert {
        margin-top:14px;padding:10px 14px;border-radius:6px;
        font-size:12px;font-family:'Courier New',monospace;display:none;
      }
      #__lu_alert.error { background:rgba(255,50,50,.1);border:1px solid rgba(255,50,50,.3);color:#ff6b6b;display:block; }
      #__lu_alert.success { background:rgba(0,200,100,.08);border:1px solid rgba(0,200,100,.25);color:#4caf88;display:block; }
      @keyframes __lu_spin { to{transform:rotate(360deg)} }
      .__lu_spinner {
        display:inline-block;width:13px;height:13px;
        border:2px solid rgba(255,255,255,.3);border-top-color:#fff;
        border-radius:50%;animation:__lu_spin .7s linear infinite;
        vertical-align:middle;margin-right:6px;
      }
      #__logout_user_btn {
        position:fixed;bottom:20px;right:20px;z-index:2147483646;
        background:#0d1520;color:#c0d0e0;border:1.5px solid #2979ff;
        border-radius:8px;padding:8px 16px;font-size:12px;
        font-family:'Courier New',monospace;cursor:pointer;
        box-shadow:0 4px 20px rgba(41,121,255,.25);transition:all .2s;letter-spacing:.5px;
      }
      #__logout_user_btn:hover { background:#2979ff;color:#fff; }
    `;
    document.head.appendChild(style);
  }

  // ─── Inject Overlay ────────────────────────────────────────────
  function injectOverlay() {
    if (document.getElementById('__login_user_overlay')) return;
    const div = document.createElement('div');
    div.id = '__login_user_overlay';
    div.innerHTML = `
      <div id="__login_user_card">
        <h2>User Login</h2>
        <div class="sub">MEMBER ACCESS · v${VERSION}</div>
        <label>Username</label>
        <input type="text" id="__lu_user" placeholder="username" autocomplete="username" />
        <label>Password</label>
        <input type="password" id="__lu_pass" placeholder="password" autocomplete="current-password" />
        <label class="secret-row">
          <input type="checkbox" id="__lu_secret" />
          <span>Gunakan Secret Key (localhost / domain tidak terdaftar)</span>
        </label>
        <button id="__lu_btn" onclick="__luDoLogin()">Masuk</button>
        <div id="__lu_alert"></div>
      </div>
    `;
    document.body.insertBefore(div, document.body.firstChild);

    const h = window.location.hostname;
    if (h === 'localhost' || h === '127.0.0.1' || h.startsWith('192.168.') || h.startsWith('10.')) {
      document.getElementById('__lu_secret').checked = true;
    }

    div.addEventListener('keydown', (e) => { if (e.key === 'Enter') window.__luDoLogin(); });
    setTimeout(() => document.getElementById('__lu_user').focus(), 100);
  }

  // ─── Inject Logout Button ──────────────────────────────────────
  function injectLogoutBtn(username) {
    if (document.getElementById('__logout_user_btn')) return;
    const btn = document.createElement('button');
    btn.id = '__logout_user_btn';
    btn.innerHTML = '👤 Logout <span style="opacity:.6">' + username + '</span>';
    btn.onclick = () => { if (confirm('Yakin logout?')) { clearSession(); location.reload(); } };
    document.body.appendChild(btn);
  }

  // ─── Login Logic ───────────────────────────────────────────────
  window.__luDoLogin = async function () {
    const username = document.getElementById('__lu_user').value.trim();
    const password = document.getElementById('__lu_pass').value;
    const useSecret = document.getElementById('__lu_secret').checked;
    const alertEl = document.getElementById('__lu_alert');
    const btn = document.getElementById('__lu_btn');

    alertEl.className = '__lu_alert'; alertEl.style.display = 'none';

    if (!username || !password) {
      alertEl.className = 'error'; alertEl.textContent = 'Username dan password wajib diisi.'; return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="__lu_spinner"></span>MEMPROSES...';

    try {
      const headers = { 'Content-Type': 'application/json', 'X-Role': ROLE };
      if (useSecret) headers['X-Custom-Auth'] = SECRET;

      const res = await fetch(API + '?action=login', {
        method: 'POST', headers,
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (data.success) {
        alertEl.className = 'success'; alertEl.textContent = '✓ Login berhasil!';
        saveSession(username);
        setTimeout(() => {
          document.getElementById('__login_user_overlay').remove();
          injectLogoutBtn(username);
        }, 600);
      } else {
        alertEl.className = 'error'; alertEl.textContent = data.message || 'Username atau password salah.';
      }
    } catch (err) {
      alertEl.className = 'error'; alertEl.textContent = 'Gagal terhubung ke server.';
    } finally {
      btn.disabled = false; btn.innerHTML = 'Masuk';
    }
  };

  // ─── Init ──────────────────────────────────────────────────────
  function init() {
    injectCSS();
    const session = getSession();
    if (session) {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => injectLogoutBtn(session.username));
      } else {
        injectLogoutBtn(session.username);
      }
      return;
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', injectOverlay);
    } else {
      injectOverlay();
    }
  }

  init();
})();