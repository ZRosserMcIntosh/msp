/**
 * POST /api/support/tickets
 *
 * Accepts a JSON payload from the SupportHotkey client component, stores the
 * screenshot in Supabase Storage, and inserts a row in `support.tickets`
 * (+ `support.screenshots`).
 *
 * The route works for both authenticated users (associates with their org/profile)
 * and unauthenticated callers (recorded with `requester_email = null`,
 * `org_id = NULL` would violate RLS so we 401 those for now).
 *
 * NOTE: requires Supabase Storage bucket `support-screenshots` to exist
 * (private; access via signed URLs only).
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";        // Buffer + Supabase admin
export const dynamic = "force-dynamic";

type Payload = {
  subject?: string;
  body?: string;
  priority?: "low" | "normal" | "high" | "urgent" | "critical";
  channel?: "hotkey" | "portal" | "email" | "sms" | "teams" | "phone" | "walkup" | "system";
  screenshotDataUrl?: string | null;
  context?: {
    url?: string;
    route?: string;
    userAgent?: string;
    viewport?: { w: number; h: number; dpr: number; os: string };
    consoleTail?: unknown[];
    referrer?: string | null;
    timestamp?: string;
  };
};

const SCREENSHOT_BUCKET = "support-screenshots";
const MAX_BODY_BYTES = 8 * 1024 * 1024; // 8 MB ceiling for payload

export async function POST(req: NextRequest) {
  const lengthHeader = req.headers.get("content-length");
  if (lengthHeader && Number(lengthHeader) > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  let payload: Payload;
  try {
    payload = (await req.json()) as Payload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const subject = (payload.subject ?? "").trim();
  if (!subject) {
    return NextResponse.json({ error: "Subject required" }, { status: 400 });
  }

  // Identify caller via cookie-based session.
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // For now, hotkey requires auth. Public help-form path can be added later.
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  // Resolve caller's profile/org (RLS enforces this anyway, but we need org_id for insert).
  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("id, org_id, email, full_name")
    .eq("id", user.id)
    .single();

  if (profileErr || !profile) {
    return NextResponse.json(
      { error: "Profile not found", detail: profileErr?.message },
      { status: 403 }
    );
  }

  const admin = createAdminClient();

  // 1. Insert ticket (admin client → bypasses RLS but we set org_id explicitly).
  const ticketInsert = {
    org_id: profile.org_id,
    requester_profile_id: profile.id,
    requester_email: profile.email,
    subject,
    body: payload.body ?? "",
    channel: payload.channel ?? "hotkey",
    priority: payload.priority ?? "normal",
    status: "new" as const,
    source_url: payload.context?.url ?? null,
    source_user_agent: payload.context?.userAgent ?? null,
    source_route: payload.context?.route ?? null,
    source_viewport: payload.context?.viewport ?? null,
    source_state: {
      referrer: payload.context?.referrer ?? null,
      timestamp: payload.context?.timestamp ?? null,
    },
    metadata: {
      consoleTail: payload.context?.consoleTail ?? [],
    },
  };

  const { data: ticket, error: ticketErr } = await admin
    .schema("support")
    .from("tickets")
    .insert(ticketInsert)
    .select("id, ticket_number, org_id")
    .single();

  if (ticketErr || !ticket) {
    return NextResponse.json(
      { error: "Failed to create ticket", detail: ticketErr?.message },
      { status: 500 }
    );
  }

  // 2. Upload screenshot if provided.
  let screenshotPath: string | null = null;
  if (payload.screenshotDataUrl?.startsWith("data:image/")) {
    try {
      const { mime, buffer } = decodeDataUrl(payload.screenshotDataUrl);
      const ext = mime === "image/jpeg" ? "jpg" : "png";
      const now = new Date();
      const yyyy = String(now.getUTCFullYear());
      const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
      const path = `${ticket.org_id}/${yyyy}/${mm}/${ticket.id}.${ext}`;

      const { error: upErr } = await admin.storage
        .from(SCREENSHOT_BUCKET)
        .upload(path, buffer, { contentType: mime, upsert: true });

      if (upErr) {
        console.error("[tickets] screenshot upload failed", upErr);
      } else {
        screenshotPath = `${SCREENSHOT_BUCKET}/${path}`;

        await admin
          .schema("support")
          .from("screenshots")
          .insert({
            ticket_id: ticket.id,
            storage_path: screenshotPath,
            mime_type: mime,
            width_px: payload.context?.viewport?.w ?? null,
            height_px: payload.context?.viewport?.h ?? null,
            device_pixel_ratio: payload.context?.viewport?.dpr ?? null,
            page_url: payload.context?.url ?? "",
            page_title: null,
            console_log: payload.context?.consoleTail ?? null,
          });
      }
    } catch (err) {
      console.error("[tickets] screenshot pipeline error", err);
      // Continue — ticket exists; screenshot is best-effort.
    }
  }

  // 3. Optional: write a starter message so the thread isn't empty.
  if (payload.body && payload.body.trim().length > 0) {
    await admin.schema("support").from("ticket_messages").insert({
      ticket_id: ticket.id,
      author_profile_id: profile.id,
      body: payload.body.trim(),
      channel: payload.channel ?? "hotkey",
    });
  }

  return NextResponse.json({
    ok: true,
    ticket_id: ticket.id,
    ticket_number: ticket.ticket_number,
    screenshot_path: screenshotPath,
  });
}

function decodeDataUrl(dataUrl: string): { mime: string; buffer: Buffer } {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match) throw new Error("Bad data URL");
  return { mime: match[1], buffer: Buffer.from(match[2], "base64") };
}
