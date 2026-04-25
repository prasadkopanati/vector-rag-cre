'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { QAThread } from '@/components/QAThread';
import { AuthModal } from '@/components/AuthModal';

const FOUNDING_LINK = process.env.NEXT_PUBLIC_STRIPE_FOUNDING_MEMBER_LINK ?? '#pricing';
const ANNUAL_LINK = process.env.NEXT_PUBLIC_STRIPE_ANNUAL_LINK ?? '#pricing';

export default function LandingPage() {
  const [showAuth, setShowAuth] = useState(false);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative pt-24 pb-20 px-6 text-center overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute inset-0 -z-10 flex justify-center">
          <div className="w-[600px] h-[300px] bg-amber-500/5 rounded-full blur-3xl mt-10" />
        </div>

        <div className="max-w-3xl mx-auto">
          <span className="inline-block text-xs font-semibold uppercase tracking-widest text-amber-400 border border-amber-400/30 rounded-full px-3 py-1 mb-6">
            Commercial &amp; Industrial Real Estate
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight mb-6">
            AI That Knows{' '}
            <span className="text-amber-400">Commercial Real Estate</span>
          </h1>
          <p className="text-lg text-gray-400 max-w-xl mx-auto mb-10 leading-relaxed">
            Ask anything. Get answers grounded in the world&apos;s best investment
            books — with citations, not hallucinations.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={FOUNDING_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold px-8 py-3.5 rounded-xl text-base transition-colors"
            >
              Join as Founding Member — $99
            </a>
            <a
              href="#demo"
              className="inline-block border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white px-8 py-3.5 rounded-xl text-base transition-colors"
            >
              Try the Demo ↓
            </a>
          </div>
          <p className="text-gray-600 text-xs mt-4">
            Only 65 founding member spots · No recurring fee
          </p>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-20 px-6 border-t border-gray-800/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12 text-white">
            Everything you need to invest smarter
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              icon="📚"
              title="Grounded AI Q&A"
              description="Ask any commercial real estate question. Every answer is pulled from real investment books — with the source cited."
            />
            <FeatureCard
              icon="🎯"
              title="AI Deal Coach"
              description="Post your deal analysis in the thread. AI evaluates it against proven frameworks and flags what you might be missing."
            />
            <FeatureCard
              icon="🔢"
              title="Deal Analyzer"
              description="Instant underwriting: Cap Rate, NOI, Cash-on-Cash Return, and GRM — calculated live as you type."
            />
          </div>
        </div>
      </section>

      {/* ── Live Demo ── */}
      <section id="demo" className="py-20 px-6 border-t border-gray-800/50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold mb-3">Try it live</h2>
            <p className="text-gray-400 text-sm">
              Real questions. Real book knowledge. Ask anything below.
            </p>
          </div>
          <QAThread onSignInRequired={() => setShowAuth(true)} />
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-20 px-6 border-t border-gray-800/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-3">Simple pricing</h2>
            <p className="text-gray-400 text-sm">One investment. Unlimited questions.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Founding Member */}
            <div className="relative bg-gray-900 border border-amber-500/40 rounded-2xl p-8 overflow-hidden">
              <div className="absolute top-4 right-4 bg-amber-500 text-gray-950 text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-full">
                Limited
              </div>
              <p className="text-amber-400 text-xs font-semibold uppercase tracking-widest mb-3">
                Founding Member
              </p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-5xl font-bold">$99</span>
                <span className="text-gray-400 text-sm">one-time</span>
              </div>
              <p className="text-gray-500 text-xs mb-6">Only 65 spots · No recurring fee</p>
              <ul className="space-y-2.5 mb-8 text-sm text-gray-300">
                {[
                  'Unlimited AI Q&A',
                  'AI Deal Coach feedback',
                  'Deal Analyzer tool',
                  'Live community thread',
                  'All future book additions',
                  'Founding member badge',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="text-amber-400">✓</span> {f}
                  </li>
                ))}
              </ul>
              <a
                href={FOUNDING_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold py-3 rounded-xl transition-colors"
              >
                Claim Your Spot
              </a>
            </div>

            {/* Annual */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-3">
                Annual Member
              </p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-5xl font-bold">$27</span>
                <span className="text-gray-400 text-sm">/year</span>
              </div>
              <p className="text-gray-500 text-xs mb-6">Less than $2.25/month</p>
              <ul className="space-y-2.5 mb-8 text-sm text-gray-300">
                {[
                  'Unlimited AI Q&A',
                  'AI Deal Coach feedback',
                  'Deal Analyzer tool',
                  'Live community thread',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="text-gray-400">✓</span> {f}
                  </li>
                ))}
              </ul>
              <a
                href={ANNUAL_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center border border-gray-700 hover:border-gray-500 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                Subscribe Annually
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-800/50 py-10 px-6 text-center text-gray-600 text-sm">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-amber-400 font-bold text-base">Circle So</span>
          <div className="flex gap-6">
            <Link href="/deal-analyzer" className="hover:text-gray-400 transition-colors">
              Deal Analyzer
            </Link>
            <Link href="/submit-deal" className="hover:text-gray-400 transition-colors">
              Submit a Deal
            </Link>
            <a href="mailto:hello@circleso.com" className="hover:text-gray-400 transition-colors">
              Contact
            </a>
          </div>
          <span>© {new Date().getFullYear()} Circle So. All rights reserved.</span>
        </div>
      </footer>

      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-colors">
      <div className="text-3xl mb-4">{icon}</div>
      <h3 className="text-white font-semibold text-base mb-2">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
    </div>
  );
}
