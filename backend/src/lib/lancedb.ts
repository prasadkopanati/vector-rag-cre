import * as lancedb from '@lancedb/lancedb';
import path from 'path';
import fs from 'fs';
import { Storage } from '@google-cloud/storage';
import { execSync } from 'child_process';

const LANCEDB_PATH = process.env.LANCEDB_PATH ?? '/data/lancedb';
const TABLE_NAME = process.env.LANCEDB_TABLE ?? 'book_chunks';
const GCS_BUCKET = process.env.GCS_BUCKET_LANCEDB ?? 'circleso-lancedb';
const SNAPSHOT_FILE = 'lancedb-snapshot.tar.gz';

let db: lancedb.Connection;
let table: lancedb.Table;

async function loadFromGCS(): Promise<void> {
  const storage = new Storage();
  const localArchive = '/tmp/lancedb-snapshot.tar.gz';

  console.log('Downloading LanceDB snapshot from GCS...');
  await storage
    .bucket(GCS_BUCKET)
    .file(SNAPSHOT_FILE)
    .download({ destination: localArchive });

  fs.mkdirSync('/data', { recursive: true });
  execSync(`tar -xzf ${localArchive} -C /data/`);
  fs.unlinkSync(localArchive);
  console.log('LanceDB snapshot restored from GCS.');
}

export async function initLanceDB(): Promise<void> {
  const tableDir = path.join(LANCEDB_PATH, `${TABLE_NAME}.lance`);
  const hasLocalData = fs.existsSync(tableDir);

  if (!hasLocalData) {
    if (process.env.NODE_ENV === 'production') {
      try {
        await loadFromGCS();
      } catch (err) {
        console.warn('[LanceDB] No snapshot found in GCS — starting without vector data. Run ingestion first.');
      }
    } else {
      console.warn(
        `[LanceDB] Table "${TABLE_NAME}" not found at ${LANCEDB_PATH}. Run "npm run ingest" first.`
      );
    }
  }

  fs.mkdirSync(LANCEDB_PATH, { recursive: true });
  db = await lancedb.connect(LANCEDB_PATH);

  const tables = await db.tableNames();
  if (tables.includes(TABLE_NAME)) {
    table = await db.openTable(TABLE_NAME);
    const rowCount = await table.countRows();
    console.log(`[LanceDB] Connected — "${TABLE_NAME}" (${rowCount} chunks).`);
  } else {
    console.warn(`[LanceDB] Table "${TABLE_NAME}" missing. Queries will fail until ingestion runs.`);
  }
}

export interface SearchResult {
  id: string;
  text: string;
  bookTitle: string;
  chunkIndex: number;
  _distance: number;
}

export async function searchChunks(
  queryVector: number[],
  topK = 8
): Promise<SearchResult[]> {
  if (!table) {
    throw new Error('LanceDB not initialized. Call initLanceDB() at startup.');
  }
  return (await table.search(queryVector).limit(topK).toArray()) as SearchResult[];
}

export function getDB(): lancedb.Connection {
  return db;
}
