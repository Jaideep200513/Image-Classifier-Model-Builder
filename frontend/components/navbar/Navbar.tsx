"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { History } from "lucide-react";
import HistoryModal from "@/components/history-modal/HistoryModal";

const NAV_LINKS = [
  { label: "About", href: "#about" },
  { label: "FAQ", href: "#faq" },
];

export default function Navbar() {
  const pathname = usePathname();
  const isWorkspace = pathname === "/workspace";
  const isNewProject = pathname === "/new-project";
  const isHistory = pathname === "/history";

  return (
    <>
      {/* Floating pill nav — positioned absolute so it overlays the hero */}
      <div className="fixed top-0 left-0 right-0 z-50 flex justify-center px-6 pt-6">
        <motion.header
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            boxShadow: "rgba(0, 0, 0, 0.1) 0px 0px 48px 0px",
            border: "1px solid #f0f0f0",
            maxWidth: "1200px",
            width: "100%",
          }}
        >
          <div className="flex h-14 items-center justify-between px-5">
            {/* Logo lockup */}
            <Link
              href="/"
              onClick={(e) => {
                if (pathname === "/") {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
              className="flex items-center gap-2 group cursor-pointer"
              aria-label="ModelForge Home"
            >
              {/* Concentric ring icon mark */}
              <div
                className="flex h-8 w-8 items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
                style={{
                  borderRadius: "50%",
                  background: "#5f79ff",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <circle cx="8" cy="8" r="7" stroke="white" strokeWidth="1.5" fill="none"/>
                  <circle cx="8" cy="8" r="4" stroke="white" strokeWidth="1.5" fill="none"/>
                  <circle cx="8" cy="8" r="1.5" fill="white"/>
                </svg>
              </div>
              <span
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 700,
                  fontSize: "18px",
                  color: "#000000",
                  letterSpacing: "-0.017em",
                }}
              >
                ModelForge
              </span>
            </Link>

            {/* Center nav links (hidden on workspace, new-project & history) */}
            {!isWorkspace && !isNewProject && !isHistory && (
              <nav
                className="hidden items-center gap-1 md:flex"
                aria-label="Main navigation"
              >
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "16px",
                      fontWeight: 500,
                      color: "#000000",
                      padding: "6px 14px",
                      borderRadius: "8px",
                      textDecoration: "none",
                      transition: "color 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.color = "#5f79ff";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.color = "#000000";
                    }}
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
            )}

            {/* Right CTA */}
            <div className="flex items-center gap-3">
              {!isHistory && (
                <Link href="/history">
                  <button
                    className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-gray-700 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition-colors border border-gray-200 hover:border-violet-200"
                    id="nav-history-btn"
                    title="View project history"
                  >
                    <History className="h-4 w-4 text-violet-600" />
                    History
                  </button>
                </Link>
              )}


              {isWorkspace ? (
                <Link href="/new-project">
                  <button
                    className="btn-violet"
                    id="workspace-new-project-btn"
                    style={{ fontSize: "15px", padding: "9px 18px" }}
                  >
                    New Project
                  </button>
                </Link>
              ) : isNewProject ? null : (
                <Link href="/new-project">
                  <button
                    className="btn-violet"
                    id="hero-get-started-nav"
                    style={{ fontSize: "15px", padding: "9px 18px" }}
                  >
                    Get Started →
                  </button>
                </Link>
              )}
            </div>
          </div>
        </motion.header>
      </div>
    </>
  );
}


