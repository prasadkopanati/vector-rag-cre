'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { AuthModal } from './AuthModal';

export function Navbar() {
  const { user, loading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  return (
    <>
      <nav className="sticky top-0 z-40 border-b border-gray-800/60 bg-gray-950/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-amber-400 text-xl font-bold tracking-tight group-hover:text-amber-300 transition-colors">
              Circle So
            </span>
            <span className="hidden sm:block text-gray-600 text-xs uppercase tracking-widest mt-0.5">
              CRE Intelligence
            </span>
          </Link>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-6 text-sm text-gray-400">
            <Link href="/#features" className="hover:text-white transition-colors">Features</Link>
            <Link href="/#demo" className="hover:text-white transition-colors">Live Demo</Link>
            <Link href="/deal-analyzer" className="hover:text-white transition-colors">Deal Analyzer</Link>
            <Link href="/#pricing" className="hover:text-white transition-colors">Pricing</Link>
          </div>

          {/* Auth */}
          <div className="flex items-center gap-3">
            {!loading && (
              user ? (
                <div className="flex items-center gap-3">
                  <span className="hidden sm:block text-gray-500 text-xs truncate max-w-[160px]">
                    {user.email}
                  </span>
                  <button
                    onClick={() => signOut(auth)}
                    className="text-gray-400 hover:text-white text-sm transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => setShowAuth(true)}
                    className="text-gray-300 hover:text-white text-sm transition-colors"
                  >
                    Sign In
                  </button>
                  <Link
                    href="/#pricing"
                    className="bg-amber-500 hover:bg-amber-400 text-gray-950 font-semibold text-sm px-4 py-1.5 rounded-lg transition-colors"
                  >
                    Join
                  </Link>
                </>
              )
            )}
          </div>
        </div>
      </nav>

      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
    </>
  );
}
