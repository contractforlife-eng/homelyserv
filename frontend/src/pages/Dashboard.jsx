import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      navigate('/login');
      return;
    }

    setUser(JSON.parse(userData));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Welcome, {user.fullName}!</h1>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </header>

      <div className="dashboard-content">
        <div className="user-info">
          <h3>Your Profile</h3>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Username:</strong> {user.username}</p>
          <p><strong>Role:</strong> {user.role}</p>
          <p><strong>Verified:</strong> {user.isVerified ? 'Yes' : 'No'}</p>
          {user.phone && <p><strong>Phone:</strong> {user.phone}</p>}
          {user.city && <p><strong>City:</strong> {user.city}</p>}
        </div>

        <div className="quick-actions">
          <h3>Quick Actions</h3>
          <div className="action-grid">
            <button className="action-btn">Find Workers</button>
            <button className="action-btn">My Profile</button>
            <button className="action-btn">Messages</button>
            <button className="action-btn">Settings</button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .dashboard {
          min-height: 100vh;
          background: #f5f5f5;
          font-family: Arial, sans-serif;
        }

        .dashboard-header {
          background: white;
          padding: 20px 40px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .dashboard-header h1 {
          color: #333;
          margin: 0;
          font-size: 24px;
        }

        .logout-btn {
          padding: 10px 20px;
          background: #e74c3c;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.3s;
        }

        .logout-btn:hover {
          background: #c0392b;
        }

        .dashboard-content {
          max-width: 1200px;
          margin: 40px auto;
          padding: 0 20px;
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 30px;
        }

        .user-info,
        .quick-actions {
          background: white;
          padding: 25px;
          border-radius: 10px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .user-info h3,
        .quick-actions h3 {
          color: #333;
          margin-top: 0;
          margin-bottom: 20px;
          border-bottom: 2px solid #e74c3c;
          padding-bottom: 10px;
        }

        .user-info p {
          margin: 10px 0;
          color: #555;
        }

        .user-info strong {
          color: #333;
        }

        .action-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }

        .action-btn {
          padding: 20px;
          background: #f8f8f8;
          border: 1px solid #ddd;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          color: #333;
          transition: all 0.3s;
        }

        .action-btn:hover {
          background: #e74c3c;
          color: white;
          border-color: #e74c3c;
        }

        @media (max-width: 768px) {
          .dashboard-content {
            grid-template-columns: 1fr;
          }

          .dashboard-header {
            padding: 15px 20px;
            flex-direction: column;
            gap: 15px;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;