/**
 * login_admin.js v1.0.0
 * Login overlay untuk ADMIN
 * Cara pakai: <script src="login_admin.js"></script>
 * Taruh di baris pertama dalam <body>
 */
(function () {
  const VERSION = '1.0.0';
  const API = 'https://lidan-co-id.pages.dev/api/contacts_filter_dinamis7';
  const SESSION_KEY = 'admin_auth_session';
  const SESSION_HOURS = 8;
  const SECRET = 'admin';
  const ROLE = 'admin';

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
    if (document.getElementById('__login_admin_css')) return;
    const style = document.createElement('style');
    style.id = '__login_admin_css';
    style.textContent = `
      #__login_admin_overlay {
        position:fixed;inset:0;z-index:2147483647;
        background:rgba(10,10,20,0.97);
        display:flex;align-items:center;justify-content:center;
        font-family:'Segoe UI',sans-serif;
      }
      #__login_admin_overlay * { box-sizing:border-box; }
      #__login_admin_card {
        background:#10101e;border:1px solid #1e1e3a;border-radius:14px;
        padding:40px 36px;width:100%;max-width:400px;
        box-shadow:0 0 60px rgba(233,69,96,0.15);
        position:relative;animation:__la_slide .4s cubic-bezier(.16,1,.3,1) both;
      }
      #__login_admin_card::before {
        content:'';position:absolute;top:0;left:20px;right:20px;height:2px;
        background:linear-gradient(90deg,transparent,#e94560,transparent);border-radius:2px;
      }
      @keyframes __la_slide { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
      #__login_admin_card h2 {
        color:#fff;font-size:20px;font-weight:700;letter-spacing:3px;
        text-transform:uppercase;text-align:center;margin:0 0 6px;
      }
      #__login_admin_card .sub {
        text-align:center;font-size:11px;color:#555577;letter-spacing:2px;
        font-family:'Courier New',monospace;margin-bottom:28px;
      }
      #__login_admin_card label {
        display:block;font-size:11px;color:#555577;letter-spacing:1.5px;
        text-transform:uppercase;margin-bottom:6px;font-family:'Courier New',monospace;
      }
      #__login_admin_card input {
        width:100%;background:#0d0d1a;border:1px solid #1e1e3a;border-radius:7px;
        padding:11px 14px;color:#fff;font-size:14px;outline:none;
        transition:border-color .2s,box-shadow .2s;margin-bottom:16px;
        font-family:'Courier New',monospace;
      }
      #__login_admin_card input:focus { border-color:#e94560;box-shadow:0 0 0 3px rgba(233,69,96,.1); }
      #__login_admin_card .secret-row {
        display:flex;align-items:center;gap:8px;margin-bottom:18px;cursor:pointer;
      }
      #__login_admin_card .secret-row input { width:auto;margin:0;padding:0;accent-color:#e94560; }
      #__login_admin_card .secret-row span { font-size:11px;color:#555577;font-family:'Courier New',monospace; }
      #__la_btn {
        width:100%;padding:13px;background:#e94560;border:none;border-radius:7px;
        color:#fff;font-size:15px;font-weight:700;letter-spacing:2px;text-transform:uppercase;
        cursor:pointer;transition:all .2s;
      }
      #__la_btn:hover:not(:disabled) { background:#ff2d4e;box-shadow:0 0 24px rgba(233,69,96,.5); }
      #__la_btn:disabled { opacity:.5;cursor:not-allowed; }
      #__la_alert {
        margin-top:14px;padding:10px 14px;border-radius:6px;
        font-size:12px;font-family:'Courier New',monospace;display:none;
      }
      #__la_alert.error { background:rgba(233,69,96,.1);border:1px solid rgba(233,69,96,.3);color:#ff6b81;display:block; }
      #__la_alert.success { background:rgba(0,200,100,.08);border:1px solid rgba(0,200,100,.25);color:#4caf88;display:block; }
      @keyframes __la_spin { to{transform:rotate(360deg)} }
      .__la_spinner {
        display:inline-block;width:13px;height:13px;
        border:2px solid rgba(255,255,255,.3);border-top-color:#fff;
        border-radius:50%;animation:__la_spin .7s linear infinite;
        vertical-align:middle;margin-right:6px;
      }
      #__logout_admin_btn {
        position:fixed;bottom:20px;right:20px;z-index:2147483646;
        background:#1a1a2e;color:#e0e0e0;border:1.5px solid #e94560;
        border-radius:8px;padding:8px 16px;font-size:12px;
        font-family:'Courier New',monospace;cursor:pointer;
        box-shadow:0 4px 20px rgba(233,69,96,.3);transition:all .2s;letter-spacing:.5px;
      }
      #__logout_admin_btn:hover { background:#e94560;color:#fff; }
    `;
    document.head.appendChild(style);
  }

  // ─── Inject Overlay ────────────────────────────────────────────
  function injectOverlay() {
    if (document.getElementById('__login_admin_overlay')) return;
    const div = document.createElement('div');
    div.id = '__login_admin_overlay';
    div.innerHTML = `
      <div id="__login_admin_card">
        <h2>Admin Login</h2>
        <div class="sub">SECURE ACCESS · v${VERSION}</div>
        <label>Username</label>
        <input type="text" id="__la_user" placeholder="username" autocomplete="username" />
        <label>Password</label>
        <input type="password" id="__la_pass" placeholder="password" autocomplete="current-password" />
        <label class="secret-row">
          <input type="checkbox" id="__la_secret" />
          <span>Gunakan Secret Key (localhost / domain tidak terdaftar)</span>
        </label>
        <button id="__la_btn" onclick="__laDoLogin()">Masuk</button>
        <div id="__la_alert"></div>
      </div>
    `;
    document.body.insertBefore(div, document.body.firstChild);

    // Auto centang secret key jika localhost
    const h = window.location.hostname;
    if (h === 'localhost' || h === '127.0.0.1' || h.startsWith('192.168.') || h.startsWith('10.')) {
      document.getElementById('__la_secret').checked = true;
    }

    // Enter trigger login
    div.addEventListener('keydown', (e) => { if (e.key === 'Enter') window.__laDoLogin(); });
    setTimeout(() => document.getElementById('__la_user').focus(), 100);
  }

  // ─── Inject Logout Button ──────────────────────────────────────
  function injectLogoutBtn(username) {
    if (document.getElementById('__logout_admin_btn')) return;
    const btn = document.createElement('button');
    btn.id = '__logout_admin_btn';
    btn.innerHTML = '🔒 Logout <span style="opacity:.6">' + username + '</span>';
    btn.onclick = () => { if (confirm('Yakin logout?')) { clearSession(); location.reload(); } };
    document.body.appendChild(btn);
  }

  // ─── Login Logic ───────────────────────────────────────────────
  window.__laDoLogin = async function () {
    const username = document.getElementById('__la_user').value.trim();
    const password = document.getElementById('__la_pass').value;
    const useSecret = document.getElementById('__la_secret').checked;
    const alertEl = document.getElementById('__la_alert');
    const btn = document.getElementById('__la_btn');

    alertEl.className = '__la_alert'; alertEl.style.display = 'none';

    if (!username || !password) {
      alertEl.className = 'error'; alertEl.textContent = 'Username dan password wajib diisi.'; return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="__la_spinner"></span>MEMPROSES...';

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
          document.getElementById('__login_admin_overlay').remove();
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
      // Sudah login → langsung inject logout button
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => injectLogoutBtn(session.username));
      } else {
        injectLogoutBtn(session.username);
      }
      return;
    }
    // Belum login → tampilkan overlay
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', injectOverlay);
    } else {
      injectOverlay();
    }
  }

  init();
})();