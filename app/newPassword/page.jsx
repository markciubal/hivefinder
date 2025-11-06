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

export default function NewPasswordPage() {
  const [pw1, setPw1] = useState('');
  const [pw2, setPw2] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    setMsg(null); setErr(null);
    if (pw1.length < 8) { setErr('Min. 8 characters'); return; }
    if (pw1 !== pw2) { setErr('Passwords do not match'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw1 })
      });
      if (res.ok) setMsg('Password updated');
      else {
        const data = await res.json().catch(() => ({}));
        setErr(data?.message || 'Request failed');
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
          <h1 style={{ fontSize: 36, fontWeight: 800, margin: '10px 0 20px' }}>Enter New Password</h1>

          <form onSubmit={onSubmit} style={{ display: 'grid', gap: 14, textAlign: 'left' }}>
            <label>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>Enter New Password</div>
              <input
                type="password"
                value={pw1}
                onChange={(e) => setPw1(e.target.value)}
                placeholder="Min. 8 characters"
                autoComplete="new-password"
                required
                style={field}
              />
            </label>

            <label>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>Confirm Password</div>
              <input
                type="password"
                value={pw2}
                onChange={(e) => setPw2(e.target.value)}
                placeholder="Min. 8 characters"
                autoComplete="new-password"
                required
                style={field}
              />
            </label>

            <Link
              href="/login"
              style={{
                width: 320,
                margin: '0 auto',
                textAlign: 'center',
                padding: '10px 16px',
                color: '#6b7280',
                border: '1px solid #e5e7eb',
                borderRadius: 6
              }}
            >
              Back to Sign In
            </Link>

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
              {loading ? 'Submitting…' : 'Submit'}
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
