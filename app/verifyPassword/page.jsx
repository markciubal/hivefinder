"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import PageShell from "../components/layout/PageShell";

const LENGTH = 4;

export default function VerifyPasswordPage() {
  const [code, setCode] = useState(Array(LENGTH).fill(""));
  const [notice, setNotice] = useState("");
  const inputs = useRef([]);

  function handleChange(i, v) {
    if (!/^\d?$/.test(v)) return;
    const next = [...code];
    next[i] = v;
    setCode(next);
    if (v && i < LENGTH - 1) inputs.current[i + 1]?.focus();
  }

  function handleKeyDown(i, e) {
    if (e.key === "Backspace" && !code[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  }

  function onSubmit(e) {
    e.preventDefault();
    // No verification endpoint exists yet; say so rather than silently
    // swallowing the code the way this form used to.
    setNotice(
      "Code verification is not connected to the backend yet. Use the emailed reset link instead."
    );
  }

  return (
    <PageShell
      title="Verification"
      description="Enter the code we emailed you."
      width="sm"
    >
      <form onSubmit={onSubmit} className="hf-card space-y-6 p-6 text-center">
        <div className="flex justify-center gap-3">
          {code.map((v, i) => (
            <input
              key={i}
              ref={(el) => {
                inputs.current[i] = el;
              }}
              value={v}
              inputMode="numeric"
              maxLength={1}
              aria-label={`Digit ${i + 1} of ${LENGTH}`}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="h-14 w-14 rounded-full border border-gray-200 text-center text-xl focus:outline-2 focus:outline-[var(--hf-green)]"
            />
          ))}
        </div>

        <p className="text-sm text-gray-500">
          Did not get a code?{" "}
          <Link href="/forgotPassword" className="font-semibold text-orange-600 underline">
            Send another
          </Link>
        </p>

        {notice && <p className="text-sm text-amber-700">{notice}</p>}

        <button type="submit" className="hf-btn hf-btn-primary w-full">
          Verify
        </button>
      </form>
    </PageShell>
  );
}
