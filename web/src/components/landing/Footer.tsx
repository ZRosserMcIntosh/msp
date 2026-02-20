"use client";

import { Shield } from "lucide-react";

const footerLinks = {
  Platform: [
    { label: "MSP Operations", href: "#msp-ops" },
    { label: "Real Estate Portal", href: "#real-estate" },
    { label: "Device Lifecycle", href: "#devices" },
    { label: "Document Vault", href: "#vault" },
    { label: "Integrations", href: "#integrations" },
  ],
  Resources: [
    { label: "Documentation", href: "#" },
    { label: "API Reference", href: "#" },
    { label: "Status Page", href: "#" },
    { label: "Changelog", href: "#" },
    { label: "Blog", href: "#" },
  ],
  Company: [
    { label: "About", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Contact", href: "#" },
    { label: "Partners", href: "#" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "Security", href: "#" },
    { label: "Compliance", href: "#" },
  ],
};

export default function Footer() {
  return (
    <footer className="border-t border-border bg-surface/20">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <a href="#" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center border border-accent/20">
                <Shield className="w-4 h-4 text-accent" />
              </div>
              <span className="text-lg font-semibold">
                <span className="text-accent">MSP</span>
              </span>
            </a>
            <p className="text-xs text-muted leading-relaxed mb-4">
              Enterprise-grade managed services and real estate operations
              platform. Multi-tenant. Auditable. Secure.
            </p>
            <div className="flex gap-3">
              {["X", "LI", "GH"].map((social) => (
                <a
                  key={social}
                  href="#"
                  className="w-8 h-8 rounded-lg bg-surface-light flex items-center justify-center text-xs text-muted hover:text-foreground hover:bg-surface-light/80 transition-colors"
                >
                  {social}
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-sm font-semibold mb-4">{category}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-xs text-muted hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="mt-16 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted">
            © {new Date().getFullYear()} MSP Platform. All rights reserved.
          </p>
          <p className="text-xs text-muted">
            Built with Next.js · Supabase · Stripe · Vercel
          </p>
        </div>
      </div>
    </footer>
  );
}
