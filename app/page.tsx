"use client";
/* eslint-disable @next/next/no-img-element */

import Image from "next/image";
import dynamic from "next/dynamic";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import CinematicHero from "./CinematicHero";
import {
  RadialGauge,
  Sparkline,
  PipelineFlow,
  ConfidenceRing,
  AlertsGraph,
} from "./DashboardWidgets";

const DeploymentMap = dynamic(() => import("./DeploymentMap"), { ssr: false });
const ChatBot = dynamic(() => import("./ChatBot"), { ssr: false });

type Verdict = "intruder" | "animal" | "clear" | "capture";

interface Cap {
  url: string;
  name: string;
  ts: number | null;
  verdict?: Verdict;
}

/* ---- the ONE registered login ---- */
const VALID_OGS = ["OG-1", "OG-2", "OG-3", "OG-4"];
const FIELD_NORM = "FLDPSB1"; // FLD-PSB-1 normalized
const PASSWORD = "Powersurgeblast";
const MAX_ATTEMPTS = 3;

/* ---- fallback captures (shown if the field server is unreachable) ---- */
const FALLBACK: Cap[] = [
  { url: "/capture-01.jpeg", name: "capture_1748147640.jpg", ts: 1748147640, verdict: "intruder" },
  { url: "/capture-02.jpeg", name: "capture_1748102820.jpg", ts: 1748102820, verdict: "animal" },
  { url: "/capture-03.jpeg", name: "capture_1748089380.jpg", ts: 1748089380, verdict: "clear" },
  { url: "/capture-04.jpeg", name: "capture_1747980660.jpg", ts: 1747980660, verdict: "intruder" },
  { url: "/capture-05.jpeg", name: "capture_1747986720.jpg", ts: 1747986720, verdict: "animal" },
  { url: "/capture-06.jpeg", name: "capture_1747915080.jpg", ts: 1747915080, verdict: "clear" },
  { url: "/capture-07.jpeg", name: "capture_1747820000.jpg", ts: 1747820000, verdict: "animal" },
  { url: "/capture-08.jpeg", name: "capture_1747734400.jpg", ts: 1747734400, verdict: "clear" },
  { url: "/capture-09.jpeg", name: "capture_1747648800.jpg", ts: 1747648800, verdict: "animal" },
  { url: "/capture-10.jpeg", name: "capture_1747563200.jpg", ts: 1747563200, verdict: "intruder" },
  { url: "/capture-11.jpeg", name: "capture_1747477600.jpg", ts: 1747477600, verdict: "clear" },
  { url: "/capture-12.jpeg", name: "capture_1747392000.jpg", ts: 1747392000, verdict: "animal" },
];

function fmtTime(ts: number | null) {
  if (!ts) return "—";
  const d = new Date(ts * 1000);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function fmtDate(ts: number | null) {
  if (!ts) return "";
  const d = new Date(ts * 1000);
  return `${d.getMonth() + 1}/${d.getDate()}/${String(d.getFullYear()).slice(-2)}`;
}
function canonOg(s: string): string | null {
  const t = s.toUpperCase().replace(/[\s_]/g, "");
  const m = t.match(/^OG-?0*([0-9]+)$/);
  return m ? `OG-${parseInt(m[1], 10)}` : null;
}
function canonField(s: string) {
  return s.toUpperCase().replace(/[^A-Z0-9]/g, "");
}
function dailyCounts(caps: Cap[], days: number): number[] {
  const now = Date.now();
  const out = new Array(days).fill(0);
  caps.forEach((c) => {
    if (!c.ts) return;
    const age = Math.floor((now - c.ts * 1000) / 86400000);
    if (age >= 0 && age < days) out[days - 1 - age]++;
  });
  return out;
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};
const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};
const heroStagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};
const galleryStagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04, delayChildren: 0.05 } },
};
const cardScale: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.96 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: "easeOut" } },
};
const overlayBackdrop: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, transition: { duration: 0.2, ease: "easeInOut" } },
};
const overlayImage: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  show: { opacity: 1, scale: 1, transition: { type: "spring" as const, damping: 22, stiffness: 240 } },
  exit: { opacity: 0, scale: 0.94, transition: { duration: 0.18, ease: "easeInOut" } },
};
const subStage: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

type Stage = "gate" | "loading" | "password" | "locked" | "connected";

