import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

export interface Chunk {
  text: string;
  bookTitle: string;
  chunkIndex: number;
}

export interface QueryResponse {
  answer: string;
  citations: string[];
}

interface AIProvider {
  chat(system: string, user: string, maxTokens: number): Promise<string>;
}

class AnthropicProvider implements AIProvider {
  private client: Anthropic;
  private model: string;

  constructor(model: string) {
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    this.model = model;
  }

  async chat(system: string, user: string, maxTokens: number): Promise<string> {
    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: user }],
    });
    return message.content[0].type === 'text' ? message.content[0].text : '';
  }
}

class OpenAIProvider implements AIProvider {
  private client: OpenAI;
  private model: string;

  constructor(model: string, baseURL?: string, apiKey?: string) {
    this.client = new OpenAI({
      apiKey: apiKey ?? process.env.OPENAI_API_KEY,
      ...(baseURL ? { baseURL } : {}),
    });
    this.model = model;
  }

  async chat(system: string, user: string, maxTokens: number): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    });
    return response.choices[0]?.message?.content ?? '';
  }
}

function createProvider(): AIProvider {
  const providerName = process.env.AI_PROVIDER ?? 'anthropic';
  const model = process.env.AI_MODEL;

  switch (providerName) {
    case 'openai':
      return new OpenAIProvider(model ?? 'gpt-4o');
    case 'openai-compatible':
      return new OpenAIProvider(
        model ?? '',
        process.env.AI_BASE_URL,
        process.env.AI_API_KEY
      );
    default:
      return new AnthropicProvider(model ?? 'claude-sonnet-4-6');
  }
}

const provider = createProvider();

function buildGroundedSystem(): string {
  return `You are an expert commercial real estate investor.

Answer ONLY using the provided context from the books below.

If the answer is not in the context, say: "This is not covered in the provided material."

Always cite the book name for each piece of information you use.`;
}

function buildGroundedUser(chunks: Chunk[], question: string): string {
  const context = chunks
    .map((c, i) => `[${i + 1}] From "${c.bookTitle}":\n${c.text}`)
    .join('\n\n');
  return `Context:\n${context}\n\nQuestion: ${question}`;
}

function buildReplyMonitorSystem(): string {
  return `You are an expert commercial real estate investment coach.

A user posted the following response in a discussion thread. Evaluate it using ONLY the provided book content.

Provide one of: a confirmation (if correct), a correction (if wrong), or a suggestion (if incomplete).
Be concise — 2–4 sentences maximum. Start with "✓ Confirmed:", "✗ Correction:", or "💡 Suggestion:".`;
}

function buildReplyMonitorUser(chunks: Chunk[], userReply: string): string {
  const context = chunks
    .map((c, i) => `[${i + 1}] From "${c.bookTitle}":\n${c.text}`)
    .join('\n\n');
  return `Book context:\n${context}\n\nUser response: "${userReply}"`;
}

export async function askGroundedQuestion(
  chunks: Chunk[],
  question: string
): Promise<QueryResponse> {
  const answer = await provider.chat(
    buildGroundedSystem(),
    buildGroundedUser(chunks, question),
    1024
  );
  const citations = [...new Set(chunks.map((c) => c.bookTitle))];
  return { answer, citations };
}

export async function evaluateReply(
  chunks: Chunk[],
  userReply: string
): Promise<string> {
  return provider.chat(
    buildReplyMonitorSystem(),
    buildReplyMonitorUser(chunks, userReply),
    512
  );
}
