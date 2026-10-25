/**
 * api.js - Quản lý kết nối API Backend & API Gateway cho CineMax
 */

const CONFIG = {
  // Ưu tiên gọi qua API Gateway (Ocelot - port 5000)
  GATEWAY_URL: "http://localhost:5000/api",
  // Cổng dự phòng gọi trực tiếp Backend API (port 5145)
  DIRECT_URL: "http://localhost:5145/api",
  ACTIVE_URL: "http://localhost:5000/api"
};

/** Hàm gửi request linh hoạt, tự động thử Gateway trước, nếu lỗi kết nối sẽ thử trực tiếp Backend*/
async function apiRequest(endpoint, method = "GET", body = null, needAuth = false) {
  const headers = {
    "Content-Type": "application/json"
  };

  if (needAuth) {
    const token = getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const options = {
    method: method,
    headers: headers
  };

  if (body && (method === "POST" || method === "PUT" || method === "DELETE")) {
    options.body = JSON.stringify(body);
  }

  // 1. Thử gửi tới URL Gateway trước
  try {
    const url = `${CONFIG.ACTIVE_URL}${endpoint}`;
    const response = await fetch(url, options);
    const data = await response.json().catch(() => null);

    return {
      status: response.status,
      ok: response.ok,
      data: data
    };
  } catch (err) {
    // Nếu Gateway không phản hồi (chưa bật Gateway), tự động đổi sang gọi trực tiếp Backend
    if (CONFIG.ACTIVE_URL === CONFIG.GATEWAY_URL) {
      console.warn("Không kết nối được Gateway 5000, đang thử kết nối trực tiếp Backend 5145...");
      try {
        const fallbackUrl = `${CONFIG.DIRECT_URL}${endpoint}`;
        const response = await fetch(fallbackUrl, options);
        const data = await response.json().catch(() => null);

        // Đổi ACTIVE_URL để các request sau dùng luôn Backend trực tiếp
        CONFIG.ACTIVE_URL = CONFIG.DIRECT_URL;
        return {
          status: response.status,
          ok: response.ok,
          data: data
        };
      } catch (fallbackErr) {
        console.error("Lỗi kết nối cả Gateway và Backend:", fallbackErr);
        return {
          status: 0,
          ok: false,
          data: {
            success: false,
            message: "Không thể kết nối đến máy chủ Backend hoặc Gateway! Vui lòng kiểm tra lại dịch vụ đang chạy."
          }
        };
      }
    }

    return {
      status: 0,
      ok: false,
      data: {
        success: false,
        message: "Không thể kết nối đến máy chủ Backend! Vui lòng thử lại sau."
      }
    };
  }
}

/* ========================================================
   CÁC HÀM XỬ LÝ AUTHENTICATION & TÀI KHOẢN
======================================================== */

// 1. Gửi mã OTP về email
async function apiSendOtp(email) {
  return await apiRequest("/user/send-otp", "POST", { email: email.trim() });
}

// 2. Xác thực OTP và đặt mật khẩu mới
async function apiVerifyOtpAndResetPassword(email, otpCode, newPassword) {
  return await apiRequest("/user/verify-otp-reset-password", "POST", {
    email: email.trim(),
    otpCode: otpCode.trim(),
    newPassword: newPassword
  });
}

// 3. Đăng nhập
async function apiLogin(email, password) {
  return await apiRequest("/user/login", "POST", {
    email: email.trim(),
    password: password
  });
}

// 4. Đăng ký tài khoản
async function apiRegister(userData) {
  return await apiRequest("/user/register", "POST", userData);
}

// 5. Lấy thông tin cá nhân
async function apiGetProfile(userId) {
  return await apiRequest(`/user/profile/${userId}`, "GET", null, true);
}

/* ========================================================
   CÁC HÀM XỬ LÝ PHIM, SUẤT CHIẾU & ĐẶT VÉ
======================================================== */

// 6. Lấy danh sách phim đang chiếu
async function apiGetMovies() {
  return await apiRequest("/movie/get-all", "GET");
}

// 7. Lấy thông tin chi tiết một bộ phim
async function apiGetMovieById(id) {
  return await apiRequest(`/movie/get-by-id/${id}`, "GET");
}

// 8. Lấy danh sách suất chiếu của một bộ phim
async function apiGetShowtimesByMovie(movieId) {
  return await apiRequest(`/showtime/by-movie/${movieId}`, "GET");
}

// 9. Lấy chi tiết một suất chiếu
async function apiGetShowtimeById(showtimeId) {
  return await apiRequest(`/showtime/${showtimeId}`, "GET");
}

// 10. Lấy danh sách ghế đã được đặt cho 1 suất chiếu
async function apiGetBookedSeats(movieId, cinemaRoom, showtime) {
  const encodedRoom = encodeURIComponent(cinemaRoom);
  const encodedTime = encodeURIComponent(showtime);
  return await apiRequest(`/ticket/booked-seats?movieId=${movieId}&cinemaRoom=${encodedRoom}&showtime=${encodedTime}`, "GET");
}

// 11. Đặt vé xem phim
async function apiBookTicket(ticketData) {
  return await apiRequest("/ticket/book-ticket", "POST", ticketData, true);
}

// 12. Lấy lịch sử vé của người dùng
async function apiGetTicketHistory(userId) {
  return await apiRequest(`/ticket/history/${userId}`, "GET", null, true);
}

/* ========================================================
   CÁC HÀM DÀNH CHO QUẢN TRỊ VIÊN (ADMIN)
======================================================== */

// 13. Thêm mới phim
async function apiCreateMovie(movieData) {
  return await apiRequest("/movie/create-movie", "POST", movieData, true);
}

// 14. Cập nhật thông tin phim
async function apiUpdateMovie(movieData) {
  return await apiRequest("/movie/update-movie", "POST", movieData, true);
}

// 15. Xoá phim
async function apiDeleteMovie(movieId) {
  return await apiRequest(`/movie/delete-movie/${movieId}`, "DELETE", null, true);
}

// 16. Lấy toàn bộ danh sách vé trong hệ thống
async function apiGetAllTickets() {
  return await apiRequest("/ticket/all", "GET", null, true);
}

// 17. Soát vé (Check-in vé)
async function apiCheckInTicket(ticketCode) {
  return await apiRequest(`/ticket/checkin/${encodeURIComponent(ticketCode)}`, "POST", null, true);
}

// 18. Lấy số liệu thống kê doanh thu & vé cho Dashboard
async function apiGetRevenueStats() {
  return await apiRequest("/ticket/revenue-stats", "GET", null, true);
}

// 19. Lấy toàn bộ danh sách khách hàng
async function apiGetAllUsers() {
  return await apiRequest("/user/get-all", "GET", null, true);
}

// 20. Quản lý Phòng Chiếu (Cinema Rooms)
async function apiGetAllRooms() {
  return await apiRequest("/cinemaroom/get-all", "GET");
}

async function apiCreateRoom(roomData) {
  return await apiRequest("/cinemaroom/create", "POST", roomData, true);
}

async function apiUpdateRoom(roomData) {
  return await apiRequest("/cinemaroom/update", "POST", roomData, true);
}

async function apiDeleteRoom(roomId) {
  return await apiRequest(`/cinemaroom/delete/${roomId}`, "DELETE", null, true);
}

// 21. Quản lý Suất Chiếu (Showtimes)
async function apiGetAllShowtimes() {
  return await apiRequest("/showtime/get-all", "GET", null, true);
}

async function apiCreateShowtime(showtimeData) {
  return await apiRequest("/showtime/create", "POST", showtimeData, true);
}

async function apiUpdateShowtime(showtimeData) {
  return await apiRequest("/showtime/update", "POST", showtimeData, true);
}

async function apiDeleteShowtime(showtimeId) {
  return await apiRequest(`/showtime/delete/${showtimeId}`, "DELETE", null, true);
}

/* ========================================================
   LOCAL STORAGE & SESSION QUẢN LÝ
======================================================== */

function saveAuth(token, user) {
  localStorage.setItem("cinemax_token", token);
  localStorage.setItem("cinemax_user", JSON.stringify(user));
}

function getToken() {
  return localStorage.getItem("cinemax_token");
}

function getCurrentUser() {
  const userStr = localStorage.getItem("cinemax_user");
  try {
    return userStr ? JSON.parse(userStr) : null;
  } catch (e) {
    return null;
  }
}

function clearAuth() {
  localStorage.removeItem("cinemax_token");
  localStorage.removeItem("cinemax_user");
}

function isLoggedIn() {
  return !!getToken();
}

/* ========================================================
   UI HELPERS: THÔNG BÁO ALERT & TỰ ĐỘNG CẬP NHẬT HEADER
======================================================== */

function showAlert(containerId, message, type = "danger") {
  const container = document.getElementById(containerId);
  if (!container) return;

  const icon = type === "success" 
    ? "✓" 
    : type === "info" 
    ? "ℹ" 
    : "⚠";

  container.innerHTML = `
    <div class="alert alert-${type}">
      <span class="alert-icon">${icon}</span>
      <div class="alert-content">${message}</div>
    </div>
  `;
}

function clearAlert(containerId) {
  const container = document.getElementById(containerId);
  if (container) container.innerHTML = "";
}

// Cập nhật trạng thái người dùng trên Header (nếu có)
function updateNavbar() {
  const user = getCurrentUser();
  const userContainer = document.querySelector(".user-menu") || document.querySelector("header .btn-primary");
  
  if (user && userContainer) {
    if (userContainer.classList && userContainer.classList.contains("btn-primary")) {
      const header = userContainer.parentElement;
      if (header) {
        userContainer.remove();
        const userDiv = document.createElement("div");
        userDiv.className = "user-menu";
        const role = (user.role || user.Role || "").trim().toLowerCase();
        const adminBtn = role === "admin" 
          ? `<a href="admin.html" style="background:#e50914; color:#fff; padding:6px 14px; border-radius:4px; font-size:13px; font-weight:600; text-decoration:none; margin-right:8px; display:inline-flex; align-items:center; gap:5px;">⚙️ Quản Trị</a>`
          : "";

        userDiv.innerHTML = `
          ${adminBtn}
          <a href="profile.html" class="user-avatar-btn" style="display:flex; align-items:center; gap:8px; font-weight:600;">
            <span style="background:#e50914; color:#fff; width:34px; height:34px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:14px;">
              ${(user.fullName || "U").charAt(0).toUpperCase()}
            </span>
            <span>${user.fullName || user.email}</span>
          </a>
          <button onclick="handleLogout()" style="background:transparent; border:1px solid #444; color:#aaa; padding:6px 12px; border-radius:4px; cursor:pointer; margin-left:10px; font-size:13px; transition:0.3s;" onmouseover="this.style.color='#fff'; this.style.borderColor='#e50914';" onmouseout="this.style.color='#aaa'; this.style.borderColor='#444';">Đăng xuất</button>
        `;
        header.appendChild(userDiv);
      }
    }
  }
}

function handleLogout() {
  clearAuth();
  window.location.href = "login.html";
}

document.addEventListener("DOMContentLoaded", () => {
  updateNavbar();
});
