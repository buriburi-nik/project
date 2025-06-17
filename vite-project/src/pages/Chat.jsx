import React from "react";
import { ChatInterface } from "@/components/chat/ChatInterface.jsx";

export const Chat = ({ user, onLogout }) => {
  return <ChatInterface user={user} onLogout={onLogout} />;
};
