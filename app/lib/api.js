export async function api(path, { method = 'GET', body } = {}) {
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050';
  const res = await fetch(`${base}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    // IMPORTANT: do NOT send cookies
    credentials: 'omit',
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(t || res.statusText);
  }
  return res.json().catch(() => ({}));
}
