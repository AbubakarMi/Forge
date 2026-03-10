"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { motion } from "framer-motion";
import { authService } from "@/services/authService";
import {
  Zap, ArrowRight, Mail, Lock, Eye, EyeOff, AlertCircle,
  Shield, Globe, Activity,
} from "lucide-react";

const ease = [0.23, 1, 0.32, 1] as const;

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

    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

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
    <div className="min-h-screen bg-[#030712] flex relative overflow-hidden">
      {/* ── Background effects ── */}
      <div className="absolute inset-0 mesh-gradient opacity-50" />
      <div className="absolute inset-0 grid-bg-dark radial-fade" />
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/[0.07] rounded-full blur-[120px] animate-orb1" />
      <div className="absolute bottom-[-15%] right-[-5%] w-[500px] h-[500px] bg-violet-600/[0.05] rounded-full blur-[100px] animate-orb2" />

      {/* ── Left panel — branding (hidden on mobile) ── */}
      <div className="hidden lg:flex lg:w-[55%] relative items-center justify-center p-12">
        <div className="absolute inset-0 noise" />
        <div className="absolute top-[30%] left-[10%] w-[400px] h-[1px] bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent animate-beam" />
        <div className="absolute top-[60%] left-[5%] w-[300px] h-[1px] bg-gradient-to-r from-transparent via-violet-500/15 to-transparent animate-beam-d" />

        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease }}
          className="relative z-10 max-w-lg"
        >
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 mb-12 group">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center group-hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/20">
              <Zap className="text-white fill-white" size={16} />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">
              Forge<span className="text-indigo-400">API</span>
            </span>
          </Link>

          {/* Headline */}
          <h1 className="text-[2.8rem] font-extrabold text-white tracking-[-0.04em] leading-[1.1] mb-5">
            Financial infrastructure,{" "}
            <span className="text-gradient">forged in code.</span>
          </h1>
          <p className="text-white/50 text-[16px] leading-relaxed mb-12 max-w-md">
            Programmatic payouts, real-time transactions, and multi-currency
            wallets. One API to power your entire money layer.
          </p>

          {/* Feature pills */}
          <div className="space-y-4">
            {[
              {
                icon: <Shield size={16} />,
                title: "Bank-grade security",
                desc: "PCI-DSS Level 1 with end-to-end encryption",
              },
              {
                icon: <Globe size={16} />,
                title: "40+ countries",
                desc: "Move money globally with a single integration",
              },
              {
                icon: <Activity size={16} />,
                title: "43ms average latency",
                desc: "Built for speed with 99.99% uptime SLA",
              },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.12, duration: 0.5, ease }}
                className="flex items-start gap-3.5 group"
              >
                <div className="w-9 h-9 bg-white/[0.04] border border-white/[0.06] rounded-xl flex items-center justify-center text-indigo-400 shrink-0 group-hover:bg-indigo-500/10 group-hover:border-indigo-500/20 transition-all">
                  {f.icon}
                </div>
                <div>
                  <div className="text-white/80 font-semibold text-[13px]">
                    {f.title}
                  </div>
                  <div className="text-white/40 text-[12px]">{f.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Bottom trust */}
          <div className="mt-14 pt-7 border-t border-white/[0.04]">
            <p className="text-white/25 text-[11px] font-medium tracking-wide">
              TRUSTED BY ENGINEERING TEAMS AT
            </p>
            <div className="flex items-center gap-6 mt-3">
              {["TechCorp", "FinStack", "PayFlow", "NexaPay"].map((name) => (
                <span
                  key={name}
                  className="text-white/20 text-[13px] font-bold tracking-tight"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Right panel — login form ── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative">
        {/* Subtle glow behind form */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] bg-indigo-600/[0.03] rounded-full blur-[120px]" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease }}
          className="relative z-10 w-full max-w-[420px]"
        >
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Zap className="text-white fill-white" size={14} />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                Forge<span className="text-indigo-400">API</span>
              </span>
            </Link>
          </div>

          {/* Form header */}
          <div className="mb-8">
            <h2 className="text-2xl font-extrabold text-white tracking-tight mb-2">
              Welcome back
            </h2>
            <p className="text-white/45 text-[14px]">
              Sign in to your Forge dashboard
            </p>
          </div>

          {/* Form card */}
          <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-7 shadow-2xl shadow-black/20">
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-500/[0.08] border border-red-500/20 rounded-xl px-4 py-3 flex items-start gap-2.5"
                >
                  <AlertCircle
                    size={15}
                    className="text-red-400 mt-0.5 shrink-0"
                  />
                  <span className="text-red-400 text-[13px] leading-relaxed">
                    {error}
                  </span>
                </motion.div>
              )}

              {/* Email field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="block text-[12px] font-semibold text-white/50 uppercase tracking-wider"
                >
                  Email
                </label>
                <div
                  className={`relative rounded-xl border transition-all duration-300 ${
                    focused === "email"
                      ? "border-indigo-500/50 bg-white/[0.04] ring-1 ring-indigo-500/20"
                      : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1]"
                  }`}
                >
                  <Mail
                    size={15}
                    className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
                      focused === "email" ? "text-indigo-400" : "text-white/20"
                    }`}
                  />
                  <input
                    id="email"
                    type="email"
                    name="email"
                    placeholder="you@company.com"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocused("email")}
                    onBlur={() => setFocused(null)}
                    className="w-full pl-10 pr-4 py-3 bg-transparent text-white text-[14px] placeholder:text-white/20 focus:outline-none"
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-[12px] font-semibold text-white/50 uppercase tracking-wider"
                  >
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-[11px] text-indigo-400/70 hover:text-indigo-400 transition-colors font-medium"
                  >
                    Forgot?
                  </Link>
                </div>
                <div
                  className={`relative rounded-xl border transition-all duration-300 ${
                    focused === "password"
                      ? "border-indigo-500/50 bg-white/[0.04] ring-1 ring-indigo-500/20"
                      : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1]"
                  }`}
                >
                  <Lock
                    size={15}
                    className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
                      focused === "password"
                        ? "text-indigo-400"
                        : "text-white/20"
                    }`}
                  />
                  <input
                    id="password"
                    type={showPw ? "text" : "password"}
                    name="password"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocused("password")}
                    onBlur={() => setFocused(null)}
                    className="w-full pl-10 pr-11 py-3 bg-transparent text-white text-[14px] placeholder:text-white/20 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors"
                  >
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.01 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="relative w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold text-[14px] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/20 hover:shadow-indigo-500/30 mt-1 overflow-hidden group"
              >
                {/* Button glow */}
                <div className="absolute inset-0 rounded-xl ring-1 ring-white/10 pointer-events-none" />
                {loading ? (
                  <>
                    <svg
                      className="animate-spin w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight
                      size={15}
                      className="group-hover:translate-x-0.5 transition-transform"
                    />
                  </>
                )}
              </motion.button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/[0.04]" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-[#060d1b] px-3 text-[11px] text-white/25 font-medium">
                  OR
                </span>
              </div>
            </div>

            {/* SSO placeholder */}
            <button
              type="button"
              className="w-full bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.1] text-white/60 hover:text-white/80 py-3 rounded-xl font-semibold text-[13px] transition-all duration-300 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>
          </div>

          {/* Register link */}
          <p className="text-center text-white/40 mt-7 text-[13px]">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
            >
              Create one free
            </Link>
          </p>

          {/* Bottom security note */}
          <div className="flex items-center justify-center gap-1.5 mt-5">
            <Lock size={10} className="text-white/20" />
            <span className="text-[10px] text-white/20">
              Protected by 256-bit TLS encryption
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
