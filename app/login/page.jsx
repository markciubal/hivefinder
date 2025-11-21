'use client';

import { useState } from 'react';
import { api } from '../lib/api';
import { saveToken } from '../lib/clientAuth';

export default function LoginPage(){
  const [username,setUsername] = useState('');
  const [password,setPassword] = useState('');
  const [loading,setLoading] = useState(false);
  const [err,setErr] = useState('');
  const [msg,setMsg] = useState('');

  async function onSubmit(e){
    e.preventDefault();
    setErr(''); setMsg('');
    if(!username || !password){ setErr('Enter username and password'); return; }

    setLoading(true);
    try{
      const data = await api('/api/auth/login', {
        method: 'POST',
        body: { username, password }
      });
      // data = { token, user: { id, username, email } }
      saveToken(data.token);
      setMsg('Logged in');
      setTimeout(()=>{ window.location.href = '/'; }, 800);
    }catch(e){
      setErr(e.message);
    }finally{
      setLoading(false);
    }
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-center mb-10">Log In</h1>

      <form onSubmit={onSubmit} className="space-y-6">
        <div>
          <label className="block text-sm mb-1">Username</label>
          <input
            value={username}
            onChange={e=>setUsername(e.target.value)}
            className="w-full rounded border px-3 py-2"
            placeholder="Enter Username"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={e=>setPassword(e.target.value)}
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

        <div className="text-center text-sm mt-2">
          <a href="/forgotPassword" className="underline">Forgot Username or Password?</a>
        </div>
      </form>
    </main>
  );
}
