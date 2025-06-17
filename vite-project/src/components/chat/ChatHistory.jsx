import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, Trash2, MessageSquare, Calendar, X, Zap } from "lucide-react";

export const ChatHistory = ({
  chatHistory,
  onLoadChat,
  onDeleteChat,
  onClose,
}) => {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-2xl font-bold flex items-center space-x-2">
            <History className="w-6 h-6 text-indigo-600" />
            <span>Chat History</span>
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <ScrollArea className="h-[500px] mt-6">
          <div className="space-y-3">
            {Object.entries(chatHistory).length === 0 ? (
              <Card className="p-8 text-center">
                <CardContent className="space-y-4">
                  <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-8 h-8 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                      No chat history yet
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                      Start a conversation to see your chat history here
                    </p>
                    <div className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 mt-3">
                      <Zap className="w-3 h-3 mr-1" />
                      Stored locally in your browser
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              Object.entries(chatHistory).map(([chatId, chatData]) => {
                // Handle both old and new chat format
                const messages = chatData.messages || chatData;
                const title =
                  chatData.title || messages[0]?.text || "Empty chat";
                const messageCount = chatData.messageCount || messages.length;
                const createdAt = chatData.createdAt
                  ? new Date(chatData.createdAt)
                  : new Date(parseInt(chatId));

                const date = createdAt.toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });

                const time = createdAt.toLocaleTimeString(undefined, {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <Card
                    key={chatId}
                    className="hover:shadow-md transition-all duration-200 cursor-pointer border-l-4 border-l-indigo-500"
                  >
                    <CardContent className="p-4">
                      <div
                        className="flex items-start justify-between"
                        onClick={() => onLoadChat(chatId)}
                      >
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                            {title.length > 50
                              ? `${title.substring(0, 50)}...`
                              : title}
                          </h3>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>
                                {date} at {time}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <MessageSquare className="w-4 h-4" />
                              <span>{messageCount} messages</span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteChat(chatId);
                          }}
                          className="ml-2 h-8 w-8 p-0 text-red-500 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
