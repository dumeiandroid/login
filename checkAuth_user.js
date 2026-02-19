// checkAuth_user.js — Khusus untuk halaman USER
// Penggunaan di halaman user:
// <script src="https://login.lidan.co.id/checkAuth_user.js"></script>
// <script> checkAuth(); </script>

console.log('%c checkAuth_user.js v1.0 — loaded ✓', 'background:#5b9bd5;color:#fff;padding:3px 8px;border-radius:4px;font-weight:bold;');

// ─── KONFIGURASI ─────────────────────────────────────
const AUTH_CONFIG = {
  API_URL    : 'https://lidan-co-id.pages.dev/api/contacts_filter_dinamis7',
  API_SECRET : 'admin',                                         // ← ganti
  LOGIN_PAGE : 'https://login.lidan.co.id/login_user.html',    // ← selalu user
};
// ─────────────────────────────────────────────────────

async function checkAuth() {
  const token = localStorage.getItem('auth_token');
  const role  = localStorage.getItem('auth_role');
  const user  = localStorage.getItem('auth_user');

  // 1. Cek localStorage ada tidak
  if (!token || !role || !user) {
    redirectToLogin();
    return;
  }

  // 2. Wajib role user
  if (role !== 'user') {
    redirectToLogin('Akses ditolak.');
    return;
  }

  // 3. Berhasil → return data user
  return JSON.parse(user);
}

function redirectToLogin(message = null) {
  if (message) localStorage.setItem('auth_redirect_msg', message);
  localStorage.setItem('auth_redirect_back', window.location.href);
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_role');
  localStorage.removeItem('auth_user');
  window.location.href = AUTH_CONFIG.LOGIN_PAGE;
}

function logout() {
  window.location.href = 'https://login.lidan.co.id/logout_user.html';
}

function getAuthUser() {
  const user = localStorage.getItem('auth_user');
  return user ? JSON.parse(user) : null;
}

function getAuthRole() {
  return localStorage.getItem('auth_role');
}