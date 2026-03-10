"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, useInView, useScroll, useTransform, AnimatePresence } from "framer-motion";
import {
  Zap, Shield, Globe, Code2, ArrowRight, CheckCircle2, ChevronRight,
  Wallet, Activity, Terminal, Lock, ArrowUpRight, RefreshCw, Copy,
  Plus, CreditCard, BarChart3, Clock, Menu, X, BookOpen,
  GitBranch, Eye, FileCode, Gauge, Send, Database, Webhook,
} from "lucide-react";

/* ─── helpers ─── */
const ease = [0.23, 1, 0.32, 1] as const;

function useCounter(end: number, dur = 2200) {
  const [n, setN] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const vis = useInView(ref, { once: true, margin: "-80px" });
  const ran = useRef(false);
  useEffect(() => {
    if (!vis || ran.current) return;
    ran.current = true;
    const t0 = Date.now();
    (function tick() {
      const p = Math.min((Date.now() - t0) / dur, 1);
      setN(Math.floor((1 - (1 - p) ** 3) * end));
      if (p < 1) requestAnimationFrame(tick);
    })();
  }, [vis, end, dur]);
  return { n, ref };
}

/* ─── Rotating Words ─── */
function RotatingWords({ words, className }: { words: string[]; className?: string }) {
  return (
    <span className={`inline-flex h-[1.15em] overflow-hidden align-bottom ${className}`}>
      <span className="animate-word-rotate flex flex-col">
        {words.map((w, i) => (
          <span key={`${w}-${i}`} className="block h-[1.15em] leading-[1.15]">{w}</span>
        ))}
      </span>
    </span>
  );
}

/* ─── Beam Lights (hero decoration) ─── */
function Beams() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-[30%] left-0 w-[600px] h-[1px] bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent animate-beam" />
      <div className="absolute top-[55%] left-0 w-[400px] h-[1px] bg-gradient-to-r from-transparent via-violet-500/20 to-transparent animate-beam-d" />
    </div>
  );
}

/* ─── Code block ─── */
function CodeBlock() {
  const [copied, setCopied] = useState(false);
  const [vis, setVis] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  const lines = [
    { n: 1, t: "import Forge from ", h: "'@forge/sdk'", e: ";" },
    { n: 2, t: "", h: "", e: "" },
    { n: 3, t: "const forge = new Forge(", h: "'fg_live_key'", e: ");" },
    { n: 4, t: "", h: "", e: "" },
    { n: 5, t: "const payout = await forge.payouts.", h: "create", e: "({" },
    { n: 6, t: "  amount:    ", h: "2_500_000", e: "," },
    { n: 7, t: "  currency:  ", h: "'NGN'", e: "," },
    { n: 8, t: "  recipient: ", h: "'acct_dev_88'", e: "," },
    { n: 9, t: "  narration: ", h: "'Invoice #1042'", e: "" },
    { n: 10, t: "});", h: "", e: "" },
    { n: 11, t: "", h: "", e: "" },
    { n: 12, t: "// => ", h: "{ status: 'completed', latency: '43ms' }", e: "" },
  ];

  useEffect(() => {
    if (!inView) return;
    let i = 0;
    const iv = setInterval(() => { if (++i > lines.length) clearInterval(iv); else setVis(i); }, 100);
    return () => clearInterval(iv);
  }, [inView]);

  return (
    <div ref={ref} className="w-full max-w-[600px] relative group">
      {/* Glow */}
      <div className="absolute -inset-3 bg-gradient-to-br from-indigo-500/20 via-violet-500/10 to-transparent rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
      <div className="relative bg-[#080d1a] rounded-xl border border-white/[0.06] shadow-2xl overflow-hidden ring-1 ring-white/[0.03]">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-white/[0.02] border-b border-white/[0.04]">
          <div className="flex gap-1.5">
            <div className="w-[9px] h-[9px] rounded-full bg-[#ff5f57]/70" />
            <div className="w-[9px] h-[9px] rounded-full bg-[#febc2e]/70" />
            <div className="w-[9px] h-[9px] rounded-full bg-[#28c840]/70" />
          </div>
          <span className="text-[9px] font-mono text-white/40 tracking-wider">payout.ts</span>
          <button onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 2e3); }} className="text-white/40 hover:text-white/70 transition-colors">
            {copied ? <CheckCircle2 size={11} className="text-emerald-400" /> : <Copy size={11} />}
          </button>
        </div>
        {/* Code */}
        <div className="p-4 lg:p-5 font-mono text-[12px] lg:text-[12.5px] leading-[1.9] overflow-x-auto">
          {lines.map((l, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -5 }} animate={i < vis ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.12 }}
              className="flex gap-4 hover:bg-white/[0.01] rounded px-1.5 -mx-1.5">
              <span className="text-white/20 select-none w-5 text-right shrink-0 tabular-nums">{l.n}</span>
              <span><span className="text-slate-400/70">{l.t}</span><span className="text-indigo-400">{l.h}</span><span className="text-slate-400/70">{l.e}</span></span>
            </motion.div>
          ))}
          <div className="flex gap-4 px-1.5 -mx-1.5">
            <span className="text-white/20 select-none w-5 text-right shrink-0 tabular-nums">13</span>
            <span className="w-[6px] h-[17px] bg-indigo-500 animate-blink rounded-[1px]" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Live activity feed (hero right side) ─── */
