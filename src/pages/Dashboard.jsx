import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Overview from "../components/Overview";
import ViewExpenses from "../components/ViewExpenses";
import Reports from "../components/Reports";
import Settings from "../components/Settings";
import TransactionModal from "../components/TransactionModal";
import { PlusCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../config/axiosConfig";

// --- CATEGORY LISTS ---
const expenseCategories = [
  "Food",
  "Transport",
  "Shopping",
  "Utilities",
  "Rent",
  "Health",
  "Entertainment",
  "Education",
  "Other",
];

const incomeCategories = [
  "Salary",
  "Bonus",
  "Gifts",
  "Investment",
  "Freelance",
  "Other",
];
// --- END ---

const today = new Date().toISOString().split("T")[0];

export default function Dashboard() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [userName, setUserName] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [showModal, setShowModal] = useState(false);

  // theme: light/dark/system, persist in localStorage
  const [activeTheme, setActiveTheme] = useState(() => {
    return localStorage.getItem("theme") || "system";
  });

  const [newTransaction, setNewTransaction] = useState({
    type: "expense",
    category: expenseCategories[0],
    amount: "",
    date: today,
    description: "",
    receipt: null,
  });

  const [receiptPreview, setReceiptPreview] = useState(null);

  const navigate = useNavigate();

  // --- Dark/Light/System Theme Handling (single source of truth) ---
  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = () => {
      if (activeTheme === "dark") {
        root.classList.add("dark");
      } else if (activeTheme === "light") {
        root.classList.remove("dark");
      } else {
        const prefersDark = window.matchMedia(
          "(prefers-color-scheme: dark)"
        ).matches;
        if (prefersDark) root.classList.add("dark");
        else root.classList.remove("dark");
      }
    };

    applyTheme();
    localStorage.setItem("theme", activeTheme);

    // If system theme, watch for OS theme changes
    let media;
    const handleSystemChange = (e) => {
      if (activeTheme === "system") {
        if (e.matches) root.classList.add("dark");
        else root.classList.remove("dark");
      }
    };

    if (activeTheme === "system") {
      media = window.matchMedia("(prefers-color-scheme: dark)");
      media.addEventListener("change", handleSystemChange);
    }

    return () => {
      if (media) {
        media.removeEventListener("change", handleSystemChange);
      }
    };
  }, [activeTheme]);

  // --- Auth Handling ---
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const urlToken = searchParams.get("token");

    if (urlToken) {
      localStorage.setItem("authToken", urlToken);
      navigate("/dashboard", { replace: true });
      return;
    }

    const token = localStorage.getItem("authToken");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setUserName(payload.name?.split(" ")[0] || "User");
    } catch (error) {
      console.error("Token decode error:", error);
      localStorage.removeItem("authToken");
      navigate("/login");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    navigate("/login");
  };

  // --- Transaction Handlers ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTransaction((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleReceiptChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (receiptPreview) {
        URL.revokeObjectURL(receiptPreview);
      }
      setNewTransaction((prev) => ({
        ...prev,
        receipt: file,
      }));
      setReceiptPreview(URL.createObjectURL(file));
    }
  };

  useEffect(() => {
    return () => {
      if (receiptPreview) {
        URL.revokeObjectURL(receiptPreview);
      }
    };
  }, [receiptPreview]);

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!newTransaction.category || !newTransaction.amount) {
      alert("Please fill all required fields.");
      return;
    }

    try {
      const token = localStorage.getItem("authToken");
      const formData = new FormData();

      Object.entries(newTransaction).forEach(([key, value]) => {
        if (key === "amount") {
          formData.append(key, String(value));
        } else {
          formData.append(key, value);
        }
      });

      await api.post(`/transactions`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setRefreshKey((prev) => prev + 1);

      setShowModal(false);
      setNewTransaction({
        type: "expense",
        category: expenseCategories[0],
        amount: "",
        date: today,
        description: "",
        receipt: null,
      });
      setReceiptPreview(null);
    } catch (error) {
      console.error("Error adding transaction:", error);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return <Overview refreshKey={refreshKey} />;
      case "viewExpenses":
        return <ViewExpenses refreshKey={refreshKey} />;
      case "reports":
        return <Reports refreshKey={refreshKey} />;
      case "settings":
        return (
          <Settings
            activeTheme={activeTheme}
            setActiveTheme={setActiveTheme}
          />
        );
      default:
        return <Overview refreshKey={refreshKey} />;
    }
  };

  return (
    <div
      className="
        flex h-screen w-full
        bg-gradient-to-br from-emerald-100 via-sky-100 to-indigo-100
        dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-950 dark:to-slate-900
        overflow-hidden transition-colors duration-300
      "
    >
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        activeTheme={activeTheme}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Header */}
        <header
          className="
            absolute top-0 left-0 right-0 z-30
            flex justify-between items-center
            pl-16 md:pl-8 pr-4 md:pr-8 py-3
            bg-white/80 dark:bg-slate-900/80
            backdrop-blur-md shadow-sm
            border-b border-emerald-100/60 dark:border-slate-800
            transition-colors duration-300
          "
        >
          <div className="flex-1 truncate mr-2">
            <h2 className="text-lg md:text-xl font-semibold text-emerald-800 dark:text-emerald-300">
              Welcome 👋
            </h2>
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-200 truncate">
              {userName} !
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="
              flex-shrink-0 flex items-center justify-center gap-2
              px-3 py-2 md:px-4 md:py-2
              bg-emerald-600 text-white rounded-lg
              hover:bg-emerald-700 dark:hover:bg-emerald-500
              transition shadow-md
              text-sm md:text-base
            "
          >
            <PlusCircle size={18} />
            <span className="hidden md:inline">Add Transaction</span>
          </button>
        </header>

        {/* Content */}
        <main
          className="
            h-full w-full
            p-4 md:p-8 pt-24 pb-24
            overflow-y-auto
            transition-colors duration-200
            thin-scrollbar
          "
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              {renderTabContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Transaction Modal */}
      <TransactionModal
        open={showModal}
        onClose={() => setShowModal(false)}
        transaction={newTransaction}
        setTransaction={setNewTransaction}
        handleAddTransaction={handleAddTransaction}
        handleInputChange={handleInputChange}
        handleReceiptChange={handleReceiptChange}
        receiptPreview={receiptPreview}
        expenseCategories={expenseCategories}
        incomeCategories={incomeCategories}
        onSuccess={() => setRefreshKey((prev) => prev + 1)}
      />
    </div>
  );
}
