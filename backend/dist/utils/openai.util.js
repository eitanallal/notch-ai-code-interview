"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logSentiment = exports.getSentimentCompletion = exports.getChatCompletion = exports.systemPrompt = exports.getOpenAI = void 0;
const openai_1 = __importDefault(require("openai"));
const config_1 = require("../config");
let openai;
const getOpenAI = () => {
    if (!openai)
        openai = new openai_1.default({ apiKey: config_1.config.OPENAI_API_KEY });
    return openai;
};
exports.getOpenAI = getOpenAI;
exports.systemPrompt = {
    role: "system",
    content: `You are a helpful and friendly assistant. 
At the end of EVERY message you send, sign it with a DIFFERENT emoji each time. 
Pick randomly from a wide variety of emojis — never repeat the same one twice in a row.
Example endings: "...hope that helps! 🦊", "...let me know if you need more! 🌋", "...happy to help! 🎯"`,
};
async function getChatCompletion(messages) {
    return (0, exports.getOpenAI)().chat.completions.create({
        model: "gpt-4o-mini",
        messages: [exports.systemPrompt, ...messages],
    });
}
exports.getChatCompletion = getChatCompletion;
async function getSentimentCompletion(messages) {
    return (0, exports.getOpenAI)().chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content: "You analyze the sentiment of the user's messages in a conversation.",
            },
            ...messages,
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
    });
}
exports.getSentimentCompletion = getSentimentCompletion;
function logSentiment(toolCalls) {
    const toolCall = toolCalls?.[0];
    if (toolCall && toolCall.type === "function") {
        const { score, reasoning } = JSON.parse(toolCall.function.arguments);
        console.log(`[Sentiment] Score: ${score}/100 — ${reasoning}`);
    }
}
exports.logSentiment = logSentiment;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3BlbmFpLnV0aWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvdXRpbHMvb3BlbmFpLnV0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsb0RBQTRCO0FBQzVCLHNDQUFtQztBQUVuQyxJQUFJLE1BQWMsQ0FBQztBQUNaLE1BQU0sU0FBUyxHQUFHLEdBQUcsRUFBRTtJQUM1QixJQUFJLENBQUMsTUFBTTtRQUFFLE1BQU0sR0FBRyxJQUFJLGdCQUFNLENBQUMsRUFBRSxNQUFNLEVBQUUsZUFBTSxDQUFDLGNBQWMsRUFBRSxDQUFDLENBQUM7SUFDcEUsT0FBTyxNQUFNLENBQUM7QUFDaEIsQ0FBQyxDQUFDO0FBSFcsUUFBQSxTQUFTLGFBR3BCO0FBRVcsUUFBQSxZQUFZLEdBQUc7SUFDMUIsSUFBSSxFQUFFLFFBQWlCO0lBQ3ZCLE9BQU8sRUFBRTs7O3lHQUc4RjtDQUN4RyxDQUFDO0FBRUssS0FBSyxVQUFVLGlCQUFpQixDQUNyQyxRQUFrRDtJQUVsRCxPQUFPLElBQUEsaUJBQVMsR0FBRSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDO1FBQ3pDLEtBQUssRUFBRSxhQUFhO1FBQ3BCLFFBQVEsRUFBRSxDQUFDLG9CQUFZLEVBQUUsR0FBRyxRQUFRLENBQUM7S0FDdEMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQVBELDhDQU9DO0FBRU0sS0FBSyxVQUFVLHNCQUFzQixDQUMxQyxRQUFrRDtJQUVsRCxPQUFPLElBQUEsaUJBQVMsR0FBRSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDO1FBQ3pDLEtBQUssRUFBRSxhQUFhO1FBQ3BCLFFBQVEsRUFBRTtZQUNSO2dCQUNFLElBQUksRUFBRSxRQUFRO2dCQUNkLE9BQU8sRUFDTCxxRUFBcUU7YUFDeEU7WUFDRCxHQUFHLFFBQVE7U0FDWjtRQUNELEtBQUssRUFBRTtZQUNMO2dCQUNFLElBQUksRUFBRSxVQUFVO2dCQUNoQixRQUFRLEVBQUU7b0JBQ1IsSUFBSSxFQUFFLGtCQUFrQjtvQkFDeEIsV0FBVyxFQUNULG1FQUFtRTtvQkFDckUsVUFBVSxFQUFFO3dCQUNWLElBQUksRUFBRSxRQUFRO3dCQUNkLFVBQVUsRUFBRTs0QkFDVixLQUFLLEVBQUU7Z0NBQ0wsSUFBSSxFQUFFLFFBQVE7Z0NBQ2QsV0FBVyxFQUNULCtEQUErRDs2QkFDbEU7NEJBQ0QsU0FBUyxFQUFFO2dDQUNULElBQUksRUFBRSxRQUFRO2dDQUNkLFdBQVcsRUFBRSwrQ0FBK0M7NkJBQzdEO3lCQUNGO3dCQUNELFFBQVEsRUFBRSxDQUFDLE9BQU8sRUFBRSxXQUFXLENBQUM7cUJBQ2pDO2lCQUNGO2FBQ0Y7U0FDRjtRQUNELFdBQVcsRUFBRSxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsUUFBUSxFQUFFLEVBQUUsSUFBSSxFQUFFLGtCQUFrQixFQUFFLEVBQUU7S0FDMUUsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQXhDRCx3REF3Q0M7QUFFRCxTQUFnQixZQUFZLENBQzFCLFNBQWtFO0lBRWxFLE1BQU0sUUFBUSxHQUFHLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ2hDLElBQUksUUFBUSxJQUFJLFFBQVEsQ0FBQyxJQUFJLEtBQUssVUFBVSxFQUFFLENBQUM7UUFDN0MsTUFBTSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDckUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxzQkFBc0IsS0FBSyxVQUFVLFNBQVMsRUFBRSxDQUFDLENBQUM7SUFDaEUsQ0FBQztBQUNILENBQUM7QUFSRCxvQ0FRQyJ9