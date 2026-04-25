import { Router, Request, Response } from 'express';
import { addThreadMessage, updateMessageFeedback } from '../lib/firestore';
import { embedText } from '../lib/embeddings';
import { searchChunks } from '../lib/lancedb';
import { evaluateReply, Chunk } from '../lib/ai';

export const threadRouter = Router();

// Post a freeform user message to a thread.
// AI reply monitor runs async — does not block the HTTP response.
threadRouter.post('/thread/message', async (req: Request, res: Response) => {
  try {
    const { threadId, userId, text } = req.body as {
      threadId?: string;
      userId?: string;
      text?: string;
    };

    if (!threadId || !userId || !text?.trim()) {
      res.status(400).json({ error: 'threadId, userId, and text are required' });
      return;
    }

    const messageId = await addThreadMessage(threadId, {
      userId,
      question: text,
      aiResponse: '',
      citations: [],
    });

    // Fire-and-forget: evaluate the reply against book knowledge, write feedback back
    runReplyMonitor(threadId, messageId, text).catch((err: unknown) => {
      console.error(`Reply monitor failed for message ${messageId}:`, err);
    });

    res.json({ messageId });
  } catch (err) {
    console.error('POST /api/thread/message:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

async function runReplyMonitor(
  threadId: string,
  messageId: string,
  text: string
): Promise<void> {
  const queryVector = await embedText(text);
  const rawChunks = await searchChunks(queryVector, 5);
  const chunks: Chunk[] = rawChunks.map((c) => ({
    text: c.text,
    bookTitle: c.bookTitle,
    chunkIndex: c.chunkIndex,
  }));

  const feedback = await evaluateReply(chunks, text);
  await updateMessageFeedback(threadId, messageId, feedback);
}
