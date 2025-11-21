'use client';

import { useState } from 'react';
import { api } from '../lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    setMsg('');
    setErr('');
    if (!email) {
      setErr('Enter your email');
      return;
    }
    setLoading(true);
    try {
      await api('/api/auth/forgot-password', {
        method: 'POST',
        body: { email }
      });
      // No console text. Tell the user to check their inbox.
      setMsg('If the email exists, we sent a reset link. Check your inbox.');
    } catch (e2) {
      // Backend returns 200 even when user is not found. Only show hard errors.
      setErr('Could not send email. Try again later.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-md mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6 text-center">Forgot password</h1>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input
            type="email"
            className="w-full rounded border px-3 py-2"
            placeholder="you@example.com"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
          />
        </div>

        {err && <p className="text-sm text-red-600">{err}</p>}
        {msg && <p className="text-sm text-green-700">{msg}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-green-800 text-white py-2 font-semibold disabled:opacity-60"
        >
          {loading ? 'Sending…' : 'Send reset link'}
        </button>
      </form>
    </main>
  );
}
