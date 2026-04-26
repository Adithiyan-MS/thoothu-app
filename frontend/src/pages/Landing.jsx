import React from 'react';
import { MessageSquare, Shield, Zap, ArrowRight } from 'lucide-react';

const AUTH_URL = "https://aranid.onrender.com";
const CURRENT_APP_URL = window.location.origin;

export default function Landing() {
    const handleLogin = () => {
        window.location.href = `${AUTH_URL}?redirect=${CURRENT_APP_URL}`;
    };

    const handleRegister = () => {
        window.location.href = `${AUTH_URL}/register.html?redirect=${CURRENT_APP_URL}`;
    };

    return (
        <div style={{ 
            minHeight: '100vh', 
            background: 'radial-gradient(circle at top right, #1e1e2d, #0d0d12)',
            color: 'white',
            fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
            {/* Navbar */}
            <nav style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: '24px 40px',
                borderBottom: '1px solid rgba(255,255,255,0.05)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ 
                        background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                        padding: '8px',
                        borderRadius: '12px'
                    }}>
                        <MessageSquare size={24} />
                    </div>
                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold', letterSpacing: '-0.02em' }}>Thoothu</span>
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                    <button onClick={handleLogin} className="btn-secondary" style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontWeight: '500' }}>Login</button>
                    <button onClick={handleRegister} className="btn-primary" style={{ padding: '10px 20px', borderRadius: '10px', background: 'var(--accent-primary)', border: 'none', color: 'white', cursor: 'pointer', fontWeight: '500' }}>Get Started</button>
                </div>
            </nav>

            {/* Hero Section */}
            <main style={{ 
                maxWidth: '1200px', 
                margin: '0 auto', 
                padding: '80px 40px',
                textAlign: 'center'
            }}>
                <div style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    padding: '8px 16px',
                    borderRadius: '100px',
                    background: 'rgba(168, 85, 247, 0.1)',
                    border: '1px solid rgba(168, 85, 247, 0.2)',
                    color: '#a855f7',
                    fontSize: '0.9rem',
                    marginBottom: '24px'
                }}>
                    <Zap size={14} />
                    Powered by Universal Auth
                </div>

                <h1 style={{ 
                    fontSize: '4rem', 
                    fontWeight: '800', 
                    lineHeight: '1.1',
                    marginBottom: '24px',
                    background: 'linear-gradient(to bottom, #fff, #94a3b8)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    The intentional way <br/> to connect.
                </h1>

                <p style={{ 
                    fontSize: '1.25rem', 
                    color: '#94a3b8', 
                    maxWidth: '600px', 
                    margin: '0 auto 40px auto',
                    lineHeight: '1.6'
                }}>
                    Experience seamless, secure, and private messaging across all your favorite apps with a single identity.
                </p>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
                    <button onClick={handleRegister} style={{ 
                        padding: '16px 32px', 
                        borderRadius: '14px', 
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 10px 25px -5px rgba(168, 85, 247, 0.4)'
                    }}>
                        Start Chatting Now <ArrowRight size={20} />
                    </button>
                </div>

                {/* Features */}
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '32px',
                    marginTop: '100px'
                }}>
                    <div className="glass-panel" style={{ padding: '32px', textAlign: 'left', background: 'rgba(255,255,255,0.02)' }}>
                        <Shield style={{ color: '#a855f7', marginBottom: '16px' }} size={32} />
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '12px' }}>Universal Identity</h3>
                        <p style={{ color: '#94a3b8', lineHeight: '1.5' }}>Log in once at aranid.onrender.com and access all your apps instantly.</p>
                    </div>
                    <div className="glass-panel" style={{ padding: '32px', textAlign: 'left', background: 'rgba(255,255,255,0.02)' }}>
                        <Zap style={{ color: '#6366f1', marginBottom: '16px' }} size={32} />
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '12px' }}>Instant Handshake</h3>
                        <p style={{ color: '#94a3b8', lineHeight: '1.5' }}>No more repetitive login forms. Your identity follows you seamlessly.</p>
                    </div>
                    <div className="glass-panel" style={{ padding: '32px', textAlign: 'left', background: 'rgba(255,255,255,0.02)' }}>
                        <MessageSquare style={{ color: '#f43f5e', marginBottom: '16px' }} size={32} />
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '12px' }}>Secure Chat</h3>
                        <p style={{ color: '#94a3b8', lineHeight: '1.5' }}>Real-time messaging built on top of a rock-solid security foundation.</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
