'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { AuthModal } from '@/components/AuthModal';
import { postDealIntake, DealIntakeData } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

type Status = 'idle' | 'submitting' | 'success' | 'error';

export default function SubmitDealPage() {
  const { user, loading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const [form, setForm] = useState<DealIntakeData>({
    propertyType: '',
    address: '',
    askingPrice: undefined,
    noi: undefined,
    capRate: undefined,
    downPayment: undefined,
    annualDebtService: undefined,
    financing: '',
    questions: '',
    contactEmail: '',
  });

  const numericFields = new Set<keyof DealIntakeData>([
    'askingPrice', 'noi', 'capRate', 'downPayment', 'annualDebtService',
  ]);

  const setField =
    (field: keyof DealIntakeData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const raw = e.target.value;
      setForm((prev) => ({
        ...prev,
        [field]: numericFields.has(field) ? (raw === '' ? undefined : parseFloat(raw)) : raw,
      }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setShowAuth(true);
      return;
    }

    setStatus('submitting');
    setErrorMsg('');
    try {
      await postDealIntake({ ...form, contactEmail: form.contactEmail || user.email || undefined });
      setStatus('success');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Submission failed');
      setStatus('error');
    }
  };

  if (!loading && !user) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <Navbar />
        <main className="max-w-lg mx-auto px-6 py-24 text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold mb-3">Sign in to submit a deal</h1>
          <p className="text-gray-400 text-sm mb-6">
            Submit your deal for AI analysis grounded in real investment books.
          </p>
          <button
            onClick={() => setShowAuth(true)}
            className="bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold px-6 py-3 rounded-xl transition-colors"
          >
            Sign In
          </button>
        </main>
        <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <Navbar />
        <main className="max-w-lg mx-auto px-6 py-24 text-center">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-2xl font-bold mb-3">Deal submitted!</h1>
          <p className="text-gray-400 text-sm mb-6">
            We&apos;ve received your deal details. Our AI will review it against our book library shortly.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setStatus('idle')}
              className="border border-gray-700 hover:border-gray-500 text-white px-5 py-2.5 rounded-xl text-sm transition-colors"
            >
              Submit Another
            </button>
            <Link
              href="/"
              className="bg-amber-500 hover:bg-amber-400 text-gray-950 font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-8">
          <Link href="/" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
            ← Back to home
          </Link>
          <h1 className="text-3xl font-bold mt-4 mb-2">Submit a Deal</h1>
          <p className="text-gray-400 text-sm">
            Share your deal details and questions. AI reviews them against our real estate investment book library.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Property Info */}
          <fieldset className="space-y-4">
            <legend className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Property
            </legend>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Property Type</label>
              <select
                value={form.propertyType}
                onChange={setField('propertyType')}
                className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 transition-colors"
              >
                <option value="">Select type...</option>
                <option value="Office">Office</option>
                <option value="Retail">Retail</option>
                <option value="Industrial">Industrial</option>
                <option value="Multifamily">Multifamily (5+ units)</option>
                <option value="Mixed-Use">Mixed-Use</option>
                <option value="Self-Storage">Self-Storage</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <FormInput
              label="Property Address"
              value={form.address ?? ''}
              onChange={setField('address')}
              placeholder="123 Commerce Dr, Chicago, IL"
            />
          </fieldset>

          {/* Financials */}
          <fieldset className="space-y-4">
            <legend className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Financials
            </legend>
            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label="Asking Price ($)"
                type="number"
                value={form.askingPrice?.toString() ?? ''}
                onChange={setField('askingPrice')}
                placeholder="2500000"
              />
              <FormInput
                label="NOI ($/yr)"
                type="number"
                value={form.noi?.toString() ?? ''}
                onChange={setField('noi')}
                placeholder="175000"
              />
              <FormInput
                label="Cap Rate (%)"
                type="number"
                value={form.capRate?.toString() ?? ''}
                onChange={setField('capRate')}
                placeholder="7.0"
              />
              <FormInput
                label="Down Payment ($)"
                type="number"
                value={form.downPayment?.toString() ?? ''}
                onChange={setField('downPayment')}
                placeholder="500000"
              />
              <FormInput
                label="Annual Debt Service ($)"
                type="number"
                value={form.annualDebtService?.toString() ?? ''}
                onChange={setField('annualDebtService')}
                placeholder="120000"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Financing Details</label>
              <input
                type="text"
                value={form.financing ?? ''}
                onChange={setField('financing')}
                placeholder="e.g. 75% LTV, 6.5% rate, 25-yr amortization"
                className="w-full bg-gray-900 border border-gray-800 text-white placeholder-gray-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
          </fieldset>

          {/* Questions */}
          <fieldset className="space-y-4">
            <legend className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Your Questions
            </legend>
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                What do you want AI to evaluate?
              </label>
              <textarea
                value={form.questions ?? ''}
                onChange={setField('questions')}
                rows={4}
                placeholder="e.g. Does this cap rate make sense for industrial in this market? What are the key risks I should be stress-testing?"
                className="w-full bg-gray-900 border border-gray-800 text-white placeholder-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition-colors resize-none"
              />
            </div>
            <FormInput
              label="Contact Email (optional)"
              type="email"
              value={form.contactEmail ?? ''}
              onChange={setField('contactEmail')}
              placeholder={user?.email ?? 'you@example.com'}
            />
          </fieldset>

          {errorMsg && (
            <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={status === 'submitting'}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-gray-700 disabled:text-gray-500 text-gray-950 font-bold py-3.5 rounded-xl text-base transition-colors inline-flex items-center justify-center gap-2"
          >
            {status === 'submitting' && (
              <svg className="animate-spin h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {status === 'submitting' ? 'Submitting...' : 'Submit Deal for AI Review'}
          </button>
        </form>
      </main>

      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
    </div>
  );
}

function FormInput({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-gray-900 border border-gray-800 text-white placeholder-gray-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 transition-colors"
      />
    </div>
  );
}
