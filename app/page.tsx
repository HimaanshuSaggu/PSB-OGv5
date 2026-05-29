"use client";

import Image from "next/image";
import { useState, useEffect, useCallback } from "react";

type Verdict = "intruder" | "animal" | "clear";

interface Capture {
  file: string;
  verdict: Verdict;
  ts: number;
}

const CAPTURES: Capture[] = [
  { file: "/capture-01.jpeg", verdict: "intruder", ts: 1748147640 },
  { file: "/capture-02.jpeg", verdict: "animal",   ts: 1748102820 },
  { file: "/capture-03.jpeg", verdict: "clear",    ts: 1748089380 },
  { file: "/capture-04.jpeg", verdict: "intruder", ts: 1747980660 },
  { file: "/capture-05.jpeg", verdict: "animal",   ts: 1747986720 },
  { file: "/capture-06.jpeg", verdict: "clear",    ts: 1747915080 },
  { file: "/capture-07.jpeg", verdict: "animal",   ts: 1747820000 },
  { file: "/capture-08.jpeg", verdict: "clear",    ts: 1747734400 },
  { file: "/capture-09.jpeg", verdict: "animal",   ts: 1747648800 },
  { file: "/capture-10.jpeg", verdict: "intruder", ts: 1747563200 },
  { file: "/capture-11.jpeg", verdict: "clear",    ts: 1747477600 },
  { file: "/capture-12.jpeg", verdict: "animal",   ts: 1747392000 },
];

