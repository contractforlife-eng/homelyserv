import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import api from '../utils/api';
import toast from 'react-hot-toast';
import AdminLayout from '../components/AdminLayout';

export default function AdminSettings() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeSection, setActiveSection] = useState('general');
  const [loading, setLoading] = useState(false);

  // General Settings
  const [generalSettings, setGeneralSettings] = useState({
    appName: 'HomelyServ',
    appDescription: 'Home Services Platform',
    contactEmail: 'info@homelyserv.com',
    contactPhone: '+20 100 000 0000',
    currency: 'EGP',
    timezone: 'Africa/Cairo',
    language: 'en',
  });

  // Payment Gateway Settings
  const [paymentSettings, setPaymentSettings] = useState({
    instapay: true,
    vodafoneCash: true,
    bankTransfer: true,
    bitcoin: true,
    usdc: true,
    commissionRate: 6.5,
    vatRate: 14,
    minCommission: 50,
    maxCommission: 5000,
  });

  // Email Settings
  const [emailSettings, setEmailSettings] = useState({
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUser: 'notifications@homelyserv.com',
    smtpPass: '********',
    fromEmail: 'noreply@homelyserv.com',
    fromName: 'HomelyServ',
    notifyOnHire: true,
    notifyOnPayment: true,
    notifyOnProfile: true,
  });

  // Security Settings
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    sessionTimeout: 60,
    maxLoginAttempts: 5,
    requireEmailVerification: true,
    allowSocialLogin: true,
    ipWhitelist: '',
  });

  // Mobile App Settings
  const [mobileSettings, setMobileSettings] = useState({
    appVersion: '1.0.0',
    minVersion: '1.0.0',
    forceUpdate: false,
    enablePush: true,
    enableBiometric: false,
    debugMode: false,
  });

  // Analytics Settings
  const [analyticsSettings, setAnalyticsSettings] = useState({
    enableAnalytics: true,
    trackUserActivity: true,
    trackHires: true,
    trackPayments: true,
    retentionPeriod: 30,
    autoReport: true,
    reportFrequency: 'monthly',
  });

  const handleGeneralChange = (e) => {
    const { name, value } = e.target;
    setGeneralSettings({ ...generalSettings, [name]: value });
  };

  const handlePaymentChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPaymentSettings({
      ...paymentSettings,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleEmailChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEmailSettings({
      ...emailSettings,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSecurityChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSecuritySettings({
      ...securitySettings,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleMobileChange = (e) => {
    const { name, value, type, checked } = e.target;
    setMobileSettings({
      ...mobileSettings,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleAnalyticsChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAnalyticsSettings({
      ...analyticsSettings,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      // In production, save to database
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Settings saved successfully!');
    } catch (err) {
      toast.error('Failed to save settings');
    }
    setLoading(false);
  };

  const sections = [
    { key: 'general', label: 'General Settings', icon: '🔧' },
    { key: 'payment', label: 'Payment Gateway', icon: '💳' },
    { key: 'email', label: 'Email Settings', icon: '📧' },
    { key: 'security', label: 'Security', icon: '🔒' },
    { key: 'mobile', label: 'Mobile App', icon: '📱' },
    { key: 'analytics', label: 'Analytics', icon: '📊' },
  ];

  const renderGeneralSettings = () => (
    <div>
      <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1a3a1a', marginBottom: '16px' }}>General Settings</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label style={{ fontSize: '13px', fontWeight: '600', color: '#5a7a5a', display: 'block', marginBottom: '4px' }}>App Name</label>
          <input
            name="appName"
            value={generalSettings.appName}
            onChange={handleGeneralChange}
            className="form-input"
          />
        </div>
        <div>
          <label style={{ fontSize: '13px', fontWeight: '600', color: '#5a7a5a', display: 'block', marginBottom: '4px' }}>App Description</label>
          <input
            name="appDescription"
            value={generalSettings.appDescription}
            onChange={handleGeneralChange}
            className="form-input"
          />
        </div>
        <div>
          <label style={{ fontSize: '13px', fontWeight: '600', color: '#5a7a5a', display: 'block', marginBottom: '4px' }}>Contact Email</label>
          <input
            name="contactEmail"
            value={generalSettings.contactEmail}
            onChange={handleGeneralChange}
            className="form-input"
          />
        </div>
        <div>
          <label style={{ fontSize: '13px', fontWeight: '600', color: '#5a7a5a', display: 'block', marginBottom: '4px' }}>Contact Phone</label>
          <input
            name="contactPhone"
            value={generalSettings.contactPhone}
            onChange={handleGeneralChange}
            className="form-input"
          />
        </div>
        <div>
          <label style={{ fontSize: '13px', fontWeight: '600', color: '#5a7a5a', display: 'block', marginBottom: '4px' }}>Currency</label>
          <select name="currency" value={generalSettings.currency} onChange={handleGeneralChange} className="form-input">
            <option value="EGP">EGP - Egyptian Pound</option>
            <option value="USD">USD - US Dollar</option>
            <option value="EUR">EUR - Euro</option>
            <option value="GBP">GBP - British Pound</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: '13px', fontWeight: '600', color: '#5a7a5a', display: 'block', marginBottom: '4px' }}>Language</label>
          <select name="language" value={generalSettings.language} onChange={handleGeneralChange} className="form-input">
            <option value="en">English</option>
            <option value="ar">العربية</option>
            <option value="fr">Français</option>
            <option value="de">Deutsch</option>
            <option value="tr">Türkçe</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderPaymentSettings = () => (
    <div>
      <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1a3a1a', marginBottom: '16px' }}>Payment Gateway Settings</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label style={{ fontSize: '13px', fontWeight: '600', color: '#5a7a5a', display: 'block', marginBottom: '4px' }}>Commission Rate (%)</label>
          <input
            name="commissionRate"
            type="number"
            value={paymentSettings.commissionRate}
            onChange={handlePaymentChange}
            className="form-input"
          />
        </div>
        <div>
          <label style={{ fontSize: '13px', fontWeight: '600', color: '#5a7a5a', display: 'block', marginBottom: '4px' }}>VAT Rate (%)</label>
          <input
            name="vatRate"
            type="number"
            value={paymentSettings.vatRate}
            onChange={handlePaymentChange}
            className="form-input"
          />
        </div>
        <div>
          <label style={{ fontSize: '13px', fontWeight: '600', color: '#5a7a5a', display: 'block', marginBottom: '4px' }}>Min Commission (EGP)</label>
          <input
            name="minCommission"
            type="number"
            value={paymentSettings.minCommission}
            onChange={handlePaymentChange}
            className="form-input"
          />
        </div>
        <div>
          <label style={{ fontSize: '13px', fontWeight: '600', color: '#5a7a5a', display: 'block', marginBottom: '4px' }}>Max Commission (EGP)</label>
          <input
            name="maxCommission"
            type="number"
            value={paymentSettings.maxCommission}
            onChange={handlePaymentChange}
            className="form-input"
          />
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', gridColumn: 'span 2' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#5a7a5a', cursor: 'pointer' }}>
            <input name="instapay" type="checkbox" checked={paymentSettings.instapay} onChange={handlePaymentChange} />
            InstaPay
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#5a7a5a', cursor: 'pointer' }}>
            <input name="vodafoneCash" type="checkbox" checked={paymentSettings.vodafoneCash} onChange={handlePaymentChange} />
            Vodafone Cash
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#5a7a5a', cursor: 'pointer' }}>
            <input name="bankTransfer" type="checkbox" checked={paymentSettings.bankTransfer} onChange={handlePaymentChange} />
            Bank Transfer
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#5a7a5a', cursor: 'pointer' }}>
            <input name="bitcoin" type="checkbox" checked={paymentSettings.bitcoin} onChange={handlePaymentChange} />
            Bitcoin
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#5a7a5a', cursor: 'pointer' }}>
            <input name="usdc" type="checkbox" checked={paymentSettings.usdc} onChange={handlePaymentChange} />
            USDC (Solana)
          </label>
        </div>
      </div>
    </div>
  );

  const renderEmailSettings = () => (
    <div>
      <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1a3a1a', marginBottom: '16px' }}>Email Settings</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label style={{ fontSize: '13px', fontWeight: '600', color: '#5a7a5a', display: 'block', marginBottom: '4px' }}>SMTP Host</label>
          <input name="smtpHost" value={emailSettings.smtpHost} onChange={handleEmailChange} className="form-input" />
        </div>
        <div>
          <label style={{ fontSize: '13px', fontWeight: '600', color: '#5a7a5a', display: 'block', marginBottom: '4px' }}>SMTP Port</label>
          <input name="smtpPort" type="number" value={emailSettings.smtpPort} onChange={handleEmailChange} className="form-input" />
        </div>
        <div>
          <label style={{ fontSize: '13px', fontWeight: '600', color: '#5a7a5a', display: 'block', marginBottom: '4px' }}>SMTP Username</label>
          <input name="smtpUser" value={emailSettings.smtpUser} onChange={handleEmailChange} className="form-input" />
        </div>
        <div>
          <label style={{ fontSize: '13px', fontWeight: '600', color: '#5a7a5a', display: 'block', marginBottom: '4px' }}>SMTP Password</label>
          <input name="smtpPass" type="password" value={emailSettings.smtpPass} onChange={handleEmailChange} className="form-input" />
        </div>
        <div>
          <label style={{ fontSize: '13px', fontWeight: '600', color: '#5a7a5a', display: 'block', marginBottom: '4px' }}>From Email</label>
          <input name="fromEmail" value={emailSettings.fromEmail} onChange={handleEmailChange} className="form-input" />
        </div>
        <div>
          <label style={{ fontSize: '13px', fontWeight: '600', color: '#5a7a5a', display: 'block', marginBottom: '4px' }}>From Name</label>
          <input name="fromName" value={emailSettings.fromName} onChange={handleEmailChange} className="form-input" />
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', gridColumn: 'span 2' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#5a7a5a', cursor: 'pointer' }}>
            <input name="notifyOnHire" type="checkbox" checked={emailSettings.notifyOnHire} onChange={handleEmailChange} />
            Notify on New Hire
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#5a7a5a', cursor: 'pointer' }}>
            <input name="notifyOnPayment" type="checkbox" checked={emailSettings.notifyOnPayment} onChange={handleEmailChange} />
            Notify on Payment
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#5a7a5a', cursor: 'pointer' }}>
            <input name="notifyOnProfile" type="checkbox" checked={emailSettings.notifyOnProfile} onChange={handleEmailChange} />
            Notify on Profile Update
          </label>
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div>
      <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1a3a1a', marginBottom: '16px' }}>Security Settings</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label style={{ fontSize: '13px', fontWeight: '600', color: '#5a7a5a', display: 'block', marginBottom: '4px' }}>Session Timeout (minutes)</label>
          <input name="sessionTimeout" type="number" value={securitySettings.sessionTimeout} onChange={handleSecurityChange} className="form-input" />
        </div>
        <div>
          <label style={{ fontSize: '13px', fontWeight: '600', color: '#5a7a5a', display: 'block', marginBottom: '4px' }}>Max Login Attempts</label>
          <input name="maxLoginAttempts" type="number" value={securitySettings.maxLoginAttempts} onChange={handleSecurityChange} className="form-input" />
        </div>
        <div>
          <label style={{ fontSize: '13px', fontWeight: '600', color: '#5a7a5a', display: 'block', marginBottom: '4px' }}>IP Whitelist</label>
          <input name="ipWhitelist" value={securitySettings.ipWhitelist} onChange={handleSecurityChange} placeholder="127.0.0.1, 192.168.1.1" className="form-input" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', gridColumn: 'span 2' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#5a7a5a', cursor: 'pointer' }}>
            <input name="twoFactorAuth" type="checkbox" checked={securitySettings.twoFactorAuth} onChange={handleSecurityChange} />
            Enable Two-Factor Authentication
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#5a7a5a', cursor: 'pointer' }}>
            <input name="requireEmailVerification" type="checkbox" checked={securitySettings.requireEmailVerification} onChange={handleSecurityChange} />
            Require Email Verification
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#5a7a5a', cursor: 'pointer' }}>
            <input name="allowSocialLogin" type="checkbox" checked={securitySettings.allowSocialLogin} onChange={handleSecurityChange} />
            Allow Social Login
          </label>
        </div>
      </div>
    </div>
  );

  const renderMobileSettings = () => (
    <div>
      <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1a3a1a', marginBottom: '16px' }}>Mobile App Settings</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label style={{ fontSize: '13px', fontWeight: '600', color: '#5a7a5a', display: 'block', marginBottom: '4px' }}>App Version</label>
          <input name="appVersion" value={mobileSettings.appVersion} onChange={handleMobileChange} className="form-input" />
        </div>
        <div>
          <label style={{ fontSize: '13px', fontWeight: '600', color: '#5a7a5a', display: 'block', marginBottom: '4px' }}>Minimum Version</label>
          <input name="minVersion" value={mobileSettings.minVersion} onChange={handleMobileChange} className="form-input" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', gridColumn: 'span 2' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#5a7a5a', cursor: 'pointer' }}>
            <input name="forceUpdate" type="checkbox" checked={mobileSettings.forceUpdate} onChange={handleMobileChange} />
            Force Update (Users must update to continue)
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#5a7a5a', cursor: 'pointer' }}>
            <input name="enablePush" type="checkbox" checked={mobileSettings.enablePush} onChange={handleMobileChange} />
            Enable Push Notifications
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#5a7a5a', cursor: 'pointer' }}>
            <input name="enableBiometric" type="checkbox" checked={mobileSettings.enableBiometric} onChange={handleMobileChange} />
            Enable Biometric Login
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#5a7a5a', cursor: 'pointer' }}>
            <input name="debugMode" type="checkbox" checked={mobileSettings.debugMode} onChange={handleMobileChange} />
            Enable Debug Mode
          </label>
        </div>
      </div>
    </div>
  );

  const renderAnalyticsSettings = () => (
    <div>
      <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1a3a1a', marginBottom: '16px' }}>Analytics Settings</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label style={{ fontSize: '13px', fontWeight: '600', color: '#5a7a5a', display: 'block', marginBottom: '4px' }}>Data Retention (days)</label>
          <input name="retentionPeriod" type="number" value={analyticsSettings.retentionPeriod} onChange={handleAnalyticsChange} className="form-input" />
        </div>
        <div>
          <label style={{ fontSize: '13px', fontWeight: '600', color: '#5a7a5a', display: 'block', marginBottom: '4px' }}>Report Frequency</label>
          <select name="reportFrequency" value={analyticsSettings.reportFrequency} onChange={handleAnalyticsChange} className="form-input">
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', gridColumn: 'span 2' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#5a7a5a', cursor: 'pointer' }}>
            <input name="enableAnalytics" type="checkbox" checked={analyticsSettings.enableAnalytics} onChange={handleAnalyticsChange} />
            Enable Analytics
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#5a7a5a', cursor: 'pointer' }}>
            <input name="trackUserActivity" type="checkbox" checked={analyticsSettings.trackUserActivity} onChange={handleAnalyticsChange} />
            Track User Activity
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#5a7a5a', cursor: 'pointer' }}>
            <input name="trackHires" type="checkbox" checked={analyticsSettings.trackHires} onChange={handleAnalyticsChange} />
            Track Hires
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#5a7a5a', cursor: 'pointer' }}>
            <input name="trackPayments" type="checkbox" checked={analyticsSettings.trackPayments} onChange={handleAnalyticsChange} />
            Track Payments
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#5a7a5a', cursor: 'pointer' }}>
            <input name="autoReport" type="checkbox" checked={analyticsSettings.autoReport} onChange={handleAnalyticsChange} />
            Auto-Generate Reports
          </label>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch(activeSection) {
      case 'general': return renderGeneralSettings();
      case 'payment': return renderPaymentSettings();
      case 'email': return renderEmailSettings();
      case 'security': return renderSecuritySettings();
      case 'mobile': return renderMobileSettings();
      case 'analytics': return renderAnalyticsSettings();
      default: return renderGeneralSettings();
    }
  };

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1a3a1a' }}>Settings</h1>
          <p style={{ color: '#5a7a5a', fontSize: '14px' }}>Configure your platform settings</p>
        </div>
        <button
          onClick={saveSettings}
          disabled={loading}
          style={{
            padding: '10px 24px',
            background: '#2e7d32',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
        >
          {loading ? 'Saving...' : '💾 Save Settings'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {sections.map((section) => (
          <button
            key={section.key}
            onClick={() => setActiveSection(section.key)}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              background: activeSection === section.key ? '#2e7d32' : '#fff',
              color: activeSection === section.key ? '#fff' : '#5a7a5a',
              border: activeSection === section.key ? 'none' : '1px solid #d4e8d4',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: activeSection === section.key ? '600' : '400',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>{section.icon}</span>
            {section.label}
          </button>
        ))}
      </div>

      <div style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '24px',
        border: '1px solid #d4e8d4',
      }}>
        {renderContent()}
      </div>
    </AdminLayout>
  );
}