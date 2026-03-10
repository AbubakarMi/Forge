import Link from 'next/link'
import Image from 'next/image'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#0F172A] selection:bg-[#4F46E5]/10 font-sans">
      {/* --- Premium Navigation --- */}
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-white/70 backdrop-blur-xl border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2.5 group cursor-pointer">
            <div className="w-10 h-10 bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] rounded-xl flex items-center justify-center shadow-lg shadow-[#4F46E5]/30 group-hover:rotate-12 transition-transform duration-500">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-2xl font-black tracking-tighter text-[#0F172A]">Forge</span>
          </div>

          <div className="hidden lg:flex items-center gap-10">
            {['Solutions', 'Developers', 'Pricing', 'Docs'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-sm font-bold text-[#64748B] hover:text-[#4F46E5] transition-colors relative group"
              >
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#4F46E5] transition-all group-hover:w-full" />
              </a>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="px-5 py-2.5 text-sm font-bold text-[#64748B] hover:text-[#0F172A] transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="bg-[#4F46E5] text-white px-6 py-3 rounded-2xl font-black text-sm hover:translate-y-[-2px] hover:shadow-2xl hover:shadow-[#4F46E5]/40 active:translate-y-0 transition-all duration-300"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* --- High-Impact Hero Section --- */}
      <section className="relative pt-48 pb-32 overflow-hidden bg-white">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#4F46E5]/5 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[10%] right-[-5%] w-[40%] h-[40%] bg-[#7C3AED]/5 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          <div className="relative z-10 space-y-10">
            <div className="inline-flex items-center gap-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-full pl-2 pr-5 py-2 hover:border-[#4F46E5]/30 transition-all duration-500 cursor-pointer shadow-sm">
              <span className="bg-[#4F46E5] text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest">v3.0</span>
              <span className="text-xs font-bold text-[#64748B]">Next-gen Financial Logic Engine is Live</span>
              <svg className="w-4 h-4 text-[#4F46E5]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
            </div>

            <h1 className="text-6xl lg:text-[6.5rem] font-[1000] tracking-tight text-[#0F172A] leading-[0.95] text-balance">
              The Engine for <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4F46E5] via-[#7C3AED] to-[#4F46E5] bg-[length:200%_auto] animate-gradient italic">Borderless Finance.</span>
            </h1>

            <p className="text-xl text-[#64748B] leading-relaxed max-w-xl font-medium">
              Forge empowers developers across Africa and the world to integrate programmable money movement and bulk payouts directly into their apps.
              Built for speed, scale, and global integration.
            </p>

            <div className="flex flex-col sm:flex-row gap-6">
              <Link
                href="/register"
                className="bg-[#4F46E5] text-white px-12 py-6 rounded-[24px] font-black text-lg hover:shadow-[0_25px_50px_-12px_rgba(79,70,229,0.5)] hover:scale-[1.03] active:scale-[0.97] transition-all duration-500 flex items-center justify-center gap-3"
              >
                Launch Infrastructure
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link
                href="#docs"
                className="bg-white text-[#0F172A] border-2 border-[#E2E8F0] px-12 py-6 rounded-[24px] font-black text-lg hover:border-[#4F46E5] hover:bg-[#F8FAFC] transition-all duration-300 flex items-center justify-center gap-2"
              >
                API Docs
              </Link>
            </div>

            <div className="pt-10">
              <span className="text-[10px] font-black text-[#64748B] uppercase tracking-[0.4em] block mb-6">World-Class Engineering</span>
              <div className="flex items-center gap-12 opacity-30 grayscale saturate-0 animate-fade-in">
                <div className="text-2xl font-black tracking-tighter italic">Nigeria</div>
                <div className="text-2xl font-black tracking-tighter italic">UK</div>
                <div className="text-2xl font-black tracking-tighter italic">USA</div>
                <div className="text-2xl font-black tracking-tighter italic">UAE</div>
              </div>
            </div>
          </div>

          <div className="relative group perspective-1000">
            <div className="absolute inset-0 bg-gradient-to-br from-[#4F46E5]/30 to-[#7C3AED]/30 rounded-[64px] blur-3xl opacity-40 group-hover:opacity-60 transition-opacity duration-700" />
            <div className="relative bg-[#F8FAFC] p-4 rounded-[64px] shadow-[0_80px_160px_-40px_rgba(0,0,0,0.15)] border border-[#E2E8F0] overflow-hidden transform group-hover:rotate-1 group-hover:scale-[1.02] transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)]">
              <Image
                src="/hero-illustration.png"
                alt="Forge Global Financial Engine Illustration"
                width={1000}
                height={1000}
                className="rounded-[52px] drop-shadow-3xl"
                priority
              />
              <div className="absolute bottom-10 left-10 right-10 bg-white/40 backdrop-blur-2xl border border-white/20 p-8 rounded-[32px] shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-black text-[#0F172A] uppercase tracking-widest">Network Throughput</span>
                  <span className="text-xs font-bold text-[#4F46E5]">Live</span>
                </div>
                <div className="h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] w-[88%] animate-shimmer" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- Feature Deep-Dive --- */}
      <section id="solutions" className="py-40 bg-[#F8FAFC] relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-24 items-center mb-32">
            <div>
              <h2 className="text-[10px] font-black text-[#4F46E5] uppercase tracking-[0.5em] mb-6">Core Infrastructure</h2>
              <h3 className="text-5xl lg:text-6xl font-black text-[#0F172A] leading-[1.1] mb-10 tracking-tight">
                Built for <br /> Builders, everywhere.
              </h3>
              <p className="text-xl text-[#64748B] leading-relaxed mb-12 font-medium">
                We abstract the complexity of financial integration. Instead of months of negotiation with banks,
                Forge provides you with a direct bridge to global money movement in minutes.
              </p>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <div className="text-4xl font-black text-[#0F172A] mb-2">$500M+</div>
                  <div className="text-sm font-bold text-[#64748B]">Processed Monthly</div>
                </div>
                <div>
                  <div className="text-4xl font-black text-[#0F172A] mb-2">99.99%</div>
                  <div className="text-sm font-bold text-[#64748B]">Uptime Guaranteed</div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {[
                { title: 'Marketplaces', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
                { title: 'Fintechs', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
                { title: 'E-commerce', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z' },
                { title: 'SaaS Platforms', icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4' }
              ].map((s, i) => (
                <div key={i} className="bg-white p-8 rounded-[32px] border border-[#E2E8F0] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500">
                  <div className="w-12 h-12 bg-[#4F46E5]/5 text-[#4F46E5] rounded-2xl flex items-center justify-center mb-6">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={s.icon} /></svg>
                  </div>
                  <h4 className="text-lg font-black text-[#0F172A]">{s.title}</h4>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* --- Developer Section --- */}
      <section id="developers" className="py-40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-[#0F172A] rounded-[64px] p-12 lg:p-24 overflow-hidden relative shadow-3xl">
            <div className="absolute top-0 right-0 w-[50%] h-[100%] bg-[#4F46E5]/10 blur-[120px] pointer-events-none" />
            <div className="grid lg:grid-cols-2 gap-20 items-center relative z-10">
              <div>
                <h3 className="text-4xl lg:text-5xl font-black text-white leading-tight mb-8">
                  Shipping code, <br /> not forms.
                </h3>
                <p className="text-lg text-white/50 leading-relaxed mb-12">
                  Our developer experience is second to none. Fully typed SDKs, obsessive documentation,
                  and a sandbox that works exactly like production.
                </p>
                <div className="space-y-6">
                  {['RESTful & JSON First', 'Idempotent Keys', 'Real-time Webhooks', 'Sandbox Environment'].map(item => (
                    <div key={item} className="flex items-center gap-4 group cursor-pointer">
                      <div className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center group-hover:bg-[#4F46E5] group-hover:border-[#4F46E5] transition-all">
                        <svg className="w-3.5 h-3.5 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
                      </div>
                      <span className="text-sm font-bold text-white/80 group-hover:text-white transition-colors">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative group overflow-hidden rounded-[32px] border border-white/5 shadow-2xl">
                <div className="bg-white/5 px-6 py-4 flex items-center gap-2 border-b border-white/5">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400/20" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400/20" />
                    <div className="w-3 h-3 rounded-full bg-green-400/20" />
                  </div>
                  <span className="ml-4 text-[10px] font-black uppercase text-white/30 tracking-widest">create_transfer.ts</span>
                </div>
                <div className="bg-[#0A101E] p-10 font-mono text-sm leading-relaxed overflow-x-auto">
                  <pre className="text-white/40">
                    <code className="text-white">
                      <span className="text-[#4F46E5]">import</span> Forge <span className="text-[#4F46E5]">from</span> <span className="text-emerald-400">&apos;@forge/sdk&apos;</span>;{"\n"}
                      {"\n"}
                      <span className="text-[#7C3AED]">const</span> sdk = <span className="text-[#7C3AED]">new</span> Forge(<span className="text-white/20">&apos;...&apos;</span>);{"\n"}
                      {"\n"}
                      <span className="text-[#7C3AED]">const</span> tx = <span className="text-[#7C3AED]">await</span> sdk.transfers.create({"{"}{"\n"}
                      {"  "}amount: <span className="text-orange-400">1000000</span>, <span className="text-white/10">// NGN 1M</span>{"\n"}
                      {"  "}currency: <span className="text-emerald-400">&apos;NGN&apos;</span>,{"\n"}
                      {"  "}to: <span className="text-emerald-400">&apos;acct_9821&apos;</span>{"\n"}
                      {"}"});
                    </code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- Footer & Attribution --- */}
      <footer className="bg-white border-t border-[#E2E8F0] pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-16 mb-24">
            <div className="col-span-2 space-y-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#4F46E5] rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="text-2xl font-black tracking-tight text-[#0F172A]">Forge</span>
              </div>
              <p className="text-[#64748B] font-medium leading-relaxed max-w-sm">
                World-class financial infrastructure built for the new internet.
                Engineering excellence, built by developers in <span className="text-[#0F172A] font-black underline decoration-[#4F46E5] decoration-2 underline-offset-4">Nigeria</span>.
              </p>
            </div>
            <div>
              <h5 className="font-black text-xs uppercase tracking-[0.2em] text-[#0F172A] mb-8">Platform</h5>
              <ul className="space-y-4 text-sm font-bold text-[#64748B]">
                <li><Link href="#" className="hover:text-[#4F46E5] transition-all">Payouts API</Link></li>
                <li><Link href="#" className="hover:text-[#4F46E5] transition-all">Wallets</Link></li>
                <li><Link href="#" className="hover:text-[#4F46E5] transition-all">Ledgers</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="font-black text-xs uppercase tracking-[0.2em] text-[#0F172A] mb-8">Resources</h5>
              <ul className="space-y-4 text-sm font-bold text-[#64748B]">
                <li><Link href="#" className="hover:text-[#4F46E5] transition-all">Documentation</Link></li>
                <li><Link href="#" className="hover:text-[#4F46E5] transition-all">API Status</Link></li>
                <li><Link href="#" className="hover:text-[#4F46E5] transition-all">GitHub</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="font-black text-xs uppercase tracking-[0.2em] text-[#0F172A] mb-8">Company</h5>
              <ul className="space-y-4 text-sm font-bold text-[#64748B]">
                <li><Link href="#" className="hover:text-[#4F46E5] transition-all">About Us</Link></li>
                <li><Link href="#" className="hover:text-[#4F46E5] transition-all">Careers</Link></li>
                <li><Link href="#" className="hover:text-[#4F46E5] transition-all">Contact</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-16 border-t border-[#E2E8F0] flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <span className="text-xs font-bold text-[#64748B] uppercase tracking-widest">© 2026 Forge Infrastructure Inc.</span>
              <span className="w-1 h-1 bg-[#64748B] rounded-full" />
              <span className="text-xs font-black text-[#0F172A] uppercase tracking-widest">Built in Nigeria</span>
            </div>
            <div className="flex gap-10 text-xs font-bold text-[#64748B] uppercase tracking-widest">
              <Link href="#" className="hover:text-[#0F172A] transition-colors">Privacy</Link>
              <Link href="#" className="hover:text-[#0F172A] transition-colors">Terms</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