function LiveFeed() {
  const items = [
    { icon: <Send size={12} />, text: "Payout sent", sub: "NGN 2,500,000", color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { icon: <Webhook size={12} />, text: "Webhook fired", sub: "payout.completed", color: "text-indigo-400", bg: "bg-indigo-500/10" },
    { icon: <Database size={12} />, text: "Ledger updated", sub: "txn_8f3k2m", color: "text-amber-400", bg: "bg-amber-500/10" },
    { icon: <Shield size={12} />, text: "Fraud check", sub: "passed · 12ms", color: "text-cyan-400", bg: "bg-cyan-500/10" },
  ];
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.8, duration: 0.8 }}
      className="absolute -right-2 lg:-right-6 top-8 w-[190px] hidden xl:flex flex-col gap-2 z-10"
    >
      {items.map((it, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 2 + i * 0.25, duration: 0.5, ease }}
          className="bg-[#0d1321]/90 backdrop-blur-xl border border-white/[0.05] rounded-lg px-3 py-2 flex items-center gap-2.5 shadow-xl"
        >
          <div className={`w-6 h-6 ${it.bg} rounded-md flex items-center justify-center ${it.color}`}>{it.icon}</div>
          <div>
            <div className="text-[9px] font-semibold text-white/70">{it.text}</div>
            <div className="text-[8px] text-white/45">{it.sub}</div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════ */
export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);
  const [mob, setMob] = useState(false);

  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroOp = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, 80]);

  const tx = useCounter(2400000, 2500);
  const up = useCounter(99, 1800);
  const co = useCounter(40, 2000);
  const la = useCounter(43, 1500);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const nav = [
    { l: "Products", h: "#products" },
    { l: "Docs", h: "#developers" },
    { l: "Pricing", h: "#pricing" },
    { l: "Mission", h: "#mission" },
  ];

  return (
    <div className="min-h-screen bg-[#030712] font-sans overflow-x-hidden">

      {/* ══════════ NAVIGATION ══════════ */}
      <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-700 ${
        scrolled ? "bg-[#030712]/80 backdrop-blur-2xl border-b border-white/[0.04] py-3" : "bg-transparent py-5"
      }`}>
        <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center group-hover:bg-indigo-500 transition-colors">
              <Zap className="text-white fill-white" size={14} />
            </div>
            <span className="text-[15px] font-bold text-white tracking-tight">Forge<span className="text-indigo-400">API</span></span>
          </Link>
          <div className="hidden lg:flex items-center bg-white/[0.03] backdrop-blur-lg rounded-full border border-white/[0.05] px-1 py-1">
            {nav.map((n) => (
              <a key={n.l} href={n.h} className="text-[12.5px] font-medium text-white/60 hover:text-white hover:bg-white/[0.06] px-4 py-1.5 rounded-full transition-all">{n.l}</a>
            ))}
          </div>
          <div className="hidden lg:flex items-center gap-3">
            <Link href="/login" className="text-[12.5px] font-medium text-white/60 hover:text-white transition-colors px-3 py-1.5">Log In</Link>
            <Link href="/register" className="group bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-full text-[12.5px] font-semibold transition-all flex items-center gap-1.5 shadow-lg shadow-indigo-600/20">
              Get Started <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
          <button onClick={() => setMob(!mob)} className="lg:hidden text-white/60"><Menu size={20} /></button>
        </div>
        <AnimatePresence>
          {mob && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="lg:hidden overflow-hidden bg-[#030712] border-b border-white/[0.04]">
              <div className="p-6 space-y-1">
                {nav.map((n) => <a key={n.l} href={n.h} onClick={() => setMob(false)} className="block text-sm text-white/50 hover:text-white py-3 border-b border-white/[0.04]">{n.l}</a>)}
                <div className="pt-4 flex gap-3">
                  <Link href="/login" className="flex-1 text-center py-2.5 text-sm text-white/60 border border-white/[0.08] rounded-xl">Log In</Link>
                  <Link href="/register" className="flex-1 text-center py-2.5 text-sm bg-indigo-600 text-white rounded-xl font-semibold">Get Started</Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ══════════ HERO — DARK CINEMATIC ══════════ */}
      <section ref={heroRef} className="relative min-h-screen flex items-center overflow-hidden bg-[#030712] noise">
        {/* Mesh + grid + orbs */}
        <div className="absolute inset-0 mesh-gradient" />
        <div className="absolute inset-0 grid-bg-dark radial-fade" />
        <div className="absolute top-[-15%] left-[5%] w-[600px] h-[600px] bg-indigo-600/[0.07] rounded-full blur-[120px] animate-orb1" />
        <div className="absolute bottom-[-10%] right-[0%] w-[500px] h-[500px] bg-violet-600/[0.05] rounded-full blur-[100px] animate-orb2" />
        <div className="absolute top-[20%] right-[30%] w-[300px] h-[300px] bg-indigo-500/[0.04] rounded-full blur-[80px] animate-orb3" />
        <Beams />

        {/* Radial glow center */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] bg-indigo-600/[0.03] rounded-full blur-[150px]" />

        <motion.div style={{ opacity: heroOp, y: heroY }} className="relative w-full max-w-[1200px] mx-auto px-6 pt-32 pb-24 lg:pt-0 lg:pb-0">
          <div className="grid lg:grid-cols-[1.1fr,1fr] gap-12 lg:gap-16 items-center">
            {/* ── Left ── */}
            <div className="space-y-7 max-w-[540px]">
              {/* Pill badge */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
                className="inline-flex items-center gap-2 bg-white/[0.04] border border-white/[0.06] rounded-full px-3.5 py-1">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                </span>
                <span className="text-[10px] font-semibold text-white/50 tracking-wide">Trusted by teams shipping in production</span>
              </motion.div>

              {/* Headline */}
              <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                className="text-[2.6rem] sm:text-[3.4rem] lg:text-[4rem] font-extrabold tracking-[-0.04em] text-white leading-[1.05]">
                <motion.span initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.7, ease }}>
                  Move money with
                </motion.span>
                <br />
                <motion.span initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.7, ease }}
                  className="text-gradient">
                  a single API call.
                </motion.span>
              </motion.h1>

              {/* Subtext */}
              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.7 }}
                className="text-[16px] lg:text-[17px] text-white/60 font-medium leading-[1.7] max-w-[440px]">
                Forge gives you{" "}
                <RotatingWords words={["payouts", "wallets", "ledgers", "webhooks", "payouts"]} className="text-white/70 font-bold" />{" "}
                as simple primitives. Build payment flows in minutes, not months. We handle the banking complexity.
              </motion.p>

              {/* CTAs */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.7 }}
                className="flex flex-col sm:flex-row items-start gap-3 pt-1">
                <Link href="/register"
                  className="group relative bg-indigo-600 text-white px-7 py-3 rounded-xl font-bold text-[14px] hover:bg-indigo-500 transition-all duration-300 flex items-center gap-2 shadow-xl shadow-indigo-600/20 hover:shadow-indigo-500/30">
                  <span>Start Building Free</span>
                  <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform duration-300" />
                  <div className="absolute inset-0 rounded-xl ring-1 ring-white/10 pointer-events-none" />
                </Link>
                <Link href="#developers"
                  className="group text-white/60 hover:text-white/80 font-semibold text-[14px] flex items-center gap-2 px-4 py-3 transition-colors">
                  <BookOpen size={15} />
                  API Reference
                  <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </motion.div>

              {/* Trust */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
                className="flex flex-wrap items-center gap-5 pt-7 border-t border-white/[0.04]">
                {[
                  { i: Shield, l: "PCI-DSS L1" },
                  { i: Lock, l: "Encrypted" },
                  { i: Gauge, l: "99.99% SLA" },
                ].map((b) => (
                  <div key={b.l} className="flex items-center gap-1.5 text-[11px] text-white/45">
                    <b.i size={12} className="text-indigo-400/60" /><span>{b.l}</span>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* ── Right ── */}
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.5, ease }} className="relative">
              <LiveFeed />
              <CodeBlock />
            </motion.div>
          </div>
        </motion.div>

        {/* Bottom glow line */}
        <div className="absolute bottom-0 left-0 right-0">
          <div className="glow-line mx-auto w-full max-w-2xl" />
          <div className="h-24 bg-gradient-to-t from-[#030712] to-transparent" />
        </div>
      </section>

      {/* ══════════ METRICS ══════════ */}
      <section className="relative py-14 bg-[#030712] border-y border-white/[0.03]">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { l: "Transactions", v: tx.n, r: tx.ref, s: "+", f: true },
              { l: "Uptime SLA", v: up.n, r: up.ref, s: ".99%" },
              { l: "Countries", v: co.n, r: co.ref, s: "+" },
              { l: "Avg Latency", v: la.n, r: la.ref, s: "ms" },
            ].map((m, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="text-center lg:text-left">
                <div className="text-2xl lg:text-[2.8rem] font-extrabold text-white tracking-tight leading-none mb-1">
                  <span ref={m.r}>{m.f ? m.v.toLocaleString() : m.v}</span><span className="text-indigo-400">{m.s}</span>
                </div>
                <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/45">{m.l}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ HOW IT WORKS ══════════ */}
      <section className="py-24 lg:py-32 bg-[#030712] relative overflow-hidden">
        <div className="absolute inset-0 dot-bg opacity-40" />
        <div className="relative max-w-[1200px] mx-auto px-6">
          <div className="text-center max-w-xl mx-auto mb-16">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-indigo-400 block mb-3">How It Works</span>
              <h2 className="text-3xl lg:text-[2.5rem] font-extrabold text-white tracking-tight leading-tight">
                Zero to first payout<br />in under five minutes.
              </h2>
            </motion.div>
          </div>
          <div className="grid md:grid-cols-3 gap-4 lg:gap-5">
            {[
              { s: "01", t: "Create account", d: "Sign up and generate production API keys instantly. No compliance delays.", i: <Plus size={20} /> },
              { s: "02", t: "Integrate API", d: "Use our typed SDKs or call REST endpoints directly. Copy, paste, ship.", i: <Code2 size={20} /> },
              { s: "03", t: "Move money", d: "Process payouts and manage ledgers across 40+ countries in real time.", i: <Globe size={20} /> },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 25 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1, ease }}
                className="group relative bg-white/[0.02] hover:bg-white/[0.04] rounded-2xl border border-white/[0.04] hover:border-indigo-500/20 p-7 lg:p-8 transition-all duration-500">
                <div className="absolute top-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="flex items-center justify-between mb-6">
                  <div className="w-10 h-10 bg-indigo-500/[0.08] rounded-xl flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300">{s.i}</div>
                  <span className="text-[60px] font-extrabold text-white/[0.02] leading-none select-none">{s.s}</span>
                </div>
                <h4 className="text-lg font-bold text-white mb-2">{s.t}</h4>
                <p className="text-white/50 leading-relaxed text-[14px]">{s.d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ PRODUCTS BENTO ══════════ */}
      <section id="products" className="py-24 lg:py-32 bg-[#030712] relative">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-8 items-end mb-14">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-indigo-400 block mb-3">Products</span>
              <h2 className="text-3xl lg:text-[2.5rem] font-extrabold text-white tracking-tight leading-tight">Financial primitives for<br />modern engineering teams.</h2>
            </motion.div>
            <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
              className="text-[16px] text-white/50 max-w-md lg:text-right">
              We handle banking complexity, compliance, and ledger reconciliation. You handle the product logic.
            </motion.p>
          </div>
          <div className="grid lg:grid-cols-12 gap-4">
            {/* Payouts */}
            <motion.div initial={{ opacity: 0, y: 25 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="lg:col-span-7 bg-white/[0.02] rounded-2xl p-8 lg:p-9 border border-white/[0.04] relative overflow-hidden group hover:border-indigo-500/15 transition-all duration-500">
              <div className="relative z-10 max-w-sm">
                <div className="w-10 h-10 bg-indigo-500/[0.08] rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform"><CreditCard size={18} className="text-indigo-400" /></div>
                <h3 className="text-lg font-bold text-white mb-2">Atomic Payouts</h3>
                <p className="text-white/50 leading-relaxed text-[14px] mb-5">Every payout is idempotent, traceable, and instantly verifiable. Bank transfers and mobile money across 40+ countries.</p>
                <div className="flex flex-wrap gap-1.5">
                  {["Real-time", "Idempotent", "Multi-rail"].map(t => (
                    <span key={t} className="px-2.5 py-1 bg-white/[0.03] border border-white/[0.05] rounded-md text-[9px] font-semibold text-white/50 tracking-wide">{t}</span>
                  ))}
                </div>
              </div>
              <div className="absolute right-6 top-6 bottom-6 w-[200px] hidden lg:flex flex-col justify-center">
                <div className="bg-white/[0.03] rounded-xl border border-white/[0.05] p-4 group-hover:-translate-y-1 transition-all duration-700">
                  <div className="flex items-center gap-2 mb-2.5">
                    <div className="w-6 h-6 bg-emerald-500/10 rounded-md flex items-center justify-center"><CheckCircle2 size={12} className="text-emerald-400" /></div>
                    <div><div className="text-[8px] font-bold text-emerald-400 uppercase tracking-wider">Completed</div><div className="text-[8px] text-white/40">43ms</div></div>
                  </div>
                  <div className="text-lg font-extrabold text-white">&#8358;2,500,000</div>
                  <div className="text-[10px] text-white/40 mt-0.5">Zenith Bank ****4521</div>
                </div>
              </div>
            </motion.div>
            {/* Security */}
            <motion.div initial={{ opacity: 0, y: 25 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.08 }}
              className="lg:col-span-5 bg-gradient-to-br from-indigo-600/[0.08] to-transparent rounded-2xl p-8 lg:p-9 border border-white/[0.04] relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600/[0.08] blur-[80px] rounded-full" />
              <div className="relative z-10">
                <div className="w-10 h-10 bg-white/[0.05] rounded-xl flex items-center justify-center mb-5"><Shield size={18} className="text-indigo-400" /></div>
                <h3 className="text-lg font-bold text-white mb-2">Bank-Grade Security</h3>
                <p className="text-white/50 leading-relaxed text-[14px] mb-5">PCI-DSS Level 1 certified. End-to-end encryption and real-time fraud monitoring.</p>
                <div className="space-y-2">
                  {["256-bit AES encryption", "Hardware security modules", "Real-time fraud detection"].map(x => (
                    <div key={x} className="flex items-center gap-2"><CheckCircle2 size={11} className="text-indigo-400 shrink-0" /><span className="text-white/55 text-[12px]">{x}</span></div>
                  ))}
                </div>
              </div>
            </motion.div>
            {/* Multi-Currency */}
            <motion.div initial={{ opacity: 0, y: 25 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.12 }}
              className="lg:col-span-4 bg-white/[0.02] rounded-2xl p-8 lg:p-9 border border-white/[0.04] group hover:border-indigo-500/15 transition-all duration-500">
              <div className="w-10 h-10 bg-indigo-500/[0.08] rounded-xl flex items-center justify-center mb-5"><Wallet size={18} className="text-indigo-400" /></div>
              <h3 className="text-lg font-bold text-white mb-2">Multi-Currency</h3>
              <p className="text-white/50 leading-relaxed text-[14px] mb-5">Hold, send, and receive in NGN, USD, GBP, EUR. Instant FX at competitive rates.</p>
              <div className="flex gap-1.5">
                {["NGN", "USD", "GBP", "EUR"].map(c => (
                  <div key={c} className="w-9 h-9 bg-white/[0.03] border border-white/[0.05] rounded-lg flex items-center justify-center text-[9px] font-extrabold text-white/60">{c}</div>
                ))}
              </div>
            </motion.div>
            {/* Analytics */}
            <motion.div initial={{ opacity: 0, y: 25 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.16 }}
              className="lg:col-span-8 bg-white/[0.02] rounded-2xl p-8 lg:p-9 border border-white/[0.04] relative overflow-hidden group hover:border-indigo-500/15 transition-all duration-500">
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="flex-1">
                  <div className="w-10 h-10 bg-indigo-500/[0.08] rounded-xl flex items-center justify-center mb-5"><BarChart3 size={18} className="text-indigo-400" /></div>
                  <h3 className="text-lg font-bold text-white mb-2">Real-Time Analytics</h3>
                  <p className="text-white/50 leading-relaxed text-[14px] mb-4">Monitor flows, payout performance, and revenue with live dashboards and webhooks.</p>
                  <Link href="#" className="inline-flex items-center gap-1.5 text-indigo-400 font-semibold text-[13px] hover:gap-2.5 transition-all">Explore <ArrowRight size={13} /></Link>
                </div>
                <div className="w-44 h-28 relative hidden md:block">
                  <svg viewBox="0 0 200 120" className="w-full h-full">
                    <defs><linearGradient id="cG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6366f1" stopOpacity="0.1" /><stop offset="100%" stopColor="#6366f1" stopOpacity="0" /></linearGradient></defs>
                    <path d="M0,100 Q30,90 50,75 T100,50 T150,30 T200,10 L200,120 L0,120Z" fill="url(#cG)" />
                    <path d="M0,100 Q30,90 50,75 T100,50 T150,30 T200,10" fill="none" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" className="animate-draw" />
                    <circle cx="200" cy="10" r="3" fill="#6366f1" className="animate-pulse" />
                  </svg>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════ DEVELOPER EXPERIENCE ══════════ */}
      <section id="developers" className="py-24 lg:py-32 bg-[#030712] relative overflow-hidden">
        <div className="absolute top-1/4 left-0 w-[400px] h-[400px] bg-indigo-600/[0.05] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[350px] h-[350px] bg-violet-600/[0.04] rounded-full blur-[100px]" />
        <div className="relative z-10 max-w-[1200px] mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-14 lg:gap-18 items-center">
            <motion.div initial={{ opacity: 0, x: -25 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
              <div className="inline-flex items-center gap-2 bg-white/[0.03] border border-white/[0.05] px-3 py-1 rounded-full mb-7">
                <Terminal size={12} className="text-indigo-400" />
                <span className="text-[9px] font-bold text-white/50 tracking-wider uppercase">Developer Experience</span>
              </div>
              <h2 className="text-3xl lg:text-[2.8rem] font-extrabold text-white tracking-tight leading-[1.1] mb-5">
                Built for teams<br />that ship fast.
              </h2>
              <p className="text-[16px] text-white/50 leading-relaxed max-w-md mb-9">
                Fully typed SDKs, idempotency on every endpoint, real-time webhooks, and docs developers actually enjoy.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: <Lock size={15} />, t: "Idempotent", d: "Safe retries built-in" },
                  { icon: <Activity size={15} />, t: "Webhooks", d: "Real-time JSON events" },
                  { icon: <FileCode size={15} />, t: "Typed SDKs", d: "TS, Python, Go" },
                  { icon: <Clock size={15} />, t: "43ms Avg", d: "P99 under 200ms" },
                  { icon: <GitBranch size={15} />, t: "Versioned", d: "Non-breaking updates" },
                  { icon: <Eye size={15} />, t: "Transparent", d: "Full audit logging" },
                ].map((x) => (
                  <motion.div key={x.t} whileHover={{ x: 3 }} className="group flex items-start gap-2.5 py-1.5">
                    <div className="text-indigo-400/70 mt-0.5 shrink-0 group-hover:text-indigo-400 group-hover:scale-110 transition-all">{x.icon}</div>
                    <div>
                      <div className="text-white/80 font-semibold text-[12px]">{x.t}</div>
                      <div className="text-white/45 text-[11px]">{x.d}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 25 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.15 }}>
              <CodeBlock />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════ MISSION ══════════ */}
      <section id="mission" className="py-24 lg:py-32 bg-[#030712] relative overflow-hidden">
        <div className="absolute inset-0 grid-bg-dark radial-fade opacity-40" />
        <div className="relative max-w-[1200px] mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
            <div className="text-center mb-12">
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-indigo-400">Our Mission</span>
            </div>
            <div className="max-w-3xl mx-auto">
              <div className="relative lg:pl-10">
                <div className="absolute left-0 top-2 bottom-2 w-[2px] bg-gradient-to-b from-indigo-500 via-violet-500 to-indigo-500/10 rounded-full hidden lg:block" />
                <div className="space-y-6">
                  {[
                    { bold: true, text: "At Forge, we believe moving money in software should be as simple as sending a request to an API." },
                    { bold: false, text: "Today, many startups and organizations struggle to build reliable payment and payout systems because the financial infrastructure behind them is complex, fragmented, and difficult to integrate. We built Forge to remove that barrier." },
                    { bold: false, text: "Our mission is to give developers and businesses the tools they need to move money programmatically \u2014 securely, reliably, and at scale." },
                    { bold: false, text: "By providing simple APIs and powerful infrastructure for payments, payouts, and transaction automation, Forge allows innovators to focus on building great products while we handle the complexity of financial operations behind the scenes." },
                  ].map((p, i) => (
                    <motion.p key={i} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                      transition={{ delay: 0.1 + i * 0.1, duration: 0.5 }}
                      className={p.bold
                        ? "text-xl lg:text-2xl font-bold text-white leading-[1.6] tracking-[-0.01em]"
                        : "text-[15px] lg:text-[16px] text-white/55 leading-[1.8]"
                      }>
                      {p.text}
                    </motion.p>
                  ))}
                  <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.5 }}
                    className="flex items-center gap-3 pt-5 border-t border-white/[0.04]">
                    <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xs">F</div>
                    <div>
                      <div className="font-bold text-white text-[13px]">The Forge Team</div>
                      <div className="text-[11px] text-white/45">Building from Nigeria, for the world.</div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════ CTA ══════════ */}
      <section className="py-16 bg-[#030712]">
        <div className="max-w-[1200px] mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 25 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="relative rounded-3xl p-10 lg:p-16 text-center overflow-hidden border border-white/[0.04] bg-gradient-to-b from-white/[0.03] to-transparent">
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-0 left-1/4 w-72 h-72 bg-indigo-600/[0.1] rounded-full blur-[100px]" />
              <div className="absolute bottom-0 right-1/4 w-56 h-56 bg-violet-600/[0.06] rounded-full blur-[80px]" />
            </div>
            <div className="relative z-10 max-w-lg mx-auto">
              <h2 className="text-2xl lg:text-[2.5rem] font-extrabold text-white tracking-tight mb-4 leading-tight">
                Start building the future<br />of finance today.
              </h2>
              <p className="text-white/50 text-[15px] mb-8">No lengthy approvals. Get API keys and ship your first payout in minutes.</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/register" className="group bg-indigo-600 hover:bg-indigo-500 text-white px-7 py-3 rounded-xl font-bold text-[14px] transition-all flex items-center gap-2 shadow-xl shadow-indigo-600/20">
                  Get Started Free <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>
                <Link href="#developers" className="text-white/50 hover:text-white/70 font-semibold px-5 py-3 text-[14px] transition-colors flex items-center gap-1.5">
                  Documentation <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════ FOOTER ══════════ */}
      <footer className="bg-[#030712] pt-14 pb-8 border-t border-white/[0.03]">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 lg:gap-12 pb-12 border-b border-white/[0.03]">
            <div className="col-span-2 space-y-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center"><Zap className="text-white fill-white" size={14} /></div>
                <span className="text-[15px] font-bold text-white tracking-tight">Forge<span className="text-indigo-400">API</span></span>
              </Link>
              <p className="text-white/40 text-[12px] leading-relaxed max-w-xs">High-performance financial infrastructure built for global scale. Engineering excellence from Nigeria.</p>
            </div>
            {[
              { t: "Platform", ls: ["Payouts", "Wallets", "Ledgers", "Security"] },
              { t: "Developers", ls: ["API Docs", "SDKs", "Webhooks", "Status"] },
              { t: "Company", ls: ["About", "Careers", "Blog", "Contact"] },
              { t: "Legal", ls: ["Privacy", "Terms", "Compliance", "Licenses"] },
            ].map((g) => (
              <div key={g.t}>
                <h5 className="font-bold text-[9px] uppercase tracking-[0.18em] text-white/50 mb-3.5">{g.t}</h5>
                <ul className="space-y-2">{g.ls.map((l) => <li key={l}><Link href="#" className="text-[12px] text-white/40 hover:text-indigo-400 transition-colors">{l}</Link></li>)}</ul>
              </div>
            ))}
          </div>
          <div className="pt-7 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-[10px] text-white/35">&copy; {new Date().getFullYear()} Forge Infrastructure Inc.</div>
            <div className="flex gap-6">
              {["Twitter", "GitHub", "LinkedIn", "Discord"].map((s) => (
                <Link key={s} href="#" className="text-[10px] text-white/35 hover:text-indigo-400 transition-colors font-medium">{s}</Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
