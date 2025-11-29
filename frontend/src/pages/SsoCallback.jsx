import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const roleRouteMap = {
  ADMIN: '/admin-home',
  OFFICER: '/admin-home',
  DEPARTMENT: '/admin-home',
  TUTOR: '/tutor-home',
  STUDENT: '/student-home'
};
const defaultRoute = '/home';

const SsoCallback = () => {
  const navigate = useNavigate();
  const query = useQuery();
  const [message, setMessage] = useState('Đang xử lý...');

  useEffect(() => {
    const token = query.get('token');
    const user_id = query.get('user_id');
    const error = query.get('error');

    if (error) {
      setMessage(`SSO Error: ${error}`);
      return;
    }

    if (token) {
      try {
        localStorage.setItem('access_token', token);
        if (user_id) localStorage.setItem('user_id', user_id);
        setMessage('Đăng nhập thành công. Đang phân quyền...');

        (async () => {
          let destination = defaultRoute;
          try {
            const resp = await fetch('http://127.0.0.1:5000/auth/profile', {
              method: 'GET',
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (resp.ok) {
              const body = await resp.json();
              const user = body.user || {};
              const role = (user.role || '').toUpperCase();
              if (Object.keys(user).length) {
                localStorage.setItem('user_data', JSON.stringify(user));
              }
              if (role) {
                localStorage.setItem('user_role', role);
                destination = roleRouteMap[role] || defaultRoute;
              }
            }
          } catch (e) {
            destination = defaultRoute;
          } finally {
            setTimeout(() => navigate(destination, { replace: true }), 700);
          }
        })();

      } catch (e) {
        setMessage('Không thể lưu token vào LocalStorage');
      }
    } else {
      setMessage('Không tìm thấy token trong callback SSO.');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{padding: 30}}>
      <h3>{message}</h3>
      <p>Nếu không chuyển hướng tự động, hãy đóng tab và mở lại ứng dụng.</p>
    </div>
  );
};

export default SsoCallback;
