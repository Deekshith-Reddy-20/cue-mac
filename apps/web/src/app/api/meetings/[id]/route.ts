import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/server/api-auth";
import { finalizeMeeting, getMeetingForUser, publicMeeting } from "@/lib/server/meetings";
import type { DbMeetingLine } from "@/lib/server/db";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireAuth(req);
  if (error || !session) return error;

  const { id } = await ctx.params;
  const stored = await getMeetingForUser(id, session.userId);
  if (!stored) {
    return NextResponse.json(
      { error: "Meeting not found" },
      { status: 404, headers: CORS_HEADERS },
    );
  }

  return NextResponse.json(
    { meeting: publicMeeting(stored, true) },
    { headers: CORS_HEADERS },
  );
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireAuth(req);
  if (error || !session) return error;

  const { id } = await ctx.params;
  const meeting = await getMeetingForUser(id, session.userId);
  if (!meeting) {
    return NextResponse.json(
      { error: "Meeting not found." },
      { status: 404, headers: CORS_HEADERS },
    );
  }

  const body = (await req.json().catch(() => null)) as
    | { durationSec?: number; transcript?: DbMeetingLine[]; summary?: string; end?: boolean }
    | null;

  if (body?.end !== false) {
    await finalizeMeeting(id, {
      durationSec: body?.durationSec,
      transcript: body?.transcript,
      summary: body?.summary,
    });
  }

  const fresh = await getMeetingForUser(id, session.userId);
  return NextResponse.json(
    { meeting: fresh ? publicMeeting(fresh, true) : null },
    { headers: CORS_HEADERS },
  );
}
