/**
 * Step 2 of ingestion: clean text files → JSON array of chunks.
 *
 * Splits each book into 500–800 token chunks on paragraph boundaries.
 * Outputs: data/chunks.json
 *
 * Usage: ts-node src/scripts/chunkText.ts
 */

import fs from 'fs';
import path from 'path';

const EXTRACTED_DIR = path.resolve(__dirname, '../../data/extracted');
const OUTPUT_FILE = path.resolve(__dirname, '../../data/chunks.json');

// Rough token estimate: 1 token ≈ 4 characters (OpenAI heuristic)
const CHARS_PER_TOKEN = 4;
const TARGET_MIN_TOKENS = 500;
const TARGET_MAX_TOKENS = 800;
const MIN_CHARS = TARGET_MIN_TOKENS * CHARS_PER_TOKEN; // 2000
const MAX_CHARS = TARGET_MAX_TOKENS * CHARS_PER_TOKEN; // 3200

export interface Chunk {
  id: string;
  bookTitle: string;
  chunkIndex: number;
  text: string;
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

function chunkBook(bookTitle: string, text: string): Chunk[] {
  const paragraphs = text.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
  const chunks: Chunk[] = [];
  let current = '';
  let chunkIndex = 0;

  const flush = () => {
    if (current.trim().length > 50) { // skip tiny fragments
      chunks.push({
        id: `${slugify(bookTitle)}-${chunkIndex}`,
        bookTitle,
        chunkIndex,
        text: current.trim(),
      });
      chunkIndex++;
    }
    current = '';
  };

  for (const para of paragraphs) {
    const combined = current ? `${current}\n\n${para}` : para;

    if (combined.length > MAX_CHARS && current.length >= MIN_CHARS) {
      // Current buffer is big enough — flush before adding this paragraph
      flush();
      current = para;
    } else if (para.length > MAX_CHARS) {
      // Single paragraph exceeds max — split by sentence
      if (current) flush();
      const sentences = para.match(/[^.!?]+[.!?]+/g) ?? [para];
      let sentBuf = '';
      for (const sent of sentences) {
        if ((sentBuf + sent).length > MAX_CHARS && sentBuf.length >= MIN_CHARS) {
          current = sentBuf.trim();
          flush();
          sentBuf = sent;
        } else {
          sentBuf += sent;
        }
      }
      if (sentBuf) current = sentBuf.trim();
    } else {
      current = combined;
    }
  }

  if (current) flush();
  return chunks;
}

function slugify(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
}

function main(): void {
  if (!fs.existsSync(EXTRACTED_DIR)) {
    console.error(`data/extracted/ not found. Run extractPdfs.ts first.`);
    process.exit(1);
  }

  const txtFiles = fs
    .readdirSync(EXTRACTED_DIR)
    .filter((f) => f.endsWith('.txt'));

  if (txtFiles.length === 0) {
    console.error('No .txt files found in data/extracted/');
    process.exit(1);
  }

  const allChunks: Chunk[] = [];

  for (const file of txtFiles) {
    const content = fs.readFileSync(path.join(EXTRACTED_DIR, file), 'utf8');

    // Read the BOOK_TITLE header written by extractPdfs.ts
    const titleMatch = content.match(/^BOOK_TITLE: (.+)$/m);
    if (!titleMatch) {
      console.warn(`  ⚠ No BOOK_TITLE header in ${file} — skipping`);
      continue;
    }
    const bookTitle = titleMatch[1].trim();
    const bodyStart = content.indexOf('\n\n');
    const body = content.slice(bodyStart).trim();

    const chunks = chunkBook(bookTitle, body);
    allChunks.push(...chunks);

    const avgTokens = chunks.reduce((sum, c) => sum + estimateTokens(c.text), 0) / chunks.length;
    console.log(
      `${bookTitle}: ${chunks.length} chunks, avg ~${Math.round(avgTokens)} tokens`
    );
  }

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allChunks, null, 2), 'utf8');
  console.log(`\nTotal: ${allChunks.length} chunks → data/chunks.json`);
}

main();
