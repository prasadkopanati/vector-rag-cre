'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';

function parseNum(val: string): number {
  return parseFloat(val.replace(/,/g, '')) || 0;
}

function fmt(n: number, decimals = 2): string {
  return n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function fmtPct(n: number): string {
  return `${fmt(n)}%`;
}

interface Inputs {
  purchasePrice: string;
  noi: string;
  downPayment: string;
  annualDebtService: string;
  grossAnnualRent: string;
}

export default function DealAnalyzerPage() {
  const [inputs, setInputs] = useState<Inputs>({
    purchasePrice: '',
    noi: '',
    downPayment: '',
    annualDebtService: '',
    grossAnnualRent: '',
  });

  const set = (field: keyof Inputs) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setInputs((prev) => ({ ...prev, [field]: e.target.value }));

  const p = parseNum(inputs.purchasePrice);
  const noi = parseNum(inputs.noi);
  const down = parseNum(inputs.downPayment);
  const debt = parseNum(inputs.annualDebtService);
  const rent = parseNum(inputs.grossAnnualRent);

  const annualCashFlow = noi - debt;
  const capRate = p > 0 ? (noi / p) * 100 : null;
  const cashOnCash = down > 0 ? (annualCashFlow / down) * 100 : null;
  const grm = rent > 0 ? p / rent : null;
  const debtCoverage = debt > 0 ? noi / debt : null;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-8">
          <Link href="/" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
            ← Back to home
          </Link>
          <h1 className="text-3xl font-bold mt-4 mb-2">Deal Analyzer</h1>
          <p className="text-gray-400 text-sm">
            Enter your deal numbers. Results update live — no submit needed.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Inputs */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              Deal Inputs
            </h2>
            <InputField
              label="Purchase Price ($)"
              value={inputs.purchasePrice}
              onChange={set('purchasePrice')}
              placeholder="e.g. 2,500,000"
              required
            />
            <InputField
              label="Net Operating Income — NOI ($/yr)"
              value={inputs.noi}
              onChange={set('noi')}
              placeholder="e.g. 175,000"
            />
            <InputField
              label="Down Payment ($)"
              value={inputs.downPayment}
              onChange={set('downPayment')}
              placeholder="e.g. 500,000"
            />
            <InputField
              label="Annual Debt Service ($/yr)"
              value={inputs.annualDebtService}
              onChange={set('annualDebtService')}
              placeholder="e.g. 120,000"
            />
            <InputField
              label="Gross Annual Rent ($/yr)"
              value={inputs.grossAnnualRent}
              onChange={set('grossAnnualRent')}
              placeholder="e.g. 220,000"
            />
          </div>

          {/* Results */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              Results
            </h2>
            <ResultCard
              label="Cap Rate"
              value={capRate !== null ? fmtPct(capRate) : '—'}
              formula="NOI ÷ Purchase Price"
              highlight={capRate !== null && capRate >= 5}
            />
            <ResultCard
              label="Annual Cash Flow"
              value={noi > 0 || debt > 0 ? `$${fmt(annualCashFlow, 0)}` : '—'}
              formula="NOI − Annual Debt Service"
              highlight={annualCashFlow > 0}
            />
            <ResultCard
              label="Cash-on-Cash Return"
              value={cashOnCash !== null ? fmtPct(cashOnCash) : '—'}
              formula="Annual Cash Flow ÷ Down Payment"
              highlight={cashOnCash !== null && cashOnCash >= 6}
            />
            <ResultCard
              label="Gross Rent Multiplier (GRM)"
              value={grm !== null ? fmt(grm, 1) + '×' : '—'}
              formula="Purchase Price ÷ Gross Annual Rent"
            />
            <ResultCard
              label="Debt Coverage Ratio (DCR)"
              value={debtCoverage !== null ? fmt(debtCoverage) : '—'}
              formula="NOI ÷ Annual Debt Service"
              highlight={debtCoverage !== null && debtCoverage >= 1.25}
            />
          </div>
        </div>

        {/* Submit deal CTA */}
        <div className="mt-12 border-t border-gray-800 pt-8 text-center">
          <p className="text-gray-400 text-sm mb-4">
            Want AI analysis on this deal grounded in real estate investment books?
          </p>
          <Link
            href="/submit-deal"
            className="inline-block bg-amber-500 hover:bg-amber-400 text-gray-950 font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
          >
            Submit Deal for AI Review →
          </Link>
        </div>
      </main>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1">
        {label}
        {required && <span className="text-amber-500 ml-0.5">*</span>}
      </label>
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full bg-gray-900 border border-gray-800 text-white placeholder-gray-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 transition-colors"
      />
    </div>
  );
}

function ResultCard({
  label,
  value,
  formula,
  highlight = false,
}: {
  label: string;
  value: string;
  formula: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-4 border transition-colors ${
        highlight
          ? 'bg-amber-500/5 border-amber-500/30'
          : 'bg-gray-900 border-gray-800'
      }`}
    >
      <div className="flex items-baseline justify-between">
        <span className="text-gray-400 text-xs">{label}</span>
        <span
          className={`text-xl font-bold tabular-nums ${
            highlight ? 'text-amber-400' : 'text-white'
          }`}
        >
          {value}
        </span>
      </div>
      <p className="text-gray-600 text-xs mt-0.5">{formula}</p>
    </div>
  );
}