function fmtTime(ts: number) {
  const d = new Date(ts * 1000);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function fmtDate(ts: number) {
  const d = new Date(ts * 1000);
  return `${d.getMonth() + 1}/${d.getDate()}/${String(d.getFullYear()).slice(-2)}`;
}

export default function Page() {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [og, setOg] = useState("");
  const [fld, setFld] = useState("");
  const [error, setError] = useState("");
  const [master, setMaster] = useState(true);
  const [motion, setMotion] = useState(true);
  const [camera, setCamera] = useState(true);
  const [overlaySrc, setOverlaySrc] = useState<string | null>(null);

  // Master toggle cascades
  useEffect(() => {
    if (!master) {
      setMotion(false);
      setCamera(false);
    } else {
      setMotion(true);
      setCamera(true);
    }
  }, [master]);

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!og.trim() || !fld.trim()) {
      setError("◆ Both fields required");
      return;
    }
    setError("");
    setConnecting(true);
    setTimeout(() => {
      setConnecting(false);
      setConnected(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 1400);
  };

  const handleDisconnect = () => {
    setConnected(false);
    setOg("");
    setFld("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Escape key closes overlay
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") setOverlaySrc(null);
  }, []);
  useEffect(() => {
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  return (
    <>
      <nav className="olympian">
        <a className="brand" href="#" onClick={(e) => e.preventDefault()}>
          <div className="brand-mark">
            <Image src="/icon.png" alt="Origins Guardian" fill sizes="44px" />
          </div>
          <div className="brand-text">
            Origins Guardian
            <small>Vanishing History · MMXXVI</small>
          </div>
        </a>
        <div className={`nav-status ${connected ? "online" : ""}`}>
          <span className="dot" />
          <span>{connected ? `${og.toUpperCase()} Connected` : "Disconnected"}</span>
          {connected && (
            <button className="disconnect" onClick={handleDisconnect}>
              Disconnect
            </button>
          )}
        </div>
      </nav>

      {!connected ? (
        <section className="gate">
          <div
            className="gate-bg"
            style={{ backgroundImage: "url(/hero-bg.jpeg)" }}
          />
          <div className="gate-card">
            <span className="c3" />
            <span className="c4" />
            <div className="gate-icon">
              <Image src="/icon.png" alt="Origins Guardian emblem" fill sizes="110px" />
            </div>
            <div className="gate-eyebrow">Establish the Watch</div>
            <h1 className="gate-title">Connect to Your Guardian</h1>
            <p className="gate-sub">
              Enter your unit credentials to commune with the field.
            </p>
            <form onSubmit={handleConnect}>
              <div className="field-group">
                <label className="field-label" htmlFor="ogNumber">
                  Origins Guardian №
                </label>
                <input
                  className="field-input"
                  id="ogNumber"
                  type="text"
                  placeholder="e.g.  OG-0421"
                  value={og}
                  onChange={(e) => setOg(e.target.value)}
                  autoComplete="off"
                  required
                />
              </div>
              <div className="field-group">
                <label className="field-label" htmlFor="fieldNumber">
                  Field №
                </label>
                <input
                  className="field-input"
                  id="fieldNumber"
                  type="text"
                  placeholder="e.g.  FLD-CHAVIN-07"
                  value={fld}
                  onChange={(e) => setFld(e.target.value)}
                  autoComplete="off"
                  required
                />
              </div>
              <button className="gate-btn" type="submit" disabled={connecting}>
                Begin the Watch ⚡
              </button>
            </form>
            {connecting && (
              <div className="connecting-text">
                Establishing handshake<span className="dots" />
              </div>
            )}
            <div className="gate-error">{error}</div>
            <div className="gate-hint">
              ▲ Proof of concept — any non-empty input authenticates
            </div>
          </div>
        </section>
      ) : (
        <div className="dashboard-shown">
          <section className="hero-strip">
            <div className="hero-inner">
              <div className="hero-eyebrow">⚡ The Watch is Active ⚡</div>
              <h1 className="hero-title">Guardian Console</h1>
              <p className="hero-sub">
                Telemetry, alerts, and the unblinking gaze of the field.
              </p>
              <div className="connection-tag">
                <span>◉</span>
                <span>{`${og.toUpperCase()} · ${fld.toUpperCase()}`}</span>
              </div>
            </div>
          </section>

          <div className="dash-grid">
            {/* Controls */}
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">Controls</div>
                <div className="panel-sub">/ guardian commands</div>
              </div>
              <div className="master-toggle">
                <div className="toggle-row" style={{ borderBottom: "none", padding: 0 }}>
                  <div className="toggle-info">
                    <div className="toggle-name">⚡ Origins Guardian</div>
                    <div className="toggle-desc">
                      Master power. Disabling stills the entire unit.
                    </div>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={master}
                      onChange={(e) => setMaster(e.target.checked)}
                    />
                    <span className="slider" />
                  </label>
                </div>
              </div>
              <div className={`toggle-row ${!master ? "disabled" : ""}`}>
                <div className="toggle-info">
                  <div className="toggle-name">Motion Sensor</div>
                  <div className="toggle-desc">Detects movement at the perimeter.</div>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={motion}
                    disabled={!master}
                    onChange={(e) => setMotion(e.target.checked)}
                  />
                  <span className="slider" />
                </label>
              </div>
              <div className={`toggle-row ${!master ? "disabled" : ""}`}>
                <div className="toggle-info">
                  <div className="toggle-name">Camera</div>
                  <div className="toggle-desc">
                    Captures and uploads on motion trigger.
                  </div>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={camera}
                    disabled={!master}
                    onChange={(e) => setCamera(e.target.checked)}
                  />
                  <span className="slider" />
                </label>
              </div>
            </div>

            {/* Telemetry */}
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">Telemetry</div>
                <div className="panel-sub">/ live readouts</div>
              </div>
              <div className="stat-grid">
                <div className="stat-cell">
                  <div className="stat-cell-label">Battery</div>
                  <div className="stat-cell-value green">87<small>%</small></div>
                </div>
                <div className="stat-cell">
                  <div className="stat-cell-label">Solar</div>
                  <div className="stat-cell-value green">CHARGING</div>
                </div>
                <div className="stat-cell">
                  <div className="stat-cell-label">Captures Today</div>
                  <div className="stat-cell-value">14</div>
                </div>
                <div className="stat-cell">
                  <div className="stat-cell-label">Alerts Sent</div>
                  <div className="stat-cell-value">3</div>
                </div>
                <div className="stat-cell">
                  <div className="stat-cell-label">Signal · SIM</div>
                  <div className="stat-cell-value green">4G · STRONG</div>
                </div>
                <div className="stat-cell">
                  <div className="stat-cell-label">Uptime</div>
                  <div className="stat-cell-value">17<small>d 04h</small></div>
                </div>
              </div>
            </div>

            {/* Last Detection */}
            <div className="panel panel-wide">
              <div className="panel-header">
                <div className="panel-title">Last Detection · Gemini Verdict</div>
                <div className="panel-sub">/ 14 minutes ago</div>
              </div>
              <div className="last-detection">
                <div className="last-img">
                  <Image
                    src="/last-detection.jpeg"
                    alt="Last detection capture"
                    fill
                    sizes="220px"
                    style={{ objectFit: "cover" }}
                  />
                </div>
                <div className="gemini-block">
                  <div className="gemini-label">Gemini Vision Analysis</div>
                  <div className="gemini-verdict">⚠ Intruder Detected</div>
                  <div className="gemini-analysis">
                    &ldquo;A single human figure approaches the southern perimeter
                    wall at night. Wearing dark clothing, carrying what appears to
                    be a hand tool — likely a shovel or pick. Movement is
                    deliberate and consistent with unauthorized excavation
                    behavior. Recommend immediate archaeologist notification.&rdquo;
                  </div>
                  <div className="gemini-meta">
                    <span>Confidence: <strong>94%</strong></span>
                    <span>Latency: <strong>2.4s</strong></span>
                    <span>Alert: <strong>SENT</strong></span>
                  </div>
                  <div className="archaeologist-card">
                    <div className="archaeologist-avatar">
                      <Image
                        src="/archaeologist-avatar.jpeg"
                        alt="Dr. M. Vasquez"
                        fill
                        sizes="48px"
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                    <div className="archaeologist-info">
                      <div className="archaeologist-name">Dr. M. Vasquez</div>
                      <div className="archaeologist-status">
                        Notified · SMS + App · 02:14 AM
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pipeline */}
            <div className="panel panel-wide">
              <div className="panel-header">
                <div className="panel-title">The Pipeline</div>
                <div className="panel-sub">/ end-to-end</div>
              </div>
              <div className="pipeline-feature">
                <div className="pipeline-mascot">
                  <Image
                    src="/og-mascot.png"
                    alt="Origins Guardian device"
                    width={160}
                    height={160}
                    style={{
                      objectFit: "contain",
                      position: "relative",
                      zIndex: 1,
                      filter: "drop-shadow(0 8px 20px rgba(0,0,0,0.6))",
                    }}
                  />
                </div>
                <div className="pipeline-blurb">
                  <strong>The Guardian</strong>
                  A solar-powered sentinel cast in obsidian and gold. PIR motion
                  detection paired with a wide-lens camera, anchored on classical
                  stone — the watch that does not sleep, the eye that does not
                  blink.
                </div>
              </div>
              <div className="pipeline">
                <div className="pipe-step">
                  <div className="pipe-icon">◉</div>
                  <div className="pipe-name">Motion</div>
                  <div className="pipe-desc">PIR triggers</div>
                </div>
                <div className="pipe-step">
                  <div className="pipe-icon">☁</div>
                  <div className="pipe-name">B2 Bucket</div>
                  <div className="pipe-desc">Image uploads</div>
                </div>
                <div className="pipe-step">
                  <div className="pipe-icon">◆</div>
                  <div className="pipe-name">Pi 4 + Gemini</div>
                  <div className="pipe-desc">Vision analysis</div>
                </div>
                <div className="pipe-step">
                  <div className="pipe-icon">✉</div>
                  <div className="pipe-name">Archaeologist</div>
                  <div className="pipe-desc">If threat → alert</div>
                </div>
              </div>
            </div>

            {/* Alert Feed */}
            <div className="panel panel-wide">
              <div className="panel-header">
                <div className="panel-title">Alert Feed</div>
                <div className="panel-sub">/ chronological · newest first</div>
              </div>
              <div className="alert-feed">
                <AlertRow
                  type="intruder"
                  title="Intruder · Alert Sent"
                  time="02:14 · TODAY"
                  msg="Human figure approaching south wall at night, carrying tool consistent with excavation. Archaeologist Dr. Vasquez notified via SMS + app."
                  tag="capture_1748147640.jpg · Gemini 94%"
                />
                <AlertRow
                  type="animal"
                  title="Animal · No Threat"
                  time="22:47 · YESTERDAY"
                  msg="Stray dog crossed the perimeter near the eastern marker. No artifact proximity. Log only — no notification sent."
                  tag="capture_1748102820.jpg · Gemini 89%"
                />
                <AlertRow
                  type="clear"
                  title="All Clear · Wind Trigger"
                  time="19:03 · YESTERDAY"
                  msg="Motion detected but Gemini found no living subject — likely vegetation movement from wind. Archive only."
                  tag="capture_1748089380.jpg · Gemini 97%"
                />
                <AlertRow
                  type="intruder"
                  title="Intruder · Alert Sent"
                  time="04:31 · 2 DAYS AGO"
                  msg="Two figures with backpacks lingering at the northern excavation pit. Behavior consistent with reconnaissance. Authorities alerted."
                  tag="capture_1747980660.jpg · Gemini 91%"
                />
                <AlertRow
                  type="animal"
                  title="Animal · No Threat"
                  time="06:12 · 2 DAYS AGO"
                  msg="Bird (owl) perched on column fragment. Archived for the records."
                  tag="capture_1747986720.jpg · Gemini 96%"
                />
                <AlertRow
                  type="clear"
                  title="All Clear · False Trigger"
                  time="11:58 · 3 DAYS AGO"
                  msg="Shadow movement from passing cloud cover. No subject detected."
                  tag="capture_1747915080.jpg · Gemini 99%"
                />
              </div>
            </div>
          </div>

          {/* Gallery */}
          <section className="gallery-section">
            <div className="section-header">
              <div className="section-eyebrow">B2 Bucket · Live Feed</div>
              <h2 className="section-title">
                From the <em>Vault</em>
              </h2>
              <p className="section-sub">
                Every capture streamed from cold storage
              </p>
            </div>
            <div className="gallery-controls">
              <div className="live-indicator">
                <span className="pulse" />
                <span>Live · Syncing</span>
              </div>
              <div className="bucket-tag">
                Bucket: <strong>og-captures-private</strong> ·{" "}
                <span>{CAPTURES.length}</span> images
              </div>
            </div>
            <div className="gallery-grid">
              {CAPTURES.map((c, idx) => (
                <div
                  key={c.file}
                  className="image-card"
                  onClick={() => setOverlaySrc(c.file)}
                >
                  <div className={`card-verdict ${c.verdict}`}>{c.verdict}</div>
                  <Image
                    src={c.file}
                    alt={`Capture ${idx + 1}`}
                    fill
                    sizes="(max-width: 768px) 50vw, 240px"
                    style={{ objectFit: "cover" }}
                  />
                  <div className="card-meta">
                    <div className="card-time">{fmtTime(c.ts)}</div>
                    <div className="card-date">{fmtDate(c.ts)}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {overlaySrc && (
        <div className="overlay" onClick={() => setOverlaySrc(null)}>
          <div className="overlay-close" onClick={() => setOverlaySrc(null)}>
            ✕ Close
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={overlaySrc} alt="Capture detail" />
        </div>
      )}

      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-ornament">
            <span className="line" />
            <span className="symbol">⚱</span>
            <span className="line" />
          </div>
          <div className="footer-motto">
            What is <em>remembered</em> · cannot be <em>stolen</em>
          </div>
          <div className="footer-copy">
            MMXXVI · Power Surge Blast Robotics
          </div>
        </div>
      </footer>
    </>
  );
}

function AlertRow({
  type,
  title,
  time,
  msg,
  tag,
}: {
  type: Verdict;
  title: string;
  time: string;
  msg: string;
  tag: string;
}) {
  const icon = type === "intruder" ? "⚠" : type === "animal" ? "◐" : "◯";
  return (
    <div className={`alert ${type}`}>
      <div className="alert-icon">{icon}</div>
      <div className="alert-body">
        <div className="alert-top">
          <div className="alert-type">{title}</div>
          <div className="alert-time">{time}</div>
        </div>
        <div className="alert-msg">{msg}</div>
        <div className="alert-tag">{tag}</div>
      </div>
    </div>
  );
}
