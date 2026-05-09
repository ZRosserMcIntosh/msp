"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Shield,
  Monitor,
  Ticket,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Bell,
  Search,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { icon: BarChart3, label: "Overview", active: true },
  { icon: Monitor, label: "Devices" },
  { icon: Ticket, label: "Tickets" },
  { icon: Users, label: "Directory" },
  { icon: Shield, label: "Compliance" },
  { icon: Settings, label: "Settings" },
];

const stats = [
  { label: "Managed Devices", value: "—", sub: "Sync Intune to populate" },
  { label: "Open Tickets", value: "—", sub: "No tickets yet" },
  { label: "Active Users", value: "2", sub: "Founding admins" },
  { label: "Compliance Score", value: "—", sub: "Awaiting first scan" },
];

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ email?: string; user_metadata?: { full_name?: string } } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });
  }, []);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const displayName =
    user?.user_metadata?.full_name ?? user?.email ?? "Admin";

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-60 border-r border-border bg-surface/40 backdrop-blur-sm fixed inset-y-0 left-0 z-30">
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-accent" />
            </div>
            <span className="text-sm font-semibold">
              <span className="text-accent">MSP</span> Platform
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map((item) => (
            <button
              key={item.label}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                item.active
                  ? "bg-accent/10 text-accent font-medium"
                  : "text-muted hover:text-foreground hover:bg-surface-light/60"
              }`}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
            </button>
          ))}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
            <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold text-accent shrink-0">
              {displayName[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate">{displayName}</div>
              <div className="text-xs text-muted truncate">{user?.email}</div>
            </div>
            <button
              onClick={signOut}
              className="text-muted hover:text-foreground transition-colors"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 md:pl-60 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="h-16 border-b border-border flex items-center justify-between px-6 sticky top-0 bg-background/80 backdrop-blur-sm z-20">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <Search className="w-4 h-4 text-muted shrink-0" />
            <input
              placeholder="Search anything…"
              className="flex-1 bg-transparent text-sm placeholder:text-muted/50 outline-none"
            />
          </div>
          <div className="flex items-center gap-3">
            <button title="Notifications" className="relative text-muted hover:text-foreground transition-colors p-2">
              <Bell className="w-4 h-4" />
            </button>
            <button
              title="Sign out"
              onClick={signOut}
              className="md:hidden text-muted hover:text-foreground transition-colors p-2"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h1 className="text-2xl font-bold mb-1">
              Welcome back, {displayName.split(" ")[0]} 👋
            </h1>
            <p className="text-muted text-sm mb-8">
              MSP Platform is live. Run your Supabase migrations to unlock all features.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="glass rounded-xl p-5 border border-border"
                >
                  <div className="text-3xl font-bold mb-1">{stat.value}</div>
                  <div className="text-sm font-medium mb-0.5">{stat.label}</div>
                  <div className="text-xs text-muted">{stat.sub}</div>
                </motion.div>
              ))}
            </div>

            {/* Getting started checklist */}
            <div className="glass rounded-xl border border-border p-6">
              <h2 className="text-base font-semibold mb-4">Getting started</h2>
              <div className="space-y-3">
                {[
                  {
                    done: true,
                    label: "Push codebase to GitHub",
                    sub: "Vercel auto-deployed",
                  },
                  {
                    done: false,
                    label: "Run migrations 001–007 in Supabase SQL Editor",
                    sub: "Creates all schemas, tables & RLS",
                  },
                  {
                    done: false,
                    label: "Run seed.sql",
                    sub: "Creates platform org + your two admin accounts",
                  },
                  {
                    done: false,
                    label: "Create support-screenshots storage bucket",
                    sub: "Required for the Ctrl+/ support ticket screenshot feature",
                  },
                  {
                    done: false,
                    label: "Add SUPABASE_SERVICE_ROLE_KEY to Vercel env vars",
                    sub: "Needed for server-side ticket creation",
                  },
                  {
                    done: false,
                    label: "Register Microsoft Entra app for Graph API sync",
                    sub: "See docs/azure-graph-integration.md",
                  },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                        item.done
                          ? "border-green-500 bg-green-500/20"
                          : "border-border"
                      }`}
                    >
                      {item.done && (
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      )}
                    </div>
                    <div>
                      <div
                        className={`text-sm font-medium ${
                          item.done ? "line-through text-muted" : ""
                        }`}
                      >
                        {item.label}
                      </div>
                      <div className="text-xs text-muted">{item.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
