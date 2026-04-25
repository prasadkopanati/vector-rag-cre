'use client';

import { useEffect, useRef, useState } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { postQuery } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface Message {
  id: string;
  userId: string;
  question: string;
  aiResponse: string;
  feedback: string;
  citations: string[];
  timestamp: Timestamp | null;
}

interface QAThreadProps {
  threadId?: string;
  onSignInRequired: () => void;
}

export function QAThread({ threadId = 'demo', onSignInRequired }: QAThreadProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'threads', threadId, 'messages'),
      orderBy('timestamp', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Message))
      );
    });
    return unsubscribe;
  }, [threadId]);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    if (!user) {
      onSignInRequired();
      return;
    }

    setError('');
    setLoading(true);
    try {
      await postQuery(question.trim(), threadId, user.uid);
      setQuestion('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[580px] bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
      {/* Messages */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-5 space-y-5">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-8">
            <div className="text-4xl mb-3">📚</div>
            <p className="text-gray-400 text-sm">
              Ask anything about commercial real estate investing.
            </p>
            <p className="text-gray-600 text-xs mt-1">
              Answers are grounded in real investment books.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className="space-y-2">
            {/* User question bubble */}
            <div className="flex justify-end">
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[80%]">
                <p className="text-white text-sm">{msg.question}</p>
              </div>
            </div>

            {/* AI response */}
            {msg.aiResponse && (
              <div className="max-w-[88%] space-y-1.5">
                <div className="bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3">
                  <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">
                    {msg.aiResponse}
                  </p>

                  {/* Citations */}
                  {msg.citations?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {msg.citations.map((c) => (
                        <span
                          key={c}
                          className="inline-flex items-center gap-1 text-xs bg-gray-700/60 text-amber-400 border border-amber-400/20 px-2 py-0.5 rounded-full"
                        >
                          <span>📖</span>
                          <span>{c}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* AI feedback from reply monitor */}
                {msg.feedback && (
                  <p className="text-xs text-gray-500 italic px-1">{msg.feedback}</p>
                )}
              </div>
            )}

            {/* Loading indicator for the last message with no response yet */}
            {!msg.aiResponse && loading && (
              <div className="max-w-[88%]">
                <div className="bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1.5 items-center">
                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" />
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-800 p-4">
        {error && (
          <p className="text-red-400 text-xs mb-2 px-1">{error}</p>
        )}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={
              user
                ? 'Ask about cap rates, financing, deal structure...'
                : 'Sign in to ask a question...'
            }
            disabled={loading}
            className="flex-1 bg-gray-800 text-white placeholder-gray-500 rounded-xl px-4 py-2.5 text-sm border border-gray-700 focus:outline-none focus:border-amber-500 transition-colors disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="bg-amber-500 hover:bg-amber-400 disabled:bg-gray-700 disabled:text-gray-500 text-gray-950 font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors whitespace-nowrap inline-flex items-center gap-2"
          >
            {loading && (
              <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {loading ? 'Asking...' : 'Ask'}
          </button>
        </form>
        {!user && (
          <p className="text-center text-gray-600 text-xs mt-2">
            <button
              onClick={onSignInRequired}
              className="text-amber-400 hover:underline"
            >
              Sign in
            </button>{' '}
            to participate in the live thread
          </p>
        )}
      </div>
    </div>
  );
}
