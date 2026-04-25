/**
 * Step 3 of ingestion: chunks → chunks with embedding vectors.
 *
 * Reads data/chunks.json, calls OpenAI text-embedding-3-small in batches,
 * writes data/chunks-embedded.json.
 *
 * IMPORTANT: uses the same model/dimensions as src/lib/embeddings.ts (1536-dim).
 *
 * Usage: ts-node src/scripts/generateEmbeddings.ts
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import type { Chunk } from './chunkText';

const INPUT_FILE = path.resolve(__dirname, '../../data/chunks.json');
const OUTPUT_FILE = path.resolve(__dirname, '../../data/chunks-embedded.json');

// Match src/lib/embeddings.ts exactly — both ingestion and runtime must use the same model
const EMBEDDING_MODEL = 'text-embedding-3-small';
const BATCH_SIZE = 100; // OpenAI allows up to 2048 inputs per request; 100 is safe
const RATE_LIMIT_DELAY_MS = 200; // conservative delay between batches

export interface EmbeddedChunk extends Chunk {
  vector: number[];
}

async function embedBatch(openai: OpenAI, texts: string[]): Promise<number[][]> {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts.map((t) => t.slice(0, 8000)),
  });
  return response.data
    .sort((a, b) => a.index - b.index)
    .map((d) => d.embedding);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
  if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY is not set. Add it to backend/.env');
    process.exit(1);
  }

  if (!fs.existsSync(INPUT_FILE)) {
    console.error('data/chunks.json not found. Run chunkText.ts first.');
    process.exit(1);
  }

  const chunks: Chunk[] = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));
  console.log(`Embedding ${chunks.length} chunks with ${EMBEDDING_MODEL}...`);

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const embedded: EmbeddedChunk[] = [];
  const total = chunks.length;

  for (let i = 0; i < total; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    const texts = batch.map((c) => c.text);

    process.stdout.write(
      `  Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(total / BATCH_SIZE)} (${i + 1}–${Math.min(i + BATCH_SIZE, total)})...`
    );

    const vectors = await embedBatch(openai, texts);

    batch.forEach((chunk, j) => {
      embedded.push({ ...chunk, vector: vectors[j] });
    });

    console.log(' ✓');

    if (i + BATCH_SIZE < total) {
      await sleep(RATE_LIMIT_DELAY_MS);
    }
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(embedded, null, 2), 'utf8');
  console.log(`\nDone. ${embedded.length} embedded chunks → data/chunks-embedded.json`);
  console.log(`Vector dimensions: ${embedded[0]?.vector.length ?? 'unknown'}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
