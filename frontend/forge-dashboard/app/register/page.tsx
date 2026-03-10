"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { authService } from "@/services/authService";
import {
  Zap, ArrowRight, Mail, Lock, Eye, EyeOff, AlertCircle,
  CheckCircle2, Shield, Globe, Activity, Check,
} from "lucide-react";

const ease = [0.23, 1, 0.32, 1] as const;

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

    if (!email || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

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
            Start building{" "}
            <span className="text-gradient">in minutes.</span>
          </h1>
          <p className="text-white/50 text-[16px] leading-relaxed mb-12 max-w-md">
            Get instant access to production-ready financial APIs. No lengthy
            approvals, no compliance delays. Just sign up and ship.
          </p>

          {/* Feature pills */}
          <div className="space-y-4">
            {[
              {
                icon: <Shield size={16} />,
                title: "Instant API keys",
                desc: "Generate production keys the moment you sign up",
              },
              {
                icon: <Globe size={16} />,
                title: "Free tier included",
                desc: "1,000 API calls per month at no cost",
              },
              {
                icon: <Activity size={16} />,
                title: "Ship your first payout",
                desc: "From sign-up to live payout in under 5 minutes",
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

      {/* ── Right panel — register form ── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative">
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
              Create your account
            </h2>
            <p className="text-white/45 text-[14px]">
              Start building with Forge in minutes
            </p>
          </div>

          {/* Form card */}
          <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-7 shadow-2xl shadow-black/20">
            <AnimatePresence mode="wait">
              {success ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                    className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5"
                  >
                    <CheckCircle2 size={28} className="text-emerald-400" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    Account created!
                  </h3>
                  <p className="text-white/45 text-[14px] mb-1">
                    Redirecting you to sign in...
                  </p>
                  <div className="mt-4">
                    <div className="w-24 h-1 bg-white/[0.06] rounded-full mx-auto overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 2.5, ease: "linear" }}
                        className="h-full bg-indigo-500 rounded-full"
                      />
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  onSubmit={handleSubmit}
                  className="space-y-5"
                  noValidate
                >
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

                  {/* Email */}
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
                          focused === "email"
                            ? "text-indigo-400"
                            : "text-white/20"
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

                  {/* Password */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="password"
                      className="block text-[12px] font-semibold text-white/50 uppercase tracking-wider"
                    >
                      Password
                    </label>
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
                        placeholder="Create a password"
                        autoComplete="new-password"
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

                    {/* Password strength */}
                    {password.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="flex items-center gap-3 pt-1.5"
                      >
                        {pwChecks.map((c) => (
                          <div
                            key={c.label}
                            className="flex items-center gap-1"
                          >
                            <Check
                              size={10}
                              className={
                                c.met ? "text-emerald-400" : "text-white/15"
                              }
                            />
                            <span
                              className={`text-[10px] ${
                                c.met ? "text-emerald-400/80" : "text-white/25"
                              }`}
                            >
                              {c.label}
                            </span>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="confirmPassword"
                      className="block text-[12px] font-semibold text-white/50 uppercase tracking-wider"
                    >
                      Confirm Password
                    </label>
                    <div
                      className={`relative rounded-xl border transition-all duration-300 ${
                        focused === "confirm"
                          ? "border-indigo-500/50 bg-white/[0.04] ring-1 ring-indigo-500/20"
                          : confirmPassword &&
                            password !== confirmPassword
                          ? "border-red-500/30 bg-red-500/[0.02]"
                          : confirmPassword && password === confirmPassword
                          ? "border-emerald-500/30 bg-emerald-500/[0.02]"
                          : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1]"
                      }`}
                    >
                      <Lock
                        size={15}
                        className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
                          focused === "confirm"
                            ? "text-indigo-400"
                            : "text-white/20"
                        }`}
                      />
                      <input
                        id="confirmPassword"
                        type={showCpw ? "text" : "password"}
                        name="confirmPassword"
                        placeholder="Confirm your password"
                        autoComplete="new-password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        onFocus={() => setFocused("confirm")}
                        onBlur={() => setFocused(null)}
                        className="w-full pl-10 pr-11 py-3 bg-transparent text-white text-[14px] placeholder:text-white/20 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCpw(!showCpw)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors"
                      >
                        {showCpw ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    {confirmPassword && password !== confirmPassword && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-red-400 text-[11px] flex items-center gap-1 mt-1"
                      >
                        <AlertCircle size={10} /> Passwords do not match
                      </motion.p>
                    )}
                  </div>

                  {/* Submit */}
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: loading ? 1 : 1.01 }}
                    whileTap={{ scale: loading ? 1 : 0.98 }}
                    className="relative w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold text-[14px] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/20 hover:shadow-indigo-500/30 mt-1 overflow-hidden group"
                  >
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
                        Creating account...
                      </>
                    ) : (
                      <>
                        Create account
                        <ArrowRight
                          size={15}
                          className="group-hover:translate-x-0.5 transition-transform"
                        />
                      </>
                    )}
                  </motion.button>

                  {/* Terms */}
                  <p className="text-white/25 text-[10px] text-center leading-relaxed pt-1">
                    By creating an account, you agree to our{" "}
                    <Link
                      href="#"
                      className="text-white/40 hover:text-white/60 underline underline-offset-2"
                    >
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link
                      href="#"
                      className="text-white/40 hover:text-white/60 underline underline-offset-2"
                    >
                      Privacy Policy
                    </Link>
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          {/* Login link */}
          <p className="text-center text-white/40 mt-7 text-[13px]">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
            >
              Sign in
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
