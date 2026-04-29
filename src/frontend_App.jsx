import { useState, useEffect, useCallback } from "react";

// ── CONFIG: Replace with your Render.com backend URL after deployment ─────────
const API_BASE = import.meta.env.VITE_API_URL || "https://kidscontent-api.onrender.com";

const NICHE_META = {
  nursery_rhyme: { label: "Nursery Rhymes", icon: "🎵", color: "#7F77DD", bg: "#EEEDFE" },
  abc_learning:  { label: "ABC / 123",      icon: "🔤", color: "#1D9E75", bg: "#E1F5EE" },
  bedtime_story: { label: "Bedtime Stories",icon: "🌙", color: "#BA7517", bg: "#FAEEDA" },
  animal_facts:  { label: "Animal Facts",   icon: "🦁", color: "#D85A30", bg: "#FAECE7" },
};

const STEPS = [
  "Script + SEO",
  "Voice synthesis",
  "Video generation",
  "Background music",
  "Video assembly",
  "YouTube upload",
  "Complete!",
];

export default function App() {
  const [status, setStatus] = useState(null);
  const [logs, setLogs] = useState([]);
  const [niches, setNiches] = useState(null);
  const [enabledNiches, setEnabledNiches] = useState(Object.keys(NICHE_META));
  const [polling, setPolling] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");

  const fetchStatus = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE}/status`);
      const d = await r.json();
      setStatus(d);
      if (d.running) setPolling(true);
      else setPolling(false);
    } catch (e) { /* backend may be sleeping (Render free) */ }
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE}/logs`);
      const d = await r.json();
      setLogs(Array.isArray(d) ? d.reverse() : []);
    } catch (e) {}
  }, []);

  const fetchNiches = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE}/niches`);
      const d = await r.json();
      setNiches(d);
    } catch (e) {}
  }, []);

  useEffect(() => {
    fetchStatus();
    fetchLogs();
    fetchNiches();
  }, []);

  useEffect(() => {
    if (!polling) return;
    const id = setInterval(() => { fetchStatus(); fetchLogs(); }, 4000);
    return () => clearInterval(id);
  }, [polling, fetchStatus, fetchLogs]);

  const runPipeline = async () => {
    try {
      await fetch(`${API_BASE}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled_niches: enabledNiches }),
      });
      setPolling(true);
      fetchStatus();
    } catch (e) { alert("Could not connect to backend. Make sure it's deployed on Render.com."); }
  };

  const isRunning = status?.running;
  const currentStep = status?.step_index || 0;

  const totalVideos = logs.length;
  const nicheBreakdown = logs.reduce((acc, l) => {
    acc[l.niche] = (acc[l.niche] || 0) + 1;
    return acc;
  }, {});

  return (
    <div style={{ minHeight: "100vh", background: "#f8f7fc", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e8e6f0", padding: "0 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#7F77DD,#D4537E)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🎵</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: "#1a1a2e", letterSpacing: -0.3 }}>KidsContent.ai</div>
              <div style={{ fontSize: 11, color: "#888", marginTop: 1 }}>YouTube Shorts Automation</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 20, background: isRunning ? "#EEEDFE" : "#EAF3DE", border: `1px solid ${isRunning ? "#AFA9EC" : "#97C459"}`, fontSize: 12, fontWeight: 500, color: isRunning ? "#3C3489" : "#3B6D11" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: isRunning ? "#7F77DD" : "#639922", display: "inline-block", animation: isRunning ? "pulse 1s infinite" : "pulse 3s infinite" }}></span>
            {isRunning ? "Generating..." : "Ready"}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e8e6f0" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", gap: 0 }}>
          {["dashboard", "logs", "settings"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: "12px 20px", background: "none", border: "none", borderBottom: activeTab === tab ? "2px solid #7F77DD" : "2px solid transparent", color: activeTab === tab ? "#7F77DD" : "#888", fontWeight: 500, fontSize: 14, cursor: "pointer", textTransform: "capitalize", fontFamily: "inherit" }}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 24px" }}>

        {/* ── DASHBOARD TAB ─────────────────────────────────────────────────── */}
        {activeTab === "dashboard" && (
          <>
            {/* Stats row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
              {[
                { num: totalVideos, label: "Videos uploaded" },
                { num: enabledNiches.length, label: "Active niches" },
                { num: "3×", label: "Uploads per day" },
                { num: "$0", label: "Monthly cost" },
              ].map((s, i) => (
                <div key={i} style={{ background: "#fff", border: "1px solid #e8e6f0", borderRadius: 12, padding: "16px", textAlign: "center" }}>
                  <div style={{ fontSize: 26, fontWeight: 700, color: "#1a1a2e", lineHeight: 1 }}>{s.num}</div>
                  <div style={{ fontSize: 12, color: "#888", marginTop: 5 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Pipeline card */}
            <div style={{ background: "#fff", border: "1px solid #e8e6f0", borderRadius: 16, padding: 20, marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ fontWeight: 600, fontSize: 15, color: "#1a1a2e" }}>Generation pipeline</div>
                <button onClick={runPipeline} disabled={isRunning}
                  style={{ padding: "8px 20px", background: isRunning ? "#e0dff8" : "#7F77DD", color: isRunning ? "#999" : "#fff", border: "none", borderRadius: 8, fontWeight: 500, fontSize: 13, cursor: isRunning ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
                  {isRunning ? "Running..." : "▶ Run now"}
                </button>
              </div>

              {/* Steps */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", marginBottom: isRunning ? 14 : 0 }}>
                {STEPS.map((step, i) => {
                  const isDone = currentStep > i + 1;
                  const isActive = isRunning && currentStep === i + 1;
                  return (
                    <span key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 500, background: isDone ? "#EAF3DE" : isActive ? "#EEEDFE" : "#f5f4fb", color: isDone ? "#3B6D11" : isActive ? "#3C3489" : "#999", border: `1px solid ${isDone ? "#97C459" : isActive ? "#AFA9EC" : "#e8e6f0"}` }}>
                        {isDone ? "✓ " : ""}{step}
                      </span>
                      {i < STEPS.length - 1 && <span style={{ color: "#ccc", fontSize: 11 }}>›</span>}
                    </span>
                  );
                })}
              </div>

              {isRunning && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 12, color: "#7F77DD", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 12, height: 12, border: "2px solid #AFA9EC", borderTopColor: "#7F77DD", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }}></span>
                    {status?.step || "Processing..."}
                  </div>
                  <div style={{ height: 4, background: "#f0eef8", borderRadius: 2 }}>
                    <div style={{ height: "100%", background: "linear-gradient(90deg,#7F77DD,#D4537E)", borderRadius: 2, width: `${Math.round((currentStep / 7) * 100)}%`, transition: "width 0.5s ease" }}></div>
                  </div>
                </div>
              )}

              {status?.error && (
                <div style={{ marginTop: 12, padding: "10px 14px", background: "#FCEBEB", borderRadius: 8, fontSize: 13, color: "#A32D2D" }}>
                  ❌ {status.error}
                </div>
              )}

              {status?.last_result && !isRunning && (
                <div style={{ marginTop: 12, padding: "10px 14px", background: "#EAF3DE", borderRadius: 8, fontSize: 13, color: "#3B6D11" }}>
                  ✓ Last upload: <a href={status.last_result.url} target="_blank" rel="noreferrer" style={{ color: "#3B6D11" }}>{status.last_result.title}</a>
                </div>
              )}
            </div>

            {/* Niche breakdown + recent */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ background: "#fff", border: "1px solid #e8e6f0", borderRadius: 16, padding: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12 }}>Niche distribution</div>
                {Object.entries(NICHE_META).map(([key, meta]) => {
                  const count = nicheBreakdown[key] || 0;
                  const pct = totalVideos > 0 ? Math.round((count / totalVideos) * 100) : 0;
                  return (
                    <div key={key} style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                        <span>{meta.icon} {meta.label}</span>
                        <span style={{ color: "#888" }}>{count} videos</span>
                      </div>
                      <div style={{ height: 5, background: "#f5f4fb", borderRadius: 3 }}>
                        <div style={{ height: "100%", background: meta.color, borderRadius: 3, width: `${pct}%`, transition: "width 0.5s" }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ background: "#fff", border: "1px solid #e8e6f0", borderRadius: 16, padding: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12 }}>Recent uploads</div>
                {logs.length === 0 && <div style={{ fontSize: 13, color: "#999" }}>No uploads yet. Run the pipeline!</div>}
                {logs.slice(0, 5).map((log, i) => {
                  const m = NICHE_META[log.niche] || NICHE_META.nursery_rhyme;
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: i < 4 ? "1px solid #f5f4fb" : "none" }}>
                      <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 500, background: m.bg, color: m.color, whiteSpace: "nowrap" }}>{m.icon}</span>
                      <a href={log.url} target="_blank" rel="noreferrer" style={{ flex: 1, fontSize: 12, color: "#1a1a2e", textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{log.title}</a>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* ── LOGS TAB ──────────────────────────────────────────────────────── */}
        {activeTab === "logs" && (
          <div style={{ background: "#fff", border: "1px solid #e8e6f0", borderRadius: 16, padding: 20 }}>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 16, color: "#1a1a2e" }}>Upload history ({logs.length} videos)</div>
            {logs.length === 0 && <div style={{ color: "#999", fontSize: 14 }}>No uploads yet.</div>}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {logs.map((log, i) => {
                const m = NICHE_META[log.niche] || NICHE_META.nursery_rhyme;
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "#f9f8fd", borderRadius: 10 }}>
                    <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 12, fontWeight: 500, background: m.bg, color: m.color, whiteSpace: "nowrap" }}>{m.icon} {m.label}</span>
                    <div style={{ flex: 1 }}>
                      <a href={log.url} target="_blank" rel="noreferrer" style={{ fontSize: 13, fontWeight: 500, color: "#1a1a2e", textDecoration: "none" }}>{log.title}</a>
                      <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>{log.timestamp?.replace("T", " ").slice(0, 16)}</div>
                    </div>
                    <a href={log.url} target="_blank" rel="noreferrer" style={{ padding: "5px 12px", background: "#fff", border: "1px solid #e8e6f0", borderRadius: 6, fontSize: 12, color: "#7F77DD", textDecoration: "none", fontWeight: 500 }}>View ↗</a>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── SETTINGS TAB ──────────────────────────────────────────────────── */}
        {activeTab === "settings" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: "#fff", border: "1px solid #e8e6f0", borderRadius: 16, padding: 20 }}>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4, color: "#1a1a2e" }}>Active niches</div>
              <div style={{ fontSize: 13, color: "#888", marginBottom: 14 }}>Toggle which content types the bot generates.</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {Object.entries(NICHE_META).map(([key, meta]) => {
                  const on = enabledNiches.includes(key);
                  return (
                    <div key={key} onClick={() => setEnabledNiches(prev => on ? prev.filter(n => n !== key) : [...prev, key])}
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: on ? meta.bg : "#f9f8fd", border: `1px solid ${on ? meta.color + "55" : "#e8e6f0"}`, borderRadius: 10, cursor: "pointer" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 20 }}>{meta.icon}</span>
                        <span style={{ fontSize: 13, fontWeight: 500, color: "#1a1a2e" }}>{meta.label}</span>
                      </div>
                      <div style={{ width: 36, height: 20, borderRadius: 10, background: on ? meta.color : "#ddd", position: "relative", transition: "background 0.2s" }}>
                        <div style={{ position: "absolute", width: 14, height: 14, borderRadius: "50%", background: "#fff", top: 3, left: on ? 19 : 3, transition: "left 0.2s" }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ background: "#fff", border: "1px solid #e8e6f0", borderRadius: 16, padding: 20 }}>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4, color: "#1a1a2e" }}>Free tool stack</div>
              <div style={{ fontSize: 13, color: "#888", marginBottom: 14 }}>All tools used — total cost: $0/month</div>
              {[
                { name: "Claude API", desc: "Script + SEO generation", cost: "Free tier" },
                { name: "Edge TTS (Microsoft)", desc: "Neural voice synthesis", cost: "Free forever" },
                { name: "HuggingFace ZeroGPU", desc: "Real video generation on H200", cost: "Free (queued)" },
                { name: "Pollinations.AI", desc: "Images + background music", cost: "Free forever" },
                { name: "FFmpeg", desc: "Video assembly + subtitles", cost: "Free forever" },
                { name: "YouTube Data API v3", desc: "Auto-upload with full SEO", cost: "Free (6/day)" },
                { name: "Render.com", desc: "Backend hosting", cost: "Free tier" },
                { name: "Vercel", desc: "Frontend hosting", cost: "Free forever" },
              ].map((t, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 0", borderBottom: i < 7 ? "1px solid #f5f4fb" : "none" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "#1a1a2e" }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: "#999" }}>{t.desc}</div>
                  </div>
                  <span style={{ padding: "3px 10px", background: "#EAF3DE", color: "#3B6D11", borderRadius: 6, fontSize: 12, fontWeight: 500 }}>{t.cost}</span>
                </div>
              ))}
            </div>

            <div style={{ background: "#EEEDFE", border: "1px solid #AFA9EC", borderRadius: 16, padding: 16, fontSize: 13, color: "#3C3489" }}>
              <strong>Backend URL:</strong> Set <code>VITE_API_URL</code> in Vercel to your Render.com URL.<br />
              E.g.: <code>https://kidscontent-api.onrender.com</code>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes spin { to{transform:rotate(360deg)} }
        * { box-sizing: border-box; }
        body { margin: 0; }
      `}</style>
    </div>
  );
}
