"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import {
  Zap,
  Shield,
  Globe,
  Code2,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Wallet,
  Activity,
  Terminal,
  Lock,
  ArrowUpRight,
  RefreshCw,
  Copy,
  Plus,
  CreditCard,
  BarChart3,
  Clock,
  Sparkles,
  Menu,
  X,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════
// ANIMATED COUNTER HOOK
// ═══════════════════════════════════════════════════════════════
function useCounter(end: number, duration: number = 2000) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const started = useRef(false);

  useEffect(() => {
    if (!inView || started.current) return;
    started.current = true;
    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, end, duration]);

  return { count, ref };
}

// ═══════════════════════════════════════════════════════════════
// TYPING CODE ANIMATION
// ═══════════════════════════════════════════════════════════════
function TypingCode() {
  const [copied, setCopied] = useState(false);
  const [visibleLines, setVisibleLines] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  const codeLines = [
    { num: 1, text: 'import Forge from ', highlight: "'@forge/sdk'", end: ";" },
    { num: 2, text: '', highlight: '', end: '' },
    { num: 3, text: 'const forge = new Forge(', highlight: "'fg_live_9921'", end: ");" },
    { num: 4, text: '', highlight: '', end: '' },
    { num: 5, text: 'const payout = await forge.payouts.create({', highlight: '', end: '' },
    { num: 6, text: '  amount: ', highlight: '2_500_000', end: ',' },
    { num: 7, text: '  currency: ', highlight: "'NGN'", end: ',' },
    { num: 8, text: '  recipient: ', highlight: "'acct_dev_88'", end: ',' },
    { num: 9, text: '  narration: ', highlight: "'Invoice #1042'", end: '' },
    { num: 10, text: '});', highlight: '', end: '' },
    { num: 11, text: '', highlight: '', end: '' },
    { num: 12, text: 'console.log(payout.status);', highlight: " // 'completed'", end: '' },
  ];

  useEffect(() => {
    if (!inView) return;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setVisibleLines(i);
      if (i >= codeLines.length) clearInterval(interval);
    }, 120);
    return () => clearInterval(interval);
  }, [inView]);

  return (
    <div ref={ref} className="w-full max-w-[640px] relative group">
      <div className="absolute -inset-1 bg-gradient-to-b from-[#4F46E5]/20 to-[#7C3AED]/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      <div className="relative bg-[#0C1222] rounded-2xl border border-white/[0.06] shadow-2xl overflow-hidden">
        {/* Title bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-white/[0.02] border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
          </div>
          <span className="text-[10px] font-mono font-bold text-white/20 tracking-wider">payout.ts</span>
          <button
            onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            className="text-white/20 hover:text-white/60 transition-colors"
          >
            {copied ? <CheckCircle2 size={13} className="text-emerald-400" /> : <Copy size={13} />}
          </button>
        </div>

        {/* Code */}
        <div className="p-6 font-mono text-[13px] leading-[1.8] overflow-x-auto">
          {codeLines.map((line, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -8 }}
              animate={idx < visibleLines ? { opacity: 1, x: 0 } : { opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
              className="flex gap-5 hover:bg-white/[0.02] rounded px-2 -mx-2"
            >
              <span className="text-white/[0.12] select-none w-5 text-right shrink-0 tabular-nums">{line.num}</span>
              <span>
                <span className="text-[#CBD5E1]/60">{line.text}</span>
                <span className="text-[#4F46E5]">{line.highlight}</span>
                <span className="text-[#CBD5E1]/60">{line.end}</span>
              </span>
            </motion.div>
          ))}
          <div className="flex gap-5 px-2 -mx-2">
            <span className="text-white/[0.12] select-none w-5 text-right shrink-0 tabular-nums">{codeLines.length + 1}</span>
            <span className="w-2 h-5 bg-[#4F46E5] animate-blink" />
          </div>
        </div>

        {/* Response popup */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={visibleLines >= codeLines.length ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ delay: 0.5, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          className="absolute -right-4 -bottom-4 bg-[#0F172A] border border-emerald-500/20 rounded-xl p-4 shadow-2xl hidden xl:block"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-emerald-400/80">200 OK</span>
          </div>
          <div className="font-mono text-xs text-white/50 space-y-0.5">
            <div><span className="text-[#4F46E5]">&quot;status&quot;</span>: <span className="text-emerald-400">&quot;completed&quot;</span></div>
            <div><span className="text-[#4F46E5]">&quot;amount&quot;</span>: <span className="text-amber-400">2500000</span></div>
            <div><span className="text-[#4F46E5]">&quot;latency&quot;</span>: <span className="text-white/40">&quot;43ms&quot;</span></div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN LANDING PAGE
// ═══════════════════════════════════════════════════════════════
export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.97]);

  const txCount = useCounter(2400000, 2500);
  const uptimeCount = useCounter(99, 1800);
  const countriesCount = useCounter(40, 2000);
  const latencyCount = useCounter(43, 1500);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white text-[#0F172A] font-sans overflow-x-hidden">

      {/* ━━━ NAVIGATION ━━━ */}
      <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${
        scrolled
          ? "bg-white/80 backdrop-blur-2xl border-b border-[#E2E8F0]/60 py-4"
          : "bg-transparent py-6"
      }`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-[#4F46E5] rounded-xl flex items-center justify-center shadow-lg shadow-[#4F46E5]/20 group-hover:shadow-[#4F46E5]/40 transition-shadow">
              <Zap className="text-white fill-white" size={18} />
            </div>
            <span className="text-xl font-extrabold tracking-tight">Forge</span>
          </Link>

          <div className="hidden lg:flex items-center gap-10">
            {["Products", "Developers", "Pricing", "Company"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-[13px] font-semibold text-[#64748B] hover:text-[#0F172A] transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-[#4F46E5] hover:after:w-full after:transition-all"
              >
                {item}
              </a>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-4">
            <Link href="/login" className="text-[13px] font-semibold text-[#64748B] hover:text-[#0F172A] transition-colors px-4 py-2">
              Sign In
            </Link>
            <Link
              href="/register"
              className="bg-[#0F172A] text-white px-5 py-2.5 rounded-xl font-semibold text-[13px] hover:bg-[#1E293B] transition-all shadow-lg shadow-[#0F172A]/10 hover:shadow-[#0F172A]/20 hover:-translate-y-[1px]"
            >
              Get API Keys
            </Link>
          </div>

          <button onClick={() => setMobileMenu(!mobileMenu)} className="lg:hidden text-[#0F172A]">
            {mobileMenu ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenu && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:hidden absolute top-full left-0 right-0 bg-white border-b border-[#E2E8F0] p-6 space-y-4"
          >
            {["Products", "Developers", "Pricing", "Company"].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="block text-sm font-semibold text-[#64748B] py-2">
                {item}
              </a>
            ))}
            <div className="pt-4 border-t border-[#E2E8F0] flex gap-3">
              <Link href="/login" className="flex-1 text-center py-3 text-sm font-semibold border border-[#E2E8F0] rounded-xl">Sign In</Link>
              <Link href="/register" className="flex-1 text-center py-3 text-sm font-semibold bg-[#0F172A] text-white rounded-xl">Get API Keys</Link>
            </div>
          </motion.div>
        )}
      </nav>

      {/* ━━━ HERO ━━━ */}
      <section ref={heroRef} className="relative pt-36 lg:pt-44 pb-24 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 grid-bg" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[#4F46E5]/[0.04] rounded-full blur-[120px]" />

        <motion.div style={{ opacity: heroOpacity, scale: heroScale }} className="relative max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <div className="space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2.5 bg-[#4F46E5]/[0.05] border border-[#4F46E5]/10 rounded-full px-4 py-1.5"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4F46E5] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#4F46E5]" />
                </span>
                <span className="text-[11px] font-bold text-[#4F46E5] tracking-wide">Now processing live payouts</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
                className="text-[3.2rem] lg:text-[4.5rem] font-extrabold tracking-[-0.03em] text-[#0F172A] leading-[1.05]"
              >
                Financial
                <br />
                infrastructure,
                <br />
                <span className="text-gradient">forged in code.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="text-lg text-[#64748B] font-medium leading-relaxed max-w-[480px]"
              >
                Programmatic payouts, real-time transactions, and multi-currency
                wallets for teams that move fast. One API to power your
                entire money layer.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3 }}
                className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-2"
              >
                <Link
                  href="/register"
                  className="group bg-[#4F46E5] text-white px-8 py-4 rounded-2xl font-bold text-[15px] hover:shadow-2xl hover:shadow-[#4F46E5]/25 hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2"
                >
                  Start Building
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="#developers"
                  className="group text-[#0F172A] font-semibold text-[15px] hover:text-[#4F46E5] transition-colors flex items-center gap-2 px-4 py-4"
                >
                  <Terminal size={16} />
                  Read the Docs
                  <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex items-center gap-6 pt-8 border-t border-[#E2E8F0]/60"
              >
                <div className="flex items-center gap-2 text-[13px] text-[#94A3B8]">
                  <Shield size={14} className="text-emerald-500" />
                  <span>PCI-DSS L1</span>
                </div>
                <div className="w-px h-4 bg-[#E2E8F0]" />
                <div className="flex items-center gap-2 text-[13px] text-[#94A3B8]">
                  <Lock size={14} className="text-emerald-500" />
                  <span>SOC 2 Type II</span>
                </div>
                <div className="w-px h-4 bg-[#E2E8F0]" />
                <div className="flex items-center gap-2 text-[13px] text-[#94A3B8]">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <span>99.99% Uptime</span>
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className="relative"
            >
              <div className="absolute -inset-8 bg-gradient-to-br from-[#4F46E5]/10 via-[#7C3AED]/5 to-transparent blur-[80px] rounded-full" />
              <TypingCode />
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ━━━ LIVE METRICS BAR ━━━ */}
      <section className="relative py-16 bg-[#0F172A] noise overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#4F46E5]/10 via-transparent to-[#7C3AED]/10" />
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-16">
            {[
              { label: "Transactions Processed", value: txCount.count, ref: txCount.ref, suffix: "+", format: true },
              { label: "Uptime SLA", value: uptimeCount.count, ref: uptimeCount.ref, suffix: ".99%" },
              { label: "Countries Covered", value: countriesCount.count, ref: countriesCount.ref, suffix: "+" },
              { label: "Avg Latency", value: latencyCount.count, ref: latencyCount.ref, suffix: "ms" },
            ].map((metric, i) => (
              <div key={i} className="text-center lg:text-left">
                <div className="text-3xl lg:text-5xl font-extrabold text-white tracking-tight mb-2">
                  <span ref={metric.ref}>
                    {metric.format ? (metric.value).toLocaleString() : metric.value}
                  </span>
                  <span className="text-[#4F46E5]">{metric.suffix}</span>
                </div>
                <div className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/30">{metric.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ HOW IT WORKS ━━━ */}
      <section className="py-28 lg:py-40 bg-[#FAFBFC] border-y border-[#E2E8F0]/60 dot-bg">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#4F46E5] mb-4 block">How It Works</span>
              <h2 className="text-3xl lg:text-[2.75rem] font-extrabold text-[#0F172A] tracking-tight leading-tight">
                From zero to first payout
                <br />in under five minutes.
              </h2>
            </motion.div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {[
              {
                step: "01",
                title: "Create your account",
                desc: "Sign up and get production API keys instantly. No compliance bottlenecks, no banking hurdles.",
                icon: <Plus size={22} className="text-[#4F46E5]" />,
              },
              {
                step: "02",
                title: "Integrate the API",
                desc: "Use our fully typed SDKs or raw REST endpoints. Copy, paste, and ship.",
                icon: <Code2 size={22} className="text-[#4F46E5]" />,
              },
              {
                step: "03",
                title: "Move money globally",
                desc: "Process payouts, collect payments, and manage ledgers across 40+ countries in real time.",
                icon: <Globe size={22} className="text-[#4F46E5]" />,
              },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="relative p-8 lg:p-10 bg-white rounded-3xl border border-[#E2E8F0] group hover:border-[#4F46E5]/20 hover:shadow-xl hover:shadow-[#4F46E5]/[0.03] transition-all duration-500"
              >
                <div className="flex items-center justify-between mb-8">
                  <div className="w-12 h-12 bg-[#4F46E5]/[0.06] rounded-2xl flex items-center justify-center group-hover:bg-[#4F46E5] group-hover:[&>svg]:text-white transition-all duration-300">
                    {step.icon}
                  </div>
                  <span className="text-[80px] font-extrabold text-[#0F172A]/[0.03] leading-none select-none">{step.step}</span>
                </div>
                <h4 className="text-xl font-bold text-[#0F172A] mb-3">{step.title}</h4>
                <p className="text-[#64748B] leading-relaxed text-[15px]">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ PRODUCT BENTO GRID ━━━ */}
      <section id="products" className="py-28 lg:py-40 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-end mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#4F46E5] mb-4 block">Products</span>
              <h2 className="text-3xl lg:text-[2.75rem] font-extrabold text-[#0F172A] tracking-tight leading-tight">
                Financial primitives for
                <br />modern engineering teams.
              </h2>
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-lg text-[#64748B] max-w-md lg:text-right"
            >
              We handle banking complexity, compliance, and ledger reconciliation.
              You handle the product logic.
            </motion.p>
          </div>

          <div className="grid lg:grid-cols-12 gap-5">
            {/* Payouts */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-7 bg-gradient-to-br from-[#FAFBFC] to-white rounded-[32px] p-10 lg:p-12 border border-[#E2E8F0] relative overflow-hidden group hover:border-[#4F46E5]/20 transition-colors"
            >
              <div className="relative z-10 max-w-sm">
                <div className="w-12 h-12 bg-[#4F46E5]/[0.06] rounded-2xl flex items-center justify-center mb-8">
                  <CreditCard size={22} className="text-[#4F46E5]" />
                </div>
                <h3 className="text-2xl font-bold text-[#0F172A] mb-4">Atomic Payouts</h3>
                <p className="text-[#64748B] leading-relaxed mb-8">
                  Every payout is idempotent, traceable, and instantly verifiable. Bank transfers and mobile
                  money across 40+ countries with sub-second confirmation.
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Real-time", "Idempotent", "Multi-rail"].map(tag => (
                    <span key={tag} className="px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-[11px] font-bold text-[#64748B] tracking-wide">{tag}</span>
                  ))}
                </div>
              </div>
              <div className="absolute right-8 top-8 bottom-8 w-[240px] hidden lg:flex flex-col justify-center">
                <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-lg shadow-black/[0.03] group-hover:shadow-xl group-hover:-translate-y-1 transition-all duration-500">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                      <CheckCircle2 size={16} className="text-emerald-500" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Completed</div>
                      <div className="text-[10px] text-[#94A3B8]">43ms latency</div>
                    </div>
                  </div>
                  <div className="text-2xl font-extrabold text-[#0F172A]">&#8358;2,500,000</div>
                  <div className="text-xs text-[#94A3B8] mt-1">to Zenith Bank ****4521</div>
                </div>
              </div>
            </motion.div>

            {/* Security */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="lg:col-span-5 bg-[#0F172A] rounded-[32px] p-10 lg:p-12 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#4F46E5]/10 blur-[100px] rounded-full" />
              <div className="relative z-10">
                <div className="w-12 h-12 bg-white/[0.06] rounded-2xl flex items-center justify-center mb-8 group-hover:bg-[#4F46E5]/20 transition-colors">
                  <Shield size={22} className="text-[#4F46E5]" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Bank-Grade Security</h3>
                <p className="text-white/40 leading-relaxed mb-8">
                  PCI-DSS Level 1 certified. End-to-end encryption, hardware security modules,
                  and real-time fraud monitoring on every transaction.
                </p>
                <div className="space-y-3">
                  {["256-bit AES encryption", "Hardware security modules", "Real-time fraud detection"].map(item => (
                    <div key={item} className="flex items-center gap-3">
                      <CheckCircle2 size={14} className="text-[#4F46E5] shrink-0" />
                      <span className="text-white/60 text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Multi-Currency */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="lg:col-span-4 bg-white rounded-[32px] p-10 lg:p-12 border border-[#E2E8F0] group hover:border-[#4F46E5]/20 transition-colors"
            >
              <div className="w-12 h-12 bg-[#4F46E5]/[0.06] rounded-2xl flex items-center justify-center mb-8">
                <Wallet size={22} className="text-[#4F46E5]" />
              </div>
              <h3 className="text-2xl font-bold text-[#0F172A] mb-4">Multi-Currency</h3>
              <p className="text-[#64748B] leading-relaxed mb-8">
                Hold, send, and receive in NGN, USD, GBP, EUR, and more. Instant FX at competitive rates.
              </p>
              <div className="flex gap-2">
                {["NGN", "USD", "GBP", "EUR"].map((c) => (
                  <div key={c} className="w-11 h-11 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-center text-[11px] font-extrabold text-[#0F172A] group-hover:border-[#4F46E5]/20 transition-colors">
                    {c}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Analytics */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:col-span-8 bg-gradient-to-br from-[#FAFBFC] to-white rounded-[32px] p-10 lg:p-12 border border-[#E2E8F0] relative overflow-hidden group hover:border-[#4F46E5]/20 transition-colors"
            >
              <div className="flex flex-col md:flex-row gap-10 items-center">
                <div className="flex-1">
                  <div className="w-12 h-12 bg-[#4F46E5]/[0.06] rounded-2xl flex items-center justify-center mb-8">
                    <BarChart3 size={22} className="text-[#4F46E5]" />
                  </div>
                  <h3 className="text-2xl font-bold text-[#0F172A] mb-4">Real-Time Analytics</h3>
                  <p className="text-[#64748B] leading-relaxed mb-6">
                    Monitor transaction flows, payout performance, and revenue metrics
                    with live dashboards and programmable webhooks.
                  </p>
                  <Link href="#" className="inline-flex items-center gap-2 text-[#4F46E5] font-bold text-sm hover:gap-3 transition-all">
                    Explore Dashboard <ArrowRight size={14} />
                  </Link>
                </div>
                <div className="w-56 h-40 relative hidden md:block">
                  <svg viewBox="0 0 200 120" className="w-full h-full">
                    <defs>
                      <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#4F46E5" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d="M0,100 Q30,90 50,75 T100,50 T150,30 T200,10 L200,120 L0,120Z" fill="url(#chartGrad)" />
                    <path d="M0,100 Q30,90 50,75 T100,50 T150,30 T200,10" fill="none" stroke="#4F46E5" strokeWidth="2.5" strokeLinecap="round" />
                    <circle cx="200" cy="10" r="4" fill="#4F46E5" className="animate-pulse" />
                  </svg>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ━━━ DEVELOPER EXPERIENCE ━━━ */}
      <section id="developers" className="py-28 lg:py-40 bg-[#0F172A] relative overflow-hidden noise">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-[#4F46E5]/[0.08] rounded-full blur-[150px]" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#7C3AED]/[0.06] rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <div className="inline-flex items-center gap-2.5 bg-white/[0.04] border border-white/[0.06] px-4 py-1.5 rounded-full mb-8">
                <Code2 size={14} className="text-[#4F46E5]" />
                <span className="text-[11px] font-bold text-white/40 tracking-wide">Developer Experience</span>
              </div>

              <h2 className="text-3xl lg:text-[3.2rem] font-extrabold text-white tracking-tight leading-[1.1] mb-8">
                Built for teams
                <br />that ship fast.
              </h2>

              <p className="text-lg text-white/40 leading-relaxed max-w-lg mb-12">
                Fully typed SDKs, idempotency on every endpoint, real-time
                webhooks, and documentation that developers actually enjoy reading.
              </p>

              <div className="grid grid-cols-2 gap-6">
                {[
                  { icon: <Lock size={18} />, title: "Idempotent", desc: "Safe retries built-in" },
                  { icon: <Activity size={18} />, title: "Webhooks", desc: "Real-time JSON events" },
                  { icon: <RefreshCw size={18} />, title: "Typed SDKs", desc: "TypeScript & Go" },
                  { icon: <Clock size={18} />, title: "43ms Avg", desc: "P99 under 200ms" },
                ].map((item) => (
                  <div key={item.title} className="group">
                    <div className="text-[#4F46E5] mb-3 group-hover:scale-110 transition-transform">{item.icon}</div>
                    <div className="text-white font-bold text-sm mb-1">{item.title}</div>
                    <div className="text-white/30 text-[13px]">{item.desc}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <TypingCode />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ━━━ TESTIMONIAL ━━━ */}
      <section className="py-28 lg:py-40 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center"
          >
            <div className="flex justify-center mb-10">
              <div className="flex -space-x-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] border-2 border-white flex items-center justify-center">
                    <Sparkles size={14} className="text-white" />
                  </div>
                ))}
              </div>
            </div>

            <blockquote className="text-2xl lg:text-[2.5rem] font-extrabold text-[#0F172A] leading-tight tracking-tight mb-12 max-w-3xl mx-auto">
              &ldquo;We went from legacy banking integrations to live payouts
              in one afternoon. Forge is what Stripe should have been for Africa.&rdquo;
            </blockquote>

            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 bg-[#0F172A] rounded-full flex items-center justify-center text-white font-bold text-lg">
                AM
              </div>
              <div>
                <div className="font-bold text-[#0F172A] text-lg">Abubakar Mi</div>
                <div className="text-sm text-[#94A3B8]">CTO, KrediNou Technologies</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ━━━ CTA ━━━ */}
      <section className="py-16 lg:py-20 bg-[#FAFBFC]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative bg-[#0F172A] rounded-[40px] p-12 lg:p-20 text-center overflow-hidden shadow-2xl"
          >
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#4F46E5]/15 rounded-full blur-[120px]" />
              <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-[#7C3AED]/10 rounded-full blur-[100px]" />
              <div className="absolute inset-0 dot-bg opacity-[0.03]" />
            </div>

            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="text-3xl lg:text-5xl font-extrabold text-white tracking-tight mb-6 leading-tight">
                Start building the future
                <br />of finance today.
              </h2>
              <p className="text-white/40 text-lg mb-10 max-w-md mx-auto">
                No lengthy approvals. No archaic processes.
                Get your API keys and ship your first payout in minutes.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/register"
                  className="group bg-white text-[#0F172A] px-10 py-4 rounded-2xl font-bold text-lg hover:bg-[#4F46E5] hover:text-white transition-all duration-300 flex items-center gap-3 shadow-lg"
                >
                  Get Started Free
                  <ArrowUpRight size={20} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>
                <Link
                  href="#developers"
                  className="text-white/50 hover:text-white font-semibold px-6 py-4 transition-colors flex items-center gap-2"
                >
                  View Documentation <ChevronRight size={16} />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ━━━ FOOTER ━━━ */}
      <footer className="bg-[#FAFBFC] pt-20 pb-12 border-t border-[#E2E8F0]/60">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-12 lg:gap-16 pb-16 border-b border-[#E2E8F0]/60">
            <div className="col-span-2 space-y-6">
              <Link href="/" className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-[#4F46E5] rounded-xl flex items-center justify-center">
                  <Zap className="text-white fill-white" size={18} />
                </div>
                <span className="text-xl font-extrabold tracking-tight">Forge</span>
              </Link>
              <p className="text-[#64748B] text-sm leading-relaxed max-w-xs">
                The high-performance financial infrastructure
                platform built for global scale. Engineering
                excellence, built with pride in Nigeria.
              </p>
            </div>

            {[
              { title: "Platform", links: ["Payouts", "Wallets", "Ledgers", "Security"] },
              { title: "Developers", links: ["API Docs", "SDKs", "Webhooks", "Status"] },
              { title: "Company", links: ["About", "Careers", "Blog", "Contact"] },
              { title: "Legal", links: ["Privacy", "Terms", "Compliance", "Licenses"] },
            ].map((group) => (
              <div key={group.title}>
                <h5 className="font-bold text-[11px] uppercase tracking-[0.15em] text-[#0F172A] mb-5">{group.title}</h5>
                <ul className="space-y-3">
                  {group.links.map((link) => (
                    <li key={link}>
                      <Link href="#" className="text-sm text-[#64748B] hover:text-[#4F46E5] transition-colors">
                        {link}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="pt-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-[12px] text-[#94A3B8]">
              &copy; {new Date().getFullYear()} Forge Infrastructure Inc. All rights reserved.
            </div>
            <div className="flex gap-8">
              {["Twitter", "GitHub", "LinkedIn", "Discord"].map((social) => (
                <Link key={social} href="#" className="text-[12px] text-[#94A3B8] hover:text-[#4F46E5] transition-colors font-medium">
                  {social}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
