import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import Overview from "../components/Overview";
import ViewExpenses from "../components/ViewExpenses";
import Reports from "../components/Reports";
import Settings from "../components/Settings";
import TransactionModal from "../components/TransactionModal";
import { PlusCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- CATEGORY LISTS ---
const expenseCategories = [
  "Food", "Transport", "Shopping", "Utilities", "Rent",
  "Health", "Entertainment", "Education", "Other",
];
const incomeCategories = [
  "Salary", "Bonus", "Gifts", "Investment", "Freelance", "Other",
];
// --- END ---

export default function Dashboard() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [userName, setUserName] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [showModal, setShowModal] = useState(false);
  const [activeTheme, setActiveTheme] = useState("system"); // light/dark/system

  const [newTransaction, setNewTransaction] = useState({
    type: "expense",
    category: expenseCategories[0],
    amount: "",
    date:  new Date().toLocaleDateString("en-CA"),
    description: "",
    receipt: null,
  });
  const [receiptPreview, setReceiptPreview] = useState(null);

  const navigate = useNavigate();

  // --- Dark/Light/System Theme Handling ---
  useEffect(() => {
    const root = document.documentElement;
    if (activeTheme === "dark") root.classList.add("dark");
    else if (activeTheme === "light") root.classList.remove("dark");
    else {
      // system preference
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) root.classList.add("dark");
      else root.classList.remove("dark");
    }
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
    setNewTransaction({ ...newTransaction, [name]: value });
  };

  const handleReceiptChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewTransaction({ ...newTransaction, receipt: file });
      setReceiptPreview(URL.createObjectURL(file));
    }
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!newTransaction.category || !newTransaction.amount) {
      alert("Please fill all required fields.");
      return;
    }

    try {
      const token = localStorage.getItem("authToken");
      const formData = new FormData();
      Object.entries(newTransaction).forEach(([key, value]) => formData.append(key, value));

      await axios.post("http://localhost:5000/api/transactions", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setRefreshKey(prev => prev + 1);

      setShowModal(false);
      setNewTransaction({
        type: "expense",
        category: expenseCategories[0],
        amount: "",
        date: new Date().toISOString().split("T")[0],
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
        return <Settings activeTheme={activeTheme} setActiveTheme={setActiveTheme} />;
      default:
        return <Overview refreshKey={refreshKey} />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-gradient-to-br from-green-300 via-emerald-200 to-lime-300 dark:from-gray-650 dark:via-gray-600 dark:to-gray-500 overflow-hidden transition-colors duration-300 ">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        activeTheme={activeTheme}
      />

      {/* Main Content */}
     {/* 1. Remove `flex-col` and add `relative` to this wrapper */}
<div className="flex-1 flex overflow-hidden relative">

  {/* 2. Make the header `absolute` and give it a `z-index` */}
  <header className="absolute top-0 left-0 right-0 z-30 flex justify-between items-center pl-16 md:pl-8 pr-4 md:pr-8 py-3 bg-white/70 dark:bg-gray-800/70 backdrop-blur-md shadow-sm transition-colors duration-300">
    <div className="flex-1 truncate mr-2">
      <h2 className="text-lg md:text-xl font-semibold text-green-800 dark:text-green-400">
        Welcome 👋
      </h2>
      <p className="text-sm font-bold text-green-700 dark:text-green-300 truncate">
        {userName} !
      </p>
    </div>

    <button
      onClick={() => setShowModal(true)}
      className="flex-shrink-0 flex items-center justify-center gap-2 p-2 md:px-4 md:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-500 transition shadow-md"
    >
      <PlusCircle size={18} />
      <span className="hidden md:inline">Add Transaction</span>
    </button>
  </header>

  {/* 3. Make `main` fill the parent and add `padding-top` to account for the header */}
  <main className="h-full w-full p-4 md:p-8 pt-28 pb-28 overflow-y-auto transition-colors duration-300">
    <AnimatePresence mode="wait">
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4 }}
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
        onSuccess={() => setRefreshKey(prev => prev + 1)}
      />
    </div>
  );
}
