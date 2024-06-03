import { openai, createOpenAI } from "@ai-sdk/openai";
import { StreamingTextResponse, streamText, StreamData } from "ai";
import { MODELS } from "@/app/(desktop)/models";

import { messageRateLimit } from "../rate-limits";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

const groq = createOpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  const ip = req.headers.get("x-real-ip") ?? "localhost";
  const rl = await messageRateLimit.limit(ip);

  if (!rl.success) {
    return new Response("Rate limit exceeded", { status: 429 });
  }

  const { messages, modelId } = await req.json();

  const modelDefinition = MODELS.find((m) => m.id === modelId);

  if (!modelDefinition) {
    return new Response("Invalid model", { status: 400 });
  }

  const modelProvider = modelDefinition.provider === "groq" ? groq : openai;
  const model = modelProvider(modelDefinition.id);

  const result = await streamText({
    model,
    messages,
    system:
      "You are a helpful assistant running inside WinGPT, a Windows 95-like interface for a conversational AI agent. You are very concise, and you are obsessed with Windows 95.",
    maxTokens: 256,
  });

  const data = new StreamData();

  data.append({ start: Date.now(), modelId });

  const stream = result.toAIStream({
    onFinal(_) {
      data.append({ end: Date.now(), modelId });
      data.close();
    },
  });

  return new StreamingTextResponse(stream, {}, data);
}
