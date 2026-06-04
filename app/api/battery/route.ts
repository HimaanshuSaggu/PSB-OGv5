import { NextResponse } from "next/server";

// ▼▼▼  PASTE YOUR ESP-32 ENDPOINT HERE  ▼▼▼
// e.g. "http://192.168.0.50/battery"  — leave "" until you have it.
const ESP32_URL = "";
// ▲▲▲────────────────────────────────────▲▲▲

export const dynamic = "force-dynamic";

export async function GET() {
  if (!ESP32_URL) {
    return NextResponse.json({ ok: false, configured: false });
  }
  try {
    const res = await fetch(ESP32_URL, {
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) {
      return NextResponse.json({ ok: false, configured: true, error: `status ${res.status}` });
    }
    const txt = await res.text();
    let pct: number | null = null;
    try {
      const j = JSON.parse(txt);
      pct = j.battery ?? j.percent ?? j.level ?? j.soc ?? j.charge ?? null;
    } catch {
      const n = parseFloat(txt);
      if (!isNaN(n)) pct = n;
    }
    return NextResponse.json({ ok: pct != null, configured: true, battery: pct });
  } catch (e) {
    return NextResponse.json({
      ok: false,
      configured: true,
      error: e instanceof Error ? e.message : "unreachable",
    });
  }
}
