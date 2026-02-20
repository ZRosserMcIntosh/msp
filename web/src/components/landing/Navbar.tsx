"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  Shield,
  ChevronDown,
} from "lucide-react";

const navLinks = [
  {
    label: "Platform",
    href: "#platform",
    children: [
      { label: "MSP Operations", href: "#msp-ops" },
      { label: "Real Estate Portal", href: "#real-estate" },
      { label: "Device Lifecycle", href: "#devices" },
      { label: "Document Vault", href: "#vault" },
    ],
  },
  { label: "Features", href: "#features" },
  { label: "Integrations", href: "#integrations" },
  { label: "Security", href: "#security" },
  { label: "Pricing", href: "#pricing" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdown, setDropdown] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <motion.nav
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-background/80 backdrop-blur-xl border-b border-border"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2.5 group">
            <div className="relative">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center border border-accent/20 group-hover:border-accent/40 transition-colors">
                <Shield className="w-4 h-4 text-accent" />
              </div>
            </div>
            <span className="text-lg font-semibold tracking-tight">
              <span className="text-accent">MSP</span>
            </span>
          </a>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <div
                key={link.label}
                className="relative"
                onMouseEnter={() =>
                  link.children ? setDropdown(link.label) : undefined
                }
                onMouseLeave={() => setDropdown(null)}
              >
                <a
                  href={link.href}
                  className="flex items-center gap-1 px-3 py-2 text-sm text-muted hover:text-foreground transition-colors rounded-lg hover:bg-surface-light/50"
                >
                  {link.label}
                  {link.children && (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </a>

                {/* Dropdown */}
                <AnimatePresence>
                  {link.children && dropdown === link.label && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-0 mt-1 w-56 bg-surface border border-border rounded-xl p-2 shadow-2xl"
                    >
                      {link.children.map((child) => (
                        <a
                          key={child.label}
                          href={child.href}
                          className="block px-3 py-2 text-sm text-muted hover:text-foreground hover:bg-surface-light rounded-lg transition-colors"
                        >
                          {child.label}
                        </a>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <a
              href="#"
              className="text-sm text-muted hover:text-foreground transition-colors px-3 py-2"
            >
              Sign In
            </a>
            <a
              href="#"
              className="text-sm font-medium bg-accent hover:bg-accent-light text-white px-4 py-2 rounded-lg transition-all hover:shadow-lg hover:shadow-accent/20"
            >
              Get Started
            </a>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-muted hover:text-foreground"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-background/95 backdrop-blur-xl pt-20"
          >
            <div className="flex flex-col items-center gap-4 p-6">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-lg text-muted hover:text-foreground transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <div className="h-px w-full max-w-xs bg-border my-2" />
              <a
                href="#"
                className="text-lg text-muted hover:text-foreground transition-colors"
              >
                Sign In
              </a>
              <a
                href="#"
                className="text-sm font-medium bg-accent hover:bg-accent-light text-white px-6 py-3 rounded-lg transition-all"
              >
                Get Started
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
