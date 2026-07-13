import type { AiMessage } from "@workspace/db";

const MODE_PROMPTS: Record<string, string> = {
  explain: "You are AI Sensei, a patient tutor. Explain the concept clearly with a simple example.",
  doubt: "You are AI Sensei, a supportive tutor. Resolve the student's doubt directly and concisely.",
  summarize: "You are AI Sensei. Summarize the topic into clear, memorable bullet points.",
  quiz: "You are AI Sensei. Quiz the student with one question at a time and give feedback on their answers.",
};

// Groq exposes an OpenAI-compatible Chat Completions API, so we reuse the
// `openai` SDK and just point it at Groq's base URL with a Groq API key.
const GROQ_BASE_URL = "https://api.groq.com/openai/v1";
const GROQ_MODEL = "llama-3.3-70b-versatile";

export function isAiSenseiConfigured(): boolean {
  return !!process.env.GROQ_API_KEY;
}

/** Generates the AI Sensei's reply for a chat session. Throws if the API call fails. */
export async function generateAiSenseiReply(
  mode: string,
  history: Pick<AiMessage, "role" | "content">[],
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured");
  }

  const { default: OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey, baseURL: GROQ_BASE_URL });

  const systemPrompt = MODE_PROMPTS[mode] ?? MODE_PROMPTS.explain!;

  const completion = await client.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      ...history.map((m) => ({
        role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
        content: m.content,
      })),
    ],
  });

  const reply = completion.choices[0]?.message?.content;
  if (!reply) {
    throw new Error("Empty response from Groq");
  }
  return reply;
}
