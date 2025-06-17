import { geminiClient } from "@/lib/api.js";

export class ChatService {
  // Generate AI response using Gemini
  static async generateResponse(
    userMessage,
    chatHistory = [],
    userName = "User",
  ) {
    if (!geminiClient) {
      throw new Error(
        "Gemini API is not configured. Please add VITE_GEMINI_API_KEY to your environment variables.",
      );
    }

    try {
      return await this.generateGeminiResponse(
        userMessage,
        chatHistory,
        userName,
      );
    } catch (error) {
      console.error("Error generating AI response:", error);
      throw new Error(
        "Failed to generate AI response. Please check your Gemini API configuration.",
      );
    }
  }

  // Generate response using Gemini
  static async generateGeminiResponse(userMessage, chatHistory, userName) {
    // Convert chat history to Gemini format
    const messages = [
      {
        role: "system",
        content: `You are a helpful AI assistant in a chat application called ZeroCode Chat. You are chatting with ${userName}. Be friendly, helpful, and conversational. Keep responses concise but informative. Respond naturally and engagingly.`,
      },
      // Include recent chat history for context (last 10 messages)
      ...chatHistory.slice(-10).map((msg) => ({
        role: msg.sender === "user" ? "user" : "assistant",
        content: msg.text,
      })),
      {
        role: "user",
        content: userMessage,
      },
    ];

    return await geminiClient.generateContent(messages);
  }

  // Check if AI service is available
  static isAIAvailable() {
    return !!geminiClient;
  }

  // Get service status
  static getServiceStatus() {
    if (geminiClient) {
      return "Connected to Google Gemini 1.5 Flash";
    }
    return "API Key Required - Add VITE_GEMINI_API_KEY";
  }
}
