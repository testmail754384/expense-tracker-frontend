import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  PieChart,
  Settings,
  Wallet,
  Menu,
  ChevronLeft,
  LogOut,
} from "lucide-react";

export default function Sidebar({ activeTab, setActiveTab, onLogout, activeTheme }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Apply dark mode based on activeTheme
  useEffect(() => {
    const root = document.documentElement;
    if (activeTheme === "dark") root.classList.add("dark");
    else if (activeTheme === "light") root.classList.remove("dark");
    else {
      // System mode
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) root.classList.add("dark");
      else root.classList.remove("dark");
    }
  }, [activeTheme]);

  const navItems = [
    { id: "overview", label: "Overview", icon: <LayoutDashboard size={20} /> },
    { id: "viewExpenses", label: "View Expenses", icon: <Wallet size={20} /> },
    { id: "reports", label: "Reports", icon: <PieChart size={20} /> },
    { id: "settings", label: "Settings", icon: <Settings size={20} /> },
  ];

  return (
    <>
      {/* Sidebar Container */}
      <div
        className={`fixed md:relative top-0 left-0 h-screen
          bg-white/50 dark:bg-green-900/60 backdrop-blur-md
          border-r border-green-100 dark:border-gray-800
          shadow-xl flex flex-col z-40 transition-all duration-300
          ${collapsed ? "w-15" : "w-45"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        <div className="relative h-full flex flex-col">
          {/* Collapse Toggle */}
          <button
            onClick={() => setCollapsed((s) => !s)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="hidden md:flex absolute top-5 -right-4 z-50 bg-green-600 text-white rounded-full p-1.5 shadow-md border border-white dark:border-gray-900 transition-transform duration-300 hover:scale-110"
          >
            {collapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
          </button>

          {/* Header */}
          <div className="flex items-center justify-center h-16 border-b border-green-100 dark:border-gray-800">
            {!collapsed ? (
              <h1 className="text-2xl font-bold text-green-700 dark:text-green-400 tracking-wide">
                ExpensePro
              </h1>
            ) : (
              <span className="text-green-700 dark:text-green-400 font-bold text-4xl mr-4">💸</span>
            )}
          </div>

          {/* Nav Items */}
          <div className="flex-1 mt-4 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-green-200 dark:scrollbar-thumb-gray-700">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileOpen(false);
                }}
                className={`flex items-center gap-3 w-full px-5 py-3 rounded-lg transition-all text-left
                  ${activeTab === item.id
                    ? "bg-green-200 dark:bg-green-700/30 text-green-800 dark:text-green-200 font-semibold"
                    : "text-gray-700 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-gray-800/50"
                  }`}
              >
                {item.icon}
                {!collapsed && <span>{item.label}</span>}
              </button>
            ))}
          </div>

          {/* Logout */}
          <div className="p-1 border-t border-gray-200 dark:border-gray-700 transition-colors duration-300">
            <button
              onClick={() => {
                setMobileOpen(false);
                onLogout && onLogout();
              }}
              className="flex items-center gap-3 w-full text-left 
               text-red-600 dark:text-red-400 
               text-shadow-lg px-4 py-2 rounded-lg 
               hover:bg-red-100 dark:hover:bg-gray-700 
               transition-all duration-300"
            >
              <LogOut size={20} />
              {!collapsed && <span>Logout</span>}
            </button>
          </div>


          {/* Footer */}
          <div className="p-3 text-center text-sm text-gray-500 dark:text-gray-400 border-t border-green-50 dark:border-gray-800">
            {!collapsed && <p>© {new Date().getFullYear()} ExpensePro</p>}
          </div>
        </div>
      </div>

      {/* Mobile Toggle Button */}
      <button
        onClick={() => setMobileOpen((s) => !s)}
        aria-label={mobileOpen ? "Close menu" : "Open menu"}
        className="md:hidden fixed top-4 left-4 z-50 bg-green-600 text-white p-2 rounded-lg shadow-md"
      >
        {mobileOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
      </button>
    </>
  );
}
