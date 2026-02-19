// checkAuth.js
// Letakkan file ini di folder yang mudah diakses, lalu panggil di setiap halaman:
// <script src="/checkAuth.js"></script>
// Lalu panggil: checkAuth('admin') atau checkAuth('user') atau checkAuth() untuk semua role

// ─── KONFIGURASI ─────────────────────────────────────
const AUTH_CONFIG = {
  API_URL    : 'https://your-worker.workers.dev', // ← ganti ini
  API_SECRET : 'admin',                            // ← ganti ini
  LOGIN_PAGE : '/login.html',                      // ← ganti jika perlu
};
// ─────────────────────────────────────────────────────

/**
 * Cek apakah user sudah login.
 * @param {string|null} requiredRole - 'admin', 'user', atau null (semua role boleh)
 * 
 * Contoh penggunaan di halaman admin:
 *   checkAuth('admin');
 * 
 * Contoh penggunaan di halaman yang boleh diakses semua role:
 *   checkAuth();
 */
async function checkAuth(requiredRole = null) {
  const token = localStorage.getItem('auth_token');
  const role  = localStorage.getItem('auth_role');
  const user  = localStorage.getItem('auth_user');

  // 1. Cek apakah localStorage ada
  if (!token || !role || !user) {
    redirectToLogin();
    return;
  }

  // 2. Cek role sesuai tidak
  if (requiredRole && role !== requiredRole) {
    redirectToLogin('Role tidak sesuai.');
    return;
  }

  // 3. Verifikasi token ke API (opsional tapi lebih aman)
  // Uncomment bagian ini jika ingin verifikasi setiap halaman dibuka:
  /*
  const valid = await verifyToAPI(role, user);
  if (!valid) {
    redirectToLogin('Sesi tidak valid. Silakan login ulang.');
    return;
  }
  */

  // 4. Berhasil → return data user agar bisa dipakai halaman
  return JSON.parse(user);
}

/**
 * Verifikasi sesi ke API (opsional, lebih aman)
 * Saat ini API belum punya endpoint verify khusus,
 * jadi ini sebagai placeholder untuk dikembangkan.
 */
async function verifyToAPI(role, userData) {
  try {
    const user = JSON.parse(userData);
    const res = await fetch(`${AUTH_CONFIG.API_URL}?action=login`, {
      method: 'POST',
      headers: {
        'Content-Type'  : 'application/json',
        'X-Custom-Auth' : AUTH_CONFIG.API_SECRET,
        'X-Role'        : role,
      },
      body: JSON.stringify({ username: user.x_01, password: user.x_02 }),
    });
    const data = await res.json();
    return data.success === true;
  } catch {
    return false;
  }
}

/**
 * Hapus localStorage dan redirect ke halaman login
 */
function redirectToLogin(message = null) {
  if (message) {
    localStorage.setItem('auth_redirect_msg', message);
  }
  // Simpan URL asal agar setelah login bisa kembali ke sini
  localStorage.setItem('auth_redirect_back', window.location.href);
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_role');
  localStorage.removeItem('auth_user');
  window.location.href = AUTH_CONFIG.LOGIN_PAGE;
}

/**
 * Logout manual — panggil di tombol logout
 * Contoh: <button onclick="logout()">Logout</button>
 */
function logout() {
  redirectToLogin();
}

/**
 * Ambil data user yang sedang login
 */
function getAuthUser() {
  const user = localStorage.getItem('auth_user');
  return user ? JSON.parse(user) : null;
}

/**
 * Ambil role yang sedang login
 */
function getAuthRole() {
  return localStorage.getItem('auth_role');
}
