// Overview.jsx
import React, { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  ShoppingBag,
  PiggyBank,
} from "lucide-react";
import { toast } from "react-toastify";
import api from "../config/axiosConfig";

export default function Overview({ refreshKey }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const COLORS = ["#16a34a", "#15803d", "#4ade80", "#86efac"];

  // Fetch transactions
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) {
        toast.error("Please login to view your dashboard");
        setLoading(false);
        return;
      }

      try {
        const res = await api.get(`/transactions`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const raw = Array.isArray(res.data)
          ? res.data
          : res.data.transactions || [];

        const formatted = raw.map((tx) => ({
          ...tx,
          date: tx.date ? tx.date.split("T")[0] : "",
        }));
        setTransactions(formatted);
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch transactions.");
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [refreshKey]);

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  const netSavings = totalIncome - totalExpense;

  const expenseCategories = {};
  transactions
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      expenseCategories[t.category] =
        (expenseCategories[t.category] || 0) + t.amount;
    });

  const pieData = Object.entries(expenseCategories).map(([name, value]) => ({
    name,
    value,
  }));

  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5)
    .map((t) => ({
      ...t,
      type: t.type === "income" ? "Income" : "Expense",
      date: t.date ? new Date(t.date).toLocaleDateString() : "",
    }));

  if (loading)
    return (
      <p className="text-center mt-20 text-slate-700 dark:text-slate-300">
        Loading...
      </p>
    );

  return (
    <div className="h-full overflow-y-auto scroll-smooth px-2 mt-11 md:px-4 lg:px-6 space-y-8 pb-8 bg-transparent transition-colors duration-300">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
        {/* Income */}
        <div className="bg-white/80 dark:bg-slate-900/80 p-5 rounded-2xl shadow-md border border-emerald-50 dark:border-slate-600 transition-colors">
          <div className="flex justify-between items-center">
            <h4 className="text-emerald-700 dark:text-emerald-300 font-semibold text-lg">
              Total Income
            </h4>
            <Wallet className="text-emerald-600 dark:text-emerald-300" />
          </div>
          <p className="text-3xl font-bold text-emerald-800 dark:text-emerald-200 mt-2">
            ₹{totalIncome.toFixed(2)}
          </p>
          <span className="text-sm text-slate-600 dark:text-slate-300 flex items-center mt-1">
            <ArrowUpRight
              className="text-emerald-600 dark:text-emerald-300 mr-1"
              size={16}
            />
            {totalIncome && totalExpense
              ? `${(
                  (totalIncome / (totalIncome + totalExpense)) *
                  100
                ).toFixed(0)}% of total flow`
              : "0%"}
          </span>
        </div>

        {/* Expenses */}
        <div className="bg-white/80 dark:bg-slate-900/80 p-5 rounded-2xl shadow-md border border-emerald-50 dark:border-slate-600 transition-colors">
          <div className="flex justify-between items-center">
            <h4 className="text-emerald-700 dark:text-emerald-300 font-semibold text-lg">
              Total Expenses
            </h4>
            <ShoppingBag className="text-emerald-600 dark:text-emerald-300" />
          </div>
          <p className="text-3xl font-bold text-red-600 mt-2">
            ₹{totalExpense.toFixed(2)}
          </p>
          <span className="text-sm text-slate-600 dark:text-slate-400 flex items-center mt-1">
            <ArrowDownRight
              className="text-red-600 dark:text-red-400 mr-1"
              size={16}
            />
            {totalIncome && totalExpense
              ? `${(
                  (totalExpense / (totalIncome + totalExpense)) *
                  100
                ).toFixed(0)}% of total flow`
              : "0%"}
          </span>
        </div>

        {/* Net Savings */}
        <div className="bg-white/80 dark:bg-slate-900/80 p-5 rounded-2xl shadow-md border border-emerald-50 dark:border-slate-600 transition-colors">
          <div className="flex justify-between items-center">
            <h4 className="text-emerald-700 dark:text-emerald-300 font-semibold text-lg">
              Net Savings
            </h4>
            <PiggyBank className="text-emerald-600 dark:text-emerald-300" />
          </div>
          <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-200 mt-2">
            ₹{netSavings.toFixed(2)}
          </p>
          <span className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Current Summary
          </span>
        </div>
      </div>

      {/* Expense Breakdown Chart */}
      <div className="bg-white/80 dark:bg-slate-900/80 p-6 rounded-2xl shadow-lg border border-emerald-50 dark:border-slate-600 transition-colors">
        <h4 className="text-xl font-semibold text-emerald-700 dark:text-emerald-300 mb-4">
          Expense Breakdown
        </h4>
        {pieData.length === 0 ? (
          <p className="text-center text-slate-500 dark:text-slate-400 py-16">
            No expense data available
          </p>
        ) : (
          <div className="w-full h-[400px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius="80%"
                  innerRadius="45%"
                  paddingAngle={4}
                  label={({ name, value }) => `${name}: ₹${value}`}
                  labelLine={false}
                  isAnimationActive={true}
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      stroke="#fff"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => `₹${value}`}
                  contentStyle={{
                    backgroundColor: "#f0fdf4",
                    border: "1px solid #16a34a",
                    borderRadius: "10px",
                    color: "#000",
                  }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      <div className="bg-white/80 dark:bg-slate-900/80 p-6 rounded-2xl shadow-lg border border-emerald-50 dark:border-slate-800 transition-colors">
        <h4 className="text-xl font-semibold text-emerald-700 dark:text-emerald-300 mb-4">
          Recent Transactions
        </h4>
        {recentTransactions.length === 0 ? (
          <p className="text-center text-slate-500 dark:text-slate-400 py-10">
            No transactions found
          </p>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-emerald-50 dark:border-slate-700 text-emerald-700 dark:text-emerald-300 font-medium">
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Category</th>
                    <th className="py-2 px-3">Type</th>
                    <th className="py-2 px-3 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map((tx) => (
                    <tr
                      key={tx._id || tx.id}
                      className="border-b border-emerald-50 dark:border-slate-800 hover:bg-emerald-50/60 dark:hover:bg-slate-900/70 transition-colors"
                    >
                      <td className="py-2 px-3 text-slate-700 dark:text-slate-200">
                        {tx.date}
                      </td>
                      <td className="py-2 px-3 text-slate-800 dark:text-slate-100 font-medium">
                        {tx.category}
                      </td>
                      <td
                        className={`py-2 px-3 font-semibold ${
                          tx.type === "Income"
                            ? "text-emerald-600 dark:text-emerald-300"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {tx.type}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-slate-800 dark:text-slate-100">
                        {tx.type === "Income" ? "+" : "-"}₹{tx.amount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List */}
            <div className="block md:hidden space-y-4">
              {recentTransactions.map((tx) => (
                <div
                  key={tx._id || tx.id}
                  className="bg-emerald-50/70 dark:bg-slate-900/70 p-4 rounded-lg shadow-sm border border-emerald-100 dark:border-slate-700 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                      {tx.category}
                    </span>
                    <span
                      className={`text-lg font-bold ${
                        tx.type === "Income"
                          ? "text-emerald-600 dark:text-emerald-300"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {tx.type === "Income" ? "+" : "-"}₹{tx.amount}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2 text-sm">
                    <span className="text-slate-600 dark:text-slate-400">
                      {tx.date}
                    </span>
                    <span
                      className={`font-semibold ${
                        tx.type === "Income"
                          ? "text-emerald-600 dark:text-emerald-300"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {tx.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
