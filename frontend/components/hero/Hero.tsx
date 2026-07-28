"use client";

import Link from "next/link";
import {
  ImageIcon,
  Zap,
  BarChart3,
  Shield,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { motion, type Variants } from "motion/react";
import BlurText from "@/components/bits/BlurText";
import SpotlightCard from "@/components/bits/SpotlightCard";
import DecryptedText from "@/components/bits/DecryptedText";
import Magnet from "@/components/bits/Magnet";

/* ─── Data ─────────────────────────────────────────────────── */

const FEATURES = [
  {
    icon: ImageIcon,
    title: "Custom Image Datasets",
    description:
      "Upload your own images or capture directly from webcam to build powerful training datasets.",
  },
  {
    icon: Zap,
    title: "Fast Training",
    description:
      "Train accurate classification models in minutes with our optimized pipeline — no ML expertise required.",
  },
  {
    icon: BarChart3,
    title: "Real-time Preview",
    description:
      "Instantly preview your model's predictions via webcam or uploaded images with confidence scores.",
  },
  {
    icon: Shield,
    title: "Model Export",
    description:
      "Export trained models to Keras (.keras) or TensorFlow SavedModel ZIP packages for deployment.",
  },
];

const HIGHLIGHTS = [
  "Image Classification",
  "Dataset Preparation",
  "Model Training",
  "Live Preview",
  "TensorFlow Export",
];

const FAQ_ITEMS = [
  {
    q: "Do I need machine learning knowledge?",
    a: "No. ModelForge is designed for non-technical users. You only need to provide images organized by class.",
  },
  {
    q: "What image formats are supported?",
    a: "JPEG, PNG, and WebP images, as well as live webcam frames, are all supported and automatically preprocessed.",
  },
  {
    q: "Can I export the trained model?",
    a: "Yes — you can export your trained model directly as Keras (.keras) and TensorFlow SavedModel packages.",
  },
  {
    q: "Is my data stored on a server?",
    a: "Your dataset is processed securely with local model training and direct export capabilities.",
  },
];

/* ─── Motion Variants ───────────────────────────────────────── */

const stagger: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

const fadeRight: Variants = {
  hidden: { opacity: 0, x: 40 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

/* ─── Sparkle SVG ───────────────────────────────────────────── */

function Sparkle({
  size = 16,
  className = "",
  style = {},
}: {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      className={className}
      style={style}
    >
      <path
        d="M8 0 C8 0 8.5 5.5 8 8 C7.5 10.5 8 16 8 16 C8 16 7.5 10.5 8 8 C8.5 5.5 8 0 8 0Z"
        fill="#d9defc"
      />
      <path
        d="M0 8 C0 8 5.5 7.5 8 8 C10.5 8.5 16 8 16 8 C16 8 10.5 7.5 8 8 C5.5 8.5 0 8 0 8Z"
        fill="#d9defc"
      />
    </svg>
  );
}

/* ─── Section Stripe ────────────────────────────────────────── */

function SectionStripe() {
  return (
    <div className="flex w-full" style={{ height: "3px" }}>
      <motion.div
        className="flex-1"
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        style={{ backgroundColor: "#01fe93", flex: 1, transformOrigin: "left" }}
      />
      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
        style={{ backgroundColor: "#5f79ff", flex: 1, transformOrigin: "left" }}
      />
      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
        style={{ backgroundColor: "#000000", flex: 1, transformOrigin: "left" }}
      />
    </div>
  );
}

/* ─── Component ─────────────────────────────────────────────── */

export default function Hero() {
  return (
    <main>
      {/* ══════════════════════════════════════════════════════════
          HERO SECTION
      ══════════════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden"
        style={{
          backgroundColor: "#ffffff",
          paddingTop: "160px",   /* clears 96px floating nav + breathing room */
          paddingBottom: "100px",
        }}
      >
        {/* Subtle dot texture */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(circle, #d9defc 1px, transparent 1px)",
            backgroundSize: "32px 32px",
            opacity: 0.35,
          }}
        />

        {/* Floating sparkles */}
        <motion.div
          className="sparkle-float pointer-events-none absolute"
          style={{ top: "18%", left: "8%", opacity: 0.7 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <Sparkle size={22} />
        </motion.div>
        <motion.div
          className="sparkle-float-2 pointer-events-none absolute"
          style={{ top: "28%", right: "10%", opacity: 0.55 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.55 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          <Sparkle size={14} />
        </motion.div>
        <motion.div
          className="sparkle-float-3 pointer-events-none absolute"
          style={{ top: "55%", left: "4%", opacity: 0.5 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 1.2, duration: 0.6 }}
        >
          <Sparkle size={10} />
        </motion.div>
        <motion.div
          className="sparkle-float pointer-events-none absolute"
          style={{ bottom: "20%", right: "6%", opacity: 0.4 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 1.4, duration: 0.6 }}
        >
          <Sparkle size={18} />
        </motion.div>

        <div className="relative mx-auto max-w-[1200px] px-6">
          <div className="grid items-center gap-16 lg:grid-cols-2">

            {/* ── Left: Copy ── */}
            <motion.div variants={stagger} initial="hidden" animate="show">



              {/* Display headline — Cormorant Garamond 300 */}
              <motion.h1
                variants={fadeUp}
                style={{
                  fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
                  fontWeight: 300,
                  fontSize: "clamp(48px, 6vw, 72px)",
                  lineHeight: 0.95,
                  letterSpacing: "-1.44px",
                  color: "#000000",
                  marginBottom: "24px",
                }}
              >
                Build Image{" "}
                <br />
                Classification{" "}
                <br />
                Models{" "}
                <em style={{ fontStyle: "italic", color: "#5f79ff" }}>
                  with Ease
                </em>
              </motion.h1>

              {/* Description */}
              <motion.div variants={fadeUp} className="mb-6">
                <BlurText
                  text="A streamlined platform for preparing image classification models through dataset creation, training, live validation, and model export."
                  delay={50}
                  stepDuration={0.3}
                  className="max-w-[480px]"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "18px",
                    lineHeight: 1.6,
                    color: "#4d4d4d",
                  }}
                />
              </motion.div>

              {/* Highlight chips */}
              <motion.ul
                variants={stagger}
                className="mb-8 flex flex-wrap gap-2"
              >
                {HIGHLIGHTS.map((h) => (
                  <motion.li
                    key={h}
                    variants={fadeUp}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "12px",
                      fontWeight: 400,
                      color: "#4d4d4d",
                      backgroundColor: "#f5f5f5",
                      border: "1px solid #e5e7eb",
                      borderRadius: "100px",
                      padding: "4px 12px",
                    }}
                  >
                    <CheckCircle2
                      style={{ width: "11px", height: "11px", color: "#01fe93", flexShrink: 0 }}
                    />
                    {h}
                  </motion.li>
                ))}
              </motion.ul>

              {/* CTA row */}
              <motion.div
                variants={fadeUp}
                className="flex flex-wrap items-center gap-4"
              >
                <Link href="/new-project">
                  <Magnet magnetStrength={0.3}>
                    <button className="btn-violet" id="hero-get-started">
                      Get Started
                      <ArrowRight style={{ width: "15px", height: "15px" }} />
                    </button>
                  </Magnet>
                </Link>
                <a href="#about">
                  <button className="btn-ghost" id="hero-learn-more">
                    Learn More
                  </button>
                </a>
              </motion.div>
            </motion.div>

            {/* ── Right: Demo Card ── */}
            <motion.div
              variants={fadeRight}
              initial="hidden"
              animate="show"
              className="relative"
            >
              {/* Main demo card — flat, hairline border, no shadow */}
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #a6a6a6",
                  borderRadius: "16px",
                  padding: "24px",
                }}
              >
                {/* Card header */}
                <div className="mb-5 flex items-center justify-between">
                  <span
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "13px",
                      fontWeight: 400,
                      color: "#000000",
                    }}
                  >
                    Live Prediction
                  </span>
                  <span
                    className="flex items-center gap-1.5"
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "12px",
                      color: "#4d4d4d",
                    }}
                  >
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: "#01fe93" }} />
                      <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: "#01fe93" }} />
                    </span>
                    Live
                  </span>
                </div>

                {/* Live Prediction Image Container */}
                <div
                  className="mb-5 flex items-center justify-center overflow-hidden rounded-xl border border-slate-200"
                  style={{
                    height: "176px",
                    background: "#f5f2eb",
                  }}
                >
                  <img
                    src="/cat-sample.png"
                    alt="Cat Line Art Sample"
                    className="h-full w-full object-contain select-none mix-blend-multiply"
                  />
                </div>

                {/* Confidence bars */}
                {[
                  { label: "Cat", value: 87, color: "#5f79ff" },
                  { label: "Dog", value: 10, color: "#d9defc" },
                  { label: "Other", value: 3, color: "#f5f5f5" },
                ].map((p, i) => (
                  <div key={p.label} className="mb-3">
                    <div
                      className="mb-1 flex justify-between"
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: "12px",
                      }}
                    >
                      <span style={{ color: "#000000" }}>{p.label}</span>
                      <span style={{ color: "#9c9c9c" }}>{p.value}%</span>
                    </div>
                    <div
                      className="overflow-hidden"
                      style={{
                        height: "6px",
                        borderRadius: "100px",
                        backgroundColor: "#f5f5f5",
                      }}
                    >
                      <motion.div
                        style={{ height: "100%", borderRadius: "100px", backgroundColor: p.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${p.value}%` }}
                        transition={{
                          duration: 1.0,
                          delay: 0.6 + i * 0.15,
                          ease: [0.34, 1.2, 0.64, 1],
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Floating tooltip */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1, duration: 0.45 }}
                style={{
                  position: "absolute",
                  bottom: "-16px",
                  left: "-16px",
                  background: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                  padding: "10px 16px",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
                }}
              >
                <p
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "13px",
                    fontWeight: 400,
                    color: "#000000",
                    marginBottom: "2px",
                  }}
                >
                  87% Confident
                </p>
                <p
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "12px",
                    color: "#9c9c9c",
                  }}
                >
                  Top prediction: Cat
                </p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section Stripe 1 */}
      <SectionStripe />

      {/* ══════════════════════════════════════════════════════════
          FEATURES SECTION
      ══════════════════════════════════════════════════════════ */}
      <section
        id="about"
        style={{ backgroundColor: "#ffffff", paddingTop: "100px", paddingBottom: "100px" }}
      >
        <div className="mx-auto max-w-[1200px] px-6">

          {/* Editorial heading block */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
            className="mb-16 text-center"
          >
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "12px",
                fontWeight: 400,
                color: "#5f79ff",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                marginBottom: "12px",
              }}
            >
              Feature Overview
            </p>
            <h2
              style={{
                fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
                fontWeight: 300,
                fontSize: "clamp(36px, 4vw, 48px)",
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
                color: "#000000",
                marginBottom: "16px",
              }}
            >
              Everything you need to{" "}
              <em style={{ fontStyle: "italic", color: "#5f79ff" }}>
                build
              </em>
              ,{" "}
              <em style={{ fontStyle: "italic" }}>train</em>, and{" "}
              <em style={{ fontStyle: "italic", color: "#5f79ff" }}>export</em>
            </h2>
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "15px",
                color: "#4d4d4d",
                maxWidth: "520px",
                margin: "0 auto",
                lineHeight: 1.6,
              }}
            >
              Our platform creates an end-to-end workflow for image classification: dataset curation, model training, real-time preview, and export.
            </p>
          </motion.div>

          {/* 4-column feature cards */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: i * 0.08 }}
                  whileHover={{ y: -4 }}
                  style={{ borderRadius: "16px", overflow: "hidden" }}
                >
                  <SpotlightCard
                    spotlightColor="rgba(95, 121, 255, 0.05)"
                    style={{
                      height: "100%",
                      borderRadius: "16px",
                      border: "1px solid #e5e7eb",
                      backgroundColor: "#f5f5f5",
                      padding: "24px",
                      textAlign: "center",
                      transition: "border-color 0.2s ease",
                    }}
                    onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                      (e.currentTarget as HTMLDivElement).style.borderColor = "#5f79ff";
                    }}
                    onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                      (e.currentTarget as HTMLDivElement).style.borderColor = "#e5e7eb";
                    }}
                  >
                    {/* Icon */}
                    <div
                      className="mx-auto mb-5 flex items-center justify-center"
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "12px",
                        backgroundColor: "#d9defc",
                      }}
                    >
                      <Icon style={{ width: "22px", height: "22px", color: "#5f79ff" }} />
                    </div>

                    {/* Title with DecryptedText hover */}
                    <h3
                      className="mb-3 cursor-default"
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: "15px",
                        fontWeight: 400,
                        color: "#000000",
                        letterSpacing: "-0.017em",
                      }}
                    >
                      <DecryptedText
                        text={feature.title}
                        animateOn="hover"
                        speed={40}
                        maxIterations={6}
                        className="text-[#000000]"
                        encryptedClassName="text-[#a6a6a6]"
                      />
                    </h3>

                    <p
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: "13px",
                        lineHeight: 1.6,
                        color: "#4d4d4d",
                      }}
                    >
                      {feature.description}
                    </p>
                  </SpotlightCard>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section Stripe 2 */}
      <SectionStripe />

      {/* ══════════════════════════════════════════════════════════
          FAQ SECTION
      ══════════════════════════════════════════════════════════ */}
      <section
        id="faq"
        style={{ backgroundColor: "#ffffff", paddingTop: "100px", paddingBottom: "100px" }}
      >
        <div className="mx-auto max-w-[720px] px-6">

          {/* Editorial heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-14 text-center"
          >
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "12px",
                fontWeight: 400,
                color: "#5f79ff",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                marginBottom: "12px",
              }}
            >
              Questions
            </p>
            <h2
              style={{
                fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
                fontWeight: 300,
                fontSize: "clamp(32px, 4vw, 48px)",
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
                color: "#000000",
                marginBottom: "12px",
              }}
            >
              Frequently Asked Questions
            </h2>
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "15px",
                color: "#4d4d4d",
              }}
            >
              Everything you need to know about ModelForge.
            </p>
          </motion.div>

          {/* FAQ cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {FAQ_ITEMS.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                whileHover={{ x: 4 }}
                style={{
                  borderRadius: "16px",
                  border: "1px solid #e5e7eb",
                  backgroundColor: "#ffffff",
                  padding: "24px",
                  cursor: "default",
                  transition: "border-color 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "#5f79ff";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "#e5e7eb";
                }}
              >
                <h3
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "15px",
                    fontWeight: 400,
                    color: "#5f79ff",
                    marginBottom: "8px",
                    letterSpacing: "-0.017em",
                  }}
                >
                  {item.q}
                </h3>
                <p
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "13px",
                    lineHeight: 1.65,
                    color: "#4d4d4d",
                  }}
                >
                  {item.a}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section Stripe 3 */}
      <SectionStripe />

      {/* ══════════════════════════════════════════════════════════
          CTA BANNER
      ══════════════════════════════════════════════════════════ */}
      <section
        style={{
          backgroundColor: "#ffffff",
          paddingTop: "100px",
          paddingBottom: "100px",
        }}
      >
        <div className="mx-auto max-w-[1200px] px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            style={{
              textAlign: "center",
              border: "1px solid #e5e7eb",
              borderRadius: "16px",
              padding: "80px 40px",
              backgroundColor: "#f5f5f5",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Background sparkles */}
            <div
              className="sparkle-float pointer-events-none absolute"
              style={{ top: "20%", left: "6%", opacity: 0.5 }}
            >
              <Sparkle size={24} />
            </div>
            <div
              className="sparkle-float-2 pointer-events-none absolute"
              style={{ bottom: "25%", right: "8%", opacity: 0.4 }}
            >
              <Sparkle size={16} />
            </div>
            <div
              className="sparkle-float-3 pointer-events-none absolute"
              style={{ top: "15%", right: "15%", opacity: 0.35 }}
            >
              <Sparkle size={12} />
            </div>

            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "12px",
                fontWeight: 400,
                color: "#5f79ff",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                marginBottom: "16px",
              }}
            >
              Get Started
            </p>

            <h2
              style={{
                fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
                fontWeight: 300,
                fontSize: "clamp(40px, 5vw, 64px)",
                lineHeight: 0.95,
                letterSpacing: "-1.44px",
                color: "#000000",
                marginBottom: "20px",
              }}
            >
              Ready to build your{" "}
              <em style={{ fontStyle: "italic", color: "#5f79ff" }}>
                first model?
              </em>
            </h2>

            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "18px",
                color: "#4d4d4d",
                marginBottom: "40px",
                maxWidth: "480px",
                margin: "0 auto 40px auto",
                lineHeight: 1.6,
              }}
            >
              Start by creating a new project and uploading your images.
            </p>

            <Link href="/new-project">
              <Magnet magnetStrength={0.25}>
                <button
                  className="btn-violet"
                  id="cta-get-started"
                  style={{ fontSize: "15px", padding: "12px 28px" }}
                >
                  Create Your First Project
                  <ArrowRight style={{ width: "16px", height: "16px" }} />
                </button>
              </Magnet>
            </Link>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
