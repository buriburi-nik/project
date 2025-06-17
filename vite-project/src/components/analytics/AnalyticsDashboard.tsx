import React from "react";

interface Analytics {
  totalMessages: number;
  totalChats: number;
  avgMessagesPerChat: number;
  dailyUsage: { date: string; messages: number }[];
}

interface AnalyticsDashboardProps {
  analytics: Analytics;
  onClose: () => void;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  analytics,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-96 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Analytics Dashboard
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200">
              Total Messages
            </h3>
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {analytics.totalMessages}
            </p>
          </div>

          <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
              Total Chats
            </h3>
            <p className="text-2xl font-bold text-green-900 dark:text-green-100">
              {analytics.totalChats}
            </p>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-200">
              Avg Messages/Chat
            </h3>
            <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              {analytics.avgMessagesPerChat.toFixed(1)}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Daily Usage (Last 7 Days)
          </h3>
          {analytics.dailyUsage.map((day, index) => (
            <div
              key={index}
              className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600"
            >
              <span className="text-gray-700 dark:text-gray-300">
                {day.date}
              </span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {day.messages} messages
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
export type { Analytics };
