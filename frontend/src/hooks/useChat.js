import { useState, useCallback } from "react";
import { chatAPI } from "../utils/api";

export function useChat(mode) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [conversationTitle, setConversationTitle] = useState("");

  const sendMessage = useCallback(
    async (text) => {
      if (!text.trim() || isLoading) return;

      // Add user message instantly
      const userMsg = {
        id: Date.now(),
        role: "user",
        content: text.trim(),
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);
      setError(null);

      try {
        const data = await chatAPI.send(
          text.trim(),
          mode,
          conversationId
        );

        // Add AI reply
        const aiMsg = {
          id: Date.now() + 1,
          role: "assistant",
          content: data.reply,
          created_at: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, aiMsg]);
        setConversationId(data.conversation_id);
        setConversationTitle(data.conversation_title);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    },
    [mode, conversationId, isLoading]
  );

  // Load an existing conversation from history
  const loadConversation = useCallback((conv) => {
    setConversationId(conv.id);
    setConversationTitle(conv.title);
    setMessages(conv.messages || []);
    setError(null);
  }, []);

  // Start fresh
  const resetChat = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setConversationTitle("");
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    conversationId,
    conversationTitle,
    sendMessage,
    loadConversation,
    resetChat,
  };
}