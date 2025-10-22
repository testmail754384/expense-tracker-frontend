import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import {
    BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell // Added PieChart components
} from "recharts";
import { ArrowLeft, ArrowRight } from "lucide-react"; // Removed unused icons for clarity
import { motion, AnimatePresence } from "framer-motion";
import api from "../config/axiosConfig"; // Axios instance



// Helper function to format currency
const formatCurrency = (amount) => `₹${amount.toFixed(2)}`;

// Helper function to get month name
const getMonthName = (monthIndex) => { // 0 = Jan, 1 = Feb, etc.
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    // Ensure index is within bounds
    if (monthIndex >= 0 && monthIndex < 12) {
        return monthNames[monthIndex];
    }
    return "Invalid Month"; // Fallback for safety
};

// --- Colors for Expense Pie Chart ---
const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ffc658', '#82ca9d', '#fa8072', '#a0522d', '#d2691e'];
// --- END ---

export default function Reports({ refreshKey }) {
    const navigate = useNavigate();
    const [token, setToken] = useState(localStorage.getItem("authToken"));
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reportType, setReportType] = useState("monthly"); // 'daily', 'monthly', 'yearly'

    // --- State for Period Selection ---
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth(); // 0-11
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [selectedMonth, setSelectedMonth] = useState(currentMonth); // 0-11 for Date object compatibility
    // --- End Period Selection State ---

    // Set default Axios Authorization header
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
            const res = await api.get(`/transactions`);
            // Ensure date is only YYYY-MM-DD
            const formattedData = res.data.map(tx => ({
                ...tx,
                date: tx.date ? tx.date.split("T")[0] : null // Handle potential missing dates
            })).filter(tx => tx.date); // Filter out transactions with invalid dates
            setTransactions(formattedData);
        } catch (err) {
            console.error("Fetch Error:", err);
            if (err.response?.status === 401) {
                toast.error("Session expired. Please log in again.");
                localStorage.removeItem("authToken");
                navigate("/login");
            } else {
                toast.error("Failed to fetch transaction data for reports.");
            }
            setTransactions([]); // Clear data on error
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchTransactions();
    }, [token, refreshKey]); // Re-fetch on token or refreshKey change


    // --- Data Processing & Summaries (useMemo for efficiency) ---

    // Group transactions by Day, Month, Year
    const processedData = useMemo(() => {
        const daily = {}; // key: YYYY-MM-DD
        const monthly = {}; // key: YYYY-MM
        const yearly = {}; // key: YYYY

        transactions.forEach(tx => {
            if (!tx.date) return; // Skip if date is missing/invalid after filtering
            // Use UTC methods to avoid timezone issues when creating the Date object
            const dateParts = tx.date.split('-');
            const year = parseInt(dateParts[0], 10);
            const month = parseInt(dateParts[1], 10) - 1; // JS months are 0-indexed
            const day = parseInt(dateParts[2], 10);
            const date = new Date(Date.UTC(year, month, day)); // Use UTC

            if (isNaN(date.getTime())) {
                console.warn("Skipping invalid date during processing:", tx.date);
                return; // Skip invalid dates reliably
            }

            const dayKey = tx.date; // YYYY-MM-DD (already formatted)
            const monthKey = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`; // YYYY-MM
            const yearKey = date.getUTCFullYear().toString(); // YYYY

            // Daily aggregation
            if (!daily[dayKey]) daily[dayKey] = { income: 0, expense: 0, date: date };
            daily[dayKey][tx.type] += tx.amount;

            // Monthly aggregation
            if (!monthly[monthKey]) monthly[monthKey] = { income: 0, expense: 0, year: date.getUTCFullYear(), month: date.getUTCMonth() };
            monthly[monthKey][tx.type] += tx.amount;

            // Yearly aggregation
            if (!yearly[yearKey]) yearly[yearKey] = { income: 0, expense: 0, year: date.getUTCFullYear() };
            yearly[yearKey][tx.type] += tx.amount;
        });

        return { daily, monthly, yearly };
    }, [transactions]);

    // Find highest income/expense periods
    const summaryStats = useMemo(() => {
        // Initialize with null date/label and amount 0
        let highestDailyIncome = { dateObj: null, amount: 0 };
        let highestDailyExpense = { dateObj: null, amount: 0 };
        let highestMonthlyIncome = { monthLabel: null, amount: 0 };
        let highestMonthlyExpense = { monthLabel: null, amount: 0 };
        let highestYearlyIncome = { year: null, amount: 0 };
        let highestYearlyExpense = { year: null, amount: 0 };

        // Find Daily Peaks
        Object.values(processedData.daily).forEach(day => {
            if (day.date instanceof Date && !isNaN(day.date)) {
                if (day.income > highestDailyIncome.amount) {
                    highestDailyIncome = { dateObj: day.date, amount: day.income };
                }
                if (day.expense > highestDailyExpense.amount) {
                    highestDailyExpense = { dateObj: day.date, amount: day.expense };
                }
            }
        });

        // Find Monthly Peaks
        Object.values(processedData.monthly).forEach(month => {
            const monthLabel = `${getMonthName(month.month)} ${month.year}`;
            if (month.income > highestMonthlyIncome.amount) {
                highestMonthlyIncome = { monthLabel: monthLabel, amount: month.income };
            }
            if (month.expense > highestMonthlyExpense.amount) {
                highestMonthlyExpense = { monthLabel: monthLabel, amount: month.expense };
            }
        });

        // Find Yearly Peaks
        Object.values(processedData.yearly).forEach(year => {
            if (year.income > highestYearlyIncome.amount) {
                highestYearlyIncome = { year: year.year, amount: year.income };
            }
            if (year.expense > highestYearlyExpense.amount) {
                highestYearlyExpense = { year: year.year, amount: year.expense };
            }
        });

        return { highestDailyIncome, highestDailyExpense, highestMonthlyIncome, highestMonthlyExpense, highestYearlyIncome, highestYearlyExpense };
    }, [processedData]);


    // Prepare chart data based on selected type and period
    const chartData = useMemo(() => {
        if (reportType === 'daily') {
            // Use UTC date methods to correctly get days in month
            const daysInMonth = new Date(Date.UTC(selectedYear, selectedMonth + 1, 0)).getUTCDate();
            const monthData = [];
            for (let day = 1; day <= daysInMonth; day++) {
                const dayKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                monthData.push({
                    name: `${day}`, // Day number
                    income: processedData.daily[dayKey]?.income || 0,
                    expense: processedData.daily[dayKey]?.expense || 0,
                });
            }
            return monthData;
        } else if (reportType === 'monthly') {
            const yearData = [];
            for (let month = 0; month < 12; month++) {
                const monthKey = `${selectedYear}-${String(month + 1).padStart(2, '0')}`;
                yearData.push({
                    name: getMonthName(month), // Month abbreviation
                    income: processedData.monthly[monthKey]?.income || 0,
                    expense: processedData.monthly[monthKey]?.expense || 0,
                });
            }
            return yearData;
        } else if (reportType === 'yearly') {
            // Sort yearly data by year
            return Object.values(processedData.yearly)
                .sort((a, b) => a.year - b.year)
                .map(year => ({
                    name: year.year.toString(), // Year as string
                    income: year.income,
                    expense: year.expense,
                }));
        }
        return [];
    }, [reportType, selectedYear, selectedMonth, processedData]);

    // --- Prepare Expense Pie Chart data for the selected period ---
    const expensePieData = useMemo(() => {
        // Only makes sense for daily and monthly views
        if (reportType === 'yearly') return [];

        const categoryTotals = {};
        // Filter transactions relevant to the current chart view
        transactions.forEach(tx => {
            if (!tx.date) return; // Skip if no date
            const date = new Date(Date.UTC(parseInt(tx.date.substring(0, 4)), parseInt(tx.date.substring(5, 7)) - 1, parseInt(tx.date.substring(8, 10))));
            if (isNaN(date.getTime())) return;

            const txYear = date.getUTCFullYear();
            const txMonth = date.getUTCMonth(); // 0-11

            let include = false;
            if (reportType === 'daily' && txYear === selectedYear && txMonth === selectedMonth) {
                include = true;
            } else if (reportType === 'monthly' && txYear === selectedYear) {
                include = true;
            }

            if (include && tx.type === 'expense') {
                categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + tx.amount;
            }
        });

        return Object.entries(categoryTotals)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value); // Sort largest slice first

    }, [transactions, reportType, selectedYear, selectedMonth]);
    // --- END ---

    // --- Calculate Average Spend for the period ---
    const averageSpend = useMemo(() => {
        if (reportType === 'daily' && chartData.length > 0) {
            const totalExpenseThisMonth = chartData.reduce((sum, day) => sum + day.expense, 0);
            return totalExpenseThisMonth / chartData.length; // Avg daily spend
        } else if (reportType === 'monthly' && chartData.length > 0) {
            const totalExpenseThisYear = chartData.reduce((sum, month) => sum + month.expense, 0);
            const monthsWithExpense = chartData.filter(month => month.expense > 0).length;
            return monthsWithExpense > 0 ? totalExpenseThisYear / monthsWithExpense : 0; // Avg monthly spend (only for months with spend)
        }
        return 0; // Not applicable for yearly view
    }, [chartData, reportType]);
    // --- END ---


    // Available years for dropdowns
    const availableYears = useMemo(() => {
        const years = new Set();
        transactions.forEach(tx => {
            if (tx.date) {
                const year = new Date(Date.UTC(parseInt(tx.date.substring(0, 4)), parseInt(tx.date.substring(5, 7)) - 1, parseInt(tx.date.substring(8, 10)))).getUTCFullYear();
                if (!isNaN(year)) years.add(year);
            }
        });
        // const years = new Set(transactions.map(tx => new Date(tx.date + 'T00:00:00Z').getUTCFullYear())); // Use UTC
        const sortedYears = Array.from(years).sort((a, b) => b - a); // Descending
        return sortedYears.length > 0 ? sortedYears : [currentYear];
    }, [transactions, currentYear]);

    // Handlers for changing period
    const handleYearChange = (e) => setSelectedYear(parseInt(e.target.value));
    const handleMonthChange = (e) => setSelectedMonth(parseInt(e.target.value));

    // Handlers for prev/next period navigation
    const goToPrevPeriod = () => {
        if (reportType === 'daily') {
            const currentSelectedDate = new Date(Date.UTC(selectedYear, selectedMonth, 1));
            currentSelectedDate.setUTCMonth(currentSelectedDate.getUTCMonth() - 1); // Go to previous month
            setSelectedMonth(currentSelectedDate.getUTCMonth());
            setSelectedYear(currentSelectedDate.getUTCFullYear());
        } else if (reportType === 'monthly') {
            const currentMinYear = availableYears.length > 0 ? availableYears[availableYears.length - 1] : currentYear;
            setSelectedYear(prev => Math.max(currentMinYear, prev - 1)); // Go to previous year, min available
        }
    };
    const goToNextPeriod = () => {
        if (reportType === 'daily') {
            const currentSelectedDate = new Date(Date.UTC(selectedYear, selectedMonth, 1));
            currentSelectedDate.setUTCMonth(currentSelectedDate.getUTCMonth() + 1); // Go to next month
            // Prevent going to future months beyond the current month/year
            const today = new Date();
            if (currentSelectedDate.getUTCFullYear() > today.getUTCFullYear() ||
                (currentSelectedDate.getUTCFullYear() === today.getUTCFullYear() && currentSelectedDate.getUTCMonth() > today.getUTCMonth())) {
                return; // Do nothing if it's a future month
            }
            setSelectedMonth(currentSelectedDate.getUTCMonth());
            setSelectedYear(currentSelectedDate.getUTCFullYear());
        } else if (reportType === 'monthly') {
            const currentMaxYear = availableYears.length > 0 ? availableYears[0] : currentYear;
            // Prevent going to future years beyond the current year
            if (selectedYear >= currentYear) return;
            setSelectedYear(prev => Math.min(currentMaxYear, prev + 1)); // Go to next year, max available
        }
    };


    if (loading) return <p className="text-center mt-6 text-gray-600">Loading reports...</p>;



    return (

        // Main Container: Sets default text and background for both modes

        <div className="h-full overflow-y-auto scroll-smooth p-4 mt-7 md:p-6 space-y-6 bg-transparent dark:bg-transparent text-gray-800 dark:text-gray-100 transition-colors duration-300">

            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-700 text-center mb-6">

                Reports & Analysis

            </h1>



            {/* View Type Selection - MODIFIED for sliding animation */}

            <div className="relative flex justify-center gap-2 mb-6 bg-white/50 dark:bg-gray-800/50 p-1 rounded-lg max-w-md mx-auto shadow-sm">

                <button

                    onClick={() => setReportType('daily')}

                    className={`relative flex-1 py-2 px-4 rounded text-sm font-medium transition ${reportType === 'daily'

                            ? 'text-white' // Active text color

                            : 'text-gray-600 dark:text-gray-300 hover:bg-white/70 dark:hover:bg-gray-700/70'

                        }`}

                >

                    {/* This is the sliding pill */}

                    {reportType === 'daily' && (

                        <motion.div

                            layoutId="active-pill"

                            className="absolute inset-0 bg-green-600 rounded-lg shadow"

                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}

                        />

                    )}

                    {/* Text needs to be relative to be on top */}

                    <span className="relative z-10">Daily</span>

                </button>

                <button

                    onClick={() => setReportType('monthly')}

                    className={`relative flex-1 py-2 px-4 rounded text-sm font-medium transition ${reportType === 'monthly'

                            ? 'text-white'

                            : 'text-gray-600 dark:text-gray-300 hover:bg-white/70 dark:hover:bg-gray-700/70'

                        }`}

                >

                    {reportType === 'monthly' && (

                        <motion.div

                            layoutId="active-pill"

                            className="absolute inset-0 bg-green-600 rounded-lg shadow"

                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}

                        />

                    )}

                    <span className="relative z-10">Monthly</span>

                </button>

                <button

                    onClick={() => setReportType('yearly')}

                    className={`relative flex-1 py-2 px-4 rounded text-sm font-medium transition ${reportType === 'yearly'

                            ? 'text-white'

                            : 'text-gray-600 dark:text-gray-300 hover:bg-white/70 dark:hover:bg-gray-700/70'

                        }`}

                >

                    {reportType === 'yearly' && (

                        <motion.div

                            layoutId="active-pill"

                            className="absolute inset-0 bg-green-600 rounded-lg shadow"

                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}

                        />

                    )}

                    <span className="relative z-10">Yearly</span>

                </button>

            </div>



            {/* Period Selection & Navigation */}

            {(reportType === 'daily' || reportType === 'monthly') && (

                <div className="flex flex-col sm:flex-row justify-center items-center gap-2 mb-6">

                    <button

                        onClick={goToPrevPeriod}

                        className="p-2 rounded hover:bg-white/60 dark:hover:bg-gray-700/60 text-gray-600 dark:text-gray-300"

                        title="Previous Period"

                    >

                        <ArrowLeft size={20} />

                    </button>



                    {/* Daily requires Month + Year */}

                    {reportType === 'daily' && (

                        <select

                            value={selectedMonth}

                            onChange={handleMonthChange}

                            // Added dark mode styles for select

                            className="p-2 rounded border border-gray-300 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 appearance-none focus:outline-none focus:ring-2 focus:ring-green-400 bg-no-repeat bg-right pr-8"

                            style={{

                                // Adjusting SVG color for dark mode (using %239ca3af which is gray-400 for better contrast)

                                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,

                                backgroundPosition: 'right 0.5rem center',

                                backgroundSize: '1.5em 1.5em',

                            }}

                        >

                            {Array.from({ length: 12 }).map((_, i) => (

                                <option key={i} value={i}>

                                    {getMonthName(i)}

                                </option>

                            ))}

                        </select>

                    )}



                    {/* Daily or Monthly requires Year */}

                    <select

                        value={selectedYear}

                        onChange={handleYearChange}

                        // Added dark mode styles for select

                        className="p-2 rounded border border-gray-300 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 appearance-none focus:outline-none focus:ring-2 focus:ring-green-400 bg-no-repeat bg-right pr-8"

                        style={{

                            // Adjusting SVG color for dark mode

                            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,

                            backgroundPosition: 'right 0.5rem center',

                            backgroundSize: '1.5em 1.5em',

                        }}

                    >

                        {availableYears.map((year) => (

                            <option key={year} value={year}>

                                {year}

                            </option>

                        ))}

                    </select>

                    <button

                        onClick={goToNextPeriod}

                        className="p-2 rounded hover:bg-white/60 dark:hover:bg-gray-700/60 text-gray-600 dark:text-gray-300"

                        title="Next Period"

                    >

                        <ArrowRight size={20} />

                    </button>

                </div>

            )}



            {/* Chart Section Wrapper */}

            <div className="flex flex-col lg:flex-row gap-6">

                {/* Main Chart (Income vs Expense) */}

                <div className="flex-1 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-4 md:p-6 rounded-2xl shadow-lg dark:shadow-xl border border-green-100 dark:border-green-800 min-w-0 transition-colors duration-300">

                    <h2 className="text-lg md:text-xl font-semibold text-green-700 dark:text-green-300 mb-4 text-center">

                        {reportType === 'daily' &&

                            `Daily Summary for ${getMonthName(selectedMonth)} ${selectedYear}`}

                        {reportType === 'monthly' && `Monthly Summary for ${selectedYear}`}

                        {reportType === 'yearly' && `Yearly Trend`}

                    </h2>



                    {/* No Data/No Transactions Messages */}

                    {chartData.length === 0 && transactions.length > 0 && (

                        <div className="h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400">

                            No data for this period.

                        </div>

                    )}

                    {transactions.length === 0 && !loading && (

                        <div className="h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400">

                            No transactions recorded yet.

                        </div>

                    )}



                    {/* Recharts Configuration - MODIFIED for animation */}

                    {chartData.length > 0 && (

                        <AnimatePresence mode="wait">

                            {/* This key change triggers the animation */}

                            <motion.div

                                key={reportType}

                                initial={{ opacity: 0, y: 20 }}

                                animate={{ opacity: 1, y: 0 }}

                                exit={{ opacity: 0, y: -20 }}

                                transition={{ duration: 0.3 }}

                            >

                                <ResponsiveContainer width="100%" height={300}>

                                    {reportType === 'yearly' ? (

                                        <LineChart

                                            data={chartData}

                                            margin={{ top: 5, right: 10, left: 10, bottom: 5 }}

                                        >

                                            <CartesianGrid

                                                strokeDasharray="3 3"

                                                stroke="#e0e0e0"

                                                className="dark:stroke-gray-600"

                                            />

                                            <XAxis

                                                dataKey="name"

                                                stroke="#666"

                                                className="dark:stroke-gray-400"

                                                fontSize={12}

                                            />

                                            <YAxis

                                                stroke="#666"

                                                className="dark:stroke-gray-400"

                                                fontSize={12}

                                                tickFormatter={formatCurrency}

                                                width={80}

                                            />

                                            <Tooltip

                                                contentStyle={{

                                                    backgroundColor: 'rgba(255, 255, 255, 0.9)',

                                                    border: '1px solid #ccc',

                                                }}

                                                wrapperStyle={{ color: '#333' }}

                                                className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"

                                                formatter={(value) => formatCurrency(value)}

                                            />

                                            <Legend />

                                            <Line

                                                type="monotone"

                                                dataKey="income"

                                                stroke="#16a34a"

                                                strokeWidth={2}

                                                name="Income"

                                                dot={false}

                                                activeDot={{ r: 6 }}

                                                animationDuration={500} // ADDED

                                            />

                                            <Line

                                                type="monotone"

                                                dataKey="expense"

                                                stroke="#ef4444"

                                                strokeWidth={2}

                                                name="Expense"

                                                dot={false}

                                                activeDot={{ r: 6 }}

                                                animationDuration={500} // ADDED

                                            />

                                        </LineChart>

                                    ) : (

                                        <BarChart

                                            data={chartData}

                                            margin={{ top: 5, right: 10, left: 10, bottom: 5 }}

                                        >

                                            <CartesianGrid

                                                strokeDasharray="3 3"

                                                stroke="#e0e0e0"

                                                className="dark:stroke-gray-600"

                                            />

                                            <XAxis

                                                dataKey="name"

                                                stroke="#666"

                                                className="dark:stroke-gray-400"

                                                fontSize={12}

                                            />

                                            <YAxis

                                                stroke="#666"

                                                className="dark:stroke-gray-400"

                                                fontSize={12}

                                                tickFormatter={formatCurrency}

                                                width={80}

                                            />

                                            <Tooltip

                                                contentStyle={{

                                                    backgroundColor: 'rgba(255, 255, 255, 0.9)',

                                                    border: '1px solid #ccc',

                                                }}

                                                wrapperStyle={{ color: '#333' }}

                                                className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"

                                                formatter={(value) => formatCurrency(value)}

                                            />

                                            <Legend />

                                            <Bar

                                                dataKey="income"

                                                fill="#16a34a"

                                                name="Income"

                                                radius={[4, 4, 0, 0]}

                                                animationDuration={500} // ADDED

                                            />

                                            <Bar

                                                dataKey="expense"

                                                fill="#ef4444"

                                                name="Expense"

                                                radius={[4, 4, 0, 0]}

                                                animationDuration={500} // ADDED

                                            />

                                        </BarChart>

                                    )}

                                </ResponsiveContainer>

                            </motion.div>

                        </AnimatePresence>

                    )}

                </div>



                {/* Expense Breakdown Pie Chart (Conditional) - MODIFIED for animation */}

                <AnimatePresence>

                    {(reportType === 'monthly' || reportType === 'daily') && (

                        <motion.div

                            className="lg:w-1/3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-4 md:p-6 rounded-2xl shadow-lg dark:shadow-xl border border-green-100 dark:border-green-800 flex flex-col min-w-0 transition-colors duration-300"

                            initial={{ opacity: 0, x: 50 }} // Slide in from right

                            animate={{ opacity: 1, x: 0 }}

                            exit={{ opacity: 0, x: 50 }} // Slide out to right

                            transition={{ type: 'spring', stiffness: 200, damping: 20 }}

                        >

                            <h2 className="text-lg md:text-xl font-semibold text-green-700 dark:text-green-300 mb-4 text-center">

                                Expense Breakdown

                            </h2>



                            {/* No Data/No Transactions Messages */}

                            {expensePieData.length === 0 && transactions.length > 0 && (

                                <div className="h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400">

                                    No expense data for breakdown.

                                </div>

                            )}

                            {transactions.length === 0 && !loading && (

                                <div className="h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400">

                                    No transactions recorded yet.

                                </div>

                            )}



                            {/* Recharts Pie Configuration */}

                            {expensePieData.length > 0 && (

                                <ResponsiveContainer width="100%" height={300}>

                                    <PieChart>

                                        <Pie

                                            data={expensePieData}

                                            cx="50%"

                                            cy="50%"

                                            labelLine={false}

                                            outerRadius="80%"

                                            innerRadius="40%" // Donut effect

                                            fill="#8884d8"

                                            dataKey="value"

                                            paddingAngle={2}

                                            animationDuration={500} // ADDED

                                        >

                                            {expensePieData.map((entry, index) => (

                                                <Cell

                                                    key={`cell-${index}`}

                                                    fill={PIE_COLORS[index % PIE_COLORS.length]}

                                                />

                                            ))}

                                        </Pie>

                                        <Tooltip

                                            contentStyle={{

                                                backgroundColor: 'rgba(255, 255, 255, 0.9)',

                                                border: '1px solid #ccc',

                                            }}

                                            wrapperStyle={{ color: '#333' }}

                                            className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"

                                            formatter={(value) => formatCurrency(value)}

                                        />

                                        <Legend

                                            layout="vertical"

                                            align="right"

                                            verticalAlign="middle"

                                            iconSize={10}

                                            wrapperStyle={{

                                                fontSize: '12px',

                                                lineHeight: '1.5',

                                                color: '#374151',

                                                paddingLeft: '10px',

                                            }}

                                            className="dark:text-gray-300"

                                        />

                                    </PieChart>

                                </ResponsiveContainer>

                            )}

                        </motion.div>

                    )}

                </AnimatePresence>

            </div>

            {/* End Chart Section Wrapper */}



            {/* Summary Statistics */}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

                {/* Average Spend Card */}

                {(reportType === 'daily' || reportType === 'monthly') && (

                    <div className="bg-white/80   dark:bg-gray-800/80 backdrop-blur-sm p-4 rounded-2xl shadow-md dark:shadow-xl border border-green-100 dark:border-green-800 text-center place-content-center transition-colors duration-300">

                        <h3 className="font-semibold text-gray-700 dark:text-gray-300  text-sm mb-1">

                            {reportType === 'daily'

                                ? 'Avg. Daily Spend'

                                : 'Avg. Monthly Spend'}

                        </h3>

                        {averageSpend > 0 ? (

                            <>

                                <p className="font-bold text-lg text-orange-600 dark:text-orange-400">

                                    {formatCurrency(averageSpend)}

                                </p>

                                <p className="text-xs text-gray-500 dark:text-gray-400">

                                    {reportType === 'daily'

                                        ? `in ${getMonthName(selectedMonth)} ${selectedYear}`

                                        : `in ${selectedYear}`}

                                </p>

                            </>

                        ) : (

                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">

                                -

                            </p> // Show dash if no spend

                        )}

                    </div>

                )}



                {/* Highest Daily */}

                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-4 rounded-2xl shadow-md dark:shadow-xl border border-green-100 dark:border-green-800 space-y-2 transition-colors duration-300">

                    <h3 className="font-semibold text-center text-gray-700 dark:text-gray-300 text-sm">

                        Peak Day

                    </h3>

                    <div className="text-center">

                        <p className="text-xs text-gray-500 dark:text-gray-400">

                            Highest Income

                        </p>

                        {summaryStats.highestDailyIncome.dateObj instanceof Date &&

                            !isNaN(summaryStats.highestDailyIncome.dateObj) ? (

                            <>

                                <p className="font-bold text-green-600 dark:text-green-400">

                                    {formatCurrency(summaryStats.highestDailyIncome.amount)}

                                </p>

                                <p className="text-xs text-gray-500 dark:text-gray-400">

                                    {summaryStats.highestDailyIncome.dateObj.toLocaleDateString()}

                                </p>

                            </>

                        ) : (

                            <p className="text-xs text-gray-400 dark:text-gray-500">

                                {summaryStats.highestDailyIncome.amount > 0

                                    ? formatCurrency(summaryStats.highestDailyIncome.amount)

                                    : '-'}

                            </p>

                        )}

                    </div>

                    {/* Adjust HR color for dark mode */}

                    <hr className="border-gray-200 dark:border-gray-700" />

                    <div className="text-center">

                        <p className="text-xs text-gray-500 dark:text-gray-400">

                            Highest Expense

                        </p>

                        {summaryStats.highestDailyExpense.dateObj instanceof Date &&

                            !isNaN(summaryStats.highestDailyExpense.dateObj) ? (

                            <>

                                <p className="font-bold text-red-600 dark:text-red-400">

                                    {formatCurrency(summaryStats.highestDailyExpense.amount)}

                                </p>

                                <p className="text-xs text-gray-500 dark:text-gray-400">

                                    {summaryStats.highestDailyExpense.dateObj.toLocaleDateString()}

                                </p>

                            </>

                        ) : (

                            <p className="text-xs text-gray-400 dark:text-gray-500">

                                {summaryStats.highestDailyExpense.amount > 0

                                    ? formatCurrency(summaryStats.highestDailyExpense.amount)

                                    : '-'}

                            </p>

                        )}

                    </div>

                </div>



                {/* Highest Monthly */}

                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-4 rounded-2xl shadow-md dark:shadow-xl border border-green-100 dark:border-green-800 space-y-2 transition-colors duration-300">

                    <h3 className="font-semibold text-center text-gray-700 dark:text-gray-300 text-sm">

                        Peak Month

                    </h3>

                    <div className="text-center">

                        <p className="text-xs text-gray-500 dark:text-gray-400">

                            Highest Income

                        </p>

                        {summaryStats.highestMonthlyIncome.monthLabel ? (

                            <>

                                <p className="font-bold text-green-600 dark:text-green-400">

                                    {formatCurrency(summaryStats.highestMonthlyIncome.amount)}

                                </p>

                                <p className="text-xs text-gray-500 dark:text-gray-400">

                                    {summaryStats.highestMonthlyIncome.monthLabel}

                                </p>

                            </>

                        ) : (

                            <p className="text-xs text-gray-400 dark:text-gray-500">-</p>

                        )}

                    </div>

                    {/* Adjust HR color for dark mode */}

                    <hr className="border-gray-200 dark:border-gray-700" />

                    <div className="text-center">

                        <p className="text-xs text-gray-500 dark:text-gray-400">

                            Highest Expense

                        </p>

                        {summaryStats.highestMonthlyExpense.monthLabel ? (

                            <>

                                <p className="font-bold text-red-600 dark:text-red-400">

                                    {formatCurrency(summaryStats.highestMonthlyExpense.amount)}

                                </p>

                                <p className="text-xs text-gray-500 dark:text-gray-400">

                                    {summaryStats.highestMonthlyExpense.monthLabel}

                                </p>

                            </>

                        ) : (

                            <p className="text-xs text-gray-400 dark:text-gray-500">-</p>

                        )}

                    </div>

                </div>



                {/* Highest Yearly */}

                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-4 rounded-2xl shadow-md dark:shadow-xl border border-green-100 dark:border-green-800 space-y-2 transition-colors duration-300">

                    <h3 className="font-semibold text-center text-gray-700 dark:text-gray-300 text-sm">

                        Peak Year

                    </h3>

                    <div className="text-center">

                        <p className="text-xs text-gray-500 dark:text-gray-400">

                            Highest Income

                        </p>

                        {summaryStats.highestYearlyIncome.year ? (

                            <>

                                <p className="font-bold text-green-600 dark:text-green-400">

                                    {formatCurrency(summaryStats.highestYearlyIncome.amount)}

                                </p>

                                <p className="text-xs text-gray-500 dark:text-gray-400">

                                    {summaryStats.highestYearlyIncome.year}

                                </p>

                            </>

                        ) : (

                            <p className="text-xs text-gray-400 dark:text-gray-500">-</p>

                        )}

                    </div>

                    {/* Adjust HR color for dark mode */}

                    <hr className="border-gray-200 dark:border-gray-700" />

                    <div className="text-center">

                        <p className="text-xs text-gray-500 dark:text-gray-400">

                            Highest Expense

                        </p>

                        {summaryStats.highestYearlyExpense.year ? (

                            <>

                                <p className="font-bold text-red-600 dark:text-red-400">

                                    {formatCurrency(summaryStats.highestYearlyExpense.amount)}

                                </p>

                                <p className="text-xs text-gray-500 dark:text-gray-400">

                                    {summaryStats.highestYearlyExpense.year}

                                </p>

                            </>

                        ) : (

                            <p className="text-xs text-gray-400 dark:text-gray-500">-</p>

                        )}

                    </div>

                </div>

            </div>

        </div>

    );


}