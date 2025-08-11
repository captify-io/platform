import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { sessionId } = await req.json();

    // TODO: Add any server-side state clearing here (e.g., KV store, cache, Bedrock session APIs, tool state, etc.)
    // Example: await kv.del(`chat:${sessionId}`)

    return NextResponse.json({ ok: true, sessionId });
  } catch (err) {
    console.error("/api/chat/reset error", err);
    return NextResponse.json(
      { ok: false, error: "RESET_FAILED" },
      { status: 500 }
    );
  }
}
