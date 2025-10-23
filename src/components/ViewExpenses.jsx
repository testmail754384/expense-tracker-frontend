import React, { useEffect, useState, useMemo, useRef } from "react"; // --- MODIFIED: Added useMemo ---
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
// --- MODIFIED: Added more icons ---
import { Upload, X, FileImage, Search, Filter, List, Grid, RotateCcw } from "lucide-react";
import axios from "axios";
import api from "../config/axiosConfig"; // Axios instance

export default function ViewExpense({ refreshKey }) {

    const formRef = useRef(null);  // using it to come automatically on top of the screen to update the transaction when clicked on edit button

    const navigate = useNavigate();
    const [token, setToken] = useState(localStorage.getItem("authToken"));
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true); // --- MODIFIED: Start loading true ---
    const [addTransLoad, setAddTransLoad] = useState(false)





    const todayDate = new Date().toLocaleDateString("en-CA");



    const [formData, setFormData] = useState({
        type: "expense",
        category: "Food",
        amount: "",
        date: new Date().toLocaleDateString("en-CA"),
        description: "",
        receipt: null
    });

    const [editData, setEditData] = useState(null);
    const [receiptPreview, setReceiptPreview] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ open: false, txId: null });
    const [viewReceiptModal, setViewReceiptModal] = useState({ open: false, src: null });

    // --- NEW: State for Filters ---
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState("all"); // 'all', 'income', 'expense'
    const [filterCategory, setFilterCategory] = useState("all"); // 'all', or specific category
    const [filterStartDate, setFilterStartDate] = useState("");
    const [filterEndDate, setFilterEndDate] = useState("");
    const [showFilters, setShowFilters] = useState(false); // Toggle visibility of extra filters
    // --- END: State for Filters ---

    // --- NEW: State for View Switching ---
    const [currentView, setCurrentView] = useState("grid"); // 'grid' or 'list'
    // --- END: State for View Switching ---

    const expenseCategories = [
        "Food", "Transport", "Shopping", "Utilities", "Rent", "Health", "Entertainment", "Education", "Other"
    ];
    const incomeCategories = ["Salary", "Bonus", "Gifts", "Investment", "Freelance", "Other"];


    // Scroll form into view when editing a transaction
    useEffect(() => {
        if (editData && formRef.current) {
            formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }, [editData]);


    // Set default Axios Authorization header
    useEffect(() => {
        if (token) {
            axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        } else {
            localStorage.removeItem("authToken"); // Ensure clean state
            navigate("/login");
        }
    }, [token, navigate]);

    // Fetch transactions
    const fetchTransactions = async () => {
        setLoading(true); // Start loading
        try {
            const res = await api.get(`/transactions`, {
          headers: { Authorization: `Bearer ${token}` }});
            const formattedData = res.data.map(tx => ({
                ...tx,
                date: tx.date.split("T")[0] // Keep date as YYYY-MM-DD for filtering
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
            setTransactions([]); // Clear data on error
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchTransactions();
    }, [token, refreshKey]); // Re-fetch on token or refreshKey change


    // Add or update transaction
    const submitTransaction = async (e) => {
        e.preventDefault();
        setAddTransLoad(true)
        const currentSubmitData = editData || formData; // Use the correct data object
        if (!currentSubmitData.amount || Number(currentSubmitData.amount) <= 0) {
            toast.error("Please enter a valid positive amount");
            return;
        }
        if (!currentSubmitData.category) {
            toast.error("Please select a category");
            return;
        }
        if (!currentSubmitData.date) {
            toast.error("Please select a date");
            return;
        }


        // Prepare data to match backend
        const payload = {
            ...currentSubmitData,
            amount: Number(currentSubmitData.amount),
            date: new Date(currentSubmitData.date) // Convert to ISO string
        };


        try {
            if (editData) {
                const res = await api.put(`/transactions/${editData._id}`, editData);
                const updatedTx = { ...res.data, date: res.data.date.split("T")[0] };
                setTransactions(transactions.map(t => t._id === editData._id ? updatedTx : t));
                toast.success("Transaction updated successfully!");
                setEditData(null); // Clear edit state
                setReceiptPreview(null); // Clear any lingering preview
            } else {
                const res = await api.post("/transactions", formData);
                const newTx = { ...res.data, date: res.data.date.split("T")[0] };
                setTransactions([...transactions, newTx]); // Add to the list
                toast.success("Transaction added successfully!");
                // Reset form completely
                setFormData({
                    type: "expense",
                    category: expenseCategories[0],
                    amount: "",
                    date: new Date().toLocaleDateString("en-CA"),
                    description: "",
                    receipt: null
                });
                setReceiptPreview(null); // Clear preview
            }
        } catch (err) {
            console.error("Submit Error:", err);
            toast.error(err.response?.data?.message || "Failed to save transaction.");
        }

        finally {
            setAddTransLoad(false)
        }
    };

    // --- CORRECTED: Handle category selection and type change properly ---
    const handleInputChange = (e, isEdit = false) => {
        const { name, value } = e.target;

        // Determine which state object and setter function to use
        const currentState = isEdit ? editData : formData;
        const setStateFunc = isEdit ? setEditData : setFormData;

        // Start with the basic update for the field that changed
        let update = { [name]: value };

        // If the 'type' field was the one that changed...
        if (name === "type") {
            // ...also update the 'category' to the default for the new type
            update.category = value === "expense" ? expenseCategories[0] : incomeCategories[0];
        }

        // Apply all updates to the state, ensuring date is formatted correctly if changed
        if (name === 'date') {
            update.date = value.split('T')[0]; // Ensure only YYYY-MM-DD is stored
        }

        setStateFunc({ ...currentState, ...update });
    };
    // --- END CORRECTION ---


    // Handle file upload
    const handleFileChange = (e, isEdit = false) => {
        const file = e.target.files[0];
        if (!file) {
            e.target.value = null; // Reset input if no file selected
            return;
        }
        if (file.size > 2097152) { // 2MB Limit
            toast.error("File is too large! (Max 2MB)");
            e.target.value = null; // Reset input
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
                setReceiptPreview(base64String); // For "add" form preview
            }
        };
        reader.onerror = (error) => {
            console.error("Error converting file:", error);
            toast.error("Failed to read file.");
            e.target.value = null; // Reset input on error
        };
    };



    // Delete transaction
    const confirmDelete = (id) => setDeleteModal({ open: true, txId: id });
    const deleteTransaction = async () => {
        const { txId } = deleteModal;
        try {
            await api.delete(`/transactions/${txId}`);
            setTransactions(transactions.filter(t => t._id !== txId));
            toast.success("Transaction deleted successfully!");
        } catch (err) {
            console.error("Delete Error:", err);
            toast.error("Failed to delete transaction.");
        } finally {
            setDeleteModal({ open: false, txId: null });
        }
    };

    // --- Calculate totals (using ORIGINAL transactions) ---
    // Totals should generally reflect ALL data, not filtered data
    const totalIncome = useMemo(() => transactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0), [transactions]);
    const totalExpense = useMemo(() => transactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0), [transactions]);
    const netBalance = totalIncome - totalExpense;


    // --- Filtered Transactions Logic ---
    const filteredTransactions = useMemo(() => {
        return transactions.filter(tx => {
            // 1. Filter by Search Term (Category or Description, case-insensitive)
            const searchLower = searchTerm.toLowerCase();
            const searchMatch = searchLower === '' ||
                tx.category.toLowerCase().includes(searchLower) ||
                (tx.description && tx.description.toLowerCase().includes(searchLower));

            // 2. Filter by Type
            const typeMatch = filterType === 'all' || tx.type === filterType;

            // 3. Filter by Category
            const categoryMatch = filterCategory === 'all' || tx.category === filterCategory;

            // 4. Filter by Date Range (inclusive)
            const dateMatch = (!filterStartDate || tx.date >= filterStartDate) &&
                (!filterEndDate || tx.date <= filterEndDate);

            return searchMatch && typeMatch && categoryMatch && dateMatch;
        });
    }, [transactions, searchTerm, filterType, filterCategory, filterStartDate, filterEndDate]);
    // --- END: Filtered Logic ---


    // --- NEW: Get unique categories for filter dropdown ---
    const uniqueCategories = useMemo(() => {
        const categories = new Set(transactions.map(tx => tx.category));
        return ['all', ...Array.from(categories).sort()]; // Add 'all' option
    }, [transactions]);
    // --- END: Unique Categories ---

    // --- NEW: Reset Filters ---
    const resetFilters = () => {
        setSearchTerm("");
        setFilterType("all");
        setFilterCategory("all");
        setFilterStartDate("");
        setFilterEndDate("");
        setShowFilters(false); // Hide advanced filters on reset
    };
    // --- END: Reset Filters ---


    const currentData = editData || formData;
    const currentCategories = currentData.type === "income" ? incomeCategories : expenseCategories;




    return (
        <div className="h-full overflow-y-auto scroll-smooth mt-11 pb-20 bg-transparent from-green-200 via-emerald-100 to-lime-200 dark:bg-transparent dark:from-gray-800 dark:via-gray-900 dark:to-gray-800">
            <div className="max-w-5xl mx-auto">
                <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-700 text-center">Manage Your Expenses</h1>

                {/* Balance Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    {/* Total Income Card */}
                    <motion.div
                        className="p-6 rounded-2xl bg-white/50 backdrop-blur-md shadow-lg border border-white/40 dark:border-0 flex flex-col items-center dark:bg-gray-700/60 dark:border-gray-650/60"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <p className="text-gray-600 dark:text-gray-300">Total Income</p>
                        <p className="text-green-500 font-bold text-2xl">₹{totalIncome.toFixed(2)}</p>
                    </motion.div>
                    {/* Total Expenses Card */}
                    <motion.div
                        className="p-6 rounded-2xl bg-white/50 backdrop-blur-md shadow-lg border border-white/40 dark:border-0 flex flex-col items-center dark:bg-gray-700/60 dark:border-gray-650/60"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <p className="text-gray-600 dark:text-gray-300">Total Expenses</p>
                        <p className="text-red-600 font-bold text-2xl">₹{totalExpense.toFixed(2)}</p>
                    </motion.div>
                    {/* Net Balance Card */}
                    <motion.div
                        className="p-6 rounded-2xl bg-white/50 backdrop-blur-md shadow-lg border border-white/40  dark:border-0 flex flex-col items-center dark:bg-gray-700/60 dark:border-gray-650/60"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <p className="text-gray-600 dark:text-gray-300">Net Balance</p>
                        <p className={`font-bold text-2xl ${netBalance >= 0 ? "text-green-500" : "text-red-700"}`}>₹{netBalance.toFixed(2)}</p>
                    </motion.div>
                </div>

                {/* --- */}

                {/* Add/Edit Form */}
                <motion.form
                    ref={formRef}
                    onSubmit={submitTransaction}
                    className="mb-8 p-6 bg-white/60 backdrop-blur-md rounded-2xl shadow-lg space-y-4 dark:bg-gray-700/60 dark:text-white"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-100">{editData ? "Edit Transaction" : "Add New Transaction"}</h2>
                    {/* Row 1: Type & Category */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Type Select */}
                        <select
                            name="type"
                            value={currentData.type}
                            onChange={(e) => handleInputChange(e, !!editData)} // Pass edit flag
                            className="w-full p-2 rounded border border-gray-300 bg-gray appearance-none focus:outline-none focus:ring-2 focus:ring-green-400 bg-no-repeat bg-right pr-8 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                            style={{
                                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                                backgroundPosition: 'right 0.5rem center',
                                backgroundSize: '1.5em 1.5em',
                            }}
                            required
                        >
                            <option value="expense">Expense</option>
                            <option value="income">Income</option>
                        </select>

                        {/* Category Select */}
                        <select
                            name="category"
                            value={currentData.category}
                            onChange={(e) => handleInputChange(e, !!editData)} // Pass edit flag
                            className="w-full p-2 rounded border border-gray-300 bg-gray appearance-none focus:outline-none focus:ring-2 focus:ring-green-400 bg-no-repeat bg-right pr-8 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                            style={{
                                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                                backgroundPosition: 'right 0.5rem center',
                                backgroundSize: '1.5em 1.5em',
                            }}
                            required
                        >
                            {/* <option value="">Select Category</option> No need if default is set */}
                            {currentCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>

                    {/* Row 2: Amount & Date */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Amount Input */}
                        <input
                            type="number"
                            name="amount"
                            placeholder="Amount"
                            value={currentData.amount}
                            onChange={(e) => handleInputChange(e, !!editData)} // Pass edit flag
                            required
                            className="focus:outline-none focus:ring-2 focus:ring-green-400 bg-no-repeat bg-right pr-8 w-full p-2 rounded border border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                        />
                        {/* Date Input */}
                        <input
                            type="date"
                            name="date"
                            value={currentData.date}
                            onChange={(e) => handleInputChange(e, !!editData)} // Pass edit flag
                            max={todayDate}
                            required
                            className="focus:outline-none focus:ring-2 focus:ring-green-400 bg-no-repeat bg-right pr-8 w-full p-2 rounded border border-gray-300 cursor-pointer bg-gray dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100" // Standard date input
                        />
                    </div>

                    {/* Row 3: Description */}
                    <input
                        type="text"
                        name="description"
                        placeholder="Description (Optional)"
                        value={currentData.description}
                        onChange={(e) => handleInputChange(e, !!editData)} // Pass edit flag
                        className="focus:outline-none focus:ring-2 focus:ring-green-400 bg-no-repeat bg-right pr-8 w-full p-3 rounded border border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark: rounded-b-xl"
                    />

                    {/* Row 4: File Upload */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <label
                            htmlFor={editData ? "edit-file-input" : "add-file-input"} // Unique IDs
                            className="flex-1 flex items-center justify-center gap-2 cursor-pointer text-green-700 hover:text-green-900 border-2 border-dashed border-gray-300 p-3 rounded-lg dark:text-green-400 dark:border-gray-500 dark:hover:text-green-300"
                        >
                            <Upload size={18} />
                            <span>Upload Receipt (Optional, Max 2MB)</span>
                        </label>
                        <input
                            type="file"
                            id={editData ? "edit-file-input" : "add-file-input"} // Unique IDs match htmlFor
                            accept="image/*"
                            onChange={(e) => handleFileChange(e, !!editData)} // Pass edit flag
                            className="w-0 h-0 opacity-0 absolute" // Visually hidden
                        />

                        {/* Preview Logic (Combined and simplified) */}
                        {(receiptPreview || (editData && editData.receipt)) && (
                            <div className="flex gap-2 items-center p-2 border rounded-lg bg-white/50 dark:bg-gray-800/50 dark:border-gray-600">
                                <img
                                    src={editData ? editData.receipt : receiptPreview} // Show edit receipt if editing, otherwise add preview
                                    alt="Preview"
                                    className="w-16 h-16 rounded-lg object-cover"
                                />
                                <button type="button" onClick={() => {
                                    if (editData) {
                                        setEditData({ ...editData, receipt: null }); // Clear receipt in edit mode
                                    } else {
                                        setFormData({ ...formData, receipt: null }); // Clear receipt in add mode
                                        setReceiptPreview(null); // Clear preview for add mode
                                    }
                                }} className="text-red-500 hover:text-red-700">
                                    <X size={20} />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-2">
                        <button type="submit" disabled={addTransLoad} className={`px-4 py-2 rounded font-semibold ${editData ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700"} text-white transition ${addTransLoad ?
                            "bg-gray-400 cursor-not-allowed"
                            : editData
                                ? "bg-blue-600 hover:bg-blue-700"
                                : "bg-green-600 hover:bg-green-700"
                            }`}>

                            {addTransLoad
                                ? editData
                                    ? "Updating..."
                                    : "Adding..."
                                : editData
                                    ? "Update Transaction"
                                    : "Add Transaction"}
                        </button>
                        {editData && (
                            <button type="button" onClick={() => { setEditData(null); setReceiptPreview(null); }} className="px-4 py-2 rounded bg-gray-400 hover:bg-gray-500 text-white transition">
                                Cancel Edit
                            </button>
                        )}
                    </div>
                </motion.form>

                {/* --- */}

                {/* NEW: Filter Section */}
                <div className="mb-6 p-4 bg-white/60 backdrop-blur-md rounded-2xl shadow-lg space-y-4 dark:bg-gray-700/60 dark:text-white">
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                        {/* Search Input */}
                        <div className="relative flex-grow w-full md:w-auto">
                            <input
                                type="text"
                                placeholder="Search category or description..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full p-2 pl-10 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400 bg-no-repeat bg-right pr-8 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                            />
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        </div>

                        {/* Type Filter */}
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="w-full md:w-auto p-2 rounded border border-gray-300 bg-gray appearance-none focus:outline-none focus:ring-2 focus:ring-green-400 bg-no-repeat bg-right pr-8 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                            style={{ /* SVG Arrow Style */
                                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                                backgroundPosition: 'right 0.5rem center',
                                backgroundSize: '1.5em 1.5em',
                            }}
                        >
                            <option value="all">All Types</option>
                            <option value="income">Income</option>
                            <option value="expense">Expense</option>
                        </select>

                        {/* Toggle Advanced Filters */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded bg-gray-500 hover:bg-gray-600 text-white transition text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                            title="More Filters"
                        >
                            <Filter size={16} /> Filters {showFilters ? <X size={16} /> : null}
                        </button>
                        {/* Reset Filters */}
                        <button
                            onClick={resetFilters}
                            className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded bg-yellow-500 hover:bg-yellow-600 text-white transition text-sm"
                            title="Reset Filters"
                        >
                            <RotateCcw size={16} /> Reset
                        </button>
                    </div>

                    {/* Advanced Filters (Category & Date Range) */}
                    <AnimatePresence>
                        {showFilters && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                                    {/* Category Filter */}
                                    <select
                                        value={filterCategory}
                                        onChange={(e) => setFilterCategory(e.target.value)}
                                        className="w-full p-2 rounded border border-gray-300 bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-green-400 bg-no-repeat bg-right pr-8 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                                        style={{ /* SVG Arrow Style */
                                            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                                            backgroundPosition: 'right 0.5rem center',
                                            backgroundSize: '1.5em 1.5em',
                                        }}
                                    >
                                        {uniqueCategories.map(cat => (
                                            <option key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</option>
                                        ))}
                                    </select>
                                    {/* Start Date */}
                                    <input
                                        type="date"
                                        placeholder="Start Date"
                                        value={filterStartDate}
                                        onChange={(e) => setFilterStartDate(e.target.value)}
                                        max={todayDate}
                                        className="w-full p-2 rounded border border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                                        title="Start Date"
                                    />
                                    {/* End Date */}
                                    <input
                                        type="date"
                                        placeholder="End Date"
                                        value={filterEndDate}
                                        onChange={(e) => setFilterEndDate(e.target.value)}
                                        max={todayDate}
                                        className="w-full p-2 rounded border border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                                        title="End Date"
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                {/* --- END: Filter Section --- */}

                {/* --- */}

                {/* NEW: View Switcher and Title */}
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-semibold text-gray-700 dark:text-gray-100">
                        {searchTerm || filterType !== 'all' || filterCategory !== 'all' || filterStartDate || filterEndDate
                            ? `Filtered Transactions (${filteredTransactions.length})`
                            : `All Transactions (${transactions.length})`
                        }
                    </h3>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentView('grid')}
                            className={`p-2 rounded transition ${currentView === 'grid' ? 'bg-green-600 text-white' : 'bg-white/50 hover:bg-white/80 text-gray-600 dark:bg-gray-700/60 dark:text-gray-300 dark:hover:bg-gray-700'}`}
                            title="Grid View"
                        >
                            <Grid size={18} />
                        </button>
                        <button
                            onClick={() => setCurrentView('list')}
                            className={`p-2 rounded transition ${currentView === 'list' ? 'bg-green-600 text-white' : 'bg-white/50 hover:bg-white/80 text-gray-600 dark:bg-gray-700/60 dark:text-gray-300 dark:hover:bg-gray-700'}`}
                            title="List View"
                        >
                            <List size={18} />
                        </button>
                    </div>
                </div>
                {/* --- END: View Switcher --- */}

                {/* --- */}

                {/* Transaction List (Now uses filteredTransactions and conditional rendering) */}
                {loading ? (
                    <p className="text-center text-gray-600 dark:text-gray-400 py-10">Loading transactions...</p>
                ) : filteredTransactions.length === 0 ? (
                    <p className="text-center text-gray-600 dark:text-gray-400 py-10">
                        {transactions.length === 0 ? 'No transactions found. Add one above!' : 'No transactions match your filters.'}
                    </p>
                ) : (
                    // --- MODIFIED: Conditional Rendering based on currentView ---
                    <AnimatePresence>
                        <motion.div
                            key={currentView} // Add key for animation trigger
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            // Apply different layout classes based on view
                            className={currentView === 'grid' ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "flex flex-col gap-3"}
                        >
                            {filteredTransactions.map(tx => (
                                <motion.div
                                    key={tx._id}
                                    layout // Animate layout changes
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.2 }}
                                    // Base styles, adjusted for dark mode visibility
                                    className={`p-4 rounded-2xl shadow-lg border 
                                    ${tx.type === "income"
                                            ? "bg-green-200 border-green-300 dark:bg-green-700/50 dark:border-green-800"
                                            : "bg-red-100 border-red-300 dark:bg-red-900/50 dark:border-red-800"} 
                                    ${currentView === 'list' ? 'flex flex-col sm:flex-row sm:items-center sm:justify-between' : ''}`
                                    }
                                >
                                    {/* Content inside the card */}
                                    <div className={`mb-2 ${currentView === 'list' ? 'sm:mb-0 sm:flex-grow' : ''}`}>
                                        <div className={`flex justify-between items-start ${currentView === 'list' ? 'sm:items-center' : 'mb-1'}`}>
                                            <h2 className={`font-bold text-lg ${currentView === 'list' ? 'sm:text-base' : ''} dark:text-gray-100`}>{tx.category}</h2>
                                            <span className={`font-semibold ${tx.type === "income" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"} ${currentView === 'list' ? 'text-base sm:ml-4' : 'text-lg'}`}>
                                                {tx.type === "income" ? "+" : "-"}₹{tx.amount.toFixed(2)}
                                            </span>
                                        </div>
                                        <p className="text-gray-500 text-xs dark:text-gray-200/60">{new Date(tx.date + 'T00:00:00').toLocaleDateString()}</p> {/* Ensure correct date parsing */}
                                    </div>
                                    {tx.description && <p className={`text-gray-600 text-sm ${currentView === 'list' ? 'mb-2 sm:mb-0 sm:flex-grow sm:mx-4' : 'mb-3'} dark:text-gray-300`}>{tx.description}</p>}

                                    {/* Buttons and Receipt Link */}
                                    <div className={`flex items-center ${currentView === 'list' ? 'sm:flex-shrink-0' : 'justify-between'}`}>
                                        <div className="flex gap-2">
                                            <button onClick={() => {
                                                setEditData(tx);
                                                setReceiptPreview(tx.receipt || null); // Load existing receipt into preview for edit
                                            }}
                                                className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 text-sm"
                                            >Edit</button>
                                            <button onClick={() => confirmDelete(tx._id)} className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 text-sm">Delete</button>
                                        </div>
                                        {tx.receipt && (
                                            <button
                                                type="button"
                                                onClick={() => setViewReceiptModal({ open: true, src: tx.receipt })}
                                                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm ml-auto dark:text-blue-400 dark:hover:text-blue-300" // ml-auto pushes it right in list view too
                                            >
                                                <FileImage size={16} /> View Receipt
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </AnimatePresence>
                )}

                {/* --- */}

                {/* Delete Modal (Ensure dark mode visibility) */}
                <AnimatePresence>
                    {deleteModal.open && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-xs text-center dark:bg-gray-800">
                                <p className="mb-4 font-semibold text-gray-700 dark:text-gray-200">Are you sure you want to delete this transaction?</p>
                                <div className="flex justify-center gap-4">
                                    <button onClick={deleteTransaction} className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white">Delete</button>
                                    <button onClick={() => setDeleteModal({ open: false, txId: null })} className="px-4 py-2 rounded-lg bg-gray-400 hover:bg-gray-500 text-white">Cancel</button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Receipt Modal (Ensure dark mode visibility) */}
                <AnimatePresence>
                    {viewReceiptModal.open && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                            onClick={() => setViewReceiptModal({ open: false, src: null })}
                        >
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                className="relative bg-white p-4 rounded-2xl shadow-lg w-full max-w-lg dark:bg-gray-800"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button
                                    onClick={() => setViewReceiptModal({ open: false, src: null })}
                                    className="absolute -top-3 -right-3 bg-white rounded-full p-1 shadow-lg text-gray-600 hover:text-red-500 z-10 dark:bg-gray-700 dark:text-gray-300"
                                >
                                    <X />
                                </button>
                                <img src={viewReceiptModal.src} alt="Receipt" className="w-full max-h-[80vh] object-contain rounded-lg" />
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}