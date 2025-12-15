import React, { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import {
  Upload,
  X,
  FileImage,
  Search,
  Filter,
  List,
  Grid,
  RotateCcw,
} from "lucide-react";
import axios from "axios";
import api from "../config/axiosConfig";

export default function ViewExpense({ refreshKey }) {
  const formRef = useRef(null);

  const navigate = useNavigate();
  const [token] = useState(localStorage.getItem("authToken"));
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addTransLoad, setAddTransLoad] = useState(false);

  const todayDate = new Date().toLocaleDateString("en-CA");

  const [formData, setFormData] = useState({
    type: "expense",
    category: "Food",
    amount: "",
    date: new Date().toLocaleDateString("en-CA"),
    description: "",
    receipt: null,
  });

  const [editData, setEditData] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ open: false, txId: null });
  const [viewReceiptModal, setViewReceiptModal] = useState({
    open: false,
    src: null,
  });

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // View type
  const [currentView, setCurrentView] = useState("grid");

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

  // Scroll form into view when editing
  useEffect(() => {
    if (editData && formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [editData]);

  // Set auth header
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      localStorage.removeItem("authToken");
      navigate("/login");
    }
  }, [token, navigate]);

  // Fetch transactions
  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/transactions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const formattedData = res.data.map((tx) => ({
        ...tx,
        date: tx.date.split("T")[0],
      }));
      setTransactions(formattedData);
    } catch (err) {
      console.error("Fetch Error:", err);
      if (err.response?.status === 401) {
        toast.error("Session expired. Please log in again.");
        localStorage.removeItem("authToken");
        navigate("/login");
      } else {
        toast.error("Failed to fetch transactions.");
      }
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchTransactions();
  }, [token, refreshKey]);

  // Add / update transaction
  const submitTransaction = async (e) => {
    e.preventDefault();
    setAddTransLoad(true);

    const currentSubmitData = editData || formData;

    if (!currentSubmitData.amount || Number(currentSubmitData.amount) <= 0) {
      toast.error("Please enter a valid positive amount");
      setAddTransLoad(false);
      return;
    }
    if (!currentSubmitData.category) {
      toast.error("Please select a category");
      setAddTransLoad(false);
      return;
    }
    if (!currentSubmitData.date) {
      toast.error("Please select a date");
      setAddTransLoad(false);
      return;
    }

    try {
      if (editData) {
        const res = await api.put(`/transactions/${editData._id}`, editData);
        const updatedTx = {
          ...res.data,
          date: res.data.date.split("T")[0],
        };
        setTransactions((prev) =>
          prev.map((t) => (t._id === editData._id ? updatedTx : t))
        );
        toast.success("Transaction updated successfully!");
        setEditData(null);
        setReceiptPreview(null);
      } else {
        const res = await api.post("/transactions", formData);
        const newTx = {
          ...res.data,
          date: res.data.date.split("T")[0],
        };
        setTransactions((prev) => [...prev, newTx]);
        toast.success("Transaction added successfully!");
        setFormData({
          type: "expense",
          category: expenseCategories[0],
          amount: "",
          date: new Date().toLocaleDateString("en-CA"),
          description: "",
          receipt: null,
        });
        setReceiptPreview(null);
      }
    } catch (err) {
      console.error("Submit Error:", err);
      toast.error(err.response?.data?.message || "Failed to save transaction.");
    } finally {
      setAddTransLoad(false);
    }
  };

  // Input change
  const handleInputChange = (e, isEdit = false) => {
    const { name, value } = e.target;

    const currentState = isEdit ? editData : formData;
    const setStateFunc = isEdit ? setEditData : setFormData;

    let update = { [name]: value };

    if (name === "type") {
      update.category =
        value === "expense" ? expenseCategories[0] : incomeCategories[0];
    }

    if (name === "date") {
      update.date = value.split("T")[0];
    }

    setStateFunc({ ...currentState, ...update });
  };

  // File change
  const handleFileChange = (e, isEdit = false) => {
    const file = e.target.files[0];
    if (!file) {
      e.target.value = null;
      return;
    }
    if (file.size > 2097152) {
      toast.error("File is too large! (Max 2MB)");
      e.target.value = null;
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      const base64String = reader.result;
      if (isEdit) {
        setEditData({ ...editData, receipt: base64String });
      } else {
        setFormData({ ...formData, receipt: base64String });
        setReceiptPreview(base64String);
      }
    };
    reader.onerror = (error) => {
      console.error("Error converting file:", error);
      toast.error("Failed to read file.");
      e.target.value = null;
    };
  };

  // Delete flow
  const confirmDelete = (id) => setDeleteModal({ open: true, txId: id });
  const deleteTransaction = async () => {
    const { txId } = deleteModal;
    try {
      await api.delete(`/transactions/${txId}`);
      setTransactions((prev) => prev.filter((t) => t._id !== txId));
      toast.success("Transaction deleted successfully!");
    } catch (err) {
      console.error("Delete Error:", err);
      toast.error("Failed to delete transaction.");
    } finally {
      setDeleteModal({ open: false, txId: null });
    }
  };

  // Totals
  const totalIncome = useMemo(
    () =>
      transactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  );
  const totalExpense = useMemo(
    () =>
      transactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  );
  const netBalance = totalIncome - totalExpense;

  // Filters
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const searchLower = searchTerm.toLowerCase();
      const searchMatch =
        searchLower === "" ||
        tx.category.toLowerCase().includes(searchLower) ||
        (tx.description &&
          tx.description.toLowerCase().includes(searchLower));

      const typeMatch = filterType === "all" || tx.type === filterType;
      const categoryMatch =
        filterCategory === "all" || tx.category === filterCategory;

      const dateMatch =
        (!filterStartDate || tx.date >= filterStartDate) &&
        (!filterEndDate || tx.date <= filterEndDate);

      return searchMatch && typeMatch && categoryMatch && dateMatch;
    });
  }, [
    transactions,
    searchTerm,
    filterType,
    filterCategory,
    filterStartDate,
    filterEndDate,
  ]);

  const uniqueCategories = useMemo(() => {
    const categories = new Set(transactions.map((tx) => tx.category));
    return ["all", ...Array.from(categories).sort()];
  }, [transactions]);

  const resetFilters = () => {
    setSearchTerm("");
    setFilterType("all");
    setFilterCategory("all");
    setFilterStartDate("");
    setFilterEndDate("");
    setShowFilters(false);
  };

  const currentData = editData || formData;
  const currentCategories =
    currentData.type === "income" ? incomeCategories : expenseCategories;

  return (
    <motion.div
      className="h-full overflow-y-auto scroll-smooth mt-11 pb-20 bg-transparent"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <div className="max-w-5xl mx-auto px-3">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100 text-center">
          Manage Your Expenses
        </h1>

        {/* Balance Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="p-4 rounded-2xl bg-white shadow-sm border border-gray-100 dark:bg-slate-900 dark:border-slate-700 flex flex-col items-center">
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Total Income
            </p>
            <p className="text-green-600 font-bold text-xl mt-1">
              ₹{totalIncome.toFixed(2)}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white shadow-sm border border-gray-100 dark:bg-slate-900 dark:border-slate-700 flex flex-col items-center">
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Total Expenses
            </p>
            <p className="text-red-600 font-bold text-xl mt-1">
              ₹{totalExpense.toFixed(2)}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white shadow-sm border border-gray-100 dark:bg-slate-900 dark:border-slate-700 flex flex-col items-center">
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Net Balance
            </p>
            <p
              className={`font-bold text-xl mt-1 ${
                netBalance >= 0 ? "text-green-600" : "text-red-700"
              }`}
            >
              ₹{netBalance.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Add / Edit Form */}
        <form
          ref={formRef}
          onSubmit={submitTransaction}
          className="mb-8 p-4 md:p-5 bg-white rounded-2xl shadow-sm border border-gray-100 dark:bg-slate-900 dark:border-slate-700 space-y-4"
        >
          <h2 className="text-lg md:text-xl font-semibold text-gray-700 dark:text-gray-100">
            {editData ? "Edit Transaction" : "Add New Transaction"}
          </h2>

          {/* Type & Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              name="type"
              value={currentData.type}
              onChange={(e) => handleInputChange(e, !!editData)}
              className="w-full p-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 text-sm"
              required
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>

            <select
              name="category"
              value={currentData.category}
              onChange={(e) => handleInputChange(e, !!editData)}
              className="w-full p-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 text-sm"
              required
            >
              {currentCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="number"
              name="amount"
              placeholder="Amount"
              value={currentData.amount}
              onChange={(e) => handleInputChange(e, !!editData)}
              required
              className="w-full p-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 text-sm"
            />
            <input
              type="date"
              name="date"
              value={currentData.date}
              onChange={(e) => handleInputChange(e, !!editData)}
              max={todayDate}
              required
              className="w-full p-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 text-sm"
            />
          </div>

          {/* Description */}
          <input
            type="text"
            name="description"
            placeholder="Description (optional)"
            value={currentData.description}
            onChange={(e) => handleInputChange(e, !!editData)}
            className="w-full p-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 text-sm"
          />

          {/* File Upload */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <label
              htmlFor={editData ? "edit-file-input" : "add-file-input"}
              className="flex-1 flex items-center justify-center gap-2 cursor-pointer text-green-700 hover:text-green-900 border border-dashed border-gray-300 p-2 rounded-md text-sm dark:text-green-400 dark:border-gray-500 dark:hover:text-green-300"
            >
              <Upload size={16} />
              <span>Upload Receipt (optional, max 2MB)</span>
            </label>
            <input
              type="file"
              id={editData ? "edit-file-input" : "add-file-input"}
              accept="image/*"
              onChange={(e) => handleFileChange(e, !!editData)}
              className="hidden"
            />

            {(receiptPreview || (editData && editData.receipt)) && (
              <div className="flex gap-2 items-center p-2 border rounded-md bg-gray-50 dark:bg-gray-800 dark:border-gray-600">
                <img
                  src={editData ? editData.receipt : receiptPreview}
                  alt="Preview"
                  className="w-14 h-14 rounded object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (editData) {
                      setEditData({ ...editData, receipt: null });
                    } else {
                      setFormData({ ...formData, receipt: null });
                      setReceiptPreview(null);
                    }
                  }}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  <X size={18} />
                </button>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-2 flex-wrap">
            <button
              type="submit"
              disabled={addTransLoad}
              className={`px-4 py-2 rounded text-sm font-semibold text-white ${
                addTransLoad
                  ? "bg-gray-400 cursor-not-allowed"
                  : editData
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {addTransLoad
                ? editData
                  ? "Updating..."
                  : "Adding..."
                : editData
                ? "Update Transaction"
                : "Add Transaction"}
            </button>
            {editData && (
              <button
                type="button"
                onClick={() => {
                  setEditData(null);
                  setReceiptPreview(null);
                }}
                className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 text-sm text-gray-800"
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>

        {/* Filter Section */}
        <div className="mb-6 p-4 bg-white rounded-2xl shadow-sm border border-gray-100 dark:bg-slate-900 dark:border-slate-700 space-y-4">
          <div className="flex flex-col md:flex-row gap-3 items-center">
            {/* Search */}
            <div className="relative flex-grow w-full md:w-auto">
              <input
                type="text"
                placeholder="Search category or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 pl-9 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 text-sm"
              />
              <Search
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                size={16}
              />
            </div>

            {/* Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full md:w-auto p-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 text-sm"
            >
              <option value="all">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>

            {/* Toggle Filters */}
            <button
              onClick={() => setShowFilters((v) => !v)}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-3 py-2 rounded bg-gray-500 hover:bg-gray-600 text-white text-sm"
            >
              <Filter size={14} /> Filters {showFilters ? <X size={14} /> : null}
            </button>

            {/* Reset */}
            <button
              onClick={resetFilters}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-3 py-2 rounded bg-yellow-500 hover:bg-yellow-600 text-white text-sm"
            >
              <RotateCcw size={14} /> Reset
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full p-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 text-sm"
              >
                {uniqueCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === "all" ? "All Categories" : cat}
                  </option>
                ))}
              </select>

              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                max={todayDate}
                className="w-full p-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 text-sm"
                title="Start Date"
              />

              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                max={todayDate}
                className="w-full p-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 text-sm"
                title="End Date"
              />
            </div>
          )}
        </div>

        {/* View Switcher */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg md:text-xl font-semibold text-gray-700 dark:text-gray-100">
            {searchTerm ||
            filterType !== "all" ||
            filterCategory !== "all" ||
            filterStartDate ||
            filterEndDate
              ? `Filtered Transactions (${filteredTransactions.length})`
              : `All Transactions (${transactions.length})`}
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentView("grid")}
              className={`p-2 rounded ${
                currentView === "grid"
                  ? "bg-green-600 text-white"
                  : "bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
              }`}
              title="Grid View"
            >
              <Grid size={16} />
            </button>
            <button
              onClick={() => setCurrentView("list")}
              className={`p-2 rounded ${
                currentView === "list"
                  ? "bg-green-600 text-white"
                  : "bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
              }`}
              title="List View"
            >
              <List size={16} />
            </button>
          </div>
        </div>

       {/* Transactions */}
{loading ? (
  <p className="text-center text-gray-600 dark:text-gray-400 py-10 text-sm">
    Loading transactions...
  </p>
) : filteredTransactions.length === 0 ? (
  <p className="text-center text-gray-600 dark:text-gray-400 py-10 text-sm">
    {transactions.length === 0
      ? "No transactions found. Add one above!"
      : "No transactions match your filters."}
  </p>
) : (
  <div
    className={
      currentView === "grid"
        ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4"
        : "flex flex-col gap-3"
    }
  >
    {filteredTransactions.map((tx) => (
      <div
        key={tx._id}
        className={`p-3 rounded-2xl shadow-sm border text-xs sm:text-sm
        ${
          tx.type === "income"
            ? "bg-green-50 border-green-200 dark:bg-green-900/40 dark:border-green-700"
            : "bg-red-50 border-red-200 dark:bg-red-900/40 dark:border-red-700"
        }
        ${currentView === "list" ? "w-full" : ""}
      `}
      >
        {/* Top row: Category + Amount */}
        <div className="flex justify-between items-start mb-1">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">
            {tx.category}
          </h2>
          <span
            className={`font-semibold ${
              tx.type === "income"
                ? "text-green-700 dark:text-green-300"
                : "text-red-700 dark:text-red-300"
            }`}
          >
            {tx.type === "income" ? "+" : "-"}₹{tx.amount.toFixed(2)}
          </span>
        </div>

        {/* Date */}
        <p className="text-gray-500 text-[11px] dark:text-gray-300/70">
          {new Date(tx.date + "T00:00:00").toLocaleDateString()}
        </p>

        {/* Description */}
        {tx.description && (
          <p className="mt-1 mb-2 text-gray-700 dark:text-gray-200 text-[11px] sm:text-xs line-clamp-2">
            {tx.description}
          </p>
        )}

        {/* Actions */}
        <div className="mt-1 flex items-center gap-2 justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => {
                setEditData(tx);
                setReceiptPreview(tx.receipt || null);
              }}
              className="bg-blue-600 text-white px-2 py-1 rounded text-[11px] hover:bg-blue-700"
            >
              Edit
            </button>
            <button
              onClick={() => confirmDelete(tx._id)}
              className="bg-red-600 text-white px-2 py-1 rounded text-[11px] hover:bg-red-700"
            >
              Delete
            </button>
          </div>

          {tx.receipt && (
            <button
              type="button"
              onClick={() =>
                setViewReceiptModal({ open: true, src: tx.receipt })
              }
              className="flex items-center gap-1 text-blue-700 hover:text-blue-900 text-[11px] ml-auto dark:text-blue-300 dark:hover:text-blue-200"
            >
              <FileImage size={12} /> View
            </button>
          )}
        </div>
      </div>
    ))}
  </div>
)}

        {/* Delete Modal */}
        {deleteModal.open && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-5 rounded-2xl shadow-md w-full max-w-xs text-center dark:bg-gray-900">
              <p className="mb-4 font-semibold text-gray-700 dark:text-gray-200 text-sm">
                Are you sure you want to delete this transaction?
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={deleteTransaction}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm"
                >
                  Delete
                </button>
                <button
                  onClick={() => setDeleteModal({ open: false, txId: null })}
                  className="px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400 text-gray-800 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Receipt Modal */}
        {viewReceiptModal.open && (
          <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={() => setViewReceiptModal({ open: false, src: null })}
          >
            <div
              className="relative bg-white p-4 rounded-2xl shadow-md w-full max-w-lg dark:bg-gray-900"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setViewReceiptModal({ open: false, src: null })}
                className="absolute -top-3 -right-3 bg-white rounded-full p-1 shadow-md text-gray-600 hover:text-red-500 dark:bg-gray-800 dark:text-gray-200"
              >
                <X size={18} />
              </button>
              <img
                src={viewReceiptModal.src}
                alt="Receipt"
                className="w-full max-h-[80vh] object-contain rounded-lg"
              />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
