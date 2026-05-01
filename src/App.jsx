import { useState, useEffect, useCallback, useRef } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "https://kidscontent-api.onrender.com";

const NICHE_META = {
  history: {
    label: "Bizarre History",
    icon: "🏛️",
    color: "#C8973A",
    accent: "#F5C96E",
    bg: "rgba(200,151,58,0.12)",
    border: "rgba(200,151,58,0.3)",
    cpm: "$8–$15",
    voice: "en-US-GuyNeural",
  },
  truecrime: {
    label: "True Crime",
    icon: "🔍",
    color: "#B84A4A",
    accent: "#E87070",
    bg: "rgba(184,74,74,0.12)",
    border: "rgba(184,74,74,0.3)",
    cpm: "$10–$18",
    voice: "en-US-AriaNeural",
  },
};

const PIPELINE_STEPS = [
  { label: "Script + SEO", icon: "✍️" },
  { label: "Voice synthesis", icon: "🎙️" },
  { label: "Image generation", icon: "🎨" },
  { label: "Background music", icon: "🎵" },
  { label: "Video assembly", icon: "🎬" },
  { label: "YouTube upload", icon: "📤" },
  { label: "Complete!", icon: "✅" },
];

const TOOL_STACK = [
  { name: "Gemini 2.5 Flash", desc: "Primary LLM — script & SEO", cost: "Free", icon: "✦" },
  { name: "Groq Llama 3.3 70B", desc: "Backup LLM — 1000 req/day", cost: "Free", icon: "✦" },
  { name: "Edge TTS (Microsoft)", desc: "Neural voice — GuyNeural / AriaNeural", cost: "Free", icon: "✦" },
  { name: "ModelsLab", desc: "Cinematic dark image generation", cost: "Free tier", icon: "✦" },
  { name: "Pollinations.AI", desc: "Image fallback + music generation", cost: "Free", icon: "✦" },
  { name: "FFmpeg Ken Burns", desc: "8 motion styles via zoompan filter", cost: "Free", icon: "✦" },
  { name: "YouTube Data API v3", desc: "Auto-upload · category 27 · adult CPM", cost: "Free (6/day)", icon: "✦" },
  { name: "Render.com", desc: "Backend hosting", cost: "Free tier", icon: "✦" },
  { name: "Vercel", desc: "Frontend hosting", cost: "Free", icon: "✦" },
];

function GlitchText({ text }) {
  return (
    <span style={{ position: "relative", display: "inline-block" }}>
      {text}
      <style>{`
        @keyframes glitch1 {
          0%,90%,100% { clip-path: none; transform: none; }
          92% { clip-path: polygon(0 20%, 100% 20%, 100% 40%, 0 40%); transform: translate(-2px,0); }
          94% { clip-path: polygon(0 60%, 100% 60%, 100% 80%, 0 80%); transform: translate(2px,0); }
          96% { clip-path: none; transform: none; }
        }
      `}</style>
    </span>
  );
}

function PulsingDot({ color = "#C8973A", size = 8 }) {
  return (
    <span style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", width: size, height: size }}>
      <span style={{
        position: "absolute", width: size * 2, height: size * 2, borderRadius: "50%",
        background: color, opacity: 0.3, animation: "ripple 1.5s ease-out infinite"
      }} />
      <span style={{ width: size, height: size, borderRadius: "50%", background: color, display: "block" }} />
      <style>{`@keyframes ripple { 0%{transform:scale(0.5);opacity:0.5} 100%{transform:scale(2);opacity:0} }`}</style>
    </span>
  );
}

function StatCard({ value, label, sublabel, accent = "#C8973A" }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 12,
      padding: "20px 18px",
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
      }} />
      <div style={{ fontSize: 28, fontWeight: 800, color: "#F0EDE8", letterSpacing: -1, fontFamily: "'Bebas Neue', 'Impact', sans-serif" }}>{value}</div>
      <div style={{ fontSize: 12, color: "#888", marginTop: 4, fontFamily: "'DM Mono', monospace", textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
      {sublabel && <div style={{ fontSize: 11, color: accent, marginTop: 3, fontFamily: "'DM Mono', monospace" }}>{sublabel}</div>}
    </div>
  );
}

