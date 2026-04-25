import { Router, Request, Response } from 'express';
import { embedText } from '../lib/embeddings';
import { searchChunks } from '../lib/lancedb';
import { askGroundedQuestion, Chunk } from '../lib/ai';
import { addThreadMessage } from '../lib/firestore';

export const queryRouter = Router();

queryRouter.post('/query', async (req: Request, res: Response) => {
  try {
    const { question, threadId, userId = 'anonymous' } = req.body as {
      question?: string;
      threadId?: string;
      userId?: string;
    };

    if (!question?.trim()) {
      res.status(400).json({ error: 'question is required' });
      return;
    }

    const queryVector = await embedText(question);
    const rawChunks = await searchChunks(queryVector, 8);

    const chunks: Chunk[] = rawChunks.map((c) => ({
      text: c.text,
      bookTitle: c.bookTitle,
      chunkIndex: c.chunkIndex,
    }));

    const { answer, citations } = await askGroundedQuestion(chunks, question);

    if (threadId) {
      await addThreadMessage(threadId, {
        userId,
        question,
        aiResponse: answer,
        citations,
      });
    }

    res.json({ answer, citations });
  } catch (err) {
    console.error('POST /api/query:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
