'use client';

import { useEffect, useState } from 'react';
import Header from '../components/header/Header.jsx';
import InterestsSelector from '../components/interests/InterestsSelector.jsx';
export default function AccountPage() {
  const [username, setUsername] = useState('');
  const [firstName, setFirst] = useState('');
  const [lastName,  setLast]  = useState('');
  const [email,     setEmail] = useState('');
  const [about,     setAbout] = useState('');

  const [selectedInterests, setSelectedInterests] = useState([]);

  const [msg,       setMsg]   = useState('');
  const [err,       setErr]   = useState('');
  const [loading,   setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  function getLocalToken() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  }

  // load profile on mount
  useEffect(() => {
    const token = getLocalToken();
    if (!token) {
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return;
    }

    (async () => {
      try {
        const res = await fetch('/api/user/me', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const text = await res.text();
          console.error('GET /api/user/me failed', res.status, text);
          if (res.status === 401 && typeof window !== 'undefined') {
            window.location.href = '/login';
            return;
          }
          setErr(`Failed to load account (status ${res.status})`);
          return;
        }

        const u = await res.json();
        setUsername(u.username || '');
        setFirst(u.firstName || '');
        setLast(u.lastName || '');
        setEmail(u.email || '');
        setAbout(u.about || '');
        setSelectedInterests(u.interests || []);
      } catch (e) {
        console.error('Network error loading /api/user/me', e);
        setErr('Network error while loading account');
      } finally {
        setInitialLoading(false);
      }
    })();
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setErr('');
    setMsg('');

    const token = getLocalToken();
    if (!token) {
      setErr('Please log in');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/user/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          about,
          interests: selectedInterests,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('PUT /api/user/me failed', res.status, text);
        setErr(`Failed to save account (status ${res.status})`);
        setLoading(false);
        return;
      }

      setMsg('Saved');
    } catch (e) {
      console.error('Network error saving /api/user/me', e);
      setErr('Network error while saving account');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-center mb-8">
          Edit Account Details
        </h1>

        {initialLoading ? (
          <p className="text-center text-sm text-gray-600">Loading your profile…</p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-6">
            {/* Account summary card */}
            <section className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
              <h2 className="text-lg font-semibold text-black mb-3">
                Basic Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Username (read-only) */}
                <div>
                  <label className="block text-sm mb-1 text-gray-700">
                    Username
                  </label>
                  <input
                    className="w-full rounded border px-3 py-2 bg-gray-100 text-gray-700"
                    value={username}
                    readOnly
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Username is currently not editable.
                  </p>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm mb-1 text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full rounded border px-3 py-2"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>

                {/* First name */}
                <div>
                  <label className="block text-sm mb-1 text-gray-700">
                    First Name
                  </label>
                  <input
                    className="w-full rounded border px-3 py-2"
                    value={firstName}
                    onChange={e => setFirst(e.target.value)}
                  />
                </div>

                {/* Last name */}
                <div>
                  <label className="block text-sm mb-1 text-gray-700">
                    Last Name
                  </label>
                  <input
                    className="w-full rounded border px-3 py-2"
                    value={lastName}
                    onChange={e => setLast(e.target.value)}
                  />
                </div>
              </div>

              {/* About */}
              <div className="mt-4">
                <label className="block text-sm mb-1 text-gray-700">
                  About Me
                </label>
                <textarea
                  className="w-full rounded border px-3 py-2 min-h-[80px]"
                  value={about}
                  onChange={e => setAbout(e.target.value)}
                />
              </div>
            </section>

            <InterestsSelector
              selectedInterests={selectedInterests}
              setSelectedInterests={setSelectedInterests}
            />

            {err && <p className="text-red-600 text-sm">{err}</p>}
            {msg && <p className="text-green-700 text-sm">{msg}</p>}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="rounded bg-green-800 text-white px-5 py-2 font-semibold disabled:opacity-60"
              >
                {loading ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </main>
    </>
  );
}

