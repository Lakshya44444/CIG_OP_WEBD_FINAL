"use client";

import Link from "next/link";
import React, { useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform, useInView, AnimatePresence } from "framer-motion";
import {
  Camera, Sparkles, Shield, Upload, Search,
  ArrowRight, Globe, Heart, Play, Tag, Bell,
  ChevronDown, Star, Users,
} from "lucide-react";

// ─── Animated counter ────────────────────────────────────────────────────────
function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 1800;
    const step = (to / duration) * 16;
    const timer = setInterval(() => {
      start += step;
      if (start >= to) { setCount(to); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [inView, to]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

// ─── Reveal on scroll ────────────────────────────────────────────────────────
function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── 3D Tilt card ────────────────────────────────────────────────────────────
function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState({});

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current!;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width - 0.5) * 20;
    const y = ((e.clientY - r.top) / r.height - 0.5) * -20;
    setStyle({ transform: `perspective(700px) rotateX(${y}deg) rotateY(${x}deg) scale(1.03)`, transition: "transform 0.1s" });
  }
  function onLeave() { setStyle({ transform: "perspective(700px) rotateX(0) rotateY(0) scale(1)", transition: "transform 0.5s" }); }

  return (
    <div ref={ref} style={style} onMouseMove={onMove} onMouseLeave={onLeave} className={className}>
      {children}
    </div>
  );
}

// ─── Photo strip images ───────────────────────────────────────────────────────
const STRIP = [
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=400&h=300&fit=crop",
];

// ─── Features with real images ───────────────────────────────────────────────
const FEATURES = [
  {
    icon: Upload, title: "Bulk Upload",
    desc: "Drag-and-drop up to 50 photos at once with instant cloud compression.",
    color: "#0066FF",
    img: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&h=300&fit=crop",
  },
  {
    icon: Sparkles, title: "AI Auto-Tagging",
    desc: "Cloudinary Vision detects faces, scenes and objects — tags applied automatically.",
    color: "#FFD700",
    img: "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=500&h=300&fit=crop",
  },
  {
    icon: Search, title: "Face Search",
    desc: "Upload a selfie. Find every photo of yourself across all events instantly.",
    color: "#00CC44",
    img: "https://images.unsplash.com/photo-1536104968055-4d61aa56f46a?w=500&h=300&fit=crop",
  },
  {
    icon: Shield, title: "Role Access",
    desc: "Admin · Photographer · Member · Viewer — fine-grained access control.",
    color: "#10B981",
    img: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=500&h=300&fit=crop",
  },
  {
    icon: Bell, title: "Live Notifications",
    desc: "Instant alerts via Pusher when someone likes, comments or tags you.",
    color: "#FFC107",
    img: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=500&h=300&fit=crop",
  },
  {
    icon: Tag, title: "Smart Search",
    desc: "Search by tag, event name, uploader name or upload date.",
    color: "#0052CC",
    img: "https://images.unsplash.com/photo-1555421689-d68471e189f2?w=500&h=300&fit=crop",
  },
];

