"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const openai_1 = __importDefault(require("openai"));
const config_1 = require("../config");
const uuid_1 = require("uuid");
const router = express_1.default.Router();
const conversations = new Map();
let openai;
const getOpenAI = () => {
    if (!openai)
        openai = new openai_1.default({ apiKey: config_1.config.OPENAI_API_KEY });
    return openai;
};
router.get("/healthCheck", (_req, res) => {
    res.send("Hello world!");
});
router.get("/conversations", (_req, res) => {
    const list = Array.from(conversations.values()).map(({ id, title, createdAt, messages }) => ({
        id,
        title,
        createdAt,
        messageCount: messages.length,
    }));
    res.json(list);
});
router.post("/conversations", (req, res) => {
    const id = (0, uuid_1.v4)();
    const conversation = {
        id,
        title: req.body.title || "New conversation",
        createdAt: new Date().toISOString(),
        messages: [],
    };
    conversations.set(id, conversation);
    res.json(conversation);
});
router.get("/conversations/:id", (req, res) => {
    const conversation = conversations.get(req.params.id);
    if (!conversation)
        throw res.status(404).json({ error: "Not found" });
    res.json(conversation);
});
router.post("/conversations/:id/chat", async (req, res) => {
    const conversation = conversations.get(req.params.id);
    if (!conversation)
        throw res.status(404).json({ error: "Conversation not found" });
    const { message } = req.body;
    const userMessage = { role: "user", content: message };
    conversation.messages.push(userMessage);
    if (conversation.messages.length === 1) {
        conversation.title =
            message.slice(0, 40) + (message.length > 40 ? "…" : "");
    }
    const systemPrompt = {
        role: "system",
        content: `You are a helpful and friendly assistant. 
At the end of EVERY message you send, sign it with a DIFFERENT emoji each time. 
Pick randomly from a wide variety of emojis — never repeat the same one twice in a row.
Example endings: "...hope that helps! 🦊", "...let me know if you need more! 🌋", "...happy to help! 🎯"`,
    };
    const [chatCompletion, sentimentCompletion] = await Promise.all([
        getOpenAI().chat.completions.create({
            model: "gpt-4o-mini",
            messages: [systemPrompt, ...conversation.messages],
        }),
        getOpenAI().chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "You analyze the sentiment of the user's messages in a conversation.",
                },
                ...conversation.messages,
            ],
            tools: [
                {
                    type: "function",
                    function: {
                        name: "record_sentiment",
                        description: "Record the user's current sentiment score based on their messages",
                        parameters: {
                            type: "object",
                            properties: {
                                score: {
                                    type: "number",
                                    description: "Sentiment score from 0 (very negative) to 100 (very positive)",
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
    const toolCall = sentimentCompletion.choices[0].message.tool_calls?.[0];
    if (toolCall) {
        console.log(JSON.stringify(toolCall, undefined, 2));
        const { score, reasoning } = JSON.parse(toolCall.function.arguments);
        console.log(`[Sentiment] Score: ${score}/100 — ${reasoning}`);
    }
    const reply = chatCompletion.choices[0].message.content;
    if (!reply)
        throw res.status(500).json({ error: "No content in OpenAI response" });
    const assistantMessage = { role: "assistant", content: reply };
    conversation.messages.push(assistantMessage);
    res.json({ reply, messages: conversation.messages });
});
exports.default = router;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvY29udHJvbGxlci9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLHNEQUE4QjtBQUM5QixvREFBNEI7QUFDNUIsc0NBQW1DO0FBQ25DLCtCQUFvQztBQUVwQyxNQUFNLE1BQU0sR0FBRyxpQkFBTyxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBYWhDLE1BQU0sYUFBYSxHQUE4QixJQUFJLEdBQUcsRUFBRSxDQUFDO0FBRTNELElBQUksTUFBYyxDQUFDO0FBQ25CLE1BQU0sU0FBUyxHQUFHLEdBQUcsRUFBRTtJQUNyQixJQUFJLENBQUMsTUFBTTtRQUFFLE1BQU0sR0FBRyxJQUFJLGdCQUFNLENBQUMsRUFBRSxNQUFNLEVBQUUsZUFBTSxDQUFDLGNBQWMsRUFBRSxDQUFDLENBQUM7SUFDcEUsT0FBTyxNQUFNLENBQUM7QUFDaEIsQ0FBQyxDQUFDO0FBRUYsTUFBTSxDQUFDLEdBQUcsQ0FBQyxjQUFjLEVBQUUsQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLEVBQUU7SUFDdkMsR0FBRyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQztBQUMzQixDQUFDLENBQUMsQ0FBQztBQUdILE1BQU0sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLEVBQUU7SUFDekMsTUFBTSxJQUFJLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQ2pELENBQUMsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUN2QyxFQUFFO1FBQ0YsS0FBSztRQUNMLFNBQVM7UUFDVCxZQUFZLEVBQUUsUUFBUSxDQUFDLE1BQU07S0FDOUIsQ0FBQyxDQUNILENBQUM7SUFDRixHQUFHLENBQUMsSUFBSSxDQUFDLElB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