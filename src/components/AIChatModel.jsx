import React, { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import api from "../config/axiosConfig";
import { useUser } from "../context/UserContext";

/* ---------- Text formatter ---------- */
const formatText = (text = "") =>
  text
    // remove double line breaks
    .replace(/\n\n{2,}/g, "\n\n")
    // formatting
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/^- (.*)$/gm, "• $1")
    .replace(/\n/g, "<br/>");



/* ---------- Greeting ---------- */
const greetingText = (name, isUpdate = false) =>
  isUpdate
    ? `👋 Hi **${name}**!  
Your name has been updated successfully.

How can I help you with your expenses today? 💸`
    : `👋 Hello **${name}**!

I'm your **Expense AI Assistant** 🤖💸  
I can help you analyze your **income, expenses, and savings**.

Try asking:
- **Where did I spend the most?**
- **Monthly expense summary**
- **How can I save more money?**

How can I help you today? 😊`;

export default function AIChatModal({ isLoggedIn }) {
  const { user, loading } = useUser();

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const chatEndRef = useRef(null);
  const lastUserNameRef = useRef(null);

  /* ---------- RESET CHAT ON LOGIN ---------- */
  useEffect(() => {
    if (!isLoggedIn || loading || !user?.name) return;

    // 🔥 CLEAR OLD CHAT COMPLETELY
    setMessages([
      { role: "ai", text: greetingText(user.name) }
    ]);

    // 🔥 FORCE AUTO OPEN
    setOpen(true);

    lastUserNameRef.current = user.name;
  }, [isLoggedIn, loading, user?.name]);

  /* ---------- Greet again if name changes ---------- */
  useEffect(() => {
    if (!isLoggedIn || !user?.name) return;

    if (lastUserNameRef.current && lastUserNameRef.current !== user.name) {
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: greetingText(user.name, true) }
      ]);
      lastUserNameRef.current = user.name;
    }
  }, [user?.name, isLoggedIn]);

  /* ---------- AUTO SCROLL ---------- */
useEffect(() => {
  if (!open) return;

  // Small delay ensures modal DOM is rendered
  setTimeout(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, 50);
}, [open, messages, sending]);


  /* ---------- SEND MESSAGE ---------- */
  const sendMessage = async () => {
    if (!input.trim()) return;

    const question = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setSending(true);

    try {
      const res = await api.post("/ai/analyze", { message: question });
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: res.data.reply }
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "⚠️ AI service is temporarily unavailable." }
      ]);
    } finally {
      setSending(false);
    }
  };

  /* ---------- ENTER / SHIFT+ENTER ---------- */
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-green-600 text-white p-3 rounded-full shadow-xl hover:scale-105 transition"
      >
        <MessageCircle size={22} />
      </button>

      {/* Modal */}
      {open && (
        <div className="ai-overlay show">
          <div className="ai-modal slide-up">

            {/* Header */}
            <div className="ai-header">
              <h3>💸 Expense AI Assistant</h3>
              <button onClick={() => setOpen(false)}>
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="ai-body">
              {!isLoggedIn && (
                <p className="ai-locked">
                  🔒 Log in to chat about your expenses.
                </p>
              )}

              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`ai-msg ${m.role}`}
                  dangerouslySetInnerHTML={{
                    __html: formatText(m.text)
                  }}
                />
              ))}

              {sending && <div className="ai-typing">🤖 Analyzing…</div>}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            {isLoggedIn && (
              <div className="ai-input">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about your expenses…"
                  rows={2}
                />
                <button onClick={sendMessage}>
                  <Send size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
