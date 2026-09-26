import admin from 'firebase-admin';
import type { CitationSource } from './types';

let initialized = false;

function ensureInit(): void {
  if (initialized) return;

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  admin.initializeApp({
    credential: serviceAccountKey
      ? admin.credential.cert(JSON.parse(serviceAccountKey) as admin.ServiceAccount)
      : admin.credential.applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
  initialized = true;
}

function db(): admin.firestore.Firestore {
  ensureInit();
  return admin.firestore();
}

export interface ThreadMessage {
  id?: string;
  userId: string;
  question: string;
  aiResponse: string;
  feedback: string;
  citations: CitationSource[];
  timestamp: admin.firestore.Timestamp | Date;
}

// Messages are stored as a subcollection for real-time listener performance
// and to support async feedback updates on individual messages.
export async function addThreadMessage(
  threadId: string,
  data: { userId: string; question: string; aiResponse: string; citations: CitationSource[] }
): Promise<string> {
  const ref = await db()
    .collection('threads')
    .doc(threadId)
    .collection('messages')
    .add({
      ...data,
      feedback: '',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
  return ref.id;
}

export async function updateMessageFeedback(
  threadId: string,
  messageId: string,
  feedback: string
): Promise<void> {
  await db()
    .collection('threads')
    .doc(threadId)
    .collection('messages')
    .doc(messageId)
    .update({ feedback });
}

export async function saveDealIntake(
  data: Record<string, unknown>
): Promise<string> {
  const ref = await db()
    .collection('deal_intakes')
    .add({
      ...data,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  return ref.id;
}
