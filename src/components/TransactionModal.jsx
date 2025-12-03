import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X } from "lucide-react";
import { toast } from "react-toastify";
import api from "../config/axiosConfig"; // Axios instance

export default function TransactionModal({
  open,
  onClose,
  onSuccess,
  editData = null,
  expenseCategories = [],
  incomeCategories = [],
}) {
  const todayDate = new Date().toLocaleDateString("en-CA");



  // 1. Define an initial state for the form for easy resetting
const initialFormState = {
 type: "expense",
category: expenseCategories[0] || "",
amount: "",
date: todayDate,
description: "",
 receipt: null,
 };


  const [formData, setFormData] = useState({
    type: "expense",
    category: expenseCategories[0] || "",
    amount: "",
    date: todayDate,
    description: "",
    receipt: null,
  });

  const [receiptPreview, setReceiptPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  // ✅ Preload edit data
  useEffect(() => {
    if (editData) {
      setFormData({
        ...editData,
        amount: editData.amount.toString(),
        date: editData.date.split("T")[0],
      });
      setReceiptPreview(editData.receipt || null);
    } else {
      setFormData(initialFormState);
      setReceiptPreview(null);
    }
  }, [editData, expenseCategories,onSuccess]);

  // ✅ Handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    let update = { [name]: value };
    if (name === "type") {
      update.category =
        value === "expense" ? expenseCategories[0] : incomeCategories[0];
    }
    setFormData((prev) => ({ ...prev, ...update }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2097152) {
      toast.error("File too large! Max 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, receipt: reader.result }));
      setReceiptPreview(reader.result);
    };
  };

  const removeReceipt = () => {
    setFormData((prev) => ({ ...prev, receipt: null }));
    setReceiptPreview(null);
  };

  const submitHandler = async (e) => {
    e.preventDefault();

    if (!formData.amount || Number(formData.amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setLoading(true);

    try {
      const payload = { ...formData, amount: Number(formData.amount) };
      const headers = {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      };

      if (editData?._id) {
        await api.put(
          `/transactions/${editData._id}`,
          payload,
          headers
        );
        toast.success("Transaction updated successfully");
      } else {
        await api.post(
          `/transactions`,
          payload,
          headers
        );
        toast.success("Transaction added successfully");
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const currentCategories =
    formData.type === "income" ? incomeCategories : expenseCategories;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-gray/50 dark:bg-black/40 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0, y: 20 }}
          animate={{ scale: 1, y: 10 }}
          exit={{ scale: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-green-50/50 dark:bg-gray-700/70 backdrop-blur-md 
                     rounded-2xl shadow-2xl w-full max-w-md 
                     p-6 sm:p-8 space-y-5 border border-green-100 dark:border-gray-700 
                     transition-all-ease duration-200"
        >
          {/* Header */}
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-green-800 dark:text-green-400">
              {editData ? "Edit" : "Add"} Transaction
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
            >
              <X size={22} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={submitHandler} className="space-y-4">
            {/* Type & Category */}
            <div className="grid grid-cols-2 gap-2">
              {/* Type Toggle */}
              <div className="relative grid grid-cols-2 gap-2 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      type: "expense",
                      category: expenseCategories[0],
                    })
                  }
                  className="relative py-2 rounded-md overflow-hidden"
                >
                  {formData.type === "expense" && (
                    <motion.div
                      layoutId="active-pill"
                      className="absolute inset-0 bg-red-500 rounded-md shadow"
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      }}
                    />
                  )}
                  <span
                    className={`relative z-10 w-full block text-center transition-colors duration-200 ${
                      formData.type === "expense"
                        ? "text-white"
                        : "text-gray-700 dark:text-gray-200"
                    }`}
                  >
                    Expense
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      type: "income",
                      category: incomeCategories[0],
                    })
                  }
                  className="relative py-2 rounded-md overflow-hidden"
                >
                  {formData.type === "income" && (
                    <motion.div
                      layoutId="active-pill"
                      className="absolute inset-0 bg-green-500 rounded-md shadow"
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      }}
                    />
                  )}
                  <span
                    className={`relative z-10 w-full block text-center transition-colors duration-200 ${
                      formData.type === "income"
                        ? "text-white"
                        : "text-gray-700 dark:text-gray-200"
                    }`}
                  >
                    Income
                  </span>
                </button>
              </div>

              {/* Category */}
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="p-2 border rounded-lg bg-white/70 dark:bg-gray-800/60 
                           text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600 
                           focus:ring-2 focus:ring-green-400 transition-all"
              >
                {currentCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="Amount"
              className="w-full p-2 border rounded-lg bg-white/70 dark:bg-gray-800/60 
                         text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600 
                         focus:ring-2 focus:ring-green-400 transition-all"
              required
            />

            {/* Date */}
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              max={todayDate}
              className="w-full p-2 border rounded-lg bg-white/70 dark:bg-gray-800/60 
                         text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600 
                         focus:ring-2 focus:ring-green-400 transition-all"
              required
            />

            {/* Description */}
            <input
              type="text"
              name="description"
              placeholder="Description"
              value={formData.description}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg bg-white/70 dark:bg-gray-800/60 
                         text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600 
                         focus:ring-2 focus:ring-green-400 transition-all"
            />

            {/* Receipt Upload */}
            <label className="flex items-center gap-2 cursor-pointer border-dashed border-2 border-gray-300 dark:border-gray-600 
                               rounded-lg p-2 text-green-900 hover:text-green-600 dark:text-green-400  dark:hover:text-green-300">
              <Upload size={18} /> Upload Receipt (Optional)
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {receiptPreview && (
              <div className="flex items-center gap-2 mt-2">
                <img
                  src={receiptPreview}
                  alt="Receipt Preview"
                  className="w-20 h-20 object-cover rounded shadow"
                />
                <button
                  type="button"
                  onClick={removeReceipt}
                  className="text-red-500 hover:text-red-700"
                >
                  <X size={18} />
                </button>
              </div>
            )}

            {/* Buttons */}
            <div className="flex justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-gray-400 hover:bg-gray-500 
                           dark:bg-gray-600 dark:hover:bg-gray-700 text-white transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 
                           dark:bg-green-500 dark:hover:bg-green-600 text-white transition-all"
              >
                {loading
                  ? "Saving..."
                  : editData
                  ? "Update"
                  : "Add"}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
