'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    setErr('');
    setMsg('');

    if (!email || !password) {
      setErr('Enter email and password');
      return;
    }

    setLoading(true);
    try {
      const res = await signIn('credentials', {
        redirect: false, // false to handle errors in UI
        email,
        password,
      });

      if (res?.error) {
        setErr(res.error);
      } else {
        setMsg('Logged in');
        setTimeout(() => {
          window.location.href = '/'; // redirect after login
        }, 800);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-center mb-10">Log In</h1>

      <form onSubmit={onSubmit} className="space-y-6">
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border px-3 py-2"
            placeholder="Enter Email"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded border px-3 py-2"
            placeholder="••••••••"
          />
        </div>

        {err && <p className="text-red-600 text-sm">{err}</p>}
        {msg && <p className="text-green-700 text-sm">{msg}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-green-800 text-white py-2 font-semibold disabled:opacity-60"
        >
          {loading ? 'Logging in…' : 'Log In'}
        </button>
      </form>
    </main>
  );
}
