'use client';
import { useState, useRef } from 'react';
import Header from '../components/header/Header';
import Footer from '../components/footer/Footer';

const green = '#0b5a21';

export default function VerifyPasswordPage() {
  const [code, setCode] = useState(['', '', '', '']);
  const inputs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  function handleChange(i, v) {
    if (!/^\d?$/.test(v)) return;
    const next = [...code];
    next[i] = v;
    setCode(next);
    if (v && i < inputs.length - 1) inputs[i + 1].current?.focus();
  }

  function handleKeyDown(i, e) {
    if (e.key === 'Backspace' && !code[i] && i > 0) {
      inputs[i - 1].current?.focus();
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    const value = code.join('');
    // send value to your API here
  }

  return (
    <>
      <Header />
      <main>
        <div style={{ maxWidth: 640, margin: '40px auto', padding: '0 16px', textAlign: 'center' }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: '10px 0 20px' }}>Verification</h1>
          <p style={{ marginBottom: 18 }}>Enter Verification Code</p>

          <form onSubmit={onSubmit} style={{ display: 'grid', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 14 }}>
              {code.map((v, i) => (
                <input
                  key={i}
                  ref={inputs[i]}
                  value={v}
                  inputMode="numeric"
                  maxLength={1}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  style={{
                    width: 56,
                    height: 56,
                    textAlign: 'center',
                    fontSize: 22,
                    border: '1px solid #e5e7eb',
                    borderRadius: 999
                  }}
                />
              ))}
            </div>

            <div style={{ fontSize: 13, color: '#6b7280' }}>
              If you didn’t receive a code?{' '}
              <button type="button" onClick={() => {}} style={{ color: '#ea580c', background: 'none', border: 'none', cursor: 'pointer' }}>
                Resend
              </button>
            </div>

            <button
              type="submit"
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
              Verify
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}
