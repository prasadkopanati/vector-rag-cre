/**
 * Step 1 of ingestion: PDF → clean text files.
 *
 * Place your 5 e-book PDFs in backend/books/ before running.
 * Outputs one .txt file per book in backend/data/extracted/.
 *
 * Usage: ts-node src/scripts/extractPdfs.ts
 */

import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';

const BOOKS_DIR = path.resolve(__dirname, '../../books');
const OUTPUT_DIR = path.resolve(__dirname, '../../data/extracted');

// Maps PDF filename (without extension) to a clean display title used as the citation.
// Add/rename entries here to match your actual PDF filenames.
const BOOK_TITLE_MAP: Record<string, string> = {
  'cash-flow':
    'What Every Real Estate Investor Needs to Know About Cash Flow',
  'real-estate-game':
    'The Real Estate Game',
  'commercial-re-investing':
    'Commercial Real Estate Investing',
  'industrial-re-investing':
    'Industrial Real Estate Investing',
  're-finance-investments':
    'Real Estate Finance and Investments',
};

function cleanText(raw: string): string {
  return raw
    // Collapse excessive whitespace
    .replace(/[ \t]{2,}/g, ' ')
    // Remove standalone page numbers ("42", "- 42 -", "Page 42")
    .replace(/^[\s\-]*Page\s*\d+[\s\-]*$/gim, '')
    .replace(/^\s*\d+\s*$/gm, '')
    // Collapse 3+ blank lines to 2
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function extractOne(pdfPath: string, bookTitle: string): Promise<void> {
  const filename = path.basename(pdfPath, '.pdf');
  const outPath = path.join(OUTPUT_DIR, `${filename}.txt`);

  console.log(`Extracting: ${path.basename(pdfPath)} → ${path.basename(outPath)}`);

  const buffer = fs.readFileSync(pdfPath);
  const parsed = await pdfParse(buffer);
  const cleaned = cleanText(parsed.text);

  // Prepend metadata header so downstream scripts know which book this is
  const withHeader = `BOOK_TITLE: ${bookTitle}\n\n${cleaned}`;
  fs.writeFileSync(outPath, withHeader, 'utf8');

  const words = cleaned.split(/\s+/).length;
  console.log(`  → ${words.toLocaleString()} words`);
}

async function main(): Promise<void> {
  if (!fs.existsSync(BOOKS_DIR)) {
    console.error(`books/ directory not found at ${BOOKS_DIR}`);
    console.error('Create it and place your 5 PDF e-books inside.');
    process.exit(1);
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const pdfs = fs
    .readdirSync(BOOKS_DIR)
    .filter((f) => f.toLowerCase().endsWith('.pdf'));

  if (pdfs.length === 0) {
    console.error(`No PDF files found in ${BOOKS_DIR}`);
    process.exit(1);
  }

  let extracted = 0;
  for (const pdf of pdfs) {
    const stem = path.basename(pdf, '.pdf');
    const title = BOOK_TITLE_MAP[stem];
    if (!title) {
      console.warn(`  ⚠ No title mapping for "${pdf}". Add it to BOOK_TITLE_MAP.`);
      continue;
    }
    await extractOne(path.join(BOOKS_DIR, pdf), title);
    extracted++;
  }

  console.log(`\nDone. Extracted ${extracted}/${pdfs.length} PDFs to data/extracted/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
