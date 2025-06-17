import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Send,
  Menu,
  Sun,
  Moon,
  Download,
  Mic,
  MicOff,
  BarChart3,
  History,
  User,
  Bot,
  LogOut,
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useVoiceRecognition } from "@/hooks/useVoiceRecognition";
import AnalyticsDashboard, {
  Analytics,
} from "@/components/analytics/AnalyticsDashboard";
import ChatHistory, { Message } from "@/components/chat/ChatHistory";

interface User {
  id: string;
  email: string;
  name: string;
}

interface ChatInterfaceProps {
  user: User;
  onLogout: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ user, onLogout }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<{ [key: string]: Message[] }>(
    {},
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { isDark, toggleTheme } = useTheme();
  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    setTranscript,
  } = useVoiceRecognition();

  // Load chat history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem("chatHistory");
    if (savedHistory) {
      setChatHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Save chat history to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
  }, [chatHistory]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle voice transcript
  useEffect(() => {
    if (transcript) {
      setInputValue(transcript);
      setTranscript("");
    }
  }, [transcript, setTranscript]);

  const simulateBotResponse = useCallback(
    async (userMessage: string): Promise<string> => {
      // Simulate API delay
      await new Promise((resolve) =>
        setTimeout(resolve, 1000 + Math.random() * 2000),
      );

      // Simple bot responses
      const responses = [
        "That's an interesting question! Let me think about that...",
        "I understand what you're asking. Here's my perspective on that topic.",
        "Thanks for sharing that with me. I'd be happy to help you with this.",
        "That's a great point! Let me provide you with some insights.",
        "I appreciate you bringing this up. Here's what I think about it.",
      ];

      if (
        userMessage.toLowerCase().includes("hello") ||
        userMessage.toLowerCase().includes("hi")
      ) {
        return `Hello ${user.name}! How can I assist you today?`;
      }

      if (userMessage.toLowerCase().includes("help")) {
        return "I'm here to help! You can ask me anything, use voice input with the microphone button, export our chat, or check out the analytics dashboard.";
      }

      return (
        responses[Math.floor(Math.random() * responses.length)] +
        " " +
        "This is a demo response. In a real application, this would connect to an actual AI service."
      );
    },
    [user.name],
  );

  const sendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    try {
      const botResponse = await simulateBotResponse(inputValue);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        sender: "bot",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I encountered an error. Please try again.",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }

    setIsTyping(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const exportChat = (format: "markdown" | "json") => {
    const timestamp = new Date().toISOString().split("T")[0];
    let content: string;
    let filename: string;

    if (format === "markdown") {
      content =
        `# Chat Export - ${timestamp}\n\n` +
        messages
          .map(
            (msg) =>
              `**${msg.sender === "user" ? "User" : "Bot"}** (${msg.timestamp.toLocaleString()})\n${msg.text}\n`,
          )
          .join("\n---\n\n");
      filename = `chat-export-${timestamp}.md`;
    } else {
      content = JSON.stringify(
        {
          exportDate: new Date().toISOString(),
          user: user.name,
          messages: messages,
        },
        null,
        2,
      );
      filename = `chat-export-${timestamp}.json`;
    }

    const blob = new Blob([content], {
      type: format === "markdown" ? "text/markdown" : "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const saveCurrentChat = () => {
    if (messages.length === 0) return;

    const chatId = currentChatId || Date.now().toString();
    setChatHistory((prev) => ({
      ...prev,
      [chatId]: messages,
    }));

    if (!currentChatId) {
      setCurrentChatId(chatId);
    }
  };

  const loadChat = (chatId: string) => {
    const chat = chatHistory[chatId];
    if (chat) {
      setMessages(chat);
      setCurrentChatId(chatId);
      setShowHistory(false);
    }
  };

  const deleteChat = (chatId: string) => {
    setChatHistory((prev) => {
      const newHistory = { ...prev };
      delete newHistory[chatId];
      return newHistory;
    });

    if (currentChatId === chatId) {
      setMessages([]);
      setCurrentChatId("");
    }
  };

  const startNewChat = () => {
    if (messages.length > 0) {
      saveCurrentChat();
    }
    setMessages([]);
    setCurrentChatId("");
    setSidebarOpen(false);
  };

  const getAnalytics = (): Analytics => {
    const totalChats =
      Object.keys(chatHistory).length + (messages.length > 0 ? 1 : 0);
    const allMessages = [...Object.values(chatHistory).flat(), ...messages];

    const totalMessages = allMessages.length;
    const avgMessagesPerChat = totalChats > 0 ? totalMessages / totalChats : 0;

    // Generate mock daily usage for last 7 days
    const dailyUsage = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return {
        date: date.toLocaleDateString(),
        messages: Math.floor(Math.random() * 20) + 1,
      };
    });

    return {
      totalMessages,
      totalChats,
      avgMessagesPerChat,
      dailyUsage,
    };
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            ZeroCode Chat
          </h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ×
          </button>
        </div>

        <div className="p-4 space-y-2">
          <button
            onClick={startNewChat}
            className="w-full text-left px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            New Chat
          </button>

          <button
            onClick={() => setShowHistory(true)}
            className="w-full text-left px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center"
          >
            <History className="mr-2" size={16} />
            Chat History
          </button>

          <button
            onClick={() => setShowAnalytics(true)}
            className="w-full text-left px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center"
          >
            <BarChart3 className="mr-2" size={16} />
            Analytics
          </button>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-4">
            <button
              onClick={toggleTheme}
              className="w-full text-left px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center"
            >
              {isDark ? (
                <Sun className="mr-2" size={16} />
              ) : (
                <Moon className="mr-2" size={16} />
              )}
              {isDark ? "Light Mode" : "Dark Mode"}
            </button>

            <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center mb-2">
                <User
                  size={16}
                  className="mr-2 text-gray-600 dark:text-gray-400"
                />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {user.name}
                </span>
              </div>
              <button
                onClick={onLogout}
                className="w-full text-left px-2 py-1 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 rounded flex items-center"
              >
                <LogOut className="mr-2" size={14} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <Menu size={20} />
          </button>

          <div className="flex-1 text-center">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              AI Assistant
            </h2>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => exportChat("markdown")}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              title="Export as Markdown"
            >
              <Download size={20} />
            </button>

            <button
              onClick={() => exportChat("json")}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              title="Export as JSON"
            >
              📄
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
              <Bot size={48} className="mx-auto mb-4 opacity-50" />
              <p>Start a conversation with the AI assistant!</p>
              <p className="text-sm mt-2">
                You can type, use voice input, or try asking for help.
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`flex items-start max-w-xs lg:max-w-md ${message.sender === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${message.sender === "user" ? "bg-blue-600 ml-2" : "bg-gray-600 mr-2"}`}
                >
                  {message.sender === "user" ? (
                    <User size={16} className="text-white" />
                  ) : (
                    <Bot size={16} className="text-white" />
                  )}
                </div>

                <div
                  className={`px-4 py-2 rounded-lg ${
                    message.sender === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                  <p
                    className={`text-xs mt-1 ${message.sender === "user" ? "text-blue-100" : "text-gray-500 dark:text-gray-400"}`}
                  >
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gray-600 mr-2">
                  <Bot size={16} className="text-white" />
                </div>
                <div className="px-4 py-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-end space-x-2">
            <div className="flex-1">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none"
                rows={1}
                style={{ minHeight: "40px", maxHeight: "120px" }}
              />
            </div>

            <button
              onClick={isListening ? stopListening : startListening}
              className={`p-2 rounded-lg transition-colors ${
                isListening
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300"
              }`}
              title={isListening ? "Stop listening" : "Start voice input"}
            >
              {isListening ? <MicOff size={20} /> : <Mic size={20} />}
            </button>

            <button
              onClick={sendMessage}
              disabled={!inputValue.trim() || isTyping}
              className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              <Send size={20} />
            </button>
          </div>

          {isListening && (
            <div className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
              Listening... Speak now
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showAnalytics && (
        <AnalyticsDashboard
          analytics={getAnalytics()}
          onClose={() => setShowAnalytics(false)}
        />
      )}

      {showHistory && (
        <ChatHistory
          chatHistory={chatHistory}
          onLoadChat={loadChat}
          onDeleteChat={deleteChat}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  );
};

export default ChatInterface;