function ProgressBar({ current, total, color = "#C8973A" }) {
  const pct = total > 0 ? (current / total) * 100 : 0;
  return (
    <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
      <div style={{
        height: "100%", width: `${pct}%`,
        background: `linear-gradient(90deg, ${color}88, ${color})`,
        borderRadius: 2, transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)",
        boxShadow: `0 0 8px ${color}66`,
      }} />
    </div>
  );
}

export default function App() {
  const [status, setStatus] = useState(null);
  const [logs, setLogs] = useState([]);
  const [niches, setNiches] = useState(null);
  const [enabledNiches, setEnabledNiches] = useState(["history", "truecrime"]);
  const [polling, setPolling] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [contentType, setContentType] = useState("auto");
  const [customTopic, setCustomTopic] = useState("");
  const [running, setRunning] = useState(false);
  const [health, setHealth] = useState(null);
  const logsEndRef = useRef(null);

  const fetchStatus = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE}/status`);
      const d = await r.json();
      setStatus(d);
      setPolling(!!d.running);
    } catch (_) {}
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE}/logs`);
      const d = await r.json();
      setLogs(Array.isArray(d) ? [...d].reverse() : []);
    } catch (_) {}
  }, []);

  const fetchNiches = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE}/niches`);
      const d = await r.json();
      setNiches(d);
    } catch (_) {}
  }, []);

  const fetchHealth = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE}/health`);
      const d = await r.json();
      setHealth(d);
    } catch (_) {}
  }, []);

  useEffect(() => {
    fetchStatus(); fetchLogs(); fetchNiches(); fetchHealth();
  }, []);

  useEffect(() => {
    if (!polling) return;
    const id = setInterval(() => { fetchStatus(); fetchLogs(); }, 4000);
    return () => clearInterval(id);
  }, [polling, fetchStatus, fetchLogs]);

  const runPipeline = async () => {
    setRunning(true);
    try {
      await fetch(`${API_BASE}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content_type: contentType === "auto" ? null : contentType,
          topic: customTopic.trim() || null,
        }),
      });
      setPolling(true);
      fetchStatus();
    } catch (_) {
      alert("Cannot reach backend. Check VITE_API_URL or wait for Render to wake up (~30s).");
    } finally {
      setRunning(false);
    }
  };

  const isRunning = status?.running;
  const currentStep = status?.step_index || 0;
  const totalVideos = logs.length;
  const historyCount = logs.filter(l => l.content_type === "history").length;
  const crimeCount = logs.filter(l => l.content_type === "truecrime").length;
  const avgDuration = logs.length > 0
    ? (logs.reduce((s, l) => s + (l.audio_dur_s || 0), 0) / logs.length).toFixed(1)
    : "—";

  const tabs = ["dashboard", "pipeline", "logs", "settings"];

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0C0B0A",
      fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
      color: "#D8D4CE",
    }}>
      {/* ── Noise texture overlay ── */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`,
        opacity: 0.6,
      }} />

      {/* ── Ambient glow ── */}
      <div style={{
        position: "fixed", top: -200, left: "50%", transform: "translateX(-50%)",
        width: 800, height: 400,
        background: "radial-gradient(ellipse at center, rgba(200,151,58,0.08) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* ══ HEADER ══ */}
        <header style={{
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(12,11,10,0.9)",
          backdropFilter: "blur(20px)",
          position: "sticky", top: 0, zIndex: 100,
        }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: "linear-gradient(135deg, #1A1410, #2E200E)",
                border: "1px solid rgba(200,151,58,0.4)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18,
                boxShadow: "0 0 20px rgba(200,151,58,0.2)",
              }}>💀</div>
              <div>
                <div style={{
                  fontFamily: "'Bebas Neue', 'Impact', sans-serif",
                  fontSize: 22, letterSpacing: 2, color: "#F0EDE8",
                  lineHeight: 1,
                }}>
                  <GlitchText text="DARKHISTORY" />
                  <span style={{ color: "#C8973A" }}>.AI</span>
                </div>
                <div style={{ fontSize: 10, color: "#666", letterSpacing: 2, textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>
                  v4.0 · Viral Content Engine
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              {health && (
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {Object.entries(health.keys || {}).map(([k, v]) => (
                    <span key={k} title={k} style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: v ? "#4ADE80" : "#666",
                      display: "inline-block",
                    }} />
                  ))}
                  <span style={{ fontSize: 11, color: "#555", fontFamily: "'DM Mono', monospace", marginLeft: 2 }}>API KEYS</span>
                </div>
              )}

              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "7px 14px", borderRadius: 20,
                background: isRunning ? "rgba(200,151,58,0.1)" : "rgba(74,222,128,0.08)",
                border: `1px solid ${isRunning ? "rgba(200,151,58,0.3)" : "rgba(74,222,128,0.2)"}`,
                fontSize: 12, fontWeight: 600,
                color: isRunning ? "#C8973A" : "#4ADE80",
                fontFamily: "'DM Mono', monospace",
                letterSpacing: 1,
              }}>
                <PulsingDot color={isRunning ? "#C8973A" : "#4ADE80"} />
                {isRunning ? "GENERATING" : "READY"}
              </div>
            </div>
          </div>

          {/* Tab bar */}
          <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", display: "flex", gap: 0, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
            {tabs.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                padding: "10px 18px", background: "none", border: "none",
                borderBottom: activeTab === tab ? "2px solid #C8973A" : "2px solid transparent",
                color: activeTab === tab ? "#C8973A" : "#666",
                fontWeight: 600, fontSize: 12, cursor: "pointer",
                textTransform: "uppercase", letterSpacing: 1.5,
                fontFamily: "'DM Mono', monospace",
                transition: "color 0.2s",
              }}>
                {tab}
              </button>
            ))}
          </div>
        </header>

        <main style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px", minHeight: "calc(100vh - 120px)" }}>

          {/* ══ DASHBOARD ══ */}
          {activeTab === "dashboard" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

              {/* Stats row */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                <StatCard value={totalVideos} label="Videos Uploaded" sublabel="All time" />
                <StatCard value={`$8–18`} label="CPM Range" sublabel="vs $1–3 kids CPM" accent="#4ADE80" />
                <StatCard value={avgDuration + "s"} label="Avg Duration" sublabel="Target: 50–58s" accent="#B84A4A" />
                <StatCard value="3×" label="Daily Uploads" sublabel="YouTube quota" />
              </div>

              {/* Dual niche cards */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {Object.entries(NICHE_META).map(([key, meta]) => {
                  const count = logs.filter(l => l.content_type === key).length;
                  const pct = totalVideos > 0 ? Math.round((count / totalVideos) * 100) : 0;
                  return (
                    <div key={key} style={{
                      background: "rgba(255,255,255,0.02)",
                      border: `1px solid ${meta.border}`,
                      borderRadius: 14, padding: 20,
                      position: "relative", overflow: "hidden",
                    }}>
                      <div style={{
                        position: "absolute", top: 0, right: 0, bottom: 0, width: "40%",
                        background: `radial-gradient(ellipse at right, ${meta.bg}, transparent)`,
                        pointerEvents: "none",
                      }} />
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
                        <div>
                          <div style={{ fontSize: 22 }}>{meta.icon}</div>
                          <div style={{ fontFamily: "'Bebas Neue', 'Impact', sans-serif", fontSize: 18, letterSpacing: 1, color: "#F0EDE8", marginTop: 4 }}>{meta.label}</div>
                          <div style={{ fontSize: 11, color: "#666", fontFamily: "'DM Mono', monospace", marginTop: 2 }}>VOICE: {meta.voice}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontFamily: "'Bebas Neue', 'Impact', sans-serif", fontSize: 24, color: meta.accent, letterSpacing: 1 }}>{meta.cpm}</div>
                          <div style={{ fontSize: 10, color: "#666", fontFamily: "'DM Mono', monospace" }}>CPM RANGE</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#666", marginBottom: 6, fontFamily: "'DM Mono', monospace" }}>
                        <span>{count} VIDEOS</span><span>{pct}%</span>
                      </div>
                      <ProgressBar current={count} total={Math.max(totalVideos, 1)} color={meta.color} />
                    </div>
                  );
                })}
              </div>

              {/* Recent uploads */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "#666" }}>Recent Uploads</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#555" }}>{totalVideos} TOTAL</div>
                </div>
                {logs.length === 0 ? (
                  <div style={{ padding: "32px 20px", textAlign: "center", color: "#444", fontSize: 13, fontStyle: "italic" }}>
                    No uploads yet — run the pipeline to generate your first video.
                  </div>
                ) : (
                  logs.slice(0, 6).map((log, i) => {
                    const m = NICHE_META[log.content_type] || NICHE_META.history;
                    return (
                      <div key={i} style={{
                        display: "flex", alignItems: "center", gap: 14,
                        padding: "12px 20px",
                        borderBottom: i < Math.min(logs.length, 6) - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                        transition: "background 0.2s",
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      >
                        <span style={{
                          padding: "3px 8px", borderRadius: 4, fontSize: 11,
                          fontWeight: 600, fontFamily: "'DM Mono', monospace",
                          background: m.bg, color: m.accent, border: `1px solid ${m.border}`,
                          letterSpacing: 0.5, whiteSpace: "nowrap",
                        }}>
                          {m.icon} {m.label.toUpperCase()}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <a href={log.url} target="_blank" rel="noreferrer" style={{
                            fontSize: 13, fontWeight: 500, color: "#D8D4CE",
                            textDecoration: "none", display: "block",
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          }}>{log.title}</a>
                          <div style={{ fontSize: 11, color: "#555", marginTop: 2, fontFamily: "'DM Mono', monospace" }}>
                            {log.timestamp?.slice(0, 16).replace("T", " ")} · {log.scenes_count || "?"} scenes · {log.audio_dur_s || "?"}s
                          </div>
                        </div>
                        <a href={log.url} target="_blank" rel="noreferrer" style={{
                          padding: "5px 12px", borderRadius: 6, fontSize: 11,
                          border: "1px solid rgba(255,255,255,0.1)", color: "#C8973A",
                          textDecoration: "none", fontFamily: "'DM Mono', monospace",
                          letterSpacing: 0.5, transition: "all 0.2s", whiteSpace: "nowrap",
                        }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = "#C8973A"; e.currentTarget.style.background = "rgba(200,151,58,0.1)"; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.background = "transparent"; }}
                        >
                          YT ↗
                        </a>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Last result / error banner */}
              {status?.error && (
                <div style={{ padding: "14px 18px", background: "rgba(184,74,74,0.1)", border: "1px solid rgba(184,74,74,0.3)", borderRadius: 10, fontSize: 13, color: "#E87070", fontFamily: "'DM Mono', monospace" }}>
                  ❌ {status.error}
                </div>
              )}
              {status?.last_result && !isRunning && (
                <div style={{ padding: "14px 18px", background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.2)", borderRadius: 10, fontSize: 13, color: "#4ADE80", fontFamily: "'DM Mono', monospace" }}>
                  ✓ LAST UPLOAD:{" "}
                  <a href={status.last_result.url} target="_blank" rel="noreferrer" style={{ color: "#4ADE80" }}>
                    {status.last_result.title}
                  </a>
                </div>
              )}
            </div>
          )}

          {/* ══ PIPELINE ══ */}
          {activeTab === "pipeline" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

              {/* Run controls */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 24 }}>
                <div style={{ fontFamily: "'Bebas Neue', 'Impact', sans-serif", fontSize: 20, letterSpacing: 2, color: "#F0EDE8", marginBottom: 4 }}>GENERATE VIDEO</div>
                <div style={{ fontSize: 13, color: "#555", marginBottom: 20 }}>Configure and launch the content pipeline.</div>

                {/* Content type selector */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#666", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>Content Type</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {[
                      { id: "auto", label: "Auto (alternating)", icon: "🔄" },
                      { id: "history", label: "Bizarre History", icon: "🏛️" },
                      { id: "truecrime", label: "True Crime", icon: "🔍" },
                    ].map(opt => (
                      <button key={opt.id} onClick={() => setContentType(opt.id)} style={{
                        padding: "8px 14px", borderRadius: 8, cursor: "pointer",
                        background: contentType === opt.id ? "rgba(200,151,58,0.15)" : "rgba(255,255,255,0.03)",
                        border: contentType === opt.id ? "1px solid rgba(200,151,58,0.5)" : "1px solid rgba(255,255,255,0.08)",
                        color: contentType === opt.id ? "#C8973A" : "#888",
                        fontSize: 13, fontWeight: 500, fontFamily: "inherit",
                        transition: "all 0.2s",
                      }}>
                        {opt.icon} {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom topic */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#666", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>Custom Topic (optional)</div>
                  <input
                    value={customTopic}
                    onChange={e => setCustomTopic(e.target.value)}
                    placeholder="e.g. the most brutal medieval torture devices ever invented"
                    style={{
                      width: "100%", padding: "11px 14px", borderRadius: 8,
                      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                      color: "#D8D4CE", fontSize: 13, fontFamily: "inherit",
                      outline: "none", boxSizing: "border-box",
                    }}
                    onFocus={e => e.target.style.borderColor = "rgba(200,151,58,0.5)"}
                    onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                  />
                  <div style={{ fontSize: 11, color: "#444", marginTop: 6, fontFamily: "'DM Mono', monospace" }}>Leave blank to auto-pick from the topic pool of 50 topics.</div>
                </div>

                <button
                  onClick={runPipeline}
                  disabled={isRunning || running}
                  style={{
                    padding: "14px 32px", borderRadius: 10, cursor: isRunning || running ? "not-allowed" : "pointer",
                    background: isRunning || running
                      ? "rgba(255,255,255,0.05)"
                      : "linear-gradient(135deg, #C8973A, #A07020)",
                    border: "none", color: isRunning || running ? "#444" : "#0C0B0A",
                    fontSize: 14, fontWeight: 700, letterSpacing: 1.5,
                    fontFamily: "'DM Mono', monospace", textTransform: "uppercase",
                    boxShadow: isRunning || running ? "none" : "0 4px 20px rgba(200,151,58,0.3)",
                    transition: "all 0.2s",
                  }}
                >
                  {isRunning ? "⏳ PIPELINE RUNNING..." : "▶ LAUNCH PIPELINE"}
                </button>
              </div>

              {/* Live progress */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 24 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#666", letterSpacing: 2, textTransform: "uppercase" }}>Pipeline Progress</div>
                  {isRunning && (
                    <div style={{ fontSize: 12, color: "#C8973A", fontFamily: "'DM Mono', monospace" }}>
                      STEP {currentStep} / {PIPELINE_STEPS.length}
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {PIPELINE_STEPS.map((step, i) => {
                    const isDone = currentStep > i + 1;
                    const isActive = currentStep === i + 1 && isRunning;
                    const isPending = currentStep <= i;
                    return (
                      <div key={i} style={{
                        display: "flex", alignItems: "center", gap: 14,
                        padding: "11px 14px", borderRadius: 8,
                        background: isActive ? "rgba(200,151,58,0.08)" : isDone ? "rgba(74,222,128,0.04)" : "transparent",
                        border: isActive ? "1px solid rgba(200,151,58,0.2)" : "1px solid transparent",
                        transition: "all 0.4s",
                      }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          background: isDone ? "rgba(74,222,128,0.15)" : isActive ? "rgba(200,151,58,0.2)" : "rgba(255,255,255,0.04)",
                          border: isDone ? "1px solid rgba(74,222,128,0.3)" : isActive ? "1px solid rgba(200,151,58,0.4)" : "1px solid rgba(255,255,255,0.08)",
                          fontSize: 13,
                          animation: isActive ? "spin 2s linear infinite" : "none",
                        }}>
                          {isDone ? "✓" : step.icon}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: isDone ? "#4ADE80" : isActive ? "#F0EDE8" : "#555" }}>
                            {step.label}
                          </div>
                          {isActive && status?.step && (
                            <div style={{ fontSize: 11, color: "#C8973A", marginTop: 2, fontFamily: "'DM Mono', monospace" }}>{status.step}</div>
                          )}
                        </div>
                        {isActive && <PulsingDot color="#C8973A" size={6} />}
                        {isDone && <span style={{ fontSize: 11, color: "#4ADE80", fontFamily: "'DM Mono', monospace" }}>DONE</span>}
                      </div>
                    );
                  })}
                </div>

                {isRunning && (
                  <div style={{ marginTop: 16 }}>
                    <ProgressBar current={currentStep} total={PIPELINE_STEPS.length} color="#C8973A" />
                  </div>
                )}
              </div>

              {/* Ken Burns info */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 20 }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#666", letterSpacing: 2, textTransform: "uppercase", marginBottom: 14 }}>Video Formula v4.0</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[
                    { label: "Images per video", value: "8–18 (dynamic)" },
                    { label: "Cut rate", value: "1 image / 3s" },
                    { label: "Motion styles", value: "8 Ken Burns (random)" },
                    { label: "Script length", value: "130–160 words" },
                    { label: "Target duration", value: "50–58 seconds" },
                    { label: "YouTube category", value: "27 · Education" },
                    { label: "madeForKids", value: "false (adult CPM)" },
                    { label: "Captions", value: "Burn-in SRT overlays" },
                  ].map((item, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <span style={{ color: "#666", fontFamily: "'DM Mono', monospace" }}>{item.label}</span>
                      <span style={{ color: "#D8D4CE", fontWeight: 500 }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ══ LOGS ══ */}
          {activeTab === "logs" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontFamily: "'Bebas Neue', 'Impact', sans-serif", fontSize: 22, letterSpacing: 2, color: "#F0EDE8" }}>UPLOAD HISTORY</div>
                  <div style={{ fontSize: 12, color: "#555", fontFamily: "'DM Mono', monospace", marginTop: 2 }}>{totalVideos} VIDEOS · {historyCount} HISTORY · {crimeCount} TRUE CRIME</div>
                </div>
              </div>

              {logs.length === 0 ? (
                <div style={{ padding: "48px 20px", textAlign: "center", background: "rgba(255,255,255,0.02)", borderRadius: 14, border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>📼</div>
                  <div style={{ fontSize: 14, color: "#555" }}>No videos uploaded yet.</div>
                  <div style={{ fontSize: 12, color: "#444", marginTop: 6 }}>Go to the Pipeline tab and hit Launch.</div>
                </div>
              ) : (
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, overflow: "hidden" }}>
                  {/* Table header */}
                  <div style={{
                    display: "grid", gridTemplateColumns: "140px 1fr 80px 60px 80px 70px",
                    gap: 12, padding: "10px 18px",
                    borderBottom: "1px solid rgba(255,255,255,0.07)",
                    fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#555",
                    textTransform: "uppercase", letterSpacing: 1,
                  }}>
                    <span>Niche</span><span>Title</span><span>LLM</span><span>Scenes</span><span>Duration</span><span>Link</span>
                  </div>
                  {logs.map((log, i) => {
                    const m = NICHE_META[log.content_type] || NICHE_META.history;
                    return (
                      <div key={i} style={{
                        display: "grid", gridTemplateColumns: "140px 1fr 80px 60px 80px 70px",
                        gap: 12, padding: "11px 18px", alignItems: "center",
                        borderBottom: i < logs.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                        transition: "background 0.15s",
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      >
                        <span style={{
                          padding: "3px 8px", borderRadius: 4, fontSize: 10,
                          fontFamily: "'DM Mono', monospace", letterSpacing: 0.5,
                          background: m.bg, color: m.accent, border: `1px solid ${m.border}`,
                          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                        }}>
                          {m.icon} {m.label}
                        </span>
                        <div style={{ overflow: "hidden" }}>
                          <div style={{ fontSize: 13, color: "#D8D4CE", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{log.title}</div>
                          <div style={{ fontSize: 10, color: "#444", fontFamily: "'DM Mono', monospace", marginTop: 2 }}>{log.timestamp?.slice(0, 16).replace("T", " ")}</div>
                        </div>
                        <span style={{ fontSize: 11, color: "#666", fontFamily: "'DM Mono', monospace" }}>{log.llm_used || "—"}</span>
                        <span style={{ fontSize: 12, color: "#888", fontFamily: "'DM Mono', monospace" }}>{log.scenes_count || "—"}</span>
                        <span style={{ fontSize: 12, color: "#888", fontFamily: "'DM Mono', monospace" }}>{log.audio_dur_s ? `${log.audio_dur_s}s` : "—"}</span>
                        <a href={log.url} target="_blank" rel="noreferrer" style={{
                          fontSize: 11, color: "#C8973A", textDecoration: "none",
                          fontFamily: "'DM Mono', monospace", letterSpacing: 0.5,
                          padding: "4px 8px", borderRadius: 5,
                          border: "1px solid rgba(200,151,58,0.2)",
                          transition: "all 0.2s", display: "inline-block",
                        }}
                          onMouseEnter={e => e.currentTarget.style.background = "rgba(200,151,58,0.1)"}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                        >
                          YT ↗
                        </a>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ══ SETTINGS ══ */}
          {activeTab === "settings" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

              {/* Niche toggles */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 24 }}>
                <div style={{ fontFamily: "'Bebas Neue', 'Impact', sans-serif", fontSize: 18, letterSpacing: 2, color: "#F0EDE8", marginBottom: 4 }}>CONTENT NICHES</div>
                <div style={{ fontSize: 13, color: "#555", marginBottom: 18 }}>Toggle which niches the pipeline auto-selects from.</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {Object.entries(NICHE_META).map(([key, meta]) => {
                    const on = enabledNiches.includes(key);
                    const nicheData = niches?.niches?.find(n => n.id === key);
                    return (
                      <div key={key} onClick={() => setEnabledNiches(prev => on ? prev.filter(n => n !== key) : [...prev, key])}
                        style={{
                          padding: "16px", borderRadius: 10, cursor: "pointer",
                          background: on ? meta.bg : "rgba(255,255,255,0.02)",
                          border: `1px solid ${on ? meta.border : "rgba(255,255,255,0.07)"}`,
                          transition: "all 0.2s",
                        }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ fontSize: 22 }}>{meta.icon}</span>
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 600, color: on ? "#F0EDE8" : "#666" }}>{meta.label}</div>
                              <div style={{ fontSize: 11, color: on ? meta.accent : "#444", fontFamily: "'DM Mono', monospace" }}>{meta.cpm} CPM</div>
                            </div>
                          </div>
                          <div style={{
                            width: 40, height: 22, borderRadius: 11,
                            background: on ? meta.color : "rgba(255,255,255,0.1)",
                            position: "relative", transition: "background 0.2s", flexShrink: 0,
                          }}>
                            <div style={{
                              position: "absolute", width: 16, height: 16, borderRadius: "50%",
                              background: "#fff", top: 3, left: on ? 21 : 3, transition: "left 0.2s",
                              boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                            }} />
                          </div>
                        </div>
                        {nicheData && (
                          <div style={{ fontSize: 11, color: "#555", fontFamily: "'DM Mono', monospace" }}>
                            {nicheData.topics} TOPICS · {nicheData.formula}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* API key health */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 24 }}>
                <div style={{ fontFamily: "'Bebas Neue', 'Impact', sans-serif", fontSize: 18, letterSpacing: 2, color: "#F0EDE8", marginBottom: 4 }}>API KEY STATUS</div>
                <div style={{ fontSize: 13, color: "#555", marginBottom: 18 }}>Set these as environment variables in Render.com dashboard.</div>
                {health ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {Object.entries(health.keys || {}).map(([key, configured]) => (
                      <div key={key} style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "10px 14px", borderRadius: 8,
                        background: "rgba(255,255,255,0.02)",
                        border: `1px solid ${configured ? "rgba(74,222,128,0.15)" : "rgba(184,74,74,0.15)"}`,
                      }}>
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, textTransform: "uppercase", letterSpacing: 1, color: "#888" }}>{key.replace(/_/g, " ")}</span>
                        <span style={{
                          padding: "3px 10px", borderRadius: 4, fontSize: 11,
                          fontFamily: "'DM Mono', monospace", fontWeight: 600,
                          background: configured ? "rgba(74,222,128,0.1)" : "rgba(184,74,74,0.1)",
                          color: configured ? "#4ADE80" : "#E87070",
                          border: `1px solid ${configured ? "rgba(74,222,128,0.2)" : "rgba(184,74,74,0.2)"}`,
                        }}>
                          {configured ? "✓ CONFIGURED" : "✗ MISSING"}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: "#444", fontStyle: "italic" }}>Fetching health status...</div>
                )}
              </div>

              {/* Tool stack */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 24 }}>
                <div style={{ fontFamily: "'Bebas Neue', 'Impact', sans-serif", fontSize: 18, letterSpacing: 2, color: "#F0EDE8", marginBottom: 4 }}>FREE TOOL STACK</div>
                <div style={{ fontSize: 13, color: "#555", marginBottom: 18 }}>Every tool in the pipeline — total cost: <span style={{ color: "#4ADE80", fontWeight: 700 }}>$0/month</span></div>
                {TOOL_STACK.map((t, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "10px 0",
                    borderBottom: i < TOOL_STACK.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                  }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                      <span style={{ color: "#C8973A", fontSize: 14, marginTop: 1 }}>{t.icon}</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#D8D4CE" }}>{t.name}</div>
                        <div style={{ fontSize: 12, color: "#555" }}>{t.desc}</div>
                      </div>
                    </div>
                    <span style={{
                      padding: "3px 10px", background: "rgba(74,222,128,0.08)",
                      color: "#4ADE80", borderRadius: 5, fontSize: 11,
                      fontFamily: "'DM Mono', monospace", fontWeight: 600,
                      border: "1px solid rgba(74,222,128,0.15)", whiteSpace: "nowrap",
                    }}>
                      {t.cost}
                    </span>
                  </div>
                ))}
              </div>

              {/* Config note */}
              <div style={{
                padding: 18, borderRadius: 12,
                background: "rgba(200,151,58,0.06)", border: "1px solid rgba(200,151,58,0.2)",
                fontSize: 12, color: "#C8973A", fontFamily: "'DM Mono', monospace", lineHeight: 1.8,
              }}>
                <div style={{ fontWeight: 700, marginBottom: 6, letterSpacing: 1 }}>⚙ DEPLOYMENT CONFIG</div>
                Set <code style={{ background: "rgba(255,255,255,0.05)", padding: "1px 5px", borderRadius: 3 }}>VITE_API_URL</code> in Vercel Environment Variables to your Render backend URL.<br />
                Example: <code style={{ background: "rgba(255,255,255,0.05)", padding: "1px 5px", borderRadius: 3 }}>https://darkhistory-api.onrender.com</code><br />
                Note: Render free tier sleeps after 15min inactivity — first request may take ~30s.
              </div>
            </div>
          )}
        </main>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500;600&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes ripple { 0%{transform:scale(0.5);opacity:0.5} 100%{transform:scale(2);opacity:0} }
        * { box-sizing: border-box; }
        body { margin: 0; background: #0C0B0A; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(200,151,58,0.3); border-radius: 2px; }
        input::placeholder { color: #444; }
      `}</style>
    </div>
  );
}