export default function Page() {
  const [stage, setStage] = useState<Stage>("gate");
  const connected = stage === "connected";

  // login state
  const [ogs, setOgs] = useState<string[]>([]);
  const [ogDraft, setOgDraft] = useState("");
  const [fld, setFld] = useState("");
  const [pwd, setPwd] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState("");

  // controls (OG-1 only)
  const [master, setMaster] = useState(true);
  const [motionOn, setMotionOn] = useState(true);
  const [camera, setCamera] = useState(true);
  const [ultrasonic, setUltrasonic] = useState(true);
  const [tempSensor, setTempSensor] = useState(true);

  // live data
  const [caps, setCaps] = useState<Cap[]>(FALLBACK);
  const [live, setLive] = useState(false);
  const [tele, setTele] = useState<{
    battery: number | null;
    temp: number | null;
    signal: number | null;
    configured: boolean;
    live: boolean;
  }>({ battery: null, temp: null, signal: null, configured: false, live: false });

  const [overlaySrc, setOverlaySrc] = useState<string | null>(null);

  // tell the ESP-32 about a toggle (no-op if hardware isn't wired yet)
  const sendControl = (device: string, on: boolean) => {
    fetch("/api/og/control", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ device, on }),
    }).catch(() => {});
  };
  const onMaster = (on: boolean) => { setMaster(on); sendControl("master", on); };
  const onMotion = (on: boolean) => { setMotionOn(on); sendControl("motion", on); };
  const onCamera = (on: boolean) => { setCamera(on); sendControl("camera", on); };
  const onUltrasonic = (on: boolean) => { setUltrasonic(on); sendControl("ultrasonic", on); };
  const onTempSensor = (on: boolean) => { setTempSensor(on); sendControl("temperature", on); };

  useEffect(() => {
    const v = master;
    setMotionOn(v);
    setCamera(v);
    setUltrasonic(v);
    setTempSensor(v);
  }, [master]);

  // fetch live data once connected
  useEffect(() => {
    if (stage !== "connected") return;
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/api/captures");
        const j = await r.json();
        if (alive && j.ok && Array.isArray(j.items) && j.items.length) {
          setCaps(j.items.map((it: { url: string; name: string; ts: number | null }) => ({
            url: it.url,
            name: it.name,
            ts: it.ts,
            verdict: "capture" as Verdict,
          })));
          setLive(true);
        }
      } catch {
        /* keep fallback */
      }
    })();
    return () => {
      alive = false;
    };
  }, [stage]);

  // poll the ESP-32 for live telemetry every 5s
  useEffect(() => {
    if (stage !== "connected") return;
    let alive = true;
    const poll = async () => {
      try {
        const r = await fetch("/api/og/status");
        const j = await r.json();
        if (!alive) return;
        if (j.ok) {
          setTele({
            battery: typeof j.battery === "number" ? j.battery : null,
            temp: typeof j.temp === "number" ? j.temp : null,
            signal: typeof j.signal === "number" ? j.signal : null,
            configured: true,
            live: true,
          });
        } else {
          setTele((t) => ({ ...t, configured: !!j.configured, live: false }));
        }
      } catch {
        if (alive) setTele((t) => ({ ...t, live: false }));
      }
    };
    poll();
    const id = setInterval(poll, 5000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [stage]);

  const addOgDraft = () => {
    const v = ogDraft.trim();
    if (!v) return;
    setOgs((p) =>
      p.some((x) => (canonOg(x) || x.toUpperCase()) === (canonOg(v) || v.toUpperCase()))
        ? p
        : [...p, v]
    );
    setOgDraft("");
  };
  const removeOgAt = (i: number) => setOgs((p) => p.filter((_, j) => j !== i));

  const beginWatch = (e: React.FormEvent) => {
    e.preventDefault();
    const draft = ogDraft.trim();
    const entries = [...ogs, ...(draft ? [draft] : [])].map((s) => s.trim()).filter(Boolean);
    if (draft) {
      setOgs((p) =>
        p.some((x) => (canonOg(x) || x.toUpperCase()) === (canonOg(draft) || draft.toUpperCase()))
          ? p
          : [...p, draft]
      );
      setOgDraft("");
    }
    if (entries.length === 0) {
      setError("◆ Add at least one Guardian number.");
      return;
    }
    const canon: string[] = [];
    for (const entry of entries) {
      const c = canonOg(entry);
      if (!c) {
        setError(`◆ "${entry}" is not a valid Guardian ID.`);
        return;
      }
      if (!VALID_OGS.includes(c)) {
        setError(`◆ ${c} is not registered yet.`);
        return;
      }
      canon.push(c);
    }
    const uniq = Array.from(new Set(canon));
    if (uniq.length !== VALID_OGS.length) {
      setError("◆ Register all four guardians — OG-1 through OG-4.");
      return;
    }
    if (canonField(fld) !== FIELD_NORM) {
      setError(`◆ Field "${fld || "—"}" is not recognized.`);
      return;
    }
    setError("");
    setStage("loading");
    setTimeout(() => setStage("password"), 1600);
  };

  const submitPwd = (e: React.FormEvent) => {
    e.preventDefault();
    if (pwd === PASSWORD) {
      setError("");
      setStage("connected");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const next = attempts + 1;
    setAttempts(next);
    setPwd("");
    if (next >= MAX_ATTEMPTS) {
      setStage("locked");
    } else {
      setError(`◆ Incorrect password · ${MAX_ATTEMPTS - next} attempt${MAX_ATTEMPTS - next === 1 ? "" : "s"} remaining.`);
    }
  };

  const handleDisconnect = () => {
    setStage("gate");
    setOgs([""]);
    setFld("");
    setPwd("");
    setAttempts(0);
    setError("");
    setLive(false);
    setCaps(FALLBACK);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") setOverlaySrc(null);
  }, []);
  useEffect(() => {
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  const latest = caps[0];
  const spark7 = dailyCounts(caps, 7);
  const graph14 = dailyCounts(caps, 14);
  const todayCount = spark7[spark7.length - 1] ?? 0;

  const guardians = [
    { id: "OG-1", active: true },
    { id: "OG-2", active: false },
    { id: "OG-3", active: false },
    { id: "OG-4", active: false },
  ];

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
          <span>{connected ? "4 Guardians · FLD-PSB-1" : "Disconnected"}</span>
          {connected && (
            <button className="disconnect" onClick={handleDisconnect}>
              Disconnect
            </button>
          )}
        </div>
      </nav>

      <AnimatePresence mode="wait">
        {!connected ? (
          <motion.div key="landing" exit={{ opacity: 0, transition: { duration: 0.3 } }}>
            <CinematicHero />
            <section className="gate">
              <div className="gate-bg" style={{ backgroundImage: "url(/hero-bg.jpeg)" }} />
              <motion.div
                className="gate-card"
                initial={{ opacity: 0, y: 24, scale: 0.96 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.7, ease: "easeOut" }}
              >
                <span className="c3" />
                <span className="c4" />
                <div className="gate-icon">
                  <Image src="/icon.png" alt="Origins Guardian emblem" fill sizes="110px" />
                </div>

                <AnimatePresence mode="wait">
                  {stage === "gate" && (
                    <motion.div key="s-gate" variants={subStage} initial="hidden" animate="show" exit="exit">
                      <div className="gate-eyebrow">Establish the Watch</div>
                      <h1 className="gate-title">Connect Your Guardians</h1>
                      <p className="gate-sub">
                        Register every Origins Guardian unit on the field, then enter the field code.
                      </p>
                      <form onSubmit={beginWatch}>
                        <label className="field-label">Origins Guardian Number</label>
                        {ogs.length > 0 && (
                          <div className="og-chips">
                            {ogs.map((v, i) => (
                              <span className="og-chip" key={i}>
                                {v}
                                <button
                                  type="button"
                                  className="og-chip-x"
                                  onClick={() => removeOgAt(i)}
                                  aria-label="Remove guardian"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="og-entry">
                          <input
                            className="field-input og-entry-input"
                            type="text"
                            placeholder="ex: OG-95"
                            value={ogDraft}
                            onChange={(e) => setOgDraft(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addOgDraft();
                              }
                            }}
                            autoComplete="off"
                          />
                          <button type="button" className="og-entry-btn" onClick={addOgDraft}>
                            Add
                          </button>
                        </div>
                        <div className="og-help">Press Enter or tap Add for each unit</div>

                        <div className="field-group">
                          <label className="field-label" htmlFor="fieldNumber">
                            Dig Site Name
                          </label>
                          <input
                            className="field-input"
                            id="fieldNumber"
                            type="text"
                            placeholder="ex: FLD-BLM-IL"
                            value={fld}
                            onChange={(e) => setFld(e.target.value)}
                            autoComplete="off"
                          />
                        </div>

                        <button className="gate-btn" type="submit">
                          Begin the Watch ⚡
                        </button>
                      </form>
                      <div className="gate-error">{error}</div>
                    </motion.div>
                  )}

                  {stage === "loading" && (
                    <motion.div key="s-load" variants={subStage} initial="hidden" animate="show" exit="exit">
                      <div className="gate-eyebrow">Communing</div>
                      <h1 className="gate-title">Establishing the Link</h1>
                      <div className="connecting-text">
                        Encrypted handshake with the field<span className="dots" />
                      </div>
                    </motion.div>
                  )}

                  {stage === "password" && (
                    <motion.div key="s-pwd" variants={subStage} initial="hidden" animate="show" exit="exit">
                      <div className="gate-eyebrow">Authenticate</div>
                      <h1 className="gate-title">Enter Watch Password</h1>
                      <p className="gate-sub">Four guardians verified on FLD-PSB-1. One step remains.</p>
                      <form onSubmit={submitPwd}>
                        <div className="field-group">
                          <label className="field-label" htmlFor="pwd">
                            Password
                          </label>
                          <input
                            className="field-input"
                            id="pwd"
                            type="password"
                            placeholder="••••••••••"
                            value={pwd}
                            onChange={(e) => setPwd(e.target.value)}
                            autoComplete="off"
                            autoFocus
                          />
                        </div>
                        <button className="gate-btn" type="submit">
                          Authenticate ⚡
                        </button>
                      </form>
                      <div className="gate-error">{error}</div>
                      <div className="gate-hint">
                        {MAX_ATTEMPTS - attempts} of {MAX_ATTEMPTS} attempts remaining
                      </div>
                    </motion.div>
                  )}

                  {stage === "locked" && (
                    <motion.div key="s-lock" variants={subStage} initial="hidden" animate="show" exit="exit">
                      <div className="gate-eyebrow locked">Access Locked</div>
                      <h1 className="gate-title">The Watch Has Sealed</h1>
                      <p className="gate-sub">
                        Too many failed attempts. Refresh the page to approach the gate again.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </section>
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            className="dashboard-shown"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.4 } }}
          >
            {/* HERO STRIP */}
            <motion.section className="hero-strip" variants={heroStagger} initial="hidden" animate="show">
              <div className="hero-inner">
                <motion.div className="hero-eyebrow" variants={fadeUp}>
                  ⚡ The Watch is Active ⚡
                </motion.div>
                <motion.h1 className="hero-title" variants={fadeUp}>
                  Guardian Console
                </motion.h1>
                <motion.p className="hero-sub" variants={fadeUp}>
                  Telemetry, alerts, and the unblinking gaze of the field.
                </motion.p>
                <motion.div className="connection-tag" variants={fadeUp}>
                  <span>◉</span>
                  <span>OG-1 · OG-2 · OG-3 · OG-4 · FLD-PSB-1</span>
                </motion.div>
              </div>
            </motion.section>

            {/* GUARDIAN ROWS */}
            <motion.div className="guardian-stack" variants={staggerContainer} initial="hidden" animate="show">
              {guardians.map((g) => (
                <GuardianRow
                  key={g.id}
                  ogId={g.id}
                  active={g.active}
                  master={master}
                  motionOn={motionOn}
                  camera={camera}
                  ultrasonic={ultrasonic}
                  tempSensor={tempSensor}
                  onMaster={onMaster}
                  onMotion={onMotion}
                  onCamera={onCamera}
                  onUltrasonic={onUltrasonic}
                  onTempSensor={onTempSensor}
                  tele={tele}
                  events={caps.length}
                  todayCount={todayCount}
                  live={live}
                  spark={spark7}
                />
              ))}
            </motion.div>

            {/* WIDE PANELS */}
            <motion.div className="dash-grid" variants={staggerContainer} initial="hidden" animate="show">
              {/* Last Detection */}
              <motion.div className="panel panel-wide" variants={fadeUp}>
                <div className="panel-header">
                  <div className="panel-title">Last Detection{latest?.verdict !== "capture" ? " · Gemini Verdict" : ""}</div>
                  <div className="panel-sub">/ {latest ? fmtTime(latest.ts) : "—"} · OG-1</div>
                </div>
                <div className="last-detection">
                  <div className="last-img">
                    {latest && <img src={latest.url.startsWith("http") ? "/api/img?f=" + latest.url.split("/").pop() : latest.url} alt="Last detection capture" />}
                  </div>
                  <div className="gemini-block">
                    {latest && latest.verdict !== "capture" ? (
                      <>
                        <div className="gemini-label">Gemini Vision Analysis</div>
                        <div className="gemini-head">
                          <div className="gemini-head-left">
                            <div className="gemini-verdict">⚠ Intruder Detected</div>
                            <div className="threat-pill threat-high">
                              <span className="threat-dot" />
                              Threat Level · High
                            </div>
                          </div>
                          <ConfidenceRing value={94} />
                        </div>
                        <div className="gemini-analysis">
                          &ldquo;A single human figure approaches the southern perimeter wall at night,
                          carrying what appears to be a hand tool. Movement is consistent with unauthorized
                          excavation. Recommend immediate archaeologist notification.&rdquo;
                        </div>
                        <div className="gemini-meta">
                          <span>Latency: <strong>2.4s</strong></span>
                          <span>Alert: <strong>SENT</strong></span>
                          <span>Model: <strong>Gemini 2.5 Flash</strong></span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="gemini-label">Field Server · Live Capture</div>
                        <div className="gemini-head">
                          <div className="gemini-head-left">
                            <div className="gemini-verdict capture">◉ Motion Captured</div>
                            <div className="threat-pill threat-info">
                              <span className="threat-dot info" />
                              Awaiting Gemini Verdict
                            </div>
                          </div>
                        </div>
                        <div className="gemini-analysis">
                          Newest frame pulled live from the field server. Gemini Vision runs on the Pi 4 and
                          delivers its verdict over Telegram — verdicts are not stored in the image bucket,
                          so this panel shows the raw capture and its timestamp.
                        </div>
                        <div className="gemini-meta">
                          <span>File: <strong>{latest?.name ?? "—"}</strong></span>
                          <span>Time: <strong>{fmtTime(latest?.ts ?? null)} {fmtDate(latest?.ts ?? null)}</strong></span>
                          <span>Source: <strong>hooloovoo.blue</strong></span>
                        </div>
                      </>
                    )}
                    <ArchaeologistCard />
                  </div>
                </div>
              </motion.div>

              {/* Pipeline */}
              <motion.div className="panel panel-wide" variants={fadeUp}>
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
                      style={{ objectFit: "contain", position: "relative", zIndex: 1, filter: "drop-shadow(0 8px 20px rgba(0,0,0,0.6))" }}
                    />
                  </div>
                  <div className="pipeline-blurb">
                    <strong>The Guardian</strong>
                    A solar-powered sentinel cast in obsidian and gold. PIR motion detection paired with a
                    wide-lens camera — the watch that does not sleep, the eye that does not blink.
                  </div>
                </div>
                <PipelineFlow />
              </motion.div>

              {/* Alerts over time */}
              <motion.div className="panel" variants={fadeUp}>
                <div className="panel-header">
                  <div className="panel-title">Detections Over Time</div>
                  <div className="panel-sub">/ last 14 days</div>
                </div>
                <AlertsGraph data={graph14} />
              </motion.div>

              {/* Globe */}
              <motion.div className="panel" variants={fadeUp}>
                <div className="panel-header">
                  <div className="panel-title">Deployment Map</div>
                  <div className="panel-sub">/ active guardians</div>
                </div>
                <DeploymentMap />
              </motion.div>

              {/* Alert Feed */}
              <motion.div className="panel panel-wide" variants={fadeUp}>
                <div className="panel-header">
                  <div className="panel-title">Alert Feed</div>
                  <div className="panel-sub">/ newest first {live ? "· live" : ""}</div>
                </div>
                <div className="alert-feed">
                  {live
                    ? caps.slice(0, 10).map((c) => (
                        <AlertRow
                          key={c.name}
                          type="capture"
                          title="Motion Captured"
                          time={`${fmtTime(c.ts)} · ${fmtDate(c.ts)}`}
                          msg="Frame uploaded to the field server. Pending Gemini Vision analysis on the Pi 4."
                          tag={c.name}
                        />
                      ))
                    : (
                      <>
                        <AlertRow type="intruder" title="Intruder · Alert Sent" time="02:14 · TODAY" msg="Human figure approaching south wall at night, carrying tool consistent with excavation. Dr. Vasquez notified." tag="capture_1748147640.jpg · Gemini 94%" />
                        <AlertRow type="animal" title="Animal · No Threat" time="22:47 · YESTERDAY" msg="Stray dog crossed the perimeter near the eastern marker. Log only — no notification sent." tag="capture_1748102820.jpg · Gemini 89%" />
                        <AlertRow type="clear" title="All Clear · Wind Trigger" time="19:03 · YESTERDAY" msg="Motion detected but Gemini found no living subject — likely vegetation movement. Archive only." tag="capture_1748089380.jpg · Gemini 97%" />
                        <AlertRow type="intruder" title="Intruder · Alert Sent" time="04:31 · 2 DAYS AGO" msg="Two figures with backpacks lingering at the northern excavation pit. Authorities alerted." tag="capture_1747980660.jpg · Gemini 91%" />
                        <AlertRow type="animal" title="Animal · No Threat" time="06:12 · 2 DAYS AGO" msg="Bird (owl) perched on column fragment. Archived for the records." tag="capture_1747986720.jpg · Gemini 96%" />
                        <AlertRow type="clear" title="All Clear · False Trigger" time="11:58 · 3 DAYS AGO" msg="Shadow movement from passing cloud cover. No subject detected." tag="capture_1747915080.jpg · Gemini 99%" />
                      </>
                    )}
                </div>
              </motion.div>
            </motion.div>

            {/* Gallery */}
            <section className="gallery-section">
              <motion.div
                className="section-header"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <div className="section-eyebrow">Field Server · {live ? "Live Feed" : "Cached"}</div>
                <h2 className="section-title">
                  From the <em>Vault</em>
                </h2>
                <p className="section-sub">Every capture streamed from the field server</p>
              </motion.div>

              <motion.div
                className="gallery-controls"
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <div className="live-indicator">
                  <span className="pulse" />
                  <span>{live ? "Live · Syncing" : "Offline · Cached"}</span>
                </div>
                <div className="bucket-tag">
                  Source: <strong>{live ? "hooloovoo.blue/powersurge" : "local cache"}</strong> ·{" "}
                  <span>{caps.length}</span> images
                </div>
              </motion.div>

              <motion.div
                className="gallery-grid"
                variants={galleryStagger}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-60px" }}
              >
                {caps.map((c, idx) => (
                  <motion.div key={c.name + idx} className="image-card" variants={cardScale} onClick={() => setOverlaySrc(c.url)}>
                    <div className={`card-verdict ${c.verdict ?? "capture"}`}>{c.verdict === "capture" || !c.verdict ? "motion" : c.verdict}</div>
                    <img src={c.url} alt={`Capture ${idx + 1}`} loading="lazy" />
                    <div className="card-meta">
                      <div className="card-time">{fmtTime(c.ts)}</div>
                      <div className="card-date">{fmtDate(c.ts)}</div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {overlaySrc && (
          <motion.div className="overlay" onClick={() => setOverlaySrc(null)} variants={overlayBackdrop} initial="hidden" animate="show" exit="exit">
            <div className="overlay-close" onClick={() => setOverlaySrc(null)}>
              ✕ Close
            </div>
            <motion.img src={overlaySrc} alt="Capture detail" variants={overlayImage} initial="hidden" animate="show" exit="exit" />
          </motion.div>
        )}
      </AnimatePresence>

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
          <div className="footer-copy">MMXXVI · Power Surge Blast Robotics</div>
        </div>
      </footer>
      {/* Floating chatbot — always visible, trained via chatbot-knowledge.md */}
      <ChatBot />
    </>
  );
}

/* ============================ GUARDIAN ROW ============================ */
function GuardianRow({
  ogId,
  active,
  master,
  motionOn,
  camera,
  ultrasonic,
  tempSensor,
  onMaster,
  onMotion,
  onCamera,
  onUltrasonic,
  onTempSensor,
  tele,
  events,
  todayCount,
  live,
  spark,
}: {
  ogId: string;
  active: boolean;
  master: boolean;
  motionOn: boolean;
  camera: boolean;
  ultrasonic: boolean;
  tempSensor: boolean;
  onMaster: (b: boolean) => void;
  onMotion: (b: boolean) => void;
  onCamera: (b: boolean) => void;
  onUltrasonic: (b: boolean) => void;
  onTempSensor: (b: boolean) => void;
  tele: { battery: number | null; temp: number | null; signal: number | null; configured: boolean; live: boolean };
  events: number;
  todayCount: number;
  live: boolean;
  spark: number[];
}) {
  return (
    <motion.div className={`guardian-row ${active ? "" : "inactive"}`} variants={fadeUp}>
      <div className="guardian-row-head">
        <span className="guardian-id">{ogId}</span>
        <span className={`guardian-state ${active ? "on" : "off"}`}>
          {active ? "● ACTIVE" : "○ INACTIVE"}
        </span>
      </div>

      <div className="guardian-panels">
        {/* Controls */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">Controls</div>
            <div className="panel-sub">/ {ogId}</div>
          </div>
          {active ? (
            <>
              <div className="master-toggle">
                <div className="toggle-row" style={{ borderBottom: "none", padding: 0 }}>
                  <div className="toggle-info">
                    <div className="toggle-name">⚡ Origins Guardian</div>
                    <div className="toggle-desc">Master power. Disabling stills the entire unit.</div>
                  </div>
                  <label className="switch">
                    <input type="checkbox" checked={master} onChange={(e) => onMaster(e.target.checked)} />
                    <span className="slider" />
                  </label>
                </div>
              </div>
              <div className="controls-scroll">
                <div className={`toggle-row ${!master ? "disabled" : ""}`}>
                  <div className="toggle-info">
                    <div className="toggle-name">Motion Sensor</div>
                    <div className="toggle-desc">PIR — detects movement at the perimeter.</div>
                  </div>
                  <label className="switch">
                    <input type="checkbox" checked={motionOn} disabled={!master} onChange={(e) => onMotion(e.target.checked)} />
                    <span className="slider" />
                  </label>
                </div>
                <div className={`toggle-row ${!master ? "disabled" : ""}`}>
                  <div className="toggle-info">
                    <div className="toggle-name">Camera</div>
                    <div className="toggle-desc">Captures and uploads on motion trigger.</div>
                  </div>
                  <label className="switch">
                    <input type="checkbox" checked={camera} disabled={!master} onChange={(e) => onCamera(e.target.checked)} />
                    <span className="slider" />
                  </label>
                </div>
                <div className={`toggle-row ${!master ? "disabled" : ""}`}>
                  <div className="toggle-info">
                    <div className="toggle-name">Ultrasonic Sensor</div>
                    <div className="toggle-desc">Ranging — measures distance to nearby objects.</div>
                  </div>
                  <label className="switch">
                    <input type="checkbox" checked={ultrasonic} disabled={!master} onChange={(e) => onUltrasonic(e.target.checked)} />
                    <span className="slider" />
                  </label>
                </div>
                <div className={`toggle-row ${!master ? "disabled" : ""}`}>
                  <div className="toggle-info">
                    <div className="toggle-name">Temperature Sensor</div>
                    <div className="toggle-desc">Ambient temperature at the dig site.</div>
                  </div>
                  <label className="switch">
                    <input type="checkbox" checked={tempSensor} disabled={!master} onChange={(e) => onTempSensor(e.target.checked)} />
                    <span className="slider" />
                  </label>
                </div>
              </div>
            </>
          ) : (
            <div className="inactive-body">
              <div className="inactive-glyph">⚿</div>
              <div className="inactive-text">No unit paired to {ogId}</div>
              <div className="inactive-note">Controls available once a Guardian comes online.</div>
            </div>
          )}
        </div>

        {/* Telemetry */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">Telemetry</div>
            <div className="panel-sub">/ {active ? (live ? "live" : "cached") : "offline"}</div>
          </div>
          {active ? (
            <div className="telemetry">
              <div className="telemetry-gauges">
                {tele.battery != null ? (
                  <RadialGauge value={Math.round(tele.battery)} label="Battery" color="var(--emerald)" />
                ) : (
                  <div className="gauge-missing">
                    <div className="gauge-missing-val">—</div>
                    <div className="gauge-missing-label">Battery</div>
                    <div className="gauge-missing-note">
                      {tele.configured ? "ESP-32 unreachable" : "Awaiting ESP-32"}
                    </div>
                  </div>
                )}
                <RadialGauge value={tele.signal != null ? Math.round(tele.signal) : 92} label="Signal · 4G" color="var(--gold)" />
              </div>
              <div className="stat-grid">
                <div className="stat-cell">
                  <div className="stat-cell-label">Captures Today</div>
                  <div className="stat-cell-value">{todayCount}</div>
                </div>
                <div className="stat-cell">
                  <div className="stat-cell-label">Temp</div>
                  <div className="stat-cell-value">
                    {tele.temp != null ? (
                      <>
                        {Math.round(tele.temp)}
                        <small>°C</small>
                      </>
                    ) : (
                      "—"
                    )}
                  </div>
                </div>
                <div className="stat-cell">
                  <div className="stat-cell-label">Feed</div>
                  <div className={`stat-cell-value ${live ? "green" : ""}`}>{live ? "LIVE" : "CACHE"}</div>
                </div>
                <div className="stat-cell">
                  <div className="stat-cell-label">ESP-32</div>
                  <div className={`stat-cell-value ${tele.live ? "green" : ""}`}>
                    {tele.live ? "LIVE" : tele.configured ? "OFFLINE" : "—"}
                  </div>
                </div>
              </div>
              <div className="telemetry-spark">
                <div className="telemetry-spark-label">7-Day Capture Activity</div>
                <Sparkline data={spark.some((n) => n > 0) ? spark : [0, 0, 0, 0, 0, 0, 0]} />
              </div>
            </div>
          ) : (
            <div className="inactive-body">
              <div className="inactive-glyph">⌁</div>
              <div className="inactive-text">No telemetry from {ogId}</div>
              <div className="inactive-note">Battery, signal, and captures appear when paired.</div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ============================ ALERT ROW ============================ */
/* ==================== EDITABLE ARCHAEOLOGIST CARD ==================== */
function ArchaeologistCard() {
  const [name, setName] = useState("Enter Name Here");
  const [photo, setPhoto] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Load saved name/photo (persists per browser/account)
  useEffect(() => {
    try {
      const n = localStorage.getItem("og_arch_name");
      const p = localStorage.getItem("og_arch_photo");
      if (n) setName(n);
      if (p) setPhoto(p);
    } catch {
      /* ignore */
    }
  }, []);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        // downscale to keep it small enough to persist in localStorage
        const max = 256;
        const scale = Math.min(max / img.width, max / img.height, 1);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        const url = canvas.toDataURL("image/jpeg", 0.85);
        setPhoto(url);
        try {
          localStorage.setItem("og_arch_photo", url);
        } catch {
          /* quota */
        }
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(f);
    e.target.value = "";
  };

  const commitName = () => {
    const v = draft.trim();
    if (v) {
      setName(v);
      try {
        localStorage.setItem("og_arch_name", v);
      } catch {
        /* ignore */
      }
    }
    setEditing(false);
  };

  return (
    <div className="archaeologist-card">
      <button
        type="button"
        className="archaeologist-avatar editable"
        onClick={() => fileRef.current?.click()}
        title="Upload a profile photo"
      >
        {photo ? (
          <img src={photo} alt={name} />
        ) : (
          <span className="avatar-default" aria-hidden>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6">
              <circle cx="12" cy="8.5" r="3.6" />
              <path d="M4.5 20c0-3.8 3.4-5.8 7.5-5.8s7.5 2 7.5 5.8" strokeLinecap="round" />
            </svg>
          </span>
        )}
        <span className="avatar-overlay" aria-hidden>
          <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.7">
            <path d="M3 8.5h3L7.5 6.5h9L18 8.5h3v11H3z" strokeLinejoin="round" />
            <circle cx="12" cy="13.5" r="3.1" />
          </svg>
        </span>
      </button>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPick} />
      <div className="archaeologist-info">
        {editing ? (
          <input
            className="arch-name-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitName();
              if (e.key === "Escape") setEditing(false);
            }}
            autoFocus
          />
        ) : (
          <button
            type="button"
            className={`archaeologist-name editable ${name === "Enter Name Here" ? "placeholder" : ""}`}
            onClick={() => {
              setDraft(name === "Enter Name Here" ? "" : name);
              setEditing(true);
            }}
            title="Click to rename"
          >
            {name}
            <span className="name-edit" aria-hidden>✎</span>
          </button>
        )}
        <div className="archaeologist-status">Alert recipient · SMS + Telegram</div>
      </div>
    </div>
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
  const icon = type === "intruder" ? "⚠" : type === "animal" ? "◐" : type === "capture" ? "◉" : "◯";
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
