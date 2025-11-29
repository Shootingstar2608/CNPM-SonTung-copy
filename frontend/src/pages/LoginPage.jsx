import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './LoginPage.css';

const LoginPage = () => {
  const [error, setError] = useState('');
  const SSO_ENDPOINT = 'http://127.0.0.1:5000/auth/sso/login-url';

  const handleSso = async () => {
    setError('');
    try {
      // Lấy URL redirect tới SSO từ backend
      const res = await fetch(SSO_ENDPOINT);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Không thể lấy URL SSO');

      // Chuyển hướng trình duyệt tới SSO (backend trả redirect_url tới SSO)
      window.location.href = data.redirect_url;
    } catch (e) {
      setError(e.message || 'Lỗi khi bắt đầu SSO');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2 className="auth-title">🔐 Đăng nhập BKTutor (SSO)</h2>

        {error && <div className="auth-error">{error}</div>}

        <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
          <button className="btn-auth" onClick={handleSso}>Đăng nhập bằng SSO</button>
          <div style={{textAlign: 'center'}}>
            <small>Hoặc liên hệ admin để tạo tài khoản.</small>
          </div>
        </div>

        <p className="auth-footer">
          Chưa có tài khoản? <Link to="/register">Đăng ký (SSO)</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;