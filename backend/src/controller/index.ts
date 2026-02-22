import express from "express";
import OpenAI from "openai";
import { config } from "../config";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

// --- In-memory store ---
interface Message {
  role: "user" | "assistant";
  content: string;
}
interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  messages: Message[];
}
const conversations: Map<string, Conversation> = new Map();

let openai: OpenAI;
const getOpenAI = () => {
  if (!openai) openai = new OpenAI({ apiKey: config.OPENAI_API_KEY });
  return openai;
};

router.get("/healthCheck", (_req, res) => {
  res.send("Hello world!");
});

// GET /api/conversations — list all
router.get("/conversations", (_req, res) => {
  const list = Array.from(conversations.values()).map(
    ({ id, title, createdAt, messages }) => ({
      id,
      title,
      createdAt,
      messageCount: messages.length,
    }),
  );
  res.json(list);
});

// POST /api/conversations — create new
router.post("/conversations", (req, res) => {
  const id = uuidv4();
  const conversation: Conversation = {
    id,
    title: req.body.title || "New conversation",
    createdAt: new Date().toISOString(),
    messages: [],
  };
  conversations.set(id, conversation);
  res.json(conversation);
});

// GET /api/conversations/:id — get single with messages
router.get("/conversations/:id", (req, res) => {
  const conversation = conversations.get(req.params.id);
  if (!conversation) throw res.status(404).json({ error: "Not found" });
  res.json(conversation);
});

router.post("/conversations/:id/chat", async (req, res) => {
  const conversation = conversations.get(req.params.id);
  if (!conversation)
    throw res.status(404).json({ error: "Conversation not found" });

  const { message } = req.body;
  const userMessage: Message = { role: "user", content: message };
  conversation.messages.push(userMessage);

  // Auto-title from first message
  if (conversation.messages.length === 1) {
    conversation.title =
      message.slice(0, 40) + (message.length > 40 ? "…" : "");
  }

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
      messages: [systemPrompt, ...conversation.messages],
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
        ...conversation.messages,
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
  if (!reply)
    throw res.status(500).json({ error: "No content in OpenAI response" });
  const assistantMessage: Message = { role: "assistant", content: reply };
  conversation.messages.push(assistantMessage);

  res.json({ reply, messages: conversation.messages });
});

export default router;
