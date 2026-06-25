import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import AdminLayout from '../components/AdminLayout';

export default function AdminSettings() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const settingsSections = [
    { icon: '🔧', label: 'General Settings', desc: 'Basic platform settings' },
    { icon: '💳', label: 'Payment Gateway', desc: 'Configure payment methods' },
    { icon: '📧', label: 'Email Settings', desc: 'SMTP and notification settings' },
    { icon: '🔒', label: 'Security', desc: 'Security and access control' },
    { icon: '📱', label: 'Mobile App', desc: 'App version and settings' },
    { icon: '📊', label: 'Analytics', desc: 'Analytics and tracking' },
  ];

  return (
    <AdminLayout>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1a3a1a' }}>Settings</h1>
        <p style={{ color: '#5a7a5a', fontSize: '14px' }}>Configure your platform settings</p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '16px',
      }}>
        {settingsSections.map((section, index) => (
          <div
            key={index}
            style={{
              background: '#fff',
              borderRadius: '12px',
              padding: '24px',
              border: '1px solid #d4e8d4',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textAlign: 'center',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#2e7d32';
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#d4e8d4';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>{section.icon}</div>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1a3a1a' }}>{section.label}</h3>
            <p style={{ fontSize: '13px', color: '#5a7a5a' }}>{section.desc}</p>
          </div>
        ))}
      </div>

      <div style={{
        marginTop: '24px',
        padding: '20px',
        background: '#fff',
        borderRadius: '12px',
        border: '1px solid #d4e8d4',
        textAlign: 'center',
      }}>
        <p style={{ color: '#5a7a5a', fontSize: '14px' }}>
          ⚙️ Settings pages are under development. More options coming soon.
        </p>
      </div>
    </AdminLayout>
  );
}