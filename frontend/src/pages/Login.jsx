// frontend/src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MessageSquare, ArrowRight, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/useAuthStore';

export default function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [step, setStep] = useState('login'); // Can be 'login', 'forgot', or 'reset'
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');

    const { login, guestLogin, isLoggingIn, forgotPassword, resetPassword } = useAuthStore();

    const handleLogin = async (e) => {
        e.preventDefault();
        await login(email, password); // Call our backend!
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        const success = await forgotPassword(email);
        if (success) {
            setStep('reset'); // Move to the final step!
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        const success = await resetPassword(email, otp, newPassword);
        if (success) {
            setStep('login'); // Send them back to login!
            setPassword('');  // Clear out the old password field
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', padding: '20px' }}>

            {/* The Glassmorphism Card */}
            <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '40px' }}>

                {/* Logo Area */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        background: 'rgba(99, 102, 241, 0.1)',
                        width: '64px', height: '64px',
                        borderRadius: '20px',
                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                        margin: '0 auto 16px auto',
                        border: '1px solid rgba(99, 102, 241, 0.2)'
                    }}>
                        <MessageSquare color="var(--accent-primary)" size={32} />
                    </div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: '600', marginBottom: '8px' }}>Welcome Back</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Sign in to continue chatting</p>
                </div>

                {/* STEP 1: Standard Login Form & Guest Options */}
                {step === 'login' && (
                    <>
                        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div className="form-group">
                                <label className="form-label">Email Address</label>
                                <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="input-premium" required />
                            </div>
                            <div className="form-group">
                                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    Password
                                    <button type="button" onClick={() => setStep('forgot')} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.9rem', fontWeight: '500', cursor: 'pointer' }}>Forgot Password?</button>
                                </label>
                                <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="input-premium" required />
                            </div>

                            <button type="submit" disabled={isLoggingIn} className="btn-primary" style={{ padding: '14px', borderRadius: '12px' }}>
                                {isLoggingIn ? "Logging in..." : "Login"}
                            </button>
                        </form>

                        {/* Guest Login Option */}
                        <div style={{ marginTop: '24px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
                                <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }}></div>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>OR</span>
                                <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }}></div>
                            </div>
                            <button onClick={guestLogin} className="btn-primary" style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)' }}>
                                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    <User size={18} /> Continue as Guest
                                </span>
                            </button>
                        </div>

                        <div style={{ marginTop: '24px', textAlign: 'center' }}>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                Don't have an account?{' '}
                                <Link to="/register" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: '500' }}>
                                    Sign Up
                                </Link>
                            </p>
                        </div>
                    </>
                )}

                {/* STEP 2: Forgot Password Form */}
                {step === 'forgot' && (
                    <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center' }}>Enter your email address and we'll send you a 6-digit OTP to reset your password.</p>
                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="input-premium" required />
                        </div>
                        <button type="submit" className="btn-primary" style={{ padding: '14px', borderRadius: '12px' }}>Send Reset OTP</button>
                        <button type="button" onClick={() => setStep('login')} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.9rem', fontWeight: '500', cursor: 'pointer', marginTop: '4px', textDecoration: 'underline' }}>Back to Login</button>
                    </form>
                )}

                {/* STEP 3: Reset Password Form */}
                {step === 'reset' && (
                    <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center' }}>We sent an OTP to {email}. Enter it below along with your new password!</p>
                        <div className="form-group">
                            <label className="form-label">6-Digit OTP</label>
                            <input type="text" placeholder="123456" value={otp} onChange={(e) => setOtp(e.target.value)} className="input-premium" required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">New Password</label>
                            <input type="password" placeholder="Enter new password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="input-premium" required minLength="6" />
                        </div>
                        <button type="submit" className="btn-primary" style={{ padding: '14px', borderRadius: '12px' }}>Reset Password</button>
                    </form>
                )}

            </div>
        </div>
    );
}
