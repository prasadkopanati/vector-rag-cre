/**
 * Seeds threads/demo/messages in Firestore with realistic CRE Q&A messages.
 *
 * Safe to run multiple times — skips seeding if the thread already has
 * SEED_THRESHOLD or more messages.
 *
 * Usage:
 *   ts-node src/scripts/seedDemoThread.ts
 *
 * Auth (in order of precedence):
 *   1. FIREBASE_SERVICE_ACCOUNT_KEY env var (JSON string of service account key)
 *   2. Application Default Credentials (gcloud auth application-default login)
 *
 * Required env vars:
 *   FIREBASE_PROJECT_ID=vectordb-rag-prod
 */

import 'dotenv/config';
import admin from 'firebase-admin';

const THREAD_ID = 'demo';
const SEED_THRESHOLD = 3; // skip if thread already has this many messages

interface SeedMessage {
  userId: string;
  question: string;
  aiResponse: string;
  feedback: string;
  citations: string[];
  offsetMinutes: number; // minutes before "now" to timestamp this message
}

const SEED_MESSAGES: SeedMessage[] = [
  {
    userId: 'seed-user-1',
    question: 'What is a cap rate and what makes a good one for industrial properties?',
    aiResponse: `A capitalization rate (cap rate) is the ratio of a property's Net Operating Income (NOI) to its purchase price, expressed as a percentage. It measures the unlevered return you'd earn if you bought the property with all cash.

For industrial properties specifically, cap rates typically range from 4% to 7% depending on market, location, and asset quality. Class A industrial in major logistics corridors (near ports, major highways) trades at compressed cap rates of 4–5% due to strong tenant demand and rent growth. Secondary markets and older facilities trade at 6–7%+.

A "good" cap rate is always relative to your investment thesis:
- If you're buying for long-term appreciation in a high-demand market, a 4.5% cap rate may be justified if rent growth expectations are strong
- If you need current cash flow and are financing with debt at 6%+, you need a cap rate meaningfully above your cost of debt to achieve positive leverage — typically 7%+ in the current rate environment

The key risk with industrial is lease rollover. A single-tenant warehouse with a 2-year lease expiration is riskier than one with a 10-year NNN lease, and the cap rate should reflect that.`,
    feedback: '✓ Confirmed: The relationship between cap rates, cost of debt, and positive leverage is a core principle in commercial real estate underwriting.',
    citations: [
      'Commercial Real Estate Investing',
      'Real Estate Finance and Investments',
    ],
    offsetMinutes: 180,
  },
  {
    userId: 'seed-user-2',
    question: 'How do I calculate cash-on-cash return and why does it matter more than cap rate?',
    aiResponse: `Cash-on-cash return (CoC) measures the annual pre-tax cash flow you receive relative to the actual cash you invested (your equity). The formula is:

**Cash-on-Cash Return = Annual Pre-Tax Cash Flow ÷ Total Cash Invested**

Where:
- Annual Pre-Tax Cash Flow = NOI − Annual Debt Service
- Total Cash Invested = Down payment + closing costs + initial capital improvements

**Example:**
- Purchase price: $2,500,000
- Down payment (25%): $625,000
- NOI: $175,000/year
- Annual debt service: $120,000/year
- Annual cash flow: $55,000
- CoC return: $55,000 ÷ $625,000 = **8.8%**

**Why CoC often matters more than cap rate:**
Cap rate ignores financing — it's a property-level metric. CoC measures your actual return on the dollars you put in, which depends heavily on your loan terms. Two investors buying the same property at the same cap rate can have very different CoC returns based on their leverage, interest rate, and loan amortization.

Target CoC returns vary by investor: 6–8% is considered reasonable for stabilized commercial assets in moderate markets; 10%+ is the threshold many value-add investors require to justify the execution risk.`,
    feedback: '💡 Suggestion: Consider also tracking equity multiple and IRR over the hold period — CoC is a point-in-time metric that misses the compounding effect of rent growth and debt paydown over a 5–10 year hold.',
    citations: [
      'What Every Real Estate Investor Needs to Know About Cash Flow',
      'Real Estate Finance and Investments',
    ],
    offsetMinutes: 145,
  },
  {
    userId: 'seed-user-3',
    question: 'What due diligence should I do before buying a commercial warehouse?',
    aiResponse: `Commercial warehouse due diligence falls into four categories. Skipping any one of them is where deals go wrong.

**1. Physical / Property**
- Full structural inspection, roof assessment (replacement cost for a large roof can be $500k+), HVAC systems (dock levelers, overhead doors)
- Clear height — modern logistics tenants require 28–36 ft minimum; older warehouses at 18–22 ft are functionally obsolete for e-commerce
- Dock door count and trailer court depth (180 ft minimum for modern trailers)
- Phase I Environmental Site Assessment — mandatory for industrial; Phase II if any red flags (prior automotive, dry cleaning, manufacturing use)
- Zoning confirmation: can the current or intended use actually operate here?

**2. Financial**
- Trailing 12-month operating statements and rent roll verified against actual bank deposits
- Lease abstracts — confirm rent amounts, escalation clauses, renewal options, termination rights, tenant improvement obligations
- Verify NNN expenses actually pass through (taxes, insurance, maintenance) vs. gross lease structures
- CAM reconciliations for the past 2 years

**3. Legal**
- Title search and title insurance commitment — look for easements, restrictions, or encumbrances that limit use
- Survey confirming lot lines, easements, and any encroachments
- Existing loan assumption terms if applicable

**4. Market**
- Vacancy rate for competing product in the submarket
- Asking vs. effective rents (concessions are common in soft markets)
- Pipeline of new supply in the submarket — a 10% vacancy building looks very different if 2M sq ft is being delivered nearby`,
    feedback: '✓ Confirmed: Environmental due diligence and lease abstraction are consistently identified as the highest-risk omissions in industrial acquisitions.',
    citations: [
      'Industrial Real Estate Investing',
      'The Real Estate Game',
      'Commercial Real Estate Investing',
    ],
    offsetMinutes: 100,
  },
  {
    userId: 'seed-user-1',
    question: 'What debt coverage ratio do lenders typically require and how do I improve mine?',
    aiResponse: `The Debt Coverage Ratio (DCR), also called DSCR, is the ratio of Net Operating Income to Annual Debt Service:

**DCR = NOI ÷ Annual Debt Service**

**Typical lender requirements:**
- Conventional commercial lenders: minimum 1.20–1.25x DCR
- Agency lenders (Fannie/Freddie for multifamily): typically 1.25x
- SBA 504 loans: minimum 1.25x on the project cash flow
- Life companies and CMBS for stabilized assets: sometimes 1.15x for high-quality, long-leased properties
- Bridge and construction lenders: sometimes underwrite to a pro-forma DCR of 1.20x at stabilization

**What a 1.25x DCR means in practice:**
For every $1.00 of debt service, the property generates $1.25 of NOI. The 25-cent cushion covers vacancies, unexpected expenses, and the lender's margin of safety.

**How to improve a tight DCR:**

1. **Increase NOI** — negotiate higher rents, reduce operating expenses, eliminate below-market leases at renewal, add ancillary income (storage, parking, signage)

2. **Reduce debt service** — larger down payment reduces principal; better loan terms (lower rate, longer amortization period) reduce annual payments; interest-only periods in the early years of a bridge loan temporarily suppress debt service

3. **Restructure the financing** — a mezzanine tranche behind the senior loan won't count in the senior DCR calculation; seller financing at favorable rates can improve blended debt service

4. **Buy-down the rate** — paying points at closing to permanently reduce the interest rate improves DCR for the full loan term`,
    feedback: '✓ Confirmed: The 1.25x DSCR floor is the standard underwriting threshold across most conventional commercial lenders.',
    citations: [
      'Real Estate Finance and Investments',
      'What Every Real Estate Investor Needs to Know About Cash Flow',
    ],
    offsetMinutes: 60,
  },
  {
    userId: 'seed-user-4',
    question: 'How should I think about lease structure when evaluating a commercial deal — NNN vs gross?',
    aiResponse: `Lease structure fundamentally changes who bears the operating cost risk — the landlord or the tenant — and it directly affects how you should underwrite NOI and value the asset.

**Triple Net (NNN) Lease**
The tenant pays base rent plus all three "nets": property taxes, building insurance, and maintenance/repairs. In a true NNN lease, the landlord's cash flow is highly predictable — you receive a fixed rent stream and have almost no operating expense risk. Industrial and retail properties commonly use NNN structures.

*Landlord perspective:* NNN leases are the gold standard for income stability. They're easier to finance, trade at lower (more compressed) cap rates, and are highly attractive to 1031 exchange buyers. The tradeoff: rent is often below market because tenants demand a discount for taking on operating risk.

**Gross Lease**
The landlord pays all operating expenses out of collected rent. Office buildings often use modified gross or full-service gross structures. Your NOI is rent minus actual expenses — which fluctuates with utility costs, property tax assessments, and repair bills.

*Key underwriting risk:* Expense growth eats into NOI. A 3% annual increase in operating expenses on a flat-rent gross lease erodes cash flow every year.

**Modified Gross / Net Lease**
Most real-world leases sit between these poles. Common structures:
- Base year gross: tenant pays increases in expenses above the base year — landlord keeps full expense risk in Year 1 but passes through inflation thereafter
- Double net (NN): tenant pays taxes and insurance, landlord handles maintenance
- NNN with landlord's roof and structure: tenant handles everything except structural repairs

**What to underwrite:**
Always model the actual cash flow to the landlord net of all expenses, regardless of lease label. Verify what "NNN" actually means in each specific lease — definitions vary.`,
    feedback: '💡 Suggestion: For multi-tenant buildings, also analyze the blended lease structure across all tenants — a building with 80% NNN leases and 20% gross can have significant NOI volatility from the gross-lease portion.',
    citations: [
      'Commercial Real Estate Investing',
      'The Real Estate Game',
      'Real Estate Finance and Investments',
    ],
    offsetMinutes: 25,
  },
];

