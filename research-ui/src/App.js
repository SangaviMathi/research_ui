import { useState, useRef, useEffect } from "react";

const SUGGESTIONS = [
  "Latest AI breakthroughs 2025",
  "Quantum computing progress",
  "Climate tech innovations",
  "Space exploration missions",
];

const C = {
  bg: "#0a0a0f",
  surface: "#111118",
  border: "#1e1e2e",
  accent: "#e8c97a",
  accent2: "#7a9fe8",
  text: "#e8e6e0",
  muted: "#5a5a72",
  success: "#6ee7b7",
  error: "#f87171",
};

const styles = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'JetBrains Mono', monospace; background: ${C.bg}; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 2px; }
  textarea { font-family: 'JetBrains Mono', monospace; }

  @keyframes bounce {
    0%,80%,100% { transform: scale(0.5); opacity: 0.3; }
    40% { transform: scale(1); opacity: 1; }
  }
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulse {
    0%,100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  .suggestion-chip:hover {
    border-color: ${C.accent} !important;
    color: ${C.accent} !important;
    background: rgba(232,201,122,0.05) !important;
  }
  .history-item:hover {
    border-color: ${C.border} !important;
    background: rgba(255,255,255,0.02) !important;
  }
  .send-btn:hover:not(:disabled) {
    background: #f0d48a !important;
  }
`;

function ThinkingDots() {
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{
          width: 6, height: 6, borderRadius: "50%",
          background: C.accent,
          animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
        }} />
      ))}
    </div>
  );
}

function Tag({ children, type }) {
  const colors = {
    source: { bg: "rgba(122,159,232,0.12)", border: "rgba(122,159,232,0.3)", color: C.accent2 },
    tool: { bg: "rgba(110,231,183,0.1)", border: "rgba(110,231,183,0.25)", color: C.success },
  };
  const c = colors[type];
  return (
    <span style={{
      padding: "2px 8px", fontSize: 11, borderRadius: 2,
      background: c.bg, border: `1px solid ${c.border}`, color: c.color,
      fontFamily: "'JetBrains Mono', monospace", display: "inline-block",
    }}>{children}</span>
  );
}

function ResultBubble({ data }) {
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`, borderRadius: 2,
      padding: "16px 20px", animation: "slideUp 0.4s ease", maxWidth: "100%",
    }}>
      <div style={{
        fontFamily: "'Playfair Display', serif", fontSize: 18, color: C.accent,
        borderBottom: `1px solid ${C.border}`, paddingBottom: 10, marginBottom: 12,
      }}>{data.topic}</div>
      <div style={{
        fontSize: 13, lineHeight: 1.8, color: C.text, marginBottom: 14,
        whiteSpace: "pre-wrap",
      }}>{data.summary}</div>
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        {data.sources?.length > 0 && (
          <div>
            <div style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: C.muted, marginBottom: 6 }}>Sources</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {data.sources.map((s, i) => (
                <a key={i} href={s} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
                  <Tag type="source">{s.length > 40 ? s.slice(0, 40) + "…" : s}</Tag>
                </a>
              ))}
            </div>
          </div>
        )}
        {data.tools_used?.length > 0 && (
          <div>
            <div style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: C.muted, marginBottom: 6 }}>Tools Used</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {data.tools_used.map((t, i) => <Tag key={i} type="tool">{t}</Tag>)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Message({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: isUser ? "flex-end" : "flex-start",
      gap: 6, animation: "slideUp 0.3s ease",
    }}>
      <div style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: C.muted }}>
        {isUser ? "▸ You" : "◆ Assistant"}
      </div>
      {isUser ? (
        <div style={{
          maxWidth: "75%", padding: "10px 14px",
          background: "rgba(232,201,122,0.08)", border: "1px solid rgba(232,201,122,0.2)",
          borderRadius: 2, color: C.accent, fontSize: 13, lineHeight: 1.6,
        }}>{msg.content}</div>
      ) : msg.type === "result" ? (
        <ResultBubble data={msg.content} />
      ) : msg.type === "error" ? (
        <div style={{
          padding: "10px 14px", background: "rgba(248,113,113,0.08)",
          border: "1px solid rgba(248,113,113,0.25)", borderRadius: 2,
          color: C.error, fontSize: 13,
        }}>{msg.content}</div>
      ) : (
        <div style={{
          padding: "10px 14px", background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 2, color: C.text, fontSize: 13,
        }}>{msg.content}</div>
      )}
    </div>
  );
}

