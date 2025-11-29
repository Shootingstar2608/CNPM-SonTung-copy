// import React from 'react';
// import { BrowserRouter, Routes, Route } from 'react-router-dom';
//
// // --- IMPORT CÁC TRANG (PAGES) ---
// // Đảm bảo tên file trong thư mục src/pages đúng y hệt như này
// import MeetingPage from './pages/MeetingPage';
// import OpenSessionPage from './pages/OpenSessionPage';
// import FreeSchedulePage from './pages/FreeSchedulePage';
// import SessionInfoPage from './pages/SessionInfoPage';
//
// import ResourceMenuPage from './pages/ResourceMenuPage';
// import ResourcePage from './pages/ResourcePage';
// import HistoryPage from './pages/HistoryPage';
// import StudentResourcePage from './pages/StudentResourcePage';
//
// import UserManagementPage from './pages/UserManagementPage';
// import UserInfoPage from './pages/UserInfoPage'; // <--- Trang mới nhất
//
// function App() {
//   return (
//     <BrowserRouter>
//       <Routes>
//         {/* --- NHÓM 1: QUẢN LÝ BUỔI GẶP (Trang chủ) --- */}
//         <Route path="/" element={<MeetingPage />} />
//         <Route path="/create-session" element={<OpenSessionPage />} />
//         <Route path="/free-schedule" element={<FreeSchedulePage />} />
//         <Route path="/session-info" element={<SessionInfoPage />} />
//
//         {/* --- NHÓM 2: TÀI LIỆU HỌC TẬP --- */}
//         {/* Menu chính */}
//         <Route path="/resources" element={<ResourceMenuPage />} />
//         {/* Upload (Tutor) */}
//         <Route path="/resources/upload" element={<ResourcePage />} />
//         {/* Lịch sử */}
//         <Route path="/resources/history" element={<HistoryPage />} />
//         {/* Tìm kiếm (Sinh viên) */}
//         <Route path="/resources/student" element={<StudentResourcePage />} />
//
//         {/* --- NHÓM 3: QUẢN TRỊ (ADMIN) --- */}
//         <Route path="/user-management" element={<UserManagementPage />} />
//
//         {/* --- NHÓM 4: THÔNG TIN CÁ NHÂN (USER) --- */}
//         <Route path="/user-info" element={<UserInfoPage />} />
//
//       </Routes>
//     </BrowserRouter>
//   );
// }
//
// export default App;

// frontend/src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Import các trang
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MeetingPage from './pages/MeetingPage';
import OpenSessionPage from './pages/OpenSessionPage';
import FreeSchedulePage from './pages/FreeSchedulePage';
import SessionInfoPage from './pages/SessionInfoPage';
import ResourceMenuPage from './pages/ResourceMenuPage';
import ResourcePage from './pages/ResourcePage';
import HistoryPage from './pages/HistoryPage';
import StudentResourcePage from './pages/StudentResourcePage';
import UserManagementPage from './pages/UserManagementPage';
import UserInfoPage from './pages/UserInfoPage';
import SsoCallback from './pages/SsoCallback';
// ... import các trang khác của bạn ...

// --- COMPONENT BẢO VỆ (Guard) ---
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('access_token');

  if (!token) {
    // Nếu chưa có token -> Đá về trang Login
    return <Navigate to="/login" replace />;
  }

  // Nếu có token -> Cho phép vào trang con
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* --- ROUTE CÔNG KHAI (Ai cũng vào được) --- */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/sso/callback" element={<SsoCallback />} />

        {/* --- ROUTE ĐƯỢC BẢO VỆ (Phải đăng nhập) --- */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MeetingPage />
            </ProtectedRoute>
          }
        />

        <Route path="/create-session" element={<ProtectedRoute><OpenSessionPage/></ProtectedRoute>} />
        <Route path="/free-schedule" element={<ProtectedRoute><FreeSchedulePage/></ProtectedRoute>} />
        <Route path="/session-info/:id" element={<ProtectedRoute><SessionInfoPage/></ProtectedRoute>} />

        <Route path="/resources" element={<ProtectedRoute><ResourceMenuPage/></ProtectedRoute>} />
        <Route path="/resources/upload" element={<ProtectedRoute><ResourcePage/></ProtectedRoute>} />
        <Route path="/resources/history" element={<ProtectedRoute><HistoryPage/></ProtectedRoute>} />
        <Route path="/resources/student" element={<ProtectedRoute><StudentResourcePage/></ProtectedRoute>} />

        <Route path="/user-management" element={<ProtectedRoute><UserManagementPage/></ProtectedRoute>} />
        <Route path="/user-info" element={<ProtectedRoute><UserInfoPage/></ProtectedRoute>} />

        {/* ... Thêm các route khác tương tự, bọc trong ProtectedRoute ... */}

      </Routes>
    </BrowserRouter>
  );
}

export default App;