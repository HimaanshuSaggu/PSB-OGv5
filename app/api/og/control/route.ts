import { NextResponse } from "next/server";

// Same ESP-32 base as status route.
const ESP32_BASE = "";

export const dynamic = "force-dynamic";

// Body: { device: "motion" | "camera" | "ultrasonic" | "temperature" | "master", on: boolean }
export async function POST(req: Request) {
  if (!ESP32_BASE) {
    // No hardware wired yet — accept the toggle so the UI stays responsive.
    return NextResponse.json({ ok: false, configured: false });
  }
  try {
    const body = await req.json();
    const res = await fetch(`${ESP32_BASE}/control`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    return NextResponse.json({ ok: res.ok, configured: true });
  } catch (e) {
    return NextResponse.json({
      ok: false,
      configured: true,
      error: e instanceof Error ? e.message : "unreachable",
    });
  }
}
