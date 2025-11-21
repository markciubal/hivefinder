'use client';

import { useState } from 'react';
import { api } from '../lib/api';

export default function SignUpPage() {
  const [username, setUsername] = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [msg,      setMsg]      = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setMsg('');

    if (!username || !email || !password || !confirm) {
      setError('Fill all fields');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await api('/api/auth/register', {
        method: 'POST',
        body: { username, email, password }
      });
      setMsg('Account created');
      setTimeout(() => { window.location.href = '/login'; }, 800);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-center mb-10">Create Account</h1>

      <form onSubmit={onSubmit} className="space-y-6">
        <div>
          <label className="block text-sm mb-1">Username</label>
          <input
            value={username}
            onChange={(e)=>setUsername(e.target.value)}
            className="w-full rounded border px-3 py-2"
            placeholder="yourname"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            className="w-full rounded border px-3 py-2"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
            className="w-full rounded border px-3 py-2"
            placeholder="Min. 8 characters"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Confirm Password</label>
          <input
            type="password"
            value={confirm}
            onChange={(e)=>setConfirm(e.target.value)}
            className="w-full rounded border px-3 py-2"
            placeholder="Match password"
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}
        {msg &&   <p className="text-green-700 text-sm">{msg}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-green-800 text-white py-2 font-semibold disabled:opacity-60"
        >
          {loading ? 'Creating…' : 'Sign Up'}
        </button>

        <div className="text-center text-sm mt-2">
          <a href="/login" className="underline">Already have an account</a>
        </div>
      </form>
    </main>
  );
}
