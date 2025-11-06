'use client';
import { useState } from 'react';
import Link from 'next/link';
import Header from '../components/header/Header';
import Footer from '../components/footer/Footer';

const green = '#0b5a21';
const field = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid #e5e7eb',
  borderRadius: 6,
  outline: 'none'
};

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    setMsg(null); setErr(null);
    if (!username || !password) { setErr('Enter username and password'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (res.ok) setMsg('Logged in');
      else {
        const data = await res.json().catch(() => ({}));
        setErr(data?.message || 'Login failed');
      }
    } catch {
      setErr('Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Header />
      <main>
        <div style={{ maxWidth: 640, margin: '40px auto', padding: '0 16px', textAlign: 'center' }}>
          <h1 style={{ fontSize: 36, fontWeight: 800, margin: '10px 0 20px' }}>Log In</h1>

          <form onSubmit={onSubmit} style={{ display: 'grid', gap: 14, textAlign: 'left' }}>
            <label>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>Username</div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter Username"
                autoComplete="username"
                required
                style={field}
              />
            </label>

            <label>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>Password</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  style={{ ...field, flex: 1 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{
                    padding: '0 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: 6,
                    background: '#fff',
                    cursor: 'pointer'
                  }}
                  aria-label="Toggle password visibility"
                >
                  {showPw ? 'Hide' : 'Show'}
                </button>
              </div>
            </label>

            <div style={{ textAlign: 'center', fontSize: 12, color: '#6b7280', marginTop: 6 }}>
              <Link href="/forgotPassword" style={{ color: '#6b7280' }}>
                Forgot Username or Password?
              </Link>
              <div style={{ marginTop: 6 }}>
                Don&apos;t have an account? <Link href="/signUp">Create One!</Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                margin: '6px auto 0',
                width: 320,
                padding: '12px 16px',
                background: green,
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {loading ? 'Signing in…' : 'Log In'}
            </button>

            {msg && <p style={{ color: 'green', textAlign: 'center' }}>{msg}</p>}
            {err && <p style={{ color: 'crimson', textAlign: 'center' }}>{err}</p>}
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}
