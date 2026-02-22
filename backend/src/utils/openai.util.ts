import OpenAI from "openai";
import { config } from "../config";

let openai: OpenAI;
export const getOpenAI = () => {
  if (!openai) openai = new OpenAI({ apiKey: config.OPENAI_API_KEY });
  return openai;
};

export const systemPrompt = {
  role: "system" as const,
  content: `You are a helpful and friendly assistant. 
At the end of EVERY message you send, sign it with a DIFFERENT emoji each time. 
Pick randomly from a wide variety of emojis — never repeat the same one twice in a row.
Example endings: "...hope that helps! 🦊", "...let me know if you need more! 🌋", "...happy to help! 🎯"`,
};

export async function getChatCompletion(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
) {
  return getOpenAI().chat.completions.create({
    model: "gpt-4o-mini",
    messages: [systemPrompt, ...messages],
  });
}

export async function getSentimentCompletion(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
) {
  return getOpenAI().chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You analyze the sentiment of the user's messages in a conversation.",
      },
      ...messages,
    ],
    tools: [
      {
        type: "function",
        function: {
          name: "record_sentiment",
          description:
            "Record the user's current sentiment score based on their messages",
          parameters: {
            type: "object",
            properties: {
              score: {
                type: "number",
                description:
                  "Sentiment score from 0 (very negative) to 100 (very positive)",
              },
              reasoning: {
                type: "string",
                description: "Brief explanation of why this score was given",
              },
            },
            required: ["score", "reasoning"],
          },
        },
      },
    ],
    tool_choice: { type: "function", function: { name: "record_sentiment" } },
  });
}

export function logSentiment(
  toolCalls: OpenAI.Chat.ChatCompletionMessageToolCall[] | undefined,
) {
  const toolCall = toolCalls?.[0];
  if (toolCall && toolCall.type === "function") {
    const { score, reasoning } = JSON.parse(toolCall.function.arguments);
    console.log(`[Sentiment] Score: ${score}/100 — ${reasoning}`);
  }
}
