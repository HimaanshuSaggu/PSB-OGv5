import { NextResponse } from "next/server";

// ▼▼▼  PASTE YOUR ESP-32 BASE URL HERE  ▼▼▼
// e.g. "http://192.168.0.50"  (no trailing slash). Leave "" until you have it.
const ESP32_BASE = "";
// ▲▲▲──────────────────────────────────────▲▲▲

export const dynamic = "force-dynamic";

// Returns live telemetry from the ESP-32: { battery, temp, signal, motion, camera, ultrasonic }
export async function GET() {
  if (!ESP32_BASE) {
    return NextResponse.json({ ok: false, configured: false });
  }
  try {
    const res = await fetch(`${ESP32_BASE}/status`, {
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) {
      return NextResponse.json({ ok: false, configured: true, error: `status ${res.status}` });
    }
    const data = await res.json();
    return NextResponse.json({ ok: true, configured: true, ...data });
  } catch (e) {
    return NextResponse.json({
      ok: false,
      configured: true,
      error: e instanceof Error ? e.message : "unreachable",
    });
  }
}
