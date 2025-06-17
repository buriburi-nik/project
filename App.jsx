import React, { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth.js";
import { SignIn } from "@/pages/SignIn.jsx";
import { SignUp } from "@/pages/SignUp.jsx";
import { Chat } from "@/pages/Chat.jsx";

const queryClient = new QueryClient();

const AppContent = () => {
  const { user, isLoading, logout } = useAuth();
  const [currentPage, setCurrentPage] = useState("signin");

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mb-4">
            <div className="w-8 h-8 bg-white dark:bg-gray-900 rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 bg-gradient-to-br from-indigo-600 to-purple-600 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">
            Loading ZeroCode Chat...
          </p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Chat user={user} onLogout={logout} />;
  }

  if (currentPage === "signin") {
    return <SignIn onNavigateToSignUp={() => setCurrentPage("signup")} />;
  }

  if (currentPage === "signup") {
    return <SignUp onNavigateToSignIn={() => setCurrentPage("signin")} />;
  }

  return <SignIn onNavigateToSignUp={() => setCurrentPage("signup")} />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppContent />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
