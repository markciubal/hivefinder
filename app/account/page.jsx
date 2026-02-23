'use client';

import { useEffect, useState } from 'react';
import Header from '../components/header/Header.jsx';
import InterestsSelector from '../components/interests/InterestsSelector.jsx';

const CONTACT_TYPE_OPTIONS = [
  { value: 'EMAIL', label: 'Email', placeholder: 'you@example.com' },
  { value: 'PHONE', label: 'Phone', placeholder: '+1 555 123 4567' },
  { value: 'DISCORD', label: 'Discord', placeholder: '@username' },
  { value: 'OTHER', label: 'Other', placeholder: 'Contact handle or URL' },
];

export default function AccountPage() {
  const [username, setUsername] = useState('');
  const [firstName, setFirst] = useState('');
  const [lastName,  setLast]  = useState('');
  const [email,     setEmail] = useState('');
  const [about,     setAbout] = useState('');

  const [selectedInterests, setSelectedInterests] = useState([]);
  const [contactMethods, setContactMethods] = useState([]);

  const [msg,       setMsg]   = useState('');
  const [err,       setErr]   = useState('');
  const [loading,   setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
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
        setContactMethods(
          Array.isArray(u.contactMethods) ? u.contactMethods : []
        );
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
          contactMethods,
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

  async function onDeleteAccount() {
    setErr('');
    setMsg('');

    const token = getLocalToken();
    if (!token) {
      setErr('Please log in');
      return;
    }

    const confirmed = typeof window !== 'undefined'
      ? window.confirm('This will permanently delete your account and data. Continue?')
      : false;
    if (!confirmed) return;

    setDeleteLoading(true);
    try {
      const res = await fetch('/api/user/me', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('DELETE /api/user/me failed', res.status, text);
        setErr(`Failed to delete account (status ${res.status})`);
        setDeleteLoading(false);
        return;
      }

      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
      }
    } catch (e) {
      console.error('Network error deleting account', e);
      setErr('Network error while deleting account');
    } finally {
      setDeleteLoading(false);
    }
  }

  const addContactMethod = () => {
    setContactMethods((prev) => {
      const hasPreferred = prev.some((method) => method.preferred);
      return [
        ...prev,
        {
          localId: `local-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          type: 'EMAIL',
          value: '',
          label: '',
          preferred: !hasPreferred,
          visible: true,
        },
      ];
    });
  };

  const updateContactMethod = (index, field, value) => {
    setContactMethods((prev) =>
      prev.map((method, idx) =>
        idx === index ? { ...method, [field]: value } : method
      )
    );
  };

  const setPreferredContact = (index) => {
    setContactMethods((prev) =>
      prev.map((method, idx) => ({
        ...method,
        preferred: idx === index,
      }))
    );
  };

  const removeContactMethod = (index) => {
    setContactMethods((prev) => prev.filter((_, idx) => idx !== index));
  };

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

            <section className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-black">
                    Contact Methods
                  </h2>
                  <p className="text-xs text-gray-600">
                    Choose how others can reach you and select one preferred method.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addContactMethod}
                  className="rounded bg-green-800 text-white px-3 py-1 text-sm font-semibold hover:bg-green-700"
                >
                  Add Method
                </button>
              </div>

              {contactMethods.length === 0 && (
                <p className="mt-3 text-xs text-gray-500">
                  No contact methods added yet.
                </p>
              )}

              <div className="mt-3 space-y-3">
                {contactMethods.map((method, index) => {
                  const option = CONTACT_TYPE_OPTIONS.find(
                    (opt) => opt.value === method.type
                  );
                  return (
                    <div
                      key={method.id || method.localId || index}
                      className="rounded border border-gray-200 p-3 bg-neutral-50"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
                        <div className="md:col-span-1">
                          <label className="block text-xs text-gray-600 mb-1">
                            Type
                          </label>
                          <select
                            value={method.type || 'EMAIL'}
                            onChange={(e) =>
                              updateContactMethod(index, 'type', e.target.value)
                            }
                            className="w-full rounded border px-2 py-2 text-sm"
                          >
                            {CONTACT_TYPE_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-xs text-gray-600 mb-1">
                            Value
                          </label>
                          <input
                            value={method.value || ''}
                            onChange={(e) =>
                              updateContactMethod(index, 'value', e.target.value)
                            }
                            className="w-full rounded border px-2 py-2 text-sm"
                            placeholder={option?.placeholder}
                          />
                        </div>

                        {method.type === 'OTHER' && (
                          <div className="md:col-span-2">
                            <label className="block text-xs text-gray-600 mb-1">
                              Label
                            </label>
                            <input
                              value={method.label || ''}
                              onChange={(e) =>
                                updateContactMethod(index, 'label', e.target.value)
                              }
                              className="w-full rounded border px-2 py-2 text-sm"
                              placeholder="Telegram, Signal, etc."
                            />
                          </div>
                        )}

                        <div className="md:col-span-5 flex flex-wrap items-center gap-4">
                          <label className="text-xs text-gray-700 flex items-center gap-2">
                            <input
                              type="radio"
                              name="preferredContact"
                              checked={Boolean(method.preferred)}
                              onChange={() => setPreferredContact(index)}
                            />
                            Preferred
                          </label>
                          <label className="text-xs text-gray-700 flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={method.visible !== false}
                              onChange={(e) =>
                                updateContactMethod(index, 'visible', e.target.checked)
                              }
                            />
                            Visible to others
                          </label>
                          <button
                            type="button"
                            onClick={() => removeContactMethod(index)}
                            className="text-xs text-red-600 underline"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

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

            <section className="border border-red-200 rounded-lg p-4 bg-red-50 shadow-sm">
              <h2 className="text-lg font-semibold text-red-800">
                Delete Account
              </h2>
              <p className="text-xs text-red-700 mt-1">
                This action is permanent and cannot be undone.
              </p>
              <button
                type="button"
                onClick={onDeleteAccount}
                disabled={deleteLoading}
                className="mt-3 rounded bg-red-700 text-white px-4 py-2 text-xs font-semibold hover:bg-red-600 disabled:opacity-60"
              >
                {deleteLoading ? 'Deleting…' : 'Delete My Account'}
              </button>
            </section>

          </form>
        )}
      </main>
    </>
  );
}


