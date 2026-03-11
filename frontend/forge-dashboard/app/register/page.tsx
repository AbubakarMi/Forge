"use client";

import { useState, useEffect, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { authService } from "@/services/authService";
import {
  Zap, ArrowRight, Mail, Lock, Eye, EyeOff, AlertCircle,
  CheckCircle2, Shield, Globe, Activity, Check, Code2,
  CreditCard, Wallet, Send, BarChart3,
} from "lucide-react";

const ease = [0.23, 1, 0.32, 1] as const;

/* ─── Animated API flow illustration ─── */
function ApiFlowAnimation() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => {
      setStep(prev => (prev + 1) % 4);
    }, 2500);
    return () => clearInterval(iv);
  }, []);

  const steps = [
    { label: "API Call", icon: <Code2 size={14} />, color: "bg-indigo-50 text-indigo-600 border-indigo-200" },
    { label: "Process", icon: <Shield size={14} />, color: "bg-amber-50 text-amber-600 border-amber-200" },
    { label: "Payout", icon: <Send size={14} />, color: "bg-emerald-50 text-emerald-600 border-emerald-200" },
    { label: "Complete", icon: <CheckCircle2 size={14} />, color: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.8, ease }}
      className="mt-10 relative"
    >
      <div className="absolute -inset-4 bg-gradient-to-br from-indigo-200/20 via-violet-100/10 to-transparent rounded-3xl blur-2xl" />

      <div className="relative bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/80 overflow-hidden p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <span className="text-[10px] font-bold text-slate-600">How Forge Works</span>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[8px] font-semibold text-emerald-600">Live</span>
          </div>
        </div>

        {/* Flow steps */}
        <div className="flex items-center justify-between gap-2 mb-6">
          {steps.map((s, i) => (
            <div key={i} className="flex-1 flex flex-col items-center relative">
              <motion.div
                animate={{
                  scale: step === i ? 1.15 : 1,
                  boxShadow: step === i ? "0 4px 12px rgba(79,70,229,0.15)" : "0 0 0 transparent",
                }}
                transition={{ duration: 0.4 }}
                className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-1.5 transition-colors ${
                  step >= i ? s.color : "bg-slate-50 text-slate-300 border-slate-200"
                }`}
              >
                {s.icon}
              </motion.div>
              <span className={`text-[8px] font-semibold transition-colors ${step >= i ? "text-slate-700" : "text-slate-300"}`}>{s.label}</span>
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="absolute top-5 left-[60%] right-[-40%] h-[2px] bg-slate-100 overflow-hidden">
                  <motion.div
                    className="h-full bg-indigo-400 origin-left"
                    animate={{ scaleX: step > i ? 1 : 0 }}
                    transition={{ duration: 0.6, ease }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Animated code snippet */}
        <div className="bg-[#0F172A] rounded-xl p-3.5 font-mono text-[10px] leading-[1.8]">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="s0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                <span className="text-slate-400">const </span><span className="text-indigo-400">payout</span><span className="text-slate-400"> = await forge.</span><span className="text-indigo-400">payouts.create</span><span className="text-slate-500">({"{"}</span>
                <br /><span className="text-slate-500">  amount: </span><span className="text-amber-300">2_500_000</span><span className="text-slate-500">,</span>
                <br /><span className="text-slate-500">  currency: </span><span className="text-emerald-400">&apos;NGN&apos;</span>
                <br /><span className="text-slate-500">{"}"})</span>
              </motion.div>
            )}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                <span className="text-amber-400">// Validating & fraud check...</span>
                <br /><span className="text-slate-400">status: </span><span className="text-amber-300">&apos;processing&apos;</span>
                <br /><span className="text-slate-400">fraud_check: </span><span className="text-emerald-400">&apos;passed&apos;</span>
                <br /><span className="text-slate-400">latency: </span><span className="text-indigo-400">12ms</span>
              </motion.div>
            )}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                <span className="text-emerald-400">// Sending to bank...</span>
                <br /><span className="text-slate-400">bank: </span><span className="text-amber-300">&apos;Zenith Bank&apos;</span>
                <br /><span className="text-slate-400">account: </span><span className="text-indigo-400">****4521</span>
                <br /><span className="text-slate-400">rail: </span><span className="text-violet-400">&apos;instant&apos;</span>
              </motion.div>
            )}
            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                <span className="text-emerald-400">// Payout completed!</span>
                <br /><span className="text-slate-400">status: </span><span className="text-emerald-400">&apos;completed&apos;</span>
                <br /><span className="text-slate-400">amount: </span><span className="text-amber-300">NGN 2,500,000</span>
                <br /><span className="text-slate-400">total_latency: </span><span className="text-indigo-400">43ms</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Feature badges */}
        <div className="flex gap-2 mt-4">
          {[
            { icon: <CreditCard size={10} />, label: "Payouts" },
            { icon: <Wallet size={10} />, label: "Wallets" },
            { icon: <BarChart3 size={10} />, label: "Analytics" },
            { icon: <Globe size={10} />, label: "40+ Countries" },
          ].map((f, i) => (
            <motion.div key={f.label}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.2 + i * 0.08, type: "spring", stiffness: 300 }}
              className="flex items-center gap-1 bg-slate-50 border border-slate-100 rounded-md px-2 py-1">
              <span className="text-indigo-500">{f.icon}</span>
              <span className="text-[7px] font-semibold text-slate-500">{f.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  const pwChecks = [
    { label: "8+ characters", met: password.length >= 8 },
    { label: "Contains number", met: /\d/.test(password) },
    { label: "Uppercase letter", met: /[A-Z]/.test(password) },
  ];

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    if (!email || !password || !confirmPassword) { setError("Please fill in all fields."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters long."); return; }
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }

    setLoading(true);
    try {
      await authService.register(email, password);
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { message?: string } } })?.response
              ?.data?.message || "Registration failed. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex relative overflow-hidden">
      <motion.div animate={{ x: [0, 25, 0], y: [0, -15, 0] }} transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-15%] right-[10%] w-[500px] h-[500px] bg-indigo-100/40 rounded-full blur-[120px]" />
      <motion.div animate={{ x: [0, -20, 0], y: [0, 20, 0] }} transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[-10%] left-[5%] w-[400px] h-[400px] bg-violet-100/25 rounded-full blur-[100px]" />

      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-[55%] relative items-center justify-center p-12 bg-white border-r border-slate-200/60">
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
            Start building{" "}
            <span className="text-gradient">in minutes.</span>
          </h1>
          <p className="text-slate-500 text-[15px] leading-relaxed max-w-md mb-2">
            Get instant access to production-ready financial APIs. No approvals, no delays — just sign up and ship.
          </p>

          {/* Animated API flow */}
          <ApiFlowAnimation />
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
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">Create your account</h2>
            <p className="text-slate-400 text-[14px]">Start building with Forge in minutes</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="bg-white rounded-2xl p-7 shadow-sm border border-slate-200 hover:shadow-md transition-shadow duration-500"
          >
            <AnimatePresence mode="wait">
              {success ? (
                <motion.div key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8">
                  <motion.div
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                    className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center mx-auto mb-5">
                    <CheckCircle2 size={28} className="text-emerald-500" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Account created!</h3>
                  <p className="text-slate-400 text-[14px] mb-1">Redirecting you to sign in...</p>
                  <div className="mt-4">
                    <div className="w-32 h-1.5 bg-slate-100 rounded-full mx-auto overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: "100%" }}
                        transition={{ duration: 2.5, ease: "linear" }}
                        className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full" />
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.form key="form" onSubmit={handleSubmit} className="space-y-5" noValidate>
                  <AnimatePresence>
                    {error && (
                      <motion.div initial={{ opacity: 0, y: -8, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: -8, height: 0 }}
                        className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-2.5">
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
                    <label htmlFor="password" className="block text-[13px] font-semibold text-slate-700">Password</label>
                    <div className={`relative rounded-xl border transition-all duration-300 ${
                      focused === "password"
                        ? "border-indigo-400 bg-white ring-2 ring-indigo-100 shadow-sm"
                        : "border-slate-200 bg-slate-50 hover:border-slate-300"
                    }`}>
                      <Lock size={15} className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200 ${
                        focused === "password" ? "text-indigo-500" : "text-slate-400"
                      }`} />
                      <input id="password" type={showPw ? "text" : "password"} name="password" placeholder="Create a password"
                        autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)}
                        onFocus={() => setFocused("password")} onBlur={() => setFocused(null)}
                        className="w-full pl-10 pr-11 py-3 bg-transparent text-slate-900 text-[14px] placeholder:text-slate-400 focus:outline-none" />
                      <button type="button" onClick={() => setShowPw(!showPw)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                        {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>

                    <AnimatePresence>
                      {password.length > 0 && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                          className="flex items-center gap-3 pt-1.5">
                          {pwChecks.map((c) => (
                            <motion.div key={c.label}
                              animate={{ scale: c.met ? [1, 1.15, 1] : 1 }}
                              transition={{ duration: 0.3 }}
                              className="flex items-center gap-1">
                              <Check size={10} className={c.met ? "text-emerald-500" : "text-slate-300"} />
                              <span className={`text-[10px] font-medium transition-colors ${c.met ? "text-emerald-600" : "text-slate-400"}`}>{c.label}</span>
                            </motion.div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Confirm Password */}
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }} className="space-y-1.5">
                    <label htmlFor="confirmPassword" className="block text-[13px] font-semibold text-slate-700">Confirm Password</label>
                    <div className={`relative rounded-xl border transition-all duration-300 ${
                      focused === "confirm"
                        ? "border-indigo-400 bg-white ring-2 ring-indigo-100 shadow-sm"
                        : confirmPassword && password !== confirmPassword
                        ? "border-red-300 bg-red-50/50"
                        : confirmPassword && password === confirmPassword
                        ? "border-emerald-300 bg-emerald-50/30"
                        : "border-slate-200 bg-slate-50 hover:border-slate-300"
                    }`}>
                      <Lock size={15} className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200 ${
                        focused === "confirm" ? "text-indigo-500"
                        : confirmPassword && password === confirmPassword ? "text-emerald-500"
                        : "text-slate-400"
                      }`} />
                      <input id="confirmPassword" type={showCpw ? "text" : "password"} name="confirmPassword"
                        placeholder="Confirm your password" autoComplete="new-password" required
                        value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                        onFocus={() => setFocused("confirm")} onBlur={() => setFocused(null)}
                        className="w-full pl-10 pr-11 py-3 bg-transparent text-slate-900 text-[14px] placeholder:text-slate-400 focus:outline-none" />
                      <button type="button" onClick={() => setShowCpw(!showCpw)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                        {showCpw ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    <AnimatePresence>
                      {confirmPassword && password !== confirmPassword && (
                        <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                          className="text-red-500 text-[11px] flex items-center gap-1 mt-1 font-medium">
                          <AlertCircle size={10} /> Passwords do not match
                        </motion.p>
                      )}
                      {confirmPassword && password === confirmPassword && (
                        <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                          className="text-emerald-500 text-[11px] flex items-center gap-1 mt-1 font-medium">
                          <CheckCircle2 size={10} /> Passwords match
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Submit */}
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
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
                          Creating account...
                        </>
                      ) : (
                        <>
                          Create account
                          <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                        </>
                      )}
                    </motion.button>
                  </motion.div>

                  <p className="text-slate-400 text-[11px] text-center leading-relaxed pt-1">
                    By creating an account, you agree to our{" "}
                    <Link href="#" className="text-slate-500 hover:text-slate-700 underline underline-offset-2">Terms</Link>{" "}and{" "}
                    <Link href="#" className="text-slate-500 hover:text-slate-700 underline underline-offset-2">Privacy Policy</Link>
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
            className="text-center text-slate-400 mt-7 text-[13px]">
            Already have an account?{" "}
            <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-semibold transition-colors">Sign in</Link>
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
