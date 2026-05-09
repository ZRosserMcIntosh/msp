"use client";

/**
 * SupportHotkey
 * ─────────────
 * Global keyboard listener for ⌘/Ctrl + / that opens a "Report an issue" modal,
 * captures a viewport screenshot via html2canvas, and POSTs a ticket to
 * `/api/support/tickets`.
 *
 * Mount once in the root layout (inside `<body>`).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";

type HotkeyState = "idle" | "capturing" | "open" | "submitting" | "success" | "error";

const MAX_CONSOLE_ENTRIES = 50;

// Tap into console to keep a ring buffer for ticket context.
const consoleBuffer: { level: string; ts: string; args: unknown[] }[] = [];
if (typeof window !== "undefined" && !(window as unknown as { __mspConsoleHooked?: boolean }).__mspConsoleHooked) {
  (window as unknown as { __mspConsoleHooked?: boolean }).__mspConsoleHooked = true;
  (["log", "info", "warn", "error", "debug"] as const).forEach((level) => {
    const orig = console[level].bind(console);
    console[level] = (...args: unknown[]) => {
      consoleBuffer.push({ level, ts: new Date().toISOString(), args });
      if (consoleBuffer.length > MAX_CONSOLE_ENTRIES) consoleBuffer.shift();
      orig(...args);
    };
  });
}

export function SupportHotkey() {
  const [state, setState] = useState<HotkeyState>("idle");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [priority, setPriority] = useState<"low" | "normal" | "high" | "urgent">("normal");
  const [screenshotDataUrl, setScreenshotDataUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [ticketNumber, setTicketNumber] = useState<number | null>(null);
  const subjectInputRef = useRef<HTMLInputElement>(null);

  /* ─────────────  Capture screenshot  ───────────── */
  const captureScreenshot = useCallback(async () => {
    setState("capturing");
    try {
      const canvas = await html2canvas(document.body, {
        useCORS: true,
        logging: false,
        // Capture only the visible viewport for speed + privacy of off-screen content.
        x: window.scrollX,
        y: window.scrollY,
        width: window.innerWidth,
        height: window.innerHeight,
        windowWidth: document.documentElement.scrollWidth,
        windowHeight: document.documentElement.scrollHeight,
      });
      const dataUrl = canvas.toDataURL("image/png");
      setScreenshotDataUrl(dataUrl);
      setState("open");
    } catch (err) {
      console.warn("[support-hotkey] screenshot failed", err);
      // Open the modal anyway — user can still file the ticket without a shot.
      setScreenshotDataUrl(null);
      setState("open");
    }
  }, []);

  /* ─────────────  Keyboard listener  ───────────── */
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const isSlash = e.key === "/" || e.code === "Slash";
      const modifier = e.metaKey || e.ctrlKey;
      if (!isSlash || !modifier) return;

      // Don't hijack if user is typing "/" inside an input/textarea/contenteditable.
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || target?.isContentEditable) return;

      e.preventDefault();
      if (state !== "idle" && state !== "success" && state !== "error") return;
      void captureScreenshot();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [state, captureScreenshot]);

  /* ─────────────  Focus subject when modal opens  ───────────── */
  useEffect(() => {
    if (state === "open") {
      const t = setTimeout(() => subjectInputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [state]);

  /* ─────────────  Reset form when closed  ───────────── */
  function close() {
    setState("idle");
    setSubject("");
    setBody("");
    setPriority("normal");
    setScreenshotDataUrl(null);
    setErrorMsg(null);
    setTicketNumber(null);
  }

  /* ─────────────  Submit  ───────────── */
  async function submit() {
    if (!subject.trim()) {
      setErrorMsg("Please add a short subject.");
      return;
    }
    setState("submitting");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject.trim(),
          body: body.trim(),
          priority,
          channel: "hotkey",
          screenshotDataUrl,
          context: {
            url: window.location.href,
            route: window.location.pathname,
            userAgent: navigator.userAgent,
            viewport: {
              w: window.innerWidth,
              h: window.innerHeight,
              dpr: window.devicePixelRatio,
              os: detectOS(),
            },
            consoleTail: consoleBuffer.slice(-MAX_CONSOLE_ENTRIES),
            referrer: document.referrer || null,
            timestamp: new Date().toISOString(),
          },
        }),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`HTTP ${res.status}: ${txt.slice(0, 200)}`);
      }
      const data = (await res.json()) as { ticket_number?: number };
      setTicketNumber(data.ticket_number ?? null);
      setState("success");
    } catch (err) {
      console.error("[support-hotkey] submit failed", err);
      setErrorMsg(err instanceof Error ? err.message : "Submit failed");
      setState("error");
    }
  }

  /* ─────────────  Render  ───────────── */
  if (state === "idle" || state === "capturing") {
    return state === "capturing" ? (
      <div
        className="fixed inset-0 z-9998 flex items-center justify-center bg-black/30 backdrop-blur-sm pointer-events-none"
        aria-hidden
      >
        <div className="rounded-md bg-zinc-900/90 px-4 py-2 text-sm text-white shadow-lg">
          Capturing screenshot…
        </div>
      </div>
    ) : null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Report an issue"
      className="fixed inset-0 z-9999 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
      onKeyDown={(e) => {
        if (e.key === "Escape") close();
      }}
    >
      <div className="w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl bg-zinc-950 text-zinc-100 shadow-2xl border border-zinc-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
            <h2 className="text-sm font-medium">
              {state === "success" ? "Ticket submitted" : "Report an issue"}
            </h2>
          </div>
          <button
            onClick={close}
            className="text-zinc-500 hover:text-zinc-200 text-sm"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Success state */}
        {state === "success" ? (
          <div className="p-6 text-sm space-y-3">
            <p className="text-emerald-400 font-medium">
              Thanks — we got it.
              {ticketNumber != null && (
                <span className="ml-1 text-zinc-300">
                  Reference: <code className="font-mono">#{ticketNumber}</code>
                </span>
              )}
            </p>
            <p className="text-zinc-400">
              You&apos;ll get an email when our team picks it up.
            </p>
            <div className="pt-2">
              <button
                onClick={close}
                className="rounded-md bg-zinc-800 hover:bg-zinc-700 px-4 py-2 text-sm"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Form body */}
            <div className="p-5 grid gap-4 sm:grid-cols-[1fr_240px]">
              <div className="space-y-3">
                <label className="block">
                  <span className="text-xs text-zinc-400">Subject</span>
                  <input
                    ref={subjectInputRef}
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Briefly: what went wrong?"
                    className="mt-1 w-full rounded-md bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm focus:border-zinc-600 focus:outline-none"
                  />
                </label>

                <label className="block">
                  <span className="text-xs text-zinc-400">Details (optional)</span>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={5}
                    placeholder="Steps to reproduce, what you expected, anything else…"
                    className="mt-1 w-full rounded-md bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm focus:border-zinc-600 focus:outline-none"
                  />
                </label>

                <label className="block">
                  <span className="text-xs text-zinc-400">Priority</span>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as typeof priority)}
                    className="mt-1 w-full rounded-md bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </label>

                <p className="text-[11px] leading-relaxed text-zinc-500">
                  We&apos;ll attach this page&apos;s URL, a screenshot of what you&apos;re seeing,
                  your browser info, and the last {MAX_CONSOLE_ENTRIES} console messages so support
                  can debug without back-and-forth.
                </p>
              </div>

              {/* Screenshot preview */}
              <div className="rounded-md border border-zinc-800 bg-zinc-900 overflow-hidden">
                {screenshotDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={screenshotDataUrl}
                    alt="Screenshot preview"
                    className="block w-full h-auto"
                  />
                ) : (
                  <div className="aspect-16/10 flex items-center justify-center text-xs text-zinc-500 px-3 text-center">
                    No screenshot captured.
                    <br />
                    The ticket will still be filed.
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-zinc-800 bg-zinc-950/60">
              <div className="text-[11px] text-zinc-500 hidden sm:block">
                Tip: press{" "}
                <kbd className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-300">
                  {typeof navigator !== "undefined" && navigator.platform.includes("Mac") ? "⌘" : "Ctrl"} + /
                </kbd>{" "}
                anywhere to open this.
              </div>
              <div className="flex items-center gap-2 ml-auto">
                {errorMsg && (
                  <span className="text-xs text-red-400 mr-2">{errorMsg}</span>
                )}
                <button
                  onClick={close}
                  className="rounded-md bg-transparent hover:bg-zinc-800 border border-zinc-800 px-3 py-2 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={submit}
                  disabled={state === "submitting"}
                  className="rounded-md bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 px-4 py-2 text-sm text-zinc-950 font-medium"
                >
                  {state === "submitting" ? "Sending…" : "Submit ticket"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function detectOS(): string {
  if (typeof navigator === "undefined") return "unknown";
  const p = navigator.platform || "";
  const ua = navigator.userAgent || "";
  if (/Mac/i.test(p)) return "macOS";
  if (/Win/i.test(p)) return "Windows";
  if (/Linux/i.test(p)) return "Linux";
  if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
  if (/Android/i.test(ua)) return "Android";
  return p || "unknown";
}
