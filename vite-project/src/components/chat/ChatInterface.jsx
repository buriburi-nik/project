import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Send,
  Menu,
  Sun,
  Moon,
  Download,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  BarChart3,
  History,
  User,
  Bot,
  LogOut,
  Plus,
  ChevronDown,
  Zap,
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme.js";
import { useVoiceRecognition } from "@/hooks/useVoiceRecognition.js";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis.js";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard.jsx";
import { ChatHistory } from "@/components/chat/ChatHistory.jsx";
import { VoiceControls, VoiceStatus } from "@/components/ui/voice-controls.jsx";
import { ChatService } from "@/services/chatService.js";
import { cn } from "@/lib/utils.js";

export const ChatInterface = ({ user, onLogout }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [currentChatId, setCurrentChatId] = useState("");
  const [chatHistory, setChatHistory] = useState({});

  const messagesEndRef = useRef(null);
  const { isDark, toggleTheme } = useTheme();
  const {
    isListening,
    transcript,
    interimTranscript,
    isSupported: isVoiceSupported,
    error: voiceError,
    startListening,
    stopListening,
    resetTranscript,
  } = useVoiceRecognition();

  const {
    isSpeaking,
    isPaused,
    isSupported: isSpeechSupported,
    speak,
    pause: pauseSpeaking,
    resume: resumeSpeaking,
    stop: stopSpeaking,
  } = useSpeechSynthesis();

  // Load chat history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem("zerocode_chat_history");
    if (savedHistory) {
      setChatHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Save chat history to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("zerocode_chat_history", JSON.stringify(chatHistory));
  }, [chatHistory]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle voice transcript
  useEffect(() => {
    if (transcript) {
      setInputValue(transcript);
      resetTranscript();
    }
  }, [transcript, resetTranscript]);

  const generateBotResponse = useCallback(
    async (userMessage) => {
      return await ChatService.generateResponse(
        userMessage,
        messages,
        user.name,
      );
    },
    [messages, user.name],
  );

  // Auto-speak bot responses (optional feature)
  const [autoSpeak, setAutoSpeak] = useState(false);

  // Handle auto-speaking of bot messages
  useEffect(() => {
    if (autoSpeak && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.sender === "bot" && !isSpeaking) {
        // Small delay to ensure message is rendered
        setTimeout(() => {
          speak(lastMessage.text, {
            onEnd: () => console.log("Finished speaking bot response"),
          });
        }, 500);
      }
    }
  }, [messages, autoSpeak, speak, isSpeaking]);

  const sendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    try {
      const botResponse = await generateBotResponse(inputValue);
      const botMessage = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        sender: "bot",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error generating bot response:", error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I encountered an error generating a response. Please check your Gemini API configuration.",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }

    setIsTyping(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const exportChat = (format) => {
    const timestamp = new Date().toISOString().split("T")[0];
    let content;
    let filename;

    if (format === "markdown") {
      content =
        `# ZeroCode Chat Export - ${timestamp}\n\n` +
        `**User:** ${user.name} (${user.email})\n` +
        `**Export Date:** ${new Date().toLocaleString()}\n\n---\n\n` +
        messages
          .map(
            (msg) =>
              `**${msg.sender === "user" ? "You" : "AI Assistant"}** *(${msg.timestamp.toLocaleString()})*\n\n${msg.text}\n`,
          )
          .join("\n---\n\n");
      filename = `zerocode-chat-${timestamp}.md`;
    } else {
      content = JSON.stringify(
        {
          appName: "ZeroCode Chat",
          exportDate: new Date().toISOString(),
          user: {
            name: user.name,
            email: user.email,
          },
          chatInfo: {
            totalMessages: messages.length,
            startTime: messages[0]?.timestamp,
            endTime: messages[messages.length - 1]?.timestamp,
          },
          messages: messages,
        },
        null,
        2,
      );
      filename = `zerocode-chat-${timestamp}.json`;
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
      [chatId]: {
        messages: messages,
        title: messages[0]?.text.substring(0, 50) || "Untitled Chat",
        createdAt: new Date().toISOString(),
        messageCount: messages.length,
      },
    }));

    if (!currentChatId) {
      setCurrentChatId(chatId);
    }
  };

  const loadChat = (chatId) => {
    const chat = chatHistory[chatId];
    if (chat) {
      setMessages(chat.messages || []);
      setCurrentChatId(chatId);
      setShowHistory(false);
    }
  };

  const deleteChat = (chatId) => {
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

  const getAnalytics = () => {
    const chatEntries = Object.values(chatHistory);
    const totalChats = chatEntries.length + (messages.length > 0 ? 1 : 0);
    const allMessages = [
      ...chatEntries.flatMap((chat) => chat.messages || []),
      ...messages,
    ];

    const totalMessages = allMessages.length;
    const avgMessagesPerChat = totalChats > 0 ? totalMessages / totalChats : 0;

    // Generate realistic daily usage based on stored data
    const dailyUsage = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const dateStr = date.toLocaleDateString();

      // Count messages from that day
      const dayMessages = allMessages.filter((msg) => {
        if (!msg.timestamp) return false;
        const msgDate = new Date(msg.timestamp).toLocaleDateString();
        return msgDate === dateStr;
      });

      return {
        date: dateStr,
        messages: dayMessages.length,
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
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                ZeroCode Chat
              </h1>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden"
            >
              ×
            </Button>
          </div>

          <div className="flex-1 p-4 space-y-3">
            <Button
              onClick={startNewChat}
              className="w-full justify-start bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Chat
            </Button>

            <Button
              variant="ghost"
              onClick={() => setShowHistory(true)}
              className="w-full justify-start"
            >
              <History className="w-4 h-4 mr-2" />
              Chat History
            </Button>

            <Button
              variant="ghost"
              onClick={() => setShowAnalytics(true)}
              className="w-full justify-start"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </Button>

            <Separator />

            <Button
              variant="ghost"
              onClick={toggleTheme}
              className="w-full justify-start"
            >
              {isDark ? (
                <Sun className="w-4 h-4 mr-2" />
              ) : (
                <Moon className="w-4 h-4 mr-2" />
              )}
              {isDark ? "Light Mode" : "Dark Mode"}
            </Button>

            {isSpeechSupported && (
              <Button
                variant="ghost"
                onClick={() => setAutoSpeak(!autoSpeak)}
                className="w-full justify-start"
              >
                {autoSpeak ? (
                  <Volume2 className="w-4 h-4 mr-2" />
                ) : (
                  <VolumeX className="w-4 h-4 mr-2" />
                )}
                {autoSpeak ? "Auto-speak On" : "Auto-speak Off"}
              </Button>
            )}
          </div>

          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3 mb-3">
              <Avatar>
                <AvatarFallback className="bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400">
                  <User className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                  {user.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user.email}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={onLogout}
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden"
              >
                <Menu className="w-5 h-5" />
              </Button>
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white">
                    <Bot className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                    AI Assistant
                  </h2>
                  <div className="flex items-center space-x-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full mr-2",
                          ChatService.isAIAvailable()
                            ? "bg-green-500 animate-pulse"
                            : "bg-red-500",
                        )}
                      ></div>
                      {ChatService.getServiceStatus()}
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center">
                      <Zap className="w-3 h-3 mr-1" />
                      Frontend Only
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => exportChat("markdown")}>
                  Export as Markdown
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportChat("json")}>
                  Export as JSON
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="max-w-4xl mx-auto space-y-4">
            {messages.length === 0 && (
              <Card className="text-center py-12">
                <CardContent>
                  <div className="mx-auto w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 rounded-full flex items-center justify-center mb-4">
                    <Bot className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Hello {user.name}! 👋
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Start a conversation with your AI assistant! You can type,
                    use voice input, or ask for help.
                  </p>
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                    <Zap className="w-3 h-3 mr-1" />
                    Pure Frontend • No Backend Required
                  </div>
                </CardContent>
              </Card>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex items-start space-x-3",
                  message.sender === "user"
                    ? "flex-row-reverse space-x-reverse"
                    : "",
                )}
              >
                <Avatar>
                  <AvatarFallback
                    className={cn(
                      message.sender === "user"
                        ? "bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400"
                        : "bg-gradient-to-br from-indigo-500 to-purple-500 text-white",
                    )}
                  >
                    {message.sender === "user" ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Bot className="w-4 h-4" />
                    )}
                  </AvatarFallback>
                </Avatar>
                <Card
                  className={cn(
                    "max-w-[70%]",
                    message.sender === "user"
                      ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-0"
                      : "bg-white dark:bg-gray-800",
                  )}
                >
                  <CardContent className="p-3">
                    <p className="text-sm leading-relaxed">{message.text}</p>
                    <p
                      className={cn(
                        "text-xs mt-2",
                        message.sender === "user"
                          ? "text-indigo-100"
                          : "text-gray-500 dark:text-gray-400",
                      )}
                    >
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </p>
                  </CardContent>
                </Card>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-start space-x-3">
                <Avatar>
                  <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white">
                    <Bot className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <Card className="bg-white dark:bg-gray-800">
                  <CardContent className="p-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-end space-x-2">
              <div className="flex-1">
                <Textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="min-h-[44px] max-h-32 resize-none"
                  rows={1}
                />
              </div>

              <VoiceControls
                isListening={isListening}
                isSpeaking={isSpeaking}
                isPaused={isPaused}
                interimTranscript={interimTranscript}
                error={voiceError}
                isVoiceSupported={isVoiceSupported}
                isSpeechSupported={isSpeechSupported}
                onStartListening={startListening}
                onStopListening={stopListening}
                onPauseSpeaking={pauseSpeaking}
                onResumeSpeaking={resumeSpeaking}
                onStopSpeaking={stopSpeaking}
                size="sm"
                className="h-11"
              />

              <Button
                onClick={sendMessage}
                disabled={!inputValue.trim() || isTyping}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white h-11"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>

            <VoiceStatus
              isListening={isListening}
              isSpeaking={isSpeaking}
              isPaused={isPaused}
              interimTranscript={interimTranscript}
              error={voiceError}
              className="mt-2"
            />
          </div>
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
