"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Msg = { role: "user" | "assistant"; content: string };

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Welcome. I am Origins AI — your guide to the Guardian system. Ask me anything about the device, the pipeline, the team, or how it all works." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    const trimmed = next.slice(-6); // last 6 only — saves quota
    setMessages(next); setInput(""); setLoading(true);
    try {
      const r = await fetch("/api/chatbot", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: trimmed }) });
      const j = await r.json();
      setMessages([...next, { role: "assistant", content: j.text ?? "An error occurred." }]);
    } catch {
      setMessages([...next, { role: "assistant", content: "Network error — please try again." }]);
    } finally { setLoading(false); }
  };

  return (
    <>
      <motion.button type="button" className={`chat-fab ${open ? "open" : ""}`}
        onClick={() => setOpen(p => !p)} aria-label={open ? "Close Origins AI" : "Open Origins AI"}
        whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}>
        {open ? "✕" : "◉"}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div className="chat-panel"
            initial={{ opacity: 0, y: 20, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.94 }} transition={{ type: "spring", damping: 26, stiffness: 320 }}>
            <div className="chat-header">
              <span className="chat-header-icon">◉</span>
              <span className="chat-eyebrow">Origins AI</span>
              <span className="chat-status-dot ready" />
              <button type="button" className="chat-close" onClick={() => setOpen(false)}>✕</button>
            </div>
            <div className="chat-messages">
              {messages.map((m, i) => (
                <div key={i} className={`chat-msg ${m.role}`}>
                  {m.role === "assistant" && <span className="chat-avatar" aria-hidden>◉</span>}
                  <div className="chat-bubble">{m.content}</div>
                </div>
              ))}
              {loading && (
                <div className="chat-msg assistant">
                  <span className="chat-avatar" aria-hidden>◉</span>
                  <div className="chat-bubble chat-typing"><span /><span /><span /></div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
            <div className="chat-input-row">
              <input className="chat-input" placeholder="Ask about Origins Guardian…" value={input}
                onChange={e => setInput(e.target.value)} disabled={loading} autoComplete="off"
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} />
              <button type="button" className="chat-send" onClick={send}
                disabled={loading || !input.trim()} aria-label="Send">⚡</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
