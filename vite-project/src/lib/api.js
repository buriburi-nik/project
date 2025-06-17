// API Configuration
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Generic API client
class ApiClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    const config = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    // Add auth token if available
    const token = localStorage.getItem("authToken");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            `HTTP ${response.status}: ${response.statusText}`,
        );
      }

      return await response.json();
    } catch (error) {
      // Handle network errors (failed to fetch, connection refused, etc.)
      if (
        error instanceof TypeError ||
        (error instanceof Error &&
          (error.message.includes("fetch") ||
            error.message.includes("Failed to fetch") ||
            error.message.includes("Network request failed") ||
            error.message.includes("ERR_NETWORK") ||
            error.message.includes("ERR_INTERNET_DISCONNECTED")))
      ) {
        throw new Error("Network error: Unable to connect to server");
      }
      throw error;
    }
  }

  async get(endpoint) {
    return this.request(endpoint, { method: "GET" });
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put(endpoint, data) {
    return this.request(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: "DELETE" });
  }
}

// Create API client instance
export const apiClient = new ApiClient(API_BASE_URL);

// Google Gemini API client
export class GeminiClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = "https://generativelanguage.googleapis.com/v1";
  }

  async generateContent(messages) {
    if (!this.apiKey) {
      throw new Error("Gemini API key is not configured");
    }

    try {
      // Convert chat messages to Gemini format
      const contents = this.convertMessagesToGeminiFormat(messages);

      const response = await fetch(
        `${this.baseURL}/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents,
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1000,
              topP: 0.8,
              topK: 10,
            },
            safetySettings: [
              {
                category: "HARM_CATEGORY_HARASSMENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE",
              },
              {
                category: "HARM_CATEGORY_HATE_SPEECH",
                threshold: "BLOCK_MEDIUM_AND_ABOVE",
              },
              {
                category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE",
              },
              {
                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE",
              },
            ],
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message || `Gemini API error: ${response.status}`,
        );
      }

      const data = await response.json();

      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!generatedText) {
        throw new Error("No response generated from Gemini API");
      }

      return generatedText;
    } catch (error) {
      console.error("Gemini API error:", error);
      throw error;
    }
  }

  convertMessagesToGeminiFormat(messages) {
    // Gemini uses a different message format
    const contents = [];

    // Find system message and combine with conversation
    const systemMessage = messages.find((m) => m.role === "system");
    const conversationMessages = messages.filter((m) => m.role !== "system");

    // If there's a system message, prepend it as context
    if (systemMessage) {
      contents.push({
        role: "user",
        parts: [{ text: systemMessage.content }],
      });
      contents.push({
        role: "model",
        parts: [
          {
            text: "I understand. I'll follow these instructions in our conversation.",
          },
        ],
      });
    }

    // Convert conversation messages
    for (const message of conversationMessages) {
      contents.push({
        role: message.role === "user" ? "user" : "model",
        parts: [{ text: message.content }],
      });
    }

    return contents;
  }
}

// Create Gemini client instance (only if API key is available)
export const geminiClient = GEMINI_API_KEY
  ? new GeminiClient(GEMINI_API_KEY)
  : null;