// ─── Main page ────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "40%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">

      {/* ── NAV ── */}
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-xl"
      >
        <div className="mx-auto max-w-7xl px-5 flex h-16 items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* App icon style — iOS-like rounded square with gradient */}
            <div className="relative h-9 w-9 rounded-[10px] overflow-hidden shadow-lg shadow-violet-500/30">
              <div className="absolute inset-0 bg-linear-to-br from-violet-500 via-blue-500 to-cyan-400" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Camera className="h-5 w-5 text-white drop-shadow" />
              </div>
            </div>
            <span className="text-xl font-black tracking-tight text-gray-900">Pixora</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-600">
            <a href="#features" className="hover:text-gray-900 transition-colors">Features</a>
            <a href="#how" className="hover:text-gray-900 transition-colors">How it works</a>
            <a href="#stats" className="hover:text-gray-900 transition-colors">Stats</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Sign in</Link>
            <Link href="/register" className="rounded-xl bg-linear-to-r from-blue-500 to-cyan-500 px-5 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity shadow-lg shadow-blue-500/20">
              Get Started
            </Link>
          </div>
        </div>
      </motion.header>

      {/* ── HERO ── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white">
        {/* Animated background blobs */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, 15, 0] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-blue-600/20 blur-[120px]" />
          <motion.div animate={{ scale: [1.2, 1, 1.2], rotate: [0, -15, 0] }} transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-20 right-0 h-80 w-80 rounded-full bg-violet-600/25 blur-[100px]" />
          <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-20 left-1/4 h-64 w-64 rounded-full bg-pink-600/15 blur-[90px]" />
          {/* Grid overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
        </div>

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-10 mx-auto max-w-5xl px-5 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl sm:text-6xl lg:text-8xl font-black tracking-tight leading-[0.95] mb-6 text-gray-900"
          >
            Every moment
            <br />
            <span className="bg-linear-to-r from-blue-400 via-yellow-300 to-emerald-400 bg-clip-text text-transparent">
              beautifully saved.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-10"
          >
            The complete event media platform for clubs — upload, organise, tag with AI,
            find yourself with facial recognition, and share in real time.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/register" className="group flex items-center gap-2.5 rounded-2xl bg-linear-to-r from-blue-500 via-blue-600 to-cyan-500 px-8 py-4 text-base font-bold text-white shadow-2xl shadow-blue-500/40 hover:shadow-blue-500/60 hover:-translate-y-1 transition-all duration-300">
              Start for free
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/gallery" className="flex items-center gap-2.5 rounded-2xl border border-gray-200 bg-gray-50 px-8 py-4 text-base font-semibold text-gray-700 hover:bg-gray-100 hover:-translate-y-1 transition-all duration-300 backdrop-blur-sm">
              <Play className="h-4 w-4 fill-white/60 text-white/60" /> Browse Gallery
            </Link>
          </motion.div>

          {/* Scroll hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-gray-400 text-xs"
          >
            <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
              <ChevronDown className="h-5 w-5" />
            </motion.div>
            Scroll to explore
          </motion.div>
        </motion.div>
      </section>

      {/* ── PHOTO STRIP (auto-scroll) ── */}
      <section className="relative py-6 overflow-hidden border-y border-gray-200 bg-gray-50">
        <div className="absolute inset-y-0 left-0 w-32 bg-linear-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-32 bg-linear-to-l from-white to-transparent z-10 pointer-events-none" />
        <motion.div
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="flex gap-4"
          style={{ width: "max-content" }}
        >
          {[...STRIP, ...STRIP].map((src, i) => (
            <div key={i} className="w-56 h-36 rounded-2xl overflow-hidden shrink-0 border border-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── STATS ── */}
      <section id="stats" className="py-24 relative">
        <div className="mx-auto max-w-5xl px-5">
          <Reveal className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {[
              { n: 10000000, s: "+", label: "Photos Stored", icon: Camera },
              { n: 50000, s: "+", label: "Events Created", icon: Globe },
              { n: 200000, s: "+", label: "Club Members", icon: Users },
              { n: 1000000000, s: "+", label: "AI Tags Generated", icon: Sparkles },
            ].map(({ n, s, label, icon: Icon }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                className="rounded-2xl border border-gray-200 bg-gray-50 p-6 text-center backdrop-blur-sm hover:border-gray-300 hover:bg-gray-100 transition-all group"
              >
                <Icon className="h-6 w-6 mx-auto mb-3 text-blue-400 group-hover:scale-110 transition-transform" />
                <div className="text-3xl font-black bg-linear-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                  <Counter to={n} suffix={s} />
                </div>
                <p className="text-gray-600 text-sm mt-1">{label}</p>
              </motion.div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 relative">
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-violet-950/10 to-transparent pointer-events-none" />
        <div className="mx-auto max-w-7xl px-5">
          <Reveal className="text-center mb-16">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest mb-3">Features</p>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-gray-900">
              Everything your club needs,
              <br />
              <span className="bg-linear-to-r from-blue-500 to-emerald-500 bg-clip-text text-transparent">
                all in one place.
              </span>
            </h2>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc, color, img }, i) => (
              <Reveal key={title} delay={i * 0.08}>
                <TiltCard className="h-full">
                  <div className="h-full rounded-2xl border border-gray-200 overflow-hidden backdrop-blur-sm hover:border-gray-300 transition-all cursor-default group bg-white">
                    {/* Photo on top */}
                    <div className="relative h-44 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img}
                        alt={title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      {/* Dark gradient overlay */}
                      <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
                      {/* Icon badge on top-left */}
                      <div
                        className="absolute top-3 left-3 flex h-9 w-9 items-center justify-center rounded-xl shadow-lg"
                        style={{ backgroundColor: color + "dd", boxShadow: `0 4px 20px ${color}60` }}
                      >
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      {/* Title on image */}
                      <h3 className="absolute bottom-3 left-4 text-base font-bold text-white drop-shadow">{title}</h3>
                    </div>
                    {/* Description below */}
                    <div className="p-4">
                      <p className="text-gray-700 text-sm leading-relaxed">{desc}</p>
                    </div>
                  </div>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="py-24">
        <div className="mx-auto max-w-5xl px-5">
          <Reveal className="text-center mb-16">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest mb-3">How it works</p>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-gray-900">
              Up and running in
              <span className="bg-linear-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent"> 3 steps.</span>
            </h2>
          </Reveal>

          <div className="relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-16 left-[calc(16.67%+28px)] right-[calc(16.67%+28px)] h-px bg-linear-to-r from-blue-400 via-emerald-400 to-cyan-400" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  n: "01", color: "from-blue-500 to-cyan-500",
                  title: "Create Event", desc: "Set up your event with name, date, and category in seconds.",
                  img: "https://images.unsplash.com/photo-1552581234-26160f608093?w=400&h=250&fit=crop",
                },
                {
                  n: "02", color: "from-violet-500 to-purple-500",
                  title: "Upload Media", desc: "Drag & drop photos and videos. AI tags and compresses everything.",
                  img: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=250&fit=crop",
                },
                {
                  n: "03", color: "from-pink-500 to-rose-500",
                  title: "Share & Discover", desc: "Members find their photos with face recognition. Share via QR.",
                  img: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=400&h=250&fit=crop",
                },
              ].map(({ n, color, title, desc, img }, i) => (
                <Reveal key={n} delay={i * 0.15}>
                  <div className="flex flex-col items-center text-center group">
                    <div className={`relative z-10 h-14 w-14 rounded-2xl bg-linear-to-br ${color} flex items-center justify-center text-lg font-black text-white shadow-xl mb-6 group-hover:scale-110 transition-transform`}>
                      {n}
                    </div>
                    <div className="rounded-2xl overflow-hidden border border-gray-200 mb-5 w-full shadow-xl group-hover:border-gray-300 transition-all">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img} alt={title} className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF ── */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-blue-950/20 to-transparent pointer-events-none" />
        <div className="mx-auto max-w-5xl px-5">
          <Reveal className="text-center mb-12">
            <h2 className="text-4xl font-black text-gray-900">
              Built for <span className="bg-linear-to-r from-blue-500 to-emerald-500 bg-clip-text text-transparent">every club.</span>
            </h2>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { emoji: "📸", club: "Photography Club", quote: "Finally one place for all our event photos. The AI tagging saves us hours." },
              { emoji: "🏆", club: "Sports Committee", quote: "Love how members can find their own photos using the face recognition feature." },
              { emoji: "🎭", club: "Cultural Society", quote: "The watermarked downloads and QR sharing made our fest coverage professional." },
            ].map(({ emoji, club, quote }, i) => (
              <Reveal key={club} delay={i * 0.1}>
                <TiltCard>
                  <div className="h-full rounded-2xl border border-gray-200 bg-gray-50 p-6 backdrop-blur-sm hover:border-gray-300 hover:bg-gray-100 transition-all">
                    <div className="text-3xl mb-4">{emoji}</div>
                    <p className="text-gray-700 text-sm leading-relaxed mb-5">"{quote}"</p>
                    <div className="flex items-center gap-1 mb-1">
                      {[...Array(5)].map((_, i) => <Star key={i} className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />)}
                    </div>
                    <p className="text-gray-600 text-xs font-medium">{club}</p>
                  </div>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-5">
        <Reveal>
          <div className="mx-auto max-w-3xl rounded-3xl overflow-hidden relative">
            {/* Gradient background */}
            <div className="absolute inset-0 bg-linear-to-br from-blue-600 via-violet-600 to-pink-600" />
            {/* Noise texture overlay */}
            <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWx0ZXI9InVybCgjYSkiIG9wYWNpdHk9IjAuMDUiLz48L3N2Zz4=')]" />
            {/* Background photo */}
            <div className="absolute inset-0 opacity-10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=900&h=500&fit=crop" alt="" className="w-full h-full object-cover" />
            </div>

            <div className="relative z-10 p-12 text-center">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="text-5xl mb-5 inline-block"
              >
                ✨
              </motion.div>
              <h2 className="text-4xl sm:text-5xl font-black text-white mb-4 tracking-tight">
                Ready to get started?
              </h2>
              <p className="text-white/80 text-lg mb-8 max-w-lg mx-auto">
                Free forever. No credit card. Setup in 2 minutes.
              </p>
              <Link
                href="/register"
                className="inline-flex items-center gap-2.5 rounded-2xl bg-white px-8 py-4 text-base font-bold text-violet-700 hover:bg-white/90 hover:-translate-y-1 transition-all shadow-2xl shadow-black/20"
              >
                Create your account
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-gray-200 py-10 px-5 bg-gray-50">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="relative h-7 w-7 rounded-lg overflow-hidden">
              <div className="absolute inset-0 bg-linear-to-br from-violet-500 via-blue-500 to-cyan-400" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Camera className="h-4 w-4 text-white" />
              </div>
            </div>
            <span className="font-black text-gray-900">Pixora</span>
            <span className="text-gray-500 text-sm">© 2024</span>
          </div>
          <div className="flex gap-6 text-sm text-gray-600">
            <Link href="/login" className="hover:text-gray-900 transition-colors">Login</Link>
            <Link href="/register" className="hover:text-gray-900 transition-colors">Register</Link>
            <Link href="/gallery" className="hover:text-gray-900 transition-colors">Gallery</Link>
            <Link href="/events" className="hover:text-gray-900 transition-colors">Events</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
