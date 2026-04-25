/**
 * Step 4 of ingestion: embedded chunks → LanceDB table.
 *
 * Creates (or overwrites) the book_chunks table in data/lancedb/.
 * Run this locally; the resulting directory is then backed up to GCS
 * by backupLanceDB.ts so Cloud Run can load it on startup.
 *
 * Usage: ts-node src/scripts/seedLanceDB.ts
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import * as lancedb from '@lancedb/lancedb';
import type { EmbeddedChunk } from './generateEmbeddings';

const INPUT_FILE = path.resolve(__dirname, '../../data/chunks-embedded.json');
const LANCEDB_PATH = path.resolve(__dirname, '../../data/lancedb');
const TABLE_NAME = process.env.LANCEDB_TABLE ?? 'book_chunks';
const WRITE_BATCH = 500; // insert in batches to avoid memory pressure

async function main(): Promise<void> {
  if (!fs.existsSync(INPUT_FILE)) {
    console.error('data/chunks-embedded.json not found. Run generateEmbeddings.ts first.');
    process.exit(1);
  }

  const chunks: EmbeddedChunk[] = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));
  if (chunks.length === 0) {
    console.error('No chunks found in chunks-embedded.json');
    process.exit(1);
  }

  const vectorDim = chunks[0].vector.length;
  console.log(`Seeding ${chunks.length} chunks (${vectorDim}-dim vectors) into LanceDB...`);

  fs.mkdirSync(LANCEDB_PATH, { recursive: true });
  const db = await lancedb.connect(LANCEDB_PATH);

  // Drop existing table so re-runs are idempotent
  const existing = await db.tableNames();
  if (existing.includes(TABLE_NAME)) {
    await db.dropTable(TABLE_NAME);
    console.log(`Dropped existing table "${TABLE_NAME}"`);
  }

  // LanceDB infers the schema from the first batch's shape.
  // Ensure vector field is named "vector" — this is what searchChunks() in lancedb.ts queries.
  const rows = chunks.map((c) => ({
    id: c.id,
    bookTitle: c.bookTitle,
    chunkIndex: c.chunkIndex,
    text: c.text,
    vector: c.vector,
  }));

  // Create table with first batch, then append remaining batches
  let table: lancedb.Table | undefined;
  for (let i = 0; i < rows.length; i += WRITE_BATCH) {
    const batch = rows.slice(i, i + WRITE_BATCH);
    if (i === 0) {
      table = await db.createTable(TABLE_NAME, batch);
    } else {
      await table!.add(batch);
    }
    console.log(`  Inserted rows ${i + 1}–${Math.min(i + WRITE_BATCH, rows.length)}`);
  }

  const count = await table!.countRows();
  console.log(`\nDone. "${TABLE_NAME}" has ${count} rows in ${LANCEDB_PATH}`);

  // Quick sanity check: search with the first chunk's own vector — should be top result
  const sample = await table!.search(rows[0].vector).limit(1).toArray();
  const topId = (sample[0] as { id: string }).id;
  if (topId === rows[0].id) {
    console.log('Sanity check ✓ — nearest-neighbor search returns expected top result.');
  } else {
    console.warn(`Sanity check ⚠ — expected "${rows[0].id}" but got "${topId}"`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
