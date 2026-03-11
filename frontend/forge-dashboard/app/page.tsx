"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, useInView, useScroll, useTransform, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import {
  Zap, Shield, Globe, Code2, ArrowRight, CheckCircle2, ChevronRight,
  Wallet, Activity, Terminal, Lock, ArrowUpRight, Copy,
  Plus, CreditCard, BarChart3, Clock, Menu, X, BookOpen,
  GitBranch, Eye, FileCode, Gauge, Send, Database, Webhook,
  TrendingUp, Users, DollarSign, RefreshCw,
} from "lucide-react";

const ease = [0.23, 1, 0.32, 1] as const;

/* ─── Animated counter ─── */
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

/* ─── Live Transaction Ticker ─── */
function LiveTicker() {
  const transactions = [
    { type: "Payout", amount: "NGN 2,500,000", to: "Zenith Bank", status: "completed", ms: "43ms" },
    { type: "Transfer", amount: "USD 15,200", to: "Chase Bank", status: "completed", ms: "38ms" },
    { type: "Payout", amount: "GBP 8,750", to: "Barclays", status: "completed", ms: "51ms" },
    { type: "Wallet", amount: "EUR 22,100", to: "Revolut", status: "completed", ms: "29ms" },
    { type: "Payout", amount: "NGN 1,800,000", to: "GTBank", status: "completed", ms: "41ms" },
    { type: "Transfer", amount: "USD 5,000", to: "Wells Fargo", status: "completed", ms: "45ms" },
    { type: "Payout", amount: "NGN 4,200,000", to: "Access Bank", status: "completed", ms: "37ms" },
    { type: "Wallet", amount: "USD 31,500", to: "Mercury", status: "completed", ms: "33ms" },
  ];

  return (
    <div className="w-full overflow-hidden py-4">
      <div className="animate-ticker flex gap-6 w-max">
        {[...transactions, ...transactions].map((tx, i) => (
          <div key={i} className="flex items-center gap-3 bg-white rounded-xl px-4 py-2.5 border border-slate-200/80 shadow-sm shrink-0">
            <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center">
              <CheckCircle2 size={13} className="text-emerald-500" />
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[11px] font-bold text-slate-800">{tx.amount}</span>
              <span className="text-[10px] text-slate-400">{tx.to}</span>
              <span className="text-[9px] font-mono text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded">{tx.ms}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Animated Dashboard Mockup ─── */
function DashboardMockup() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [chartActive, setChartActive] = useState(false);

  useEffect(() => {
    if (inView) {
      const t = setTimeout(() => setChartActive(true), 400);
      return () => clearTimeout(t);
    }
  }, [inView]);

  const barHeights = [40, 65, 45, 80, 55, 90, 70, 95, 60, 85, 75, 100];

  return (
    <div ref={ref} className="relative w-full max-w-[620px]">
      {/* Glow behind */}
      <div className="absolute -inset-6 bg-gradient-to-br from-indigo-200/30 via-violet-100/20 to-transparent rounded-3xl blur-3xl" />

      <div className="relative bg-white rounded-2xl shadow-2xl shadow-slate-200/50 border border-slate-200/80 overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-3 bg-slate-50/80 border-b border-slate-200/60">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Zap className="text-white fill-white" size={11} />
            </div>
            <span className="text-[11px] font-bold text-slate-700">Forge Dashboard</span>
          </div>
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-300" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-300" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-300" />
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 p-4">
          {[
            { label: "Revenue", value: "$128,400", change: "+12.5%", icon: <DollarSign size={13} />, color: "text-emerald-600 bg-emerald-50" },
            { label: "Payouts", value: "2,847", change: "+8.3%", icon: <Send size={13} />, color: "text-indigo-600 bg-indigo-50" },
            { label: "Success Rate", value: "99.8%", change: "+0.2%", icon: <TrendingUp size={13} />, color: "text-violet-600 bg-violet-50" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 15 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3 + i * 0.15, duration: 0.5, ease }}
              className="bg-slate-50/50 rounded-xl p-3 border border-slate-100"
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${stat.color}`}>{stat.icon}</div>
                <span className="text-[9px] font-bold text-emerald-500">{stat.change}</span>
              </div>
              <div className="text-[15px] font-extrabold text-slate-900">{stat.value}</div>
              <div className="text-[9px] text-slate-400 font-medium">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Chart area */}
        <div className="px-4 pb-2">
          <div className="bg-slate-50/50 rounded-xl border border-slate-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-slate-600">Transaction Volume</span>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse-live" />
                <span className="text-[8px] font-semibold text-indigo-600">Live</span>
              </div>
            </div>
            <div className="flex items-end gap-1.5 h-20">
              {barHeights.map((h, i) => (
                <motion.div
                  key={i}
                  className="flex-1 bg-gradient-to-t from-indigo-500 to-indigo-400 rounded-t-sm origin-bottom"
                  initial={{ scaleY: 0 }}
                  animate={chartActive ? { scaleY: 1 } : {}}
                  transition={{ delay: i * 0.06, duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
            <div className="flex justify-between mt-2">
              {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map(m => (
                <span key={m} className="text-[6px] text-slate-300 flex-1 text-center">{m}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Live transactions list */}
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-600">Recent Transactions</span>
            <div className="flex items-center gap-1">
              <RefreshCw size={8} className="text-slate-400 animate-spin" style={{ animationDuration: '3s' }} />
              <span className="text-[8px] text-slate-400">Updating</span>
            </div>
          </div>
          {[
            { name: "Payout to Zenith Bank", amount: "-NGN 2,500,000", time: "2s ago", status: "bg-emerald-500" },
            { name: "Webhook: payout.completed", amount: "", time: "2s ago", status: "bg-indigo-500" },
            { name: "Wallet funded (USD)", amount: "+$15,200", time: "8s ago", status: "bg-emerald-500" },
          ].map((tx, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 1 + i * 0.2, duration: 0.4 }}
              className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
            >
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${tx.status}`} />
                <span className="text-[10px] text-slate-600">{tx.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-bold ${tx.amount.startsWith('+') ? 'text-emerald-600' : tx.amount ? 'text-slate-800' : 'text-slate-400'}`}>
                  {tx.amount || 'event'}
                </span>
                <span className="text-[8px] text-slate-300">{tx.time}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Floating notification cards */}
      <motion.div
        initial={{ opacity: 0, x: 30, y: -10 }}
        animate={inView ? { opacity: 1, x: 0, y: 0 } : {}}
        transition={{ delay: 1.8, duration: 0.6, ease }}
        className="absolute -right-4 top-16 hidden xl:block animate-float"
      >
        <div className="bg-white rounded-xl px-3.5 py-2.5 shadow-xl shadow-slate-200/60 border border-slate-200 flex items-center gap-2.5">
          <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center">
            <CheckCircle2 size={13} className="text-emerald-500" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-700">Payout Completed</div>
            <div className="text-[9px] text-slate-400">NGN 2.5M · 43ms</div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -30, y: 10 }}
        animate={inView ? { opacity: 1, x: 0, y: 0 } : {}}
        transition={{ delay: 2.2, duration: 0.6, ease }}
        className="absolute -left-4 bottom-24 hidden xl:block animate-float-d"
      >
        <div className="bg-white rounded-xl px-3.5 py-2.5 shadow-xl shadow-slate-200/60 border border-slate-200 flex items-center gap-2.5">
          <div className="w-7 h-7 bg-indigo-50 rounded-lg flex items-center justify-center">
            <Webhook size={13} className="text-indigo-500" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-700">Webhook Fired</div>
            <div className="text-[9px] text-slate-400">payout.completed</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Code block (dark) ─── */
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
      <div className="absolute -inset-3 bg-gradient-to-br from-indigo-500/10 via-violet-500/5 to-transparent rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
      <div className="relative bg-[#0F172A] rounded-2xl shadow-2xl shadow-slate-900/10 overflow-hidden ring-1 ring-slate-800/50">
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800/50 border-b border-slate-700/50">
          <div className="flex gap-1.5">
            <div className="w-[10px] h-[10px] rounded-full bg-red-400/80" />
            <div className="w-[10px] h-[10px] rounded-full bg-amber-400/80" />
            <div className="w-[10px] h-[10px] rounded-full bg-green-400/80" />
          </div>
          <span className="text-[10px] font-mono text-slate-500 tracking-wider">payout.ts</span>
          <button onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 2e3); }} className="text-slate-500 hover:text-slate-300 transition-colors">
            {copied ? <CheckCircle2 size={12} className="text-emerald-400" /> : <Copy size={12} />}
          </button>
        </div>
        <div className="p-5 font-mono text-[12.5px] leading-[1.9] overflow-x-auto">
          {lines.map((l, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -5 }} animate={i < vis ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.12 }}
              className="flex gap-4 hover:bg-white/[0.02] rounded px-1.5 -mx-1.5">
              <span className="text-slate-600 select-none w-5 text-right shrink-0 tabular-nums">{l.n}</span>
              <span><span className="text-slate-400">{l.t}</span><span className="text-indigo-400">{l.h}</span><span className="text-slate-400">{l.e}</span></span>
            </motion.div>
          ))}
          <div className="flex gap-4 px-1.5 -mx-1.5">
            <span className="text-slate-600 select-none w-5 text-right shrink-0 tabular-nums">13</span>
            <span className="w-[6px] h-[17px] bg-indigo-500 animate-blink rounded-[1px]" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Animated feature card with icon animation ─── */
function FeatureIcon({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ scale: 0, rotate: -20 }}
      whileInView={{ scale: 1, rotate: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5, type: "spring", stiffness: 200 }}
      className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300"
    >
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════
   PAGE
═══════════════════════════════════════ */
export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);
  const [mob, setMob] = useState(false);

  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroOp = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, 60]);

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
    <div className="min-h-screen bg-white font-sans overflow-x-hidden">

      {/* ══════════ NAVIGATION ══════════ */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${
          scrolled ? "bg-white/80 backdrop-blur-xl border-b border-slate-200/60 py-3 shadow-sm" : "bg-transparent py-5"
        }`}
      >
        <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center group-hover:bg-indigo-700 transition-colors">
              <Zap className="text-white fill-white" size={14} />
            </div>
            <span className="text-[15px] font-bold text-slate-900 tracking-tight">Forge<span className="text-indigo-600">API</span></span>
          </Link>
          <div className="hidden lg:flex items-center gap-1">
            {nav.map((n, i) => (
              <motion.a key={n.l} href={n.h}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className="text-[13px] font-medium text-slate-500 hover:text-slate-900 px-4 py-2 rounded-lg hover:bg-slate-50 transition-all">{n.l}
              </motion.a>
            ))}
          </div>
          <div className="hidden lg:flex items-center gap-3">
            <Link href="/login" className="text-[13px] font-medium text-slate-600 hover:text-slate-900 transition-colors px-3 py-2">Log In</Link>
            <Link href="/register" className="group bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-[13px] font-semibold transition-all flex items-center gap-1.5 shadow-sm shadow-indigo-600/20">
              Get Started <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
          <button onClick={() => setMob(!mob)} className="lg:hidden text-slate-600"><Menu size={20} /></button>
        </div>
        <AnimatePresence>
          {mob && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="lg:hidden overflow-hidden bg-white border-b border-slate-200">
              <div className="p-6 space-y-1">
                {nav.map((n) => <a key={n.l} href={n.h} onClick={() => setMob(false)} className="block text-sm text-slate-600 hover:text-slate-900 py-3 border-b border-slate-100">{n.l}</a>)}
                <div className="pt-4 flex gap-3">
                  <Link href="/login" className="flex-1 text-center py-2.5 text-sm text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50">Log In</Link>
                  <Link href="/register" className="flex-1 text-center py-2.5 text-sm bg-indigo-600 text-white rounded-xl font-semibold">Get Started</Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* ══════════ HERO ══════════ */}
      <section ref={heroRef} className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-white to-white" />
        <div className="absolute inset-0 grid-bg radial-fade" />
        {/* Animated gradient orbs */}
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-10%] right-[10%] w-[500px] h-[500px] bg-indigo-100/40 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{ x: [0, -20, 0], y: [0, 30, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[0%] left-[5%] w-[400px] h-[400px] bg-violet-100/30 rounded-full blur-[100px]"
        />
        {/* Decorative spinning ring */}
        <div className="absolute top-[15%] right-[15%] w-[300px] h-[300px] hidden lg:block">
          <div className="w-full h-full border border-indigo-100/50 rounded-full animate-spin-slow" />
          <div className="absolute inset-4 border border-violet-100/30 rounded-full animate-spin-slow" style={{ animationDirection: 'reverse', animationDuration: '30s' }} />
        </div>

        <motion.div style={{ opacity: heroOp, y: heroY }} className="relative w-full max-w-[1200px] mx-auto px-6 pt-32 pb-24 lg:pt-0 lg:pb-0">
          <div className="grid lg:grid-cols-[1fr,1.1fr] gap-12 lg:gap-14 items-center">
            {/* Left */}
            <div className="space-y-6 max-w-[520px]">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
                className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-full px-3.5 py-1">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                </span>
                <span className="text-[11px] font-semibold text-indigo-700 tracking-wide">Processing live payouts now</span>
              </motion.div>

              <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                className="text-[2.6rem] sm:text-[3.4rem] lg:text-[3.8rem] font-extrabold tracking-[-0.04em] text-slate-900 leading-[1.05]">
                <motion.span initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.7, ease }}>
                  Move money with
                </motion.span>
                <br />
                <motion.span initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.7, ease }}
                  className="text-gradient">
                  a single API call.
                </motion.span>
              </motion.h1>

              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.7 }}
                className="text-[16px] lg:text-[17px] text-slate-500 font-medium leading-[1.7] max-w-[440px]">
                Forge gives you{" "}
                <RotatingWords words={["payouts", "wallets", "ledgers", "webhooks", "payouts"]} className="text-slate-800 font-bold" />{" "}
                as simple primitives. Build payment flows in minutes, not months.
              </motion.p>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.7 }}
                className="flex flex-col sm:flex-row items-start gap-3 pt-1">
                <Link href="/register"
                  className="group bg-indigo-600 text-white px-7 py-3.5 rounded-xl font-bold text-[14px] hover:bg-indigo-700 transition-all duration-300 flex items-center gap-2 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 hover:-translate-y-0.5">
                  <span>Start Building Free</span>
                  <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
                <Link href="#developers"
                  className="group text-slate-500 hover:text-slate-800 font-semibold text-[14px] flex items-center gap-2 px-4 py-3.5 transition-colors">
                  <BookOpen size={15} />
                  API Reference
                  <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
                className="flex flex-wrap items-center gap-5 pt-6 border-t border-slate-200/60">
                {[
                  { i: Shield, l: "PCI-DSS L1" },
                  { i: Lock, l: "End-to-End Encrypted" },
                  { i: Gauge, l: "99.99% Uptime" },
                ].map((b, idx) => (
                  <motion.div key={b.l}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.3 + idx * 0.1 }}
                    className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                    <b.i size={12} className="text-indigo-500/60" /><span>{b.l}</span>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* Right — Animated Dashboard */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 25 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.4, ease }}
              className="relative"
            >
              <DashboardMockup />
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ══════════ LIVE TICKER ══════════ */}
      <section className="relative bg-slate-50 border-y border-slate-200/60 overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-slate-50 to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-slate-50 to-transparent z-10" />
        <LiveTicker />
      </section>

      {/* ══════════ METRICS ══════════ */}
      <section className="relative py-16 bg-white">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { l: "Transactions", v: tx.n, r: tx.ref, s: "+", f: true, icon: <Activity size={16} /> },
              { l: "Uptime SLA", v: up.n, r: up.ref, s: ".99%", icon: <Gauge size={16} /> },
              { l: "Countries", v: co.n, r: co.ref, s: "+", icon: <Globe size={16} /> },
              { l: "Avg Latency", v: la.n, r: la.ref, s: "ms", icon: <Clock size={16} /> },
            ].map((m, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20, scale: 0.95 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5, ease }}
                className="text-center lg:text-left p-6 rounded-2xl bg-slate-50/50 border border-slate-100 hover:border-indigo-100 hover:shadow-md transition-all duration-300 group">
                <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500 mb-3 group-hover:scale-110 transition-transform">
                  {m.icon}
                </div>
                <div className="text-2xl lg:text-[2.5rem] font-extrabold text-slate-900 tracking-tight leading-none mb-1">
                  <span ref={m.r}>{m.f ? m.v.toLocaleString() : m.v}</span><span className="text-indigo-600">{m.s}</span>
                </div>
                <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">{m.l}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ HOW IT WORKS ══════════ */}
      <section className="py-24 lg:py-32 bg-white relative overflow-hidden">
        <div className="absolute inset-0 dot-bg opacity-30" />
        <div className="relative max-w-[1200px] mx-auto px-6">
          <div className="text-center max-w-xl mx-auto mb-16">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-600 block mb-3">How It Works</span>
              <h2 className="text-3xl lg:text-[2.5rem] font-extrabold text-slate-900 tracking-tight leading-tight">
                Zero to first payout<br />in under five minutes.
              </h2>
            </motion.div>
          </div>

          {/* Connected steps with animated line */}
          <div className="relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-[72px] left-[16%] right-[16%] h-[2px]">
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, delay: 0.3, ease }}
                className="h-full bg-gradient-to-r from-indigo-200 via-indigo-400 to-indigo-200 origin-left rounded-full"
              />
            </div>
            <div className="grid md:grid-cols-3 gap-5">
              {[
                { s: "01", t: "Create account", d: "Sign up and generate production API keys instantly. No compliance delays.", i: <Plus size={22} /> },
                { s: "02", t: "Integrate API", d: "Use our typed SDKs or call REST endpoints directly. Copy, paste, ship.", i: <Code2 size={22} /> },
                { s: "03", t: "Move money", d: "Process payouts and manage ledgers across 40+ countries in real time.", i: <Globe size={22} /> },
              ].map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.2 + i * 0.15, ease }}
                  className="group relative bg-white hover:bg-slate-50/50 rounded-2xl border border-slate-200 hover:border-indigo-200 p-7 lg:p-8 transition-all duration-500 shadow-sm hover:shadow-lg hover:-translate-y-1">
                  {/* Top glow on hover */}
                  <div className="absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r from-transparent via-indigo-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full" />
                  <div className="flex items-center justify-between mb-6">
                    <FeatureIcon delay={0.3 + i * 0.15}>{s.i}</FeatureIcon>
                    <motion.span
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.5 + i * 0.15 }}
                      className="text-[60px] font-extrabold text-slate-100 leading-none select-none"
                    >{s.s}</motion.span>
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 mb-2">{s.t}</h4>
                  <p className="text-slate-500 leading-relaxed text-[14px]">{s.d}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ PRODUCTS BENTO ══════════ */}
      <section id="products" className="py-24 lg:py-32 bg-slate-50 relative">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-8 items-end mb-14">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-600 block mb-3">Products</span>
              <h2 className="text-3xl lg:text-[2.5rem] font-extrabold text-slate-900 tracking-tight leading-tight">Financial primitives for<br />modern engineering teams.</h2>
            </motion.div>
            <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
              className="text-[16px] text-slate-500 max-w-md lg:text-right">
              We handle banking complexity, compliance, and ledger reconciliation. You handle the product logic.
            </motion.p>
          </div>
          <div className="grid lg:grid-cols-12 gap-4">
            {/* Payouts — with animated mini chart */}
            <motion.div initial={{ opacity: 0, y: 25 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="lg:col-span-7 bg-white rounded-2xl p-8 lg:p-9 border border-slate-200 relative overflow-hidden group hover:border-indigo-200 hover:shadow-lg transition-all duration-500 shadow-sm hover:-translate-y-0.5">
              <div className="relative z-10 max-w-sm">
                <FeatureIcon><CreditCard size={20} /></FeatureIcon>
                <h3 className="text-lg font-bold text-slate-900 mb-2 mt-5">Atomic Payouts</h3>
                <p className="text-slate-500 leading-relaxed text-[14px] mb-5">Every payout is idempotent, traceable, and instantly verifiable. Bank transfers and mobile money across 40+ countries.</p>
                <div className="flex flex-wrap gap-1.5">
                  {["Real-time", "Idempotent", "Multi-rail"].map(t => (
                    <span key={t} className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md text-[10px] font-semibold text-slate-500 tracking-wide">{t}</span>
                  ))}
                </div>
              </div>
              <div className="absolute right-6 top-6 bottom-6 w-[200px] hidden lg:flex flex-col justify-center">
                <motion.div
                  whileHover={{ y: -4 }}
                  className="bg-slate-50 rounded-xl border border-slate-200 p-4 shadow-sm transition-all duration-500"
                >
                  <div className="flex items-center gap-2 mb-2.5">
                    <div className="w-6 h-6 bg-emerald-50 rounded-md flex items-center justify-center"><CheckCircle2 size={12} className="text-emerald-500" /></div>
                    <div><div className="text-[8px] font-bold text-emerald-600 uppercase tracking-wider">Completed</div><div className="text-[8px] text-slate-400">43ms</div></div>
                  </div>
                  <div className="text-lg font-extrabold text-slate-900">&#8358;2,500,000</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Zenith Bank ****4521</div>
                </motion.div>
              </div>
            </motion.div>
            {/* Security */}
            <motion.div initial={{ opacity: 0, y: 25 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.08 }}
              className="lg:col-span-5 bg-gradient-to-br from-indigo-50 to-white rounded-2xl p-8 lg:p-9 border border-indigo-100 relative overflow-hidden group shadow-sm hover:-translate-y-0.5 hover:shadow-lg transition-all duration-500">
              <div className="relative z-10">
                <FeatureIcon delay={0.1}><Shield size={20} /></FeatureIcon>
                <h3 className="text-lg font-bold text-slate-900 mb-2 mt-5">Bank-Grade Security</h3>
                <p className="text-slate-500 leading-relaxed text-[14px] mb-5">PCI-DSS Level 1 certified. End-to-end encryption and real-time fraud monitoring.</p>
                <div className="space-y-2.5">
                  {["256-bit AES encryption", "Hardware security modules", "Real-time fraud detection"].map((x, i) => (
                    <motion.div key={x}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      className="flex items-center gap-2">
                      <CheckCircle2 size={12} className="text-indigo-500 shrink-0" /><span className="text-slate-600 text-[13px]">{x}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
            {/* Multi-Currency — with animated flags */}
            <motion.div initial={{ opacity: 0, y: 25 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.12 }}
              className="lg:col-span-4 bg-white rounded-2xl p-8 lg:p-9 border border-slate-200 group hover:border-indigo-200 hover:shadow-lg transition-all duration-500 shadow-sm hover:-translate-y-0.5">
              <FeatureIcon delay={0.2}><Wallet size={20} /></FeatureIcon>
              <h3 className="text-lg font-bold text-slate-900 mb-2 mt-5">Multi-Currency</h3>
              <p className="text-slate-500 leading-relaxed text-[14px] mb-5">Hold, send, and receive in NGN, USD, GBP, EUR. Instant FX at competitive rates.</p>
              <div className="flex gap-1.5">
                {["NGN", "USD", "GBP", "EUR"].map((c, i) => (
                  <motion.div key={c}
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 + i * 0.08, type: "spring", stiffness: 300 }}
                    whileHover={{ y: -3, scale: 1.1 }}
                    className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center text-[10px] font-extrabold text-slate-600 cursor-default hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">{c}
                  </motion.div>
                ))}
              </div>
            </motion.div>
            {/* Analytics — with animated chart */}
            <motion.div initial={{ opacity: 0, y: 25 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.16 }}
              className="lg:col-span-8 bg-white rounded-2xl p-8 lg:p-9 border border-slate-200 relative overflow-hidden group hover:border-indigo-200 hover:shadow-lg transition-all duration-500 shadow-sm hover:-translate-y-0.5">
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="flex-1">
                  <FeatureIcon delay={0.25}><BarChart3 size={20} /></FeatureIcon>
                  <h3 className="text-lg font-bold text-slate-900 mb-2 mt-5">Real-Time Analytics</h3>
                  <p className="text-slate-500 leading-relaxed text-[14px] mb-4">Monitor flows, payout performance, and revenue with live dashboards and webhooks.</p>
                  <Link href="#" className="inline-flex items-center gap-1.5 text-indigo-600 font-semibold text-[13px] hover:gap-2.5 transition-all group/link">
                    Explore <ArrowRight size={13} className="group-hover/link:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
                <div className="w-48 h-32 relative hidden md:block">
                  <svg viewBox="0 0 200 120" className="w-full h-full">
                    <defs><linearGradient id="cG2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6366f1" stopOpacity="0.15" /><stop offset="100%" stopColor="#6366f1" stopOpacity="0" /></linearGradient></defs>
                    <path d="M0,100 Q30,90 50,75 T100,50 T150,30 T200,10 L200,120 L0,120Z" fill="url(#cG2)" />
                    <path d="M0,100 Q30,90 50,75 T100,50 T150,30 T200,10" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" className="animate-draw" />
                    <circle cx="200" cy="10" r="4" fill="#6366f1" className="animate-pulse" />
                    <circle cx="200" cy="10" r="8" fill="none" stroke="#6366f1" strokeWidth="1" opacity="0.3" className="animate-pulse" />
                  </svg>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════ DEVELOPER EXPERIENCE ══════════ */}
      <section id="developers" className="py-24 lg:py-32 bg-white relative overflow-hidden">
        <motion.div
          animate={{ x: [0, 20, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-0 w-[400px] h-[400px] bg-indigo-50/50 rounded-full blur-[120px]"
        />
        <div className="relative z-10 max-w-[1200px] mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-14 lg:gap-18 items-center">
            <motion.div initial={{ opacity: 0, x: -25 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
              <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full mb-7">
                <Terminal size={12} className="text-indigo-600" />
                <span className="text-[10px] font-bold text-indigo-700 tracking-wider uppercase">Developer Experience</span>
              </div>
              <h2 className="text-3xl lg:text-[2.8rem] font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-5">
                Built for teams<br />that ship fast.
              </h2>
              <p className="text-[16px] text-slate-500 leading-relaxed max-w-md mb-9">
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
                ].map((x, i) => (
                  <motion.div key={x.t}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 + i * 0.06 }}
                    whileHover={{ x: 4 }}
                    className="group flex items-start gap-2.5 py-2.5 px-3 rounded-xl hover:bg-indigo-50/50 transition-colors cursor-default">
                    <div className="text-indigo-500 mt-0.5 shrink-0 group-hover:text-indigo-600 group-hover:scale-110 transition-all">{x.icon}</div>
                    <div>
                      <div className="text-slate-800 font-semibold text-[13px]">{x.t}</div>
                      <div className="text-slate-400 text-[12px]">{x.d}</div>
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
      <section id="mission" className="py-24 lg:py-32 bg-slate-50 relative overflow-hidden">
        <div className="relative max-w-[1200px] mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
            <div className="text-center mb-12">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-600">Our Mission</span>
            </div>
            <div className="max-w-3xl mx-auto">
              <div className="relative lg:pl-10">
                {/* Animated gradient line */}
                <motion.div
                  initial={{ height: 0 }}
                  whileInView={{ height: "100%" }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.5, ease }}
                  className="absolute left-0 top-2 w-[3px] bg-gradient-to-b from-indigo-500 via-violet-400 to-indigo-200 rounded-full hidden lg:block origin-top"
                />
                <div className="space-y-6">
                  {[
                    { bold: true, text: "At Forge, we believe moving money in software should be as simple as sending a request to an API." },
                    { bold: false, text: "Today, many startups and organizations struggle to build reliable payment and payout systems because the financial infrastructure behind them is complex, fragmented, and difficult to integrate. We built Forge to remove that barrier." },
                    { bold: false, text: "Our mission is to give developers and businesses the tools they need to move money programmatically \u2014 securely, reliably, and at scale." },
                    { bold: false, text: "By providing simple APIs and powerful infrastructure for payments, payouts, and transaction automation, Forge allows innovators to focus on building great products while we handle the complexity of financial operations behind the scenes." },
                  ].map((p, i) => (
                    <motion.p key={i} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                      transition={{ delay: 0.2 + i * 0.12, duration: 0.5 }}
                      className={p.bold
                        ? "text-xl lg:text-2xl font-bold text-slate-900 leading-[1.6] tracking-[-0.01em]"
                        : "text-[15px] lg:text-[16px] text-slate-500 leading-[1.8]"
                      }>
                      {p.text}
                    </motion.p>
                  ))}
                  <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.7 }}
                    className="flex items-center gap-3 pt-5 border-t border-slate-200">
                    <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xs">F</div>
                    <div>
                      <div className="font-bold text-slate-900 text-[13px]">The Forge Team</div>
                      <div className="text-[12px] text-slate-400">Building from Nigeria, for the world.</div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════ CTA ══════════ */}
      <section className="py-16 bg-white">
        <div className="max-w-[1200px] mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 25 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="relative rounded-3xl p-10 lg:p-16 text-center overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 animate-gradient">
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-0 left-1/4 w-72 h-72 bg-white/5 rounded-full blur-[80px]" />
              <div className="absolute bottom-0 right-1/4 w-56 h-56 bg-violet-400/10 rounded-full blur-[60px]" />
              {/* Floating dots */}
              <motion.div animate={{ y: [0, -20, 0] }} transition={{ duration: 4, repeat: Infinity }} className="absolute top-8 left-[20%] w-2 h-2 bg-white/10 rounded-full" />
              <motion.div animate={{ y: [0, 15, 0] }} transition={{ duration: 5, repeat: Infinity }} className="absolute top-12 right-[25%] w-1.5 h-1.5 bg-white/15 rounded-full" />
              <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity }} className="absolute bottom-12 left-[35%] w-1 h-1 bg-white/20 rounded-full" />
            </div>
            <div className="relative z-10 max-w-lg mx-auto">
              <motion.h2
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-2xl lg:text-[2.5rem] font-extrabold text-white tracking-tight mb-4 leading-tight">
                Start building the future<br />of finance today.
              </motion.h2>
              <p className="text-indigo-200 text-[15px] mb-8">No lengthy approvals. Get API keys and ship your first payout in minutes.</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/register" className="group bg-white text-indigo-700 px-7 py-3.5 rounded-xl font-bold text-[14px] transition-all flex items-center gap-2 shadow-lg hover:shadow-xl hover:bg-indigo-50 hover:-translate-y-0.5">
                  Get Started Free <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>
                <Link href="#developers" className="text-indigo-200 hover:text-white font-semibold px-5 py-3.5 text-[14px] transition-colors flex items-center gap-1.5">
                  Documentation <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════ FOOTER ══════════ */}
      <footer className="bg-slate-50 pt-14 pb-8 border-t border-slate-200/60">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 lg:gap-12 pb-12 border-b border-slate-200/60">
            <div className="col-span-2 space-y-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center"><Zap className="text-white fill-white" size={14} /></div>
                <span className="text-[15px] font-bold text-slate-900 tracking-tight">Forge<span className="text-indigo-600">API</span></span>
              </Link>
              <p className="text-slate-400 text-[13px] leading-relaxed max-w-xs">High-performance financial infrastructure built for global scale. Engineering excellence from Nigeria.</p>
            </div>
            {[
              { t: "Platform", ls: ["Payouts", "Wallets", "Ledgers", "Security"] },
              { t: "Developers", ls: ["API Docs", "SDKs", "Webhooks", "Status"] },
              { t: "Company", ls: ["About", "Careers", "Blog", "Contact"] },
              { t: "Legal", ls: ["Privacy", "Terms", "Compliance", "Licenses"] },
            ].map((g) => (
              <div key={g.t}>
                <h5 className="font-bold text-[10px] uppercase tracking-[0.15em] text-slate-400 mb-3.5">{g.t}</h5>
                <ul className="space-y-2">{g.ls.map((l) => <li key={l}><Link href="#" className="text-[13px] text-slate-500 hover:text-indigo-600 transition-colors">{l}</Link></li>)}</ul>
              </div>
            ))}
          </div>
          <div className="pt-7 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-[11px] text-slate-400">&copy; {new Date().getFullYear()} Forge Infrastructure Inc.</div>
            <div className="flex gap-6">
              {["Twitter", "GitHub", "LinkedIn", "Discord"].map((s) => (
                <Link key={s} href="#" className="text-[11px] text-slate-400 hover:text-indigo-600 transition-colors font-medium">{s}</Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
