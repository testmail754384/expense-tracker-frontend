import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { Mail, Send } from "lucide-react";
import api from "../config/axiosConfig"; // Axios instance

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return toast.error("Please enter your email.");

    try {
      setLoading(true);
      const res = await api.post(`/auth/forgot-password`, { email });
      toast.success(res.data.message);
      setTimeout(() => {
        window.location.href = `/reset-password?email=${encodeURIComponent(email)}`;
      }, 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || "Error sending OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900"
    >
      <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md p-8 rounded-2xl shadow-xl w-full max-w-sm border border-gray-300 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-center mb-4 text-gray-800 dark:text-gray-200">Forgot Password</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 text-center">
          Enter your email to receive an OTP for password reset.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex items-center gap-2 border rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-700">
            <Mail className="text-gray-500 dark:text-gray-400" size={18} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your registered email"
              className="bg-transparent w-full outline-none text-gray-800 dark:text-gray-100"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <Send size={18} />
            {loading ? "Sending..." : "Send OTP"}
          </button>
        </form>
      </div>
    </motion.div>
  );
}