export default function App() {
  const [messages, setMessages] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [endpoint, setEndpoint] = useState("http://localhost:8000");
  const [showConfig, setShowConfig] = useState(false);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({ queries: 0, sources: 0, tools: 0, time: "—" });
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addMessage = (msg) =>
    setMessages((prev) => [...prev, { id: Date.now() + Math.random(), ...msg }]);

  const sendQuery = async () => {
    if (!query.trim() || loading) return;
    const q = query.trim();
    setQuery("");
    setLoading(true);
    addMessage({ role: "user", type: "text", content: q });
    setHistory((prev) => [{ query: q, time: new Date() }, ...prev].slice(0, 15));

    const thinkingId = Date.now();
    setMessages((prev) => [...prev, { id: thinkingId, role: "assistant", type: "thinking" }]);

    const t0 = Date.now();
    try {
      const res = await fetch(`${endpoint}/research`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      setMessages((prev) => prev.filter((m) => m.id !== thinkingId));
      const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

      if (!res.ok) {
        addMessage({ role: "assistant", type: "error", content: `Server error ${res.status}: ${await res.text()}` });
      } else {
        const data = await res.json();
        addMessage({ role: "assistant", type: "result", content: data });
        setStats((s) => ({
          queries: s.queries + 1,
          sources: s.sources + (data.sources?.length || 0),
          tools: s.tools + (data.tools_used?.length || 0),
          time: elapsed,
        }));
      }
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== thinkingId));
      addMessage({
        role: "assistant", type: "error",
        content: `Could not connect to ${endpoint}/research\n\nMake sure your FastAPI backend is running:\n  uvicorn main:app --reload`,
      });
    }
    setLoading(false);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendQuery(); }
  };

  return (
    <>
      <style>{styles}</style>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", background: C.bg, color: C.text, height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Header */}
        <div style={{
          padding: "14px 28px", borderBottom: `1px solid ${C.border}`,
          display: "flex", alignItems: "center", gap: 14,
          background: "rgba(10,10,15,0.95)", flexShrink: 0, zIndex: 10,
        }}>
          <div style={{
            width: 34, height: 34, border: `1.5px dashed ${C.accent}`,
            borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center",
            color: C.accent, fontSize: 16, flexShrink: 0,
          }}>◈</div>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700 }}>Research Assistant</div>
            <div style={{ fontSize: 10, color: C.muted, letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 2 }}>Gemini 2.5 Flash · LangChain Agent</div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
            <button className="send-btn" onClick={() => setShowConfig(!showConfig)} style={{
              background: "none", border: `1px solid ${C.border}`, color: C.muted,
              cursor: "pointer", padding: "5px 12px", fontSize: 11, borderRadius: 2,
              fontFamily: "'JetBrains Mono', monospace", transition: "all 0.2s",
            }}>⚙ Config</button>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              <div style={{
                width: 7, height: 7, borderRadius: "50%",
                background: loading ? C.accent : C.success,
                boxShadow: `0 0 8px ${loading ? C.accent : C.success}`,
                animation: "pulse 2s ease-in-out infinite",
              }} />
              {loading ? "Researching..." : "Ready"}
            </div>
          </div>
        </div>

        {/* Config panel */}
        {showConfig && (
          <div style={{
            padding: "12px 28px", background: C.surface, borderBottom: `1px solid ${C.border}`,
            display: "flex", gap: 20, alignItems: "center", flexShrink: 0,
            animation: "slideUp 0.2s ease",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <label style={{ fontSize: 11, color: C.muted }}>Backend Endpoint</label>
              <input value={endpoint} onChange={(e) => setEndpoint(e.target.value)}
                style={{
                  background: C.bg, border: `1px solid ${C.border}`, color: C.text,
                  padding: "5px 10px", fontSize: 11, borderRadius: 2,
                  fontFamily: "'JetBrains Mono', monospace", width: 240, outline: "none",
                }}
              />
            </div>
            <div style={{ fontSize: 11, color: C.muted }}>
              Expects <span style={{ color: C.success }}>POST {endpoint}/research</span> → <span style={{ color: C.accent2 }}>{"{ topic, summary, sources[], tools_used[] }"}</span>
            </div>
          </div>
        )}

        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

          {/* Chat area */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px", display: "flex", flexDirection: "column", gap: 22 }}>
              {messages.length === 0 ? (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18, textAlign: "center", padding: "60px 20px", animation: "fadeIn 0.8s ease" }}>
                  <div style={{ fontSize: 48, opacity: 0.2 }}>◈</div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, opacity: 0.65 }}>What shall we explore?</div>
                  <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.9, maxWidth: 400 }}>
                    Ask me anything. I'll search the web, synthesize sources,<br />and return structured research with citations.
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 10 }}>
                    {SUGGESTIONS.map((s) => (
                      <button key={s} className="suggestion-chip" onClick={() => setQuery(s)} style={{
                        padding: "7px 16px", border: `1px solid ${C.border}`, borderRadius: 2,
                        background: "none", color: C.muted, cursor: "pointer", fontSize: 11,
                        fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.04em", transition: "all 0.2s",
                      }}>{s}</button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((msg) =>
                  msg.type === "thinking" ? (
                    <div key={msg.id} style={{ display: "flex", flexDirection: "column", gap: 6, animation: "slideUp 0.3s ease" }}>
                      <div style={{ fontSize: 10, color: C.muted, letterSpacing: "0.15em", textTransform: "uppercase" }}>◆ Processing</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 2, fontSize: 12, color: C.muted }}>
                        <ThinkingDots /> Searching and synthesizing...
                      </div>
                    </div>
                  ) : (
                    <Message key={msg.id} msg={msg} />
                  )
                )
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={{ padding: "14px 32px 24px", borderTop: `1px solid ${C.border}`, background: "rgba(10,10,15,0.8)", flexShrink: 0 }}>
              <div style={{ display: "flex", border: `1px solid ${loading ? "rgba(232,201,122,0.35)" : C.border}`, borderRadius: 2, overflow: "hidden", transition: "border-color 0.2s" }}>
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Enter your research query..."
                  rows={1}
                  style={{
                    flex: 1, padding: "13px 16px", background: C.surface, border: "none",
                    outline: "none", color: C.text, fontSize: 13, resize: "none",
                    lineHeight: 1.5, minHeight: 48,
                  }}
                />
                <button className="send-btn" onClick={sendQuery} disabled={loading || !query.trim()} style={{
                  padding: "0 22px",
                  background: loading || !query.trim() ? "rgba(232,201,122,0.25)" : C.accent,
                  border: "none", cursor: loading || !query.trim() ? "not-allowed" : "pointer",
                  color: "#0a0a0f", fontSize: 11, fontWeight: 600, letterSpacing: "0.1em",
                  textTransform: "uppercase", transition: "all 0.2s", whiteSpace: "nowrap",
                  fontFamily: "'JetBrains Mono', monospace",
                }}>⟶ Research</button>
              </div>
              <div style={{ marginTop: 7, fontSize: 10, color: C.muted }}>Enter to send · Shift+Enter for new line</div>
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ width: 220, borderLeft: `1px solid ${C.border}`, background: C.surface, display: "flex", flexDirection: "column", flexShrink: 0, overflowY: "auto" }}>
            {/* Stats */}
            <div style={{ padding: "18px 16px", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: C.muted, marginBottom: 14 }}>Session Stats</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[["Queries", stats.queries], ["Sources", stats.sources], ["Tool Calls", stats.tools], ["Last (s)", stats.time]].map(([label, val]) => (
                  <div key={label} style={{ padding: "8px 10px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 2 }}>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: C.accent }}>{val}</div>
                    <div style={{ fontSize: 9, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 2 }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* History */}
            <div style={{ padding: "18px 16px", flex: 1 }}>
              <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: C.muted, marginBottom: 12 }}>History</div>
              {history.length === 0 ? (
                <div style={{ fontSize: 11, color: C.muted, textAlign: "center", padding: "16px 0", opacity: 0.6 }}>No queries yet</div>
              ) : (
                history.map((h, i) => (
                  <div key={i} className="history-item" onClick={() => setQuery(h.query)} style={{
                    padding: "8px 10px", border: "1px solid transparent", borderRadius: 2,
                    cursor: "pointer", marginBottom: 4, transition: "all 0.15s",
                  }}>
                    <div style={{ fontSize: 11, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{h.query}</div>
                    <div style={{ fontSize: 10, color: C.muted, marginTop: 3 }}>{h.time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                  </div>
                ))
              )}
            </div>

            {/* Backend info */}
            <div style={{ padding: "14px 16px", borderTop: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 9, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Connected To</div>
              <div style={{ fontSize: 10, color: C.muted, wordBreak: "break-all", lineHeight: 1.6 }}>
                {endpoint}<br />
                <span style={{ color: C.success }}>POST /research</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
