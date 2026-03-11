"use client";

import { useState, useEffect, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { motion, AnimatePresence } from "framer-motion";
import { authService } from "@/services/authService";
import {
  Zap, ArrowRight, Mail, Lock, Eye, EyeOff, AlertCircle,
  Shield, Globe, Activity, CheckCircle2, Send, TrendingUp,
  DollarSign, Webhook,
} from "lucide-react";

const ease = [0.23, 1, 0.32, 1] as const;

/* ─── Animated mini dashboard on left panel ─── */
function MiniDashboard() {
  const [activeBar, setActiveBar] = useState(-1);
  const bars = [35, 55, 40, 70, 50, 85, 60, 90, 65, 80, 72, 95];

  useEffect(() => {
    let i = 0;
    const iv = setInterval(() => {
      setActiveBar(i);
      i++;
      if (i > bars.length) clearInterval(iv);
    }, 80);
    return () => clearInterval(iv);
  }, []);

  const transactions = [
    { name: "Payout sent", amount: "NGN 2.5M", icon: <Send size={10} />, color: "text-emerald-600 bg-emerald-50", time: "2s ago" },
    { name: "Webhook fired", amount: "event", icon: <Webhook size={10} />, color: "text-indigo-600 bg-indigo-50", time: "2s ago" },
    { name: "Wallet funded", amount: "+$15,200", icon: <DollarSign size={10} />, color: "text-violet-600 bg-violet-50", time: "8s ago" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.8, ease }}
      className="mt-10 relative"
    >
      {/* Glow */}
      <div className="absolute -inset-4 bg-gradient-to-br from-indigo-200/20 via-violet-100/10 to-transparent rounded-3xl blur-2xl" />

      <div className="relative bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/80 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50/80 border-b border-slate-100">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 bg-indigo-600 rounded-md flex items-center justify-center">
              <Zap className="text-white fill-white" size={9} />
            </div>
            <span className="text-[9px] font-bold text-slate-600">Dashboard</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[8px] font-semibold text-emerald-600">Live</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 p-3">
          {[
            { label: "Revenue", value: "$128K", change: "+12%", icon: <DollarSign size={10} />, bg: "bg-emerald-50 text-emerald-600" },
            { label: "Payouts", value: "2,847", change: "+8%", icon: <Send size={10} />, bg: "bg-indigo-50 text-indigo-600" },
            { label: "Success", value: "99.8%", change: "+0.2%", icon: <TrendingUp size={10} />, bg: "bg-violet-50 text-violet-600" },
          ].map((s, i) => (
            <motion.div key={s.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.9 + i * 0.1, duration: 0.4, ease }}
              className="bg-slate-50/60 rounded-lg p-2 border border-slate-100">
              <div className="flex items-center justify-between mb-1">
                <div className={`w-4 h-4 rounded ${s.bg} flex items-center justify-center`}>{s.icon}</div>
                <span className="text-[7px] font-bold text-emerald-500">{s.change}</span>
              </div>
              <div className="text-[12px] font-extrabold text-slate-900">{s.value}</div>
              <div className="text-[7px] text-slate-400">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Chart */}
        <div className="px-3 pb-2">
          <div className="bg-slate-50/50 rounded-lg border border-slate-100 p-3">
            <div className="text-[8px] font-bold text-slate-500 mb-2">Transaction Volume</div>
            <div className="flex items-end gap-1 h-12">
              {bars.map((h, i) => (
                <motion.div
                  key={i}
                  className="flex-1 bg-gradient-to-t from-indigo-500 to-indigo-400 rounded-t-sm origin-bottom"
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: i <= activeBar ? 1 : 0 }}
                  transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Transactions */}
        <div className="px-3 pb-3">
          {transactions.map((tx, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.6 + i * 0.15, duration: 0.4 }}
              className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
              <div className="flex items-center gap-1.5">
                <div className={`w-4 h-4 rounded ${tx.color} flex items-center justify-center`}>{tx.icon}</div>
                <span className="text-[8px] text-slate-600 font-medium">{tx.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[8px] font-bold text-slate-700">{tx.amount}</span>
                <span className="text-[7px] text-slate-300">{tx.time}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Floating card */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 2.2, duration: 0.5, ease }}
        className="absolute -right-3 top-6 animate-float hidden xl:block"
      >
        <div className="bg-white rounded-lg px-2.5 py-2 shadow-lg shadow-slate-200/60 border border-slate-200 flex items-center gap-2">
          <div className="w-5 h-5 bg-emerald-50 rounded flex items-center justify-center">
            <CheckCircle2 size={10} className="text-emerald-500" />
          </div>
          <div>
            <div className="text-[8px] font-bold text-slate-700">Completed</div>
            <div className="text-[7px] text-slate-400">43ms</div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("Please fill in all fields."); return; }

    setLoading(true);
    try {
      const data = await authService.login(email, password);
      Cookies.set("forge_token", data.token, { expires: 7, sameSite: "Lax" });
      router.push("/dashboard");
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { message?: string } } })?.response
              ?.data?.message || "Invalid email or password. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex relative overflow-hidden">
      {/* Animated background orbs */}
      <motion.div animate={{ x: [0, 25, 0], y: [0, -15, 0] }} transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-15%] right-[10%] w-[500px] h-[500px] bg-indigo-100/40 rounded-full blur-[120px]" />
      <motion.div animate={{ x: [0, -20, 0], y: [0, 20, 0] }} transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[-10%] left-[5%] w-[400px] h-[400px] bg-violet-100/25 rounded-full blur-[100px]" />

      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-[55%] relative items-center justify-center p-12 bg-white border-r border-slate-200/60">
        {/* Subtle grid */}
        <div className="absolute inset-0 grid-bg radial-fade opacity-50" />

        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease }}
          className="relative z-10 max-w-lg w-full"
        >
          <Link href="/" className="flex items-center gap-2.5 mb-10 group">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center group-hover:bg-indigo-700 transition-colors shadow-sm">
              <Zap className="text-white fill-white" size={16} />
            </div>
            <span className="text-lg font-bold text-slate-900 tracking-tight">
              Forge<span className="text-indigo-600">API</span>
            </span>
          </Link>

          <h1 className="text-[2.4rem] font-extrabold text-slate-900 tracking-[-0.04em] leading-[1.1] mb-4">
            Your money layer,{" "}
            <span className="text-gradient">fully managed.</span>
          </h1>
          <p className="text-slate-500 text-[15px] leading-relaxed max-w-md mb-2">
            Programmatic payouts, real-time transactions, and multi-currency wallets — all through one API.
          </p>

          {/* Live dashboard preview */}
          <MiniDashboard />
        </motion.div>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease }}
          className="relative z-10 w-full max-w-[420px]"
        >
          {/* Mobile logo */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Zap className="text-white fill-white" size={14} />
              </div>
              <span className="text-lg font-bold text-slate-900 tracking-tight">Forge<span className="text-indigo-600">API</span></span>
            </Link>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-8">
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">Welcome back</h2>
            <p className="text-slate-400 text-[14px]">Sign in to your Forge dashboard</p>
          </motion.div>

          {/* Form card */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="bg-white rounded-2xl p-7 shadow-sm border border-slate-200 hover:shadow-md transition-shadow duration-500"
          >
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -8, height: 0 }}
                    className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-2.5"
                  >
                    <AlertCircle size={15} className="text-red-500 mt-0.5 shrink-0" />
                    <span className="text-red-600 text-[13px] leading-relaxed">{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email */}
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }} className="space-y-1.5">
                <label htmlFor="email" className="block text-[13px] font-semibold text-slate-700">Email</label>
                <div className={`relative rounded-xl border transition-all duration-300 ${
                  focused === "email"
                    ? "border-indigo-400 bg-white ring-2 ring-indigo-100 shadow-sm"
                    : "border-slate-200 bg-slate-50 hover:border-slate-300"
                }`}>
                  <Mail size={15} className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200 ${
                    focused === "email" ? "text-indigo-500" : "text-slate-400"
                  }`} />
                  <input id="email" type="email" name="email" placeholder="you@company.com" autoComplete="email" required
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocused("email")} onBlur={() => setFocused(null)}
                    className="w-full pl-10 pr-4 py-3 bg-transparent text-slate-900 text-[14px] placeholder:text-slate-400 focus:outline-none" />
                </div>
              </motion.div>

              {/* Password */}
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-[13px] font-semibold text-slate-700">Password</label>
                  <Link href="/forgot-password" className="text-[12px] text-indigo-600 hover:text-indigo-700 transition-colors font-medium">Forgot?</Link>
                </div>
                <div className={`relative rounded-xl border transition-all duration-300 ${
                  focused === "password"
                    ? "border-indigo-400 bg-white ring-2 ring-indigo-100 shadow-sm"
                    : "border-slate-200 bg-slate-50 hover:border-slate-300"
                }`}>
                  <Lock size={15} className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200 ${
                    focused === "password" ? "text-indigo-500" : "text-slate-400"
                  }`} />
                  <input id="password" type={showPw ? "text" : "password"} name="password" placeholder="Enter your password"
                    autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocused("password")} onBlur={() => setFocused(null)}
                    className="w-full pl-10 pr-11 py-3 bg-transparent text-slate-900 text-[14px] placeholder:text-slate-400 focus:outline-none" />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </motion.div>

              {/* Submit */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                <motion.button type="submit" disabled={loading}
                  whileHover={{ scale: loading ? 1 : 1.01, y: loading ? 0 : -1 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold text-[14px] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 mt-1 group">
                  {loading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign in
                      <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </motion.button>
              </motion.div>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
              <div className="relative flex justify-center"><span className="bg-white px-3 text-[11px] text-slate-400 font-medium">OR</span></div>
            </div>

            {/* Google SSO */}
            <motion.button type="button"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
              whileHover={{ scale: 1.01, y: -1 }} whileTap={{ scale: 0.98 }}
              className="w-full bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 py-3 rounded-xl font-semibold text-[13px] transition-all duration-300 flex items-center justify-center gap-2.5 hover:shadow-sm">
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </motion.button>
          </motion.div>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
            className="text-center text-slate-400 mt-7 text-[13px]">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-indigo-600 hover:text-indigo-700 font-semibold transition-colors">Create one free</Link>
          </motion.p>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="flex items-center justify-center gap-1.5 mt-5">
            <Lock size={10} className="text-slate-300" />
            <span className="text-[10px] text-slate-300">Protected by 256-bit TLS encryption</span>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
