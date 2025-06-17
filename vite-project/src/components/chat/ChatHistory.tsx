import React from "react";
import { Trash2 } from "lucide-react";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

interface ChatHistoryProps {
  chatHistory: { [key: string]: Message[] };
  onLoadChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
  onClose: () => void;
}

const ChatHistory: React.FC<ChatHistoryProps> = ({
  chatHistory,
  onLoadChat,
  onDeleteChat,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-96 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Chat History
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ×
          </button>
        </div>

        <div className="space-y-2">
          {Object.entries(chatHistory).length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              No chat history available
            </p>
          ) : (
            Object.entries(chatHistory).map(([chatId, messages]) => {
              const firstMessage = messages[0]?.text || "Empty chat";
              const messageCount = messages.length;
              const date = new Date(chatId).toLocaleDateString();

              return (
                <div
                  key={chatId}
                  className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => onLoadChat(chatId)}
                  >
                    <p className="font-semibold text-gray-900 dark:text-white truncate">
                      {firstMessage.substring(0, 50)}...
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {date} • {messageCount} messages
                    </p>
                  </div>
                  <button
                    onClick={() => onDeleteChat(chatId)}
                    className="ml-2 p-1 text-red-500 hover:text-red-700 dark:hover:text-red-400"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatHistory;
export type { Message };
