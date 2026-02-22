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

  // messages should be an array of { role: "user" | "assistant", content: string }
  const completion = await getOpenAI().chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a helpful and friendly assistant. 
At the end of EVERY message you send, sign it with a DIFFERENT emoji each time. 
Pick randomly from a wide variety of emojis — never repeat the same one twice in a row.
Example endings: "...hope that helps! 🦊", "...let me know if you need more! 🌋", "...happy to help! 🎯"`,
      },
      ...messages,
    ],
  });

  if (!completion.choices[0]) {
    res.status(500).json({ error: "No response from OpenAI" });
    return;
  }
  const reply = completion.choices[0].message.content;
  res.json({ reply });
});

export default router;
