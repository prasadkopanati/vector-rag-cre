/**
 * Step 5 of ingestion: compress local LanceDB directory → upload to GCS.
 *
 * Cloud Run loads this snapshot on startup (see src/lib/lancedb.ts).
 * Run this once after seeding. Re-run whenever you re-seed with new books.
 *
 * Requires: GOOGLE_APPLICATION_CREDENTIALS or GCS_BUCKET_LANCEDB env var.
 * Usage: ts-node src/scripts/backupLanceDB.ts
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { Storage } from '@google-cloud/storage';

const LANCEDB_PATH = path.resolve(__dirname, '../../data/lancedb');
const ARCHIVE_PATH = '/tmp/lancedb-snapshot.tar.gz';
const GCS_BUCKET = process.env.GCS_BUCKET_LANCEDB ?? 'circleso-lancedb';
const SNAPSHOT_FILE = 'lancedb-snapshot.tar.gz';

async function main(): Promise<void> {
  if (!fs.existsSync(LANCEDB_PATH)) {
    console.error('data/lancedb/ not found. Run seedLanceDB.ts first.');
    process.exit(1);
  }

  // Compress
  console.log(`Compressing ${LANCEDB_PATH} → ${ARCHIVE_PATH}...`);
  execSync(`tar -czf ${ARCHIVE_PATH} -C ${path.dirname(LANCEDB_PATH)} lancedb`);
  const sizeMb = (fs.statSync(ARCHIVE_PATH).size / 1024 / 1024).toFixed(1);
  console.log(`Archive size: ${sizeMb} MB`);

  // Upload to GCS
  console.log(`Uploading to gs://${GCS_BUCKET}/${SNAPSHOT_FILE}...`);
  const storage = new Storage();
  await storage.bucket(GCS_BUCKET).upload(ARCHIVE_PATH, {
    destination: SNAPSHOT_FILE,
    metadata: {
      contentType: 'application/gzip',
      cacheControl: 'no-cache',
    },
  });

  // Clean up local archive
  fs.unlinkSync(ARCHIVE_PATH);

  console.log(`\nDone. Snapshot uploaded to gs://${GCS_BUCKET}/${SNAPSHOT_FILE}`);
  console.log('Cloud Run will download this snapshot on next cold start.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
