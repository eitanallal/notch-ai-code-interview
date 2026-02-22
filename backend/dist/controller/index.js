"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const uuid_1 = require("uuid");
const store_1 = require("../store");
const openai_util_1 = require("../utils/openai.util");
const router = express_1.default.Router();
router.get("/healthCheck", (_req, res) => {
    res.send("Hello world!");
});
router.get("/conversations", (_req, res) => {
    const list = Array.from(store_1.conversations.values()).map(({ id, title, createdAt, messages }) => ({
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
    store_1.conversations.set(id, conversation);
    res.json(conversation);
});
router.get("/conversations/:id", (req, res) => {
    const conversation = store_1.conversations.get(req.params.id);
    if (!conversation)
        throw res.status(404).json({ error: "Not found" });
    res.json(conversation);
});
router.post("/conversations/:id/chat", async (req, res) => {
    const conversation = store_1.conversations.get(req.params.id);
    if (!conversation)
        throw res.status(404).json({ error: "Conversation not found" });
    const { message } = req.body;
    const userMessage = { role: "user", content: message };
    conversation.messages.push(userMessage);
    if (conversation.messages.length === 1) {
        conversation.title =
            message.slice(0, 40) + (message.length > 40 ? "…" : "");
    }
    const [chatCompletion, sentimentCompletion] = await Promise.all([
        (0, openai_util_1.getChatCompletion)(conversation.messages),
        (0, openai_util_1.getSentimentCompletion)(conversation.messages),
    ]);
    if (!sentimentCompletion.choices[0]) {
        res.status(500).json({ error: "No response from OpenAI (sentiment)" });
        return;
    }
    if (!chatCompletion.choices[0]) {
        res.status(500).json({ error: "No response from OpenAI (chat)" });
        return;
    }
    (0, openai_util_1.logSentiment)(sentimentCompletion.choices[0].message.tool_calls);
    const reply = chatCompletion.choices[0].message.content;
    if (!reply)
        throw res.status(500).json({ error: "No content in OpenAI response" });
    const assistantMessage = { role: "assistant", content: reply };
    conversation.messages.push(assistantMessage);
    res.json({ reply, messages: conversation.messages });
});
exports.default = router;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvY29udHJvbGxlci9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLHNEQUE4QjtBQUM5QiwrQkFBb0M7QUFDcEMsb0NBQXlDO0FBRXpDLHNEQUk4QjtBQUU5QixNQUFNLE1BQU0sR0FBRyxpQkFBTyxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBRWhDLE1BQU0sQ0FBQyxHQUFHLENBQUMsY0FBYyxFQUFFLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxFQUFFO0lBQ3ZDLEdBQUcsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7QUFDM0IsQ0FBQyxDQUFDLENBQUM7QUFHSCxNQUFNLENBQUMsR0FBRyxDQUFDLGdCQUFnQixFQUFFLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxFQUFFO0lBQ3pDLE1BQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMscUJBQWEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FDakQsQ0FBQyxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ3ZDLEVBQUU7UUFDRixLQUFLO1FBQ0wsU0FBUztRQUNULFlBQVksRUFBRSxRQUFRLENBQUMsTUFBTTtLQUM5QixDQUFDLENBQ0gsQ0FBQztJQUNGLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDakIsQ0FBQyxDQUFDLENBQUM7QUFHSCxNQUFNLENBQUMsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUFFO0lBQ3pDLE1BQU0sRUFBRSxHQUFHLElBQUEsU0FBTSxHQUFFLENBQUM7SUFDcEIsTUFBTSxZQUFZLEdBQUc7UUFDbkIsRUFBRTtRQUNGLEtBQUssRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssSUFBSSxrQkFBa0I7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