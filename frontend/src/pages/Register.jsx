import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, ArrowRight, Mail, Lock, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/useAuthStore';

export default function Register() {
  const navigate = useNavigate();
  const { register, isLoggingIn } = useAuthStore();
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await register(formData.username, formData.email, formData.password);
    if (success) {
      // Pass the email to the verify page so they don't have to type it again!
      navigate('/verify', { state: { email: formData.email } });
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', padding: '20px' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '40px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ 
            background: 'rgba(168, 85, 247, 0.1)', 
            width: '64px', height: '64px', 
            borderRadius: '20px', 
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            margin: '0 auto 16px auto',
            border: '1px solid rgba(168, 85, 247, 0.2)'
          }}>
            <UserPlus color="var(--accent-secondary)" size={32} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '600', marginBottom: '8px' }}>Create Account</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Join the ultimate chat experience</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '16px', top: '15px', color: 'var(--text-secondary)' }} />
              <input 
                type="text" 
                className="input-premium" 
                placeholder="chatmaster99" 
                style={{ paddingLeft: '45px' }}
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '16px', top: '15px', color: 'var(--text-secondary)' }} />
              <input 
                type="email" 
                className="input-premium" 
                placeholder="you@example.com" 
                style={{ paddingLeft: '45px' }}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '32px' }}>
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '16px', top: '15px', color: 'var(--text-secondary)' }} />
              <input 
                type="password" 
                className="input-premium" 
                placeholder="••••••••" 
                style={{ paddingLeft: '45px' }}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>
          </div>

          <button type="submit" disabled={isLoggingIn} className="btn-primary" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
            {isLoggingIn ? "Creating..." : "Sign Up"} <ArrowRight size={18} />
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: '500' }}>
              Sign In
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
