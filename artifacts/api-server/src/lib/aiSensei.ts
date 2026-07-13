import type { AiMessage } from "@workspace/db";
import { logger } from "./logger";

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

export class AiSenseiError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 503,
  ) {
    super(message);
    this.name = "AiSenseiError";
  }
}

/** Generates the AI Sensei's reply for a chat session. Throws AiSenseiError if the API call fails. */
export async function generateAiSenseiReply(
  mode: string,
  history: Pick<AiMessage, "role" | "content">[],
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new AiSenseiError(
      "GROQ_API_KEY is not configured",
      "GROQ_NOT_CONFIGURED",
      503,
    );
  }

  try {
    const { default: OpenAI } = await import("openai");
    const client = new OpenAI({ apiKey, baseURL: GROQ_BASE_URL });

    const systemPrompt = MODE_PROMPTS[mode] ?? MODE_PROMPTS.explain!;

    logger.debug(
      { mode, historyLength: history.length },
      "Generating AI Sensei reply",
    );

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
      logger.error(
        { completion, mode },
        "Groq API returned empty or malformed response",
      );
      throw new AiSenseiError(
        "Empty response from Groq API",
        "EMPTY_GROQ_RESPONSE",
        503,
      );
    }

    logger.debug(
      { mode, replyLength: reply.length },
      "AI Sensei reply generated successfully",
    );
    return reply;
  } catch (err) {
    // Re-throw if already an AiSenseiError
    if (err instanceof AiSenseiError) {
      throw err;
    }

    // Handle OpenAI/Groq API errors
    const error = err as any;
    const errorMessage = error?.message || "Unknown error";
    const statusCode = error?.status || 503;

    if (error?.code === "ECONNREFUSED") {
      logger.error(
        { error: errorMessage },
        "Failed to connect to Groq API - check network connectivity",
      );
      throw new AiSenseiError(
        "Unable to reach AI service. Please check your connection.",
        "GROQ_CONNECTION_ERROR",
        503,
      );
    }

    if (error?.status === 401 || error?.code === "invalid_api_key") {
      logger.error({}, "Groq API authentication failed - check GROQ_API_KEY");
      throw new AiSenseiError(
        "AI Sensei authentication failed. Please check server configuration.",
        "GROQ_AUTH_ERROR",
        503,
      );
    }

    if (error?.status === 429) {
      logger.warn({}, "Groq API rate limit exceeded");
      throw new AiSenseiError(
        "Too many requests to AI service. Please try again in a moment.",
        "GROQ_RATE_LIMIT",
        429,
      );
    }

    if (error?.status === 400) {
      logger.error({ error: errorMessage }, "Groq API received invalid request");
      throw new AiSenseiError(
        "Invalid request to AI service. Please try rewording your question.",
        "GROQ_INVALID_REQUEST",
        400,
      );
    }

    // Generic fallback
    logger.error(
      { error: errorMessage, status: statusCode, code: error?.code },
      "Groq API call failed",
    );
    throw new AiSenseiError(
      "AI Sensei is temporarily unavailable. Please try again.",
      "GROQ_UNKNOWN_ERROR",
      statusCode,
    );
  }
}
