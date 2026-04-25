import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { initLanceDB } from './lib/lancedb';
import { healthRouter } from './routes/health';
import { queryRouter } from './routes/query';
import { threadRouter } from './routes/thread';
import { dealRouter } from './routes/deal';

const app = express();
const PORT = parseInt(process.env.PORT ?? '8080', 10);

app.use(cors());
app.use(express.json());

app.use('/api', healthRouter);
app.use('/api', queryRouter);
app.use('/api', threadRouter);
app.use('/api', dealRouter);

// Catch-all 404
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

async function start(): Promise<void> {
  await initLanceDB();
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

start().catch((err: unknown) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
