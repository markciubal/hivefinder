'use client';
import Link from 'next/link';

export default function DefaultButton({ type = 'link', label, url = '#', onClick }) {
  const base = "inline-block mt-4 px-5 py-2 rounded-md bg-[#0b5a21] text-white font-semibold";
  if (type === 'link') {
    return <Link href={url} className={base}>{label}</Link>;
  }
  return <button type="button" onClick={onClick} className={base}>{label}</button>;
}
