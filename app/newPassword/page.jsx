'use client';

import { useState } from 'react';
import { api } from '../lib/api';

export default function NewPasswordPage(){
  const [pw1,setPw1] = useState('');
  const [pw2,setPw2] = useState('');
  const [loading,setLoading] = useState(false);
  const [err,setErr] = useState('');
  const [msg,setMsg] = useState('');

  async function onSubmit(e){
    e.preventDefault();
    setErr(''); setMsg('');

    if(pw1.length < 8){ setErr('Min. 8 characters'); return; }
    if(pw1 !== pw2){ setErr('Passwords do not match'); return; }

    const token = new URLSearchParams(window.location.search).get('token');
    if(!token){ setErr('Missing reset token'); return; }

    setLoading(true);
    try{
      await api('/api/auth/reset-password', {
        method: 'POST',
        body: { token, password: pw1 }
      });
      setMsg('Password updated');
      setTimeout(()=>{ window.location.href='/login'; }, 800);
    }catch(e){
      setErr(e.message);
    }finally{
      setLoading(false);
    }
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-center mb-10">Enter New Password</h1>

      <form onSubmit={onSubmit} className="space-y-6">
        <div>
          <label className="block text-sm mb-1">Enter New Password</label>
          <input
            type="password"
            value={pw1}
            onChange={e=>setPw1(e.target.value)}
            className="w-full rounded border px-3 py-2"
            placeholder="Min. 8 characters"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Confirm Password</label>
          <input
            type="password"
            value={pw2}
            onChange={e=>setPw2(e.target.value)}
            className="w-full rounded border px-3 py-2"
            placeholder="Min. 8 characters"
          />
        </div>

        {err && <p className="text-red-600 text-sm">{err}</p>}
        {msg && <p className="text-green-700 text-sm">{msg}</p>}

        <div className="flex gap-3">
          <a href="/login" className="flex-1 rounded border px-3 py-2 text-center">Back to Sign In</a>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded bg-green-800 text-white py-2 font-semibold disabled:opacity-60"
          >
            {loading ? 'Submitting…' : 'Submit'}
          </button>
        </div>
      </form>
    </main>
  );
}
