import express from "express";
import OpenAI from "openai";
import { config } from "../config";

const router = express.Router();
let openai: OpenAI;
const getOpenAI = () => {
  if (!openai) openai = new OpenAI({ apiKey: config.OPENAI_API_KEY });
  return openai;
};

router.get("/healthCheck", (_req, res) => {
  res.send("Hello world!");
});

router.post("/chat", async (req, res) => {
  const { messages } = req.body;

  const systemPrompt = {
    role: "system" as const,
    content: `You are a helpful and friendly assistant. 
At the end of EVERY message you send, sign it with a DIFFERENT emoji each time. 
Pick randomly from a wide variety of emojis — never repeat the same one twice in a row.
Example endings: "...hope that helps! 🦊", "...let me know if you need more! 🌋", "...happy to help! 🎯"`,
  };

  const [chatCompletion, sentimentCompletion] = await Promise.all([
    // Part A: regular chat response
    getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [systemPrompt, ...messages],
    }),

    // Part B: sentiment extraction via function calling
    getOpenAI().chat.completions.create({
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
    }),
  ]);

  if (!sentimentCompletion.choices[0]) {
    res.status(500).json({ error: "No response from OpenAI (sentiment)" });
    return;
  }

  if (!chatCompletion.choices[0]) {
    res.status(500).json({ error: "No response from OpenAI (chat)" });
    return;
  }
  // Parse and log the sentiment
  const toolCall = sentimentCompletion.choices[0].message.tool_calls?.[0];
  if (toolCall) {
    console.log(JSON.stringify(toolCall, undefined, 2));
    const { score, reasoning } = JSON.parse(toolCall.function.arguments);
    console.log(`[Sentiment] Score: ${score}/100 — ${reasoning}`);
  }

  const reply = chatCompletion.choices[0].message.content;
  res.json({ reply });
});

export default router;
