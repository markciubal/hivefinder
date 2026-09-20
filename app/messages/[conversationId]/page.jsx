"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import PageShell from "../../components/layout/PageShell";
import RequireAuth from "../../components/auth/RequireAuth";
import ReportButton from "../../components/moderation/ReportButton";
import BlockButton from "../../components/moderation/BlockButton";
import { useAuth } from "../../components/auth/AuthProvider";
import { apiFetch, timeAgo } from "../../lib/apiClient";

/** How often to look for replies while the thread is open and visible. */
const POLL_MS = 10000;

/**
 * One conversation.
 *
 * `/messages/new?to=<userId>&name=<username>` opens an empty composer for
 * someone you have not messaged yet. The thread only comes into existence when
 * the first message is sent - creating empty conversations on click would
 * litter the inbox with threads nobody wrote in.
 */
function Thread() {
  const { conversationId } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { token, user } = useAuth();

  const isNew = conversationId === "new";
  const toUserId = searchParams.get("to");
  const toName = searchParams.get("name");

  const [other, setOther] = useState(
    isNew ? { id: toUserId, username: toName || "New conversation" } : null
  );
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(!isNew);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  // Who, if anyone, has blocked whom. Comes from the thread GET; for a new
  // conversation it is only learned if the first send is refused.
  const [block, setBlock] = useState({ byMe: false, byThem: false });

  const endRef = useRef(null);

  const load = useCallback(async () => {
    if (isNew) return;
    try {
      const data = await apiFetch(`/api/messages/${conversationId}`, { token });
      setOther(data.other);
      setMessages(data.messages || []);
      setBlock(data.block || { byMe: false, byThem: false });
      setError("");
    } catch (e) {
      setError(e.message || "Could not load this conversation.");
    } finally {
      setLoading(false);
    }
  }, [conversationId, isNew, token]);

  useEffect(() => {
    load();
    if (isNew) return;

    const tick = () => {
      if (document.visibilityState === "visible") load();
    };
    const id = setInterval(tick, POLL_MS);
    return () => clearInterval(id);
  }, [load, isNew]);

  // Keep the newest message in view.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  async function send(e) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;

    setSending(true);
    setError("");

    try {
      if (isNew) {
        if (!toUserId) throw new Error("No recipient selected.");
        const data = await apiFetch("/api/messages", {
          token,
          method: "POST",
          body: { toUserId, body: text },
        });
        // Swap the placeholder URL for the real thread so refresh and the back
        // button behave.
        router.replace(`/messages/${data.conversationId}`);
        return;
      }

      const data = await apiFetch(`/api/messages/${conversationId}`, {
        token,
        method: "POST",
        body: { body: text },
      });
      setMessages((prev) => [...prev, data.message]);
      setDraft("");
    } catch (e2) {
      if (e2.status === 403 && e2.data?.blocked) {
        setBlock({
          byMe: e2.data.blocked === "byMe",
          byThem: e2.data.blocked === "byThem",
        });
      }
      setError(e2.message || "Could not send.");
    } finally {
      setSending(false);
    }
  }

  function onKeyDown(e) {
    // Enter sends, Shift+Enter adds a line - the convention every chat app uses.
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(e);
    }
  }

  if (isNew && !toUserId) {
    return (
      <PageShell title="New message" width="md">
        <p className="hf-card p-6 text-sm text-gray-600">
          Pick someone to message from Friend Finder.
        </p>
        <Link href="/friendFinder" className="hf-btn hf-btn-primary mt-4">
          Open Friend Finder
        </Link>
      </PageShell>
    );
  }

  return (
    <PageShell width="md">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/messages"
            className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-black"
            aria-label="Back to inbox"
          >
            ←
          </Link>
          <h1 className="text-xl font-bold text-black">
            {other?.username || "Conversation"}
          </h1>
        </div>
        {other?.id && (
          <div className="flex items-center gap-4">
            {!isNew && (
              <ReportButton
                targetType="USER"
                targetId={other.id}
                targetLabel={other.username}
                label="Report user"
              />
            )}
            <BlockButton
              userId={other.id}
              username={other.username}
              blocked={block.byMe}
              onChange={(nowBlocked) => {
                setBlock((b) => ({ ...b, byMe: nowBlocked }));
                setError("");
              }}
            />
          </div>
        )}
      </div>

      <div className="hf-card flex h-[60vh] min-h-[320px] flex-col overflow-hidden">
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {loading && (
            <p className="text-center text-sm text-gray-500">Loading…</p>
          )}

          {!loading && messages.length === 0 && (
            <p className="py-10 text-center text-sm text-gray-500">
              {isNew
                ? `Say hello to ${other?.username || "them"}.`
                : "No messages yet."}
            </p>
          )}

          {messages.map((m) => {
            const mine = m.senderId === user?.id;
            return (
              <div
                key={m.id}
                className={`flex ${mine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`group max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                    mine
                      ? "rounded-br-sm bg-[var(--hf-green)] text-white"
                      : "rounded-bl-sm bg-gray-100 text-black"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <div
                    className={`mt-1 flex items-center gap-2 text-xxs ${
                      mine ? "text-white/70" : "text-gray-500"
                    }`}
                  >
                    <span>{timeAgo(m.createdAt)}</span>
                    {!mine && (
                      <ReportButton
                        targetType="MESSAGE"
                        targetId={m.id}
                        targetLabel={m.body.slice(0, 80)}
                        className="!text-xxs opacity-0 group-hover:opacity-100 focus:opacity-100"
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>

        {block.byMe || block.byThem ? (
          <p className="border-t border-gray-200 bg-[var(--hf-surface-alt)] p-4 text-center text-sm text-gray-600">
            {block.byMe
              ? `You blocked ${other?.username || "this person"}. Unblock them to send a message.`
              : "You can't reply to this conversation."}
          </p>
        ) : (
        <form
          onSubmit={send}
          className="flex items-end gap-2 border-t border-gray-200 p-3"
        >
          <label htmlFor="msg-draft" className="sr-only">
            Message
          </label>
          <textarea
            id="msg-draft"
            className="hf-input max-h-40 flex-1 resize-none"
            rows={1}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Write a message…"
            maxLength={4000}
          />
          <button
            type="submit"
            disabled={sending || !draft.trim()}
            className="hf-btn hf-btn-primary"
          >
            {sending ? "…" : "Send"}
          </button>
        </form>
        )}
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </PageShell>
  );
}

export default function ThreadPage() {
  return (
    <RequireAuth what="messaging">
      <Thread />
    </RequireAuth>
  );
}
