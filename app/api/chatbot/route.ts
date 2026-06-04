import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

const API_KEY = process.env.NVIDIA_API_KEY;
export const dynamic = "force-dynamic";

function loadKnowledge(): string {
  try { return readFileSync(join(process.cwd(), "chatbot-knowledge.md"), "utf-8"); }
  catch { return ""; }
}

export async function POST(req: Request) {
  if (!API_KEY) return NextResponse.json({ ok:false, text:"NVIDIA_API_KEY not set in .env.local" }, {status:500});
  const { messages } = await req.json() as { messages:{role:string;content:string}[] };
  const knowledge = loadKnowledge();
  const system = `You are Origins AI — the assistant for the Origins Guardian archaeological site protection system. Be concise and helpful. Respond in 1–3 short paragraphs.\n\n${knowledge}`;
  const body = {
    model: "meta/llama-3.1-8b-instruct",
    messages: [{ role:"system", content:system }, ...messages.map((m: {role:string;content:string})=>({ role:m.role, content:m.content }))],
    max_tokens: 300,
    temperature: 0.6,
  };
  try {
    const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method:"POST",
      headers:{"Content-Type":"application/json","Authorization":`Bearer ${API_KEY}`},
      body:JSON.stringify(body),
      signal:AbortSignal.timeout(20000)
    });
    if(!res.ok) return NextResponse.json({ok:false,text:`API error ${res.status}`},{status:500});
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content ?? "I couldn't generate a response.";
    return NextResponse.json({ok:true,text});
  } catch(e) {
    return NextResponse.json({ok:false,text:e instanceof Error?e.message:"Request failed"},{status:500});
  }
}