function ensureInit(): void {
  if (admin.apps.length > 0) return;

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  admin.initializeApp({
    credential: serviceAccountKey
      ? admin.credential.cert(JSON.parse(serviceAccountKey) as admin.ServiceAccount)
      : admin.credential.applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

async function getCurrentMessageCount(db: admin.firestore.Firestore): Promise<number> {
  const snap = await db
    .collection('threads')
    .doc(THREAD_ID)
    .collection('messages')
    .count()
    .get();
  return snap.data().count;
}

async function seedMessage(
  db: admin.firestore.Firestore,
  msg: SeedMessage
): Promise<void> {
  const timestamp = new Date(Date.now() - msg.offsetMinutes * 60 * 1000);
  await db
    .collection('threads')
    .doc(THREAD_ID)
    .collection('messages')
    .add({
      userId: msg.userId,
      question: msg.question,
      aiResponse: msg.aiResponse,
      feedback: msg.feedback,
      citations: msg.citations,
      timestamp: admin.firestore.Timestamp.fromDate(timestamp),
    });
}

async function main(): Promise<void> {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) {
    console.error('FIREBASE_PROJECT_ID is not set. Add it to .env.');
    process.exit(1);
  }

  ensureInit();
  const db = admin.firestore();

  console.log(`Checking threads/${THREAD_ID}/messages in project ${projectId}...`);
  const count = await getCurrentMessageCount(db);
  console.log(`  Current message count: ${count}`);

  if (count >= SEED_THRESHOLD) {
    console.log(`  Thread already has ${count} messages (threshold: ${SEED_THRESHOLD}). Skipping.`);
    process.exit(0);
  }

  console.log(`  Seeding ${SEED_MESSAGES.length} messages...`);
  for (const msg of SEED_MESSAGES) {
    await seedMessage(db, msg);
    console.log(`  ✓ "${msg.question.slice(0, 60)}..."`);
  }

  const newCount = await getCurrentMessageCount(db);
  console.log(`\nDone. threads/${THREAD_ID}/messages now has ${newCount} messages.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
