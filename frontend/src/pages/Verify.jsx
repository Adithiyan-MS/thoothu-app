import React, { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export default function Verify() {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyOTP, isLoggingIn } = useAuthStore();
  
  // Get the email that was passed from the Register page
  const email = location.state?.email;
  const [otp, setOtp] = useState('');

  // Security check: If someone tries to visit /verify directly without registering first, kick them to register!
  if (!email) {
    return <Navigate to="/register" />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await verifyOTP(email, otp);
    if (success) {
      // If verification succeeds, send them to login!
      navigate('/login');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', padding: '20px' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '40px', textAlign: 'center' }}>
        
        <div style={{ 
          background: 'rgba(16, 185, 129, 0.1)', // Success Green glow
          width: '64px', height: '64px', 
          borderRadius: '20px', 
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          margin: '0 auto 16px auto',
          border: '1px solid rgba(16, 185, 129, 0.2)'
        }}>
          <ShieldCheck color="#10b981" size={32} />
        </div>
        
        <h1 style={{ fontSize: '1.75rem', fontWeight: '600', marginBottom: '8px' }}>Verify Your Email</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', lineHeight: '1.5' }}>
          We've sent a 6-digit code to <br/>
          <strong style={{ color: 'white' }}>{email}</strong>
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '32px', textAlign: 'left' }}>
            <label className="form-label">Verification Code</label>
            <input 
              type="text" 
              className="input-premium" 
              placeholder="Enter 6-digit OTP" 
              maxLength="6"
              style={{ textAlign: 'center', fontSize: '1.2rem', letterSpacing: '4px' }}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />
          </div>

          <button type="submit" disabled={isLoggingIn} className="btn-primary" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            {isLoggingIn ? "Verifying..." : "Verify & Continue"} <ArrowRight size={18} />
          </button>
        </form>

      </div>
    </div>
  );
}
