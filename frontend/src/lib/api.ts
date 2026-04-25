const BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export interface QueryResponse {
  answer: string;
  citations: string[];
}

export function postQuery(
  question: string,
  threadId?: string,
  userId?: string
): Promise<QueryResponse> {
  return post('/api/query', { question, threadId, userId });
}

export function postThreadMessage(
  threadId: string,
  userId: string,
  text: string
): Promise<{ messageId: string }> {
  return post('/api/thread/message', { threadId, userId, text });
}

export interface DealIntakeData {
  propertyType?: string;
  address?: string;
  askingPrice?: number;
  noi?: number;
  capRate?: number;
  downPayment?: number;
  annualDebtService?: number;
  financing?: string;
  questions?: string;
  contactEmail?: string;
}

export function postDealIntake(
  data: DealIntakeData
): Promise<{ id: string; message: string }> {
  return post('/api/deal/intake', data);
}
