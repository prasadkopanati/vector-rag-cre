'use client';

import type { CitationSource } from '@/lib/api';

interface CitationModalProps {
  citation: CitationSource | null;
  onClose: () => void;
}

export function CitationModal({ citation, onClose }: CitationModalProps) {
  if (!citation) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-lg mx-4 shadow-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span>📖</span>
            <h3 className="text-white font-semibold text-sm">{citation.bookTitle}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors ml-4 shrink-0"
          >
            ✕
          </button>
        </div>
        <p className="text-gray-500 text-xs mb-3">Passages used to generate this answer:</p>
        <div className="overflow-y-auto space-y-3">
          {citation.excerpts.map((excerpt, i) => (
            <blockquote
              key={i}
              className="border-l-2 border-amber-500/40 pl-3 text-gray-300 text-xs leading-relaxed"
            >
              {excerpt}
            </blockquote>
          ))}
        </div>
      </div>
    </div>
  );
}
