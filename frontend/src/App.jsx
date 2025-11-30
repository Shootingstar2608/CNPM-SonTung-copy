
// frontend/src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Import các trang
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import StudentHomePage from './pages/StudentHomePage';
import TutorHomePage from './pages/TutorHomePage';
import AdminHomePage from './pages/AdminHomePage';
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
import TutorSelectionPage from './pages/TutorSelectionPage'; // <--- Import mới
import BookingPage from './pages/BookingPage'; // <--- Import trang mới
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
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/sso/callback" element={<SsoCallback />} />
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* --- ROUTE ĐƯỢC BẢO VỆ (Phải đăng nhập) --- */}
        <Route path="/student-home" element={<ProtectedRoute><StudentHomePage/></ProtectedRoute>} />
        <Route path="/tutor-home" element={<ProtectedRoute><TutorHomePage/></ProtectedRoute>} />
        <Route path="/admin-home" element={<ProtectedRoute><AdminHomePage/></ProtectedRoute>} />

        <Route path="/meetings" element={<ProtectedRoute><MeetingPage/></ProtectedRoute>} />
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
        <Route path="/tutor-selection" element={<ProtectedRoute><TutorSelectionPage/></ProtectedRoute>} />
        <Route path="/booking-tutor" element={<ProtectedRoute><BookingPage/></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;