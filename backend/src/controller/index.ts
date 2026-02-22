import express from "express";
import { v4 as uuidv4 } from "uuid";
import { conversations } from "../store";
import { Message } from "../types";
import {
  getChatCompletion,
  getSentimentCompletion,
  logSentiment,
} from "../utils/openai.util";

const router = express.Router();

router.get("/healthCheck", (_req, res) => {
  res.send("Hello world!");
});

// GET /conversations — list all
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

// POST /conversations — create new
router.post("/conversations", (req, res) => {
  const id = uuidv4();
  const conversation = {
    id,
    title: req.body.title || "New conversation",
    createdAt: new Date().toISOString(),
    messages: [] as Message[],
  };
  conversations.set(id, conversation);
  res.json(conversation);
});

// GET /conversations/:id — get single with messages
router.get("/conversations/:id", (req, res) => {
  const conversation = conversations.get(req.params.id);
  if (!conversation) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(conversation);
});

// POST /conversations/:id/chat
router.post("/conversations/:id/chat", async (req, res) => {
  try {
    const conversation = conversations.get(req.params.id);
    if (!conversation) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    const { message } = req.body;
    if (!message || typeof message !== "string" || message.trim() === "") {
      res.status(400).json({ error: "message is required" });
      return;
    }

    const userMessage: Message = { role: "user", content: message };
    conversation.messages.push(userMessage);

    if (conversation.messages.length === 1) {
      conversation.title =
        message.slice(0, 40) + (message.length > 40 ? "…" : "");
    }

    const [chatCompletion, sentimentCompletion] = await Promise.all([
      getChatCompletion(conversation.messages),
      getSentimentCompletion(conversation.messages),
    ]);

    if (!sentimentCompletion.choices[0]) {
      res.status(500).json({ error: "No response from OpenAI (sentiment)" });
      return;
    }

    if (!chatCompletion.choices[0]) {
      res.status(500).json({ error: "No response from OpenAI (chat)" });
      return;
    }

    logSentiment(sentimentCompletion.choices[0].message.tool_calls);

    const reply = chatCompletion.choices[0].message.content;
    if (!reply)
      throw res.status(500).json({ error: "No content in OpenAI response" });

    const assistantMessage: Message = { role: "assistant", content: reply };
    conversation.messages.push(assistantMessage);

    res.json({ reply, messages: conversation.messages });
  } catch (error) {
    console.error("Error in /conversations/:id/chat:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

export default router;
