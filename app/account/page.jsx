'use client';

import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { getToken } from '../lib/clientAuth';

export default function AccountPage() {
  const [firstName, setFirst] = useState('');
  const [lastName,  setLast]  = useState('');
  const [email,     setEmail] = useState('');
  const [about,     setAbout] = useState('');
  const [msg,       setMsg]   = useState('');
  const [err,       setErr]   = useState('');
  const [loading,   setLoading] = useState(false);

  // load profile
  useEffect(() => {
    const token = getToken();
    if (!token) { window.location.href = '/login'; return; }
    api('/api/user/me', { method: 'GET', token })
      .then(u => {
        setFirst(u.firstName || '');
        setLast(u.lastName || '');
        setEmail(u.email || '');
        setAbout(u.about || '');
      })
      .catch(e => setErr(e.message));
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setErr(''); setMsg('');
    const token = getToken();
    if (!token) { setErr('Please log in'); return; }
    setLoading(true);
    try {
      await api('/api/user/me', {
        method: 'PUT',
        body: { firstName, lastName, email, about },
        token
      });
      setMsg('Saved');
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-center mb-8">Edit Account Details</h1>

      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label className="block text-sm mb-1">Name</label>
          <input className="w-full rounded border px-3 py-2"
                 value={firstName} onChange={e=>setFirst(e.target.value)} />
        </div>

        <div>
          <label className="block text-sm mb-1">Last Name</label>
          <input className="w-full rounded border px-3 py-2"
                 value={lastName} onChange={e=>setLast(e.target.value)} />
        </div>

        <div>
          <label className="block text-sm mb-1">Email</label>
          <input type="email" className="w-full rounded border px-3 py-2"
                 value={email} onChange={e=>setEmail(e.target.value)} />
        </div>

        <div>
          <label className="block text-sm mb-1">About Me</label>
          <input className="w-full rounded border px-3 py-2"
                 value={about} onChange={e=>setAbout(e.target.value)} />
        </div>

        {err && <p className="text-red-600 text-sm">{err}</p>}
        {msg && <p className="text-green-700 text-sm">{msg}</p>}

        <button type="submit"
                disabled={loading}
                className="rounded bg-green-800 text-white px-4 py-2 font-semibold disabled:opacity-60">
          {loading ? 'Saving…' : 'Submit'}
        </button>
      </form>
    </main>
  );
}
