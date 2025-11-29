// frontend/src/pages/RegisterPage.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './LoginPage.css';

const RegisterPage = () => {
  const [error, setError] = useState('');
  const SSO_ENDPOINT = 'http://127.0.0.1:5000/auth/sso/login-url';

  const handleSso = async () => {
    setError('');
    try {
      const res = await fetch(SSO_ENDPOINT);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Không thể lấy URL SSO');
      window.location.href = data.redirect_url;
    } catch (e) {
      setError(e.message || 'Lỗi khi chuyển tới SSO');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2 className="auth-title">📝 Đăng ký (SSO)</h2>
        {error && <div className="auth-error">{error}</div>}

        <p>Hệ thống sử dụng SSO của trường. Vui lòng đăng ký / đăng nhập thông qua SSO.</p>
        <button className="btn-auth" onClick={handleSso}>Đăng ký / Đăng nhập bằng SSO</button>

        <p className="auth-footer">
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;