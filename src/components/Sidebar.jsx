import React, { useEffect, useState } from "react";
import {
  LayoutDashboard,
  PieChart,
  Settings,
  Wallet,
  Menu,
  ChevronLeft,
  LogOut,
} from "lucide-react";

export default function Sidebar({ activeTab, setActiveTab, onLogout }) {
  const [collapsed, setCollapsed] = useState(true);      // collapsed by default on desktop
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);     // track screen size

  // Detect desktop vs mobile using matchMedia
  useEffect(() => {
    if (typeof window === "undefined") return;

    const media = window.matchMedia("(min-width: 768px)");

    const handleChange = () => {
      const desktop = media.matches;
      setIsDesktop(desktop);
      // On mobile, keep sidebar "expanded" width-wise
      if (!desktop) {
        setCollapsed(false);
      } else {
        setCollapsed(true); // start collapsed on desktop
      }
    };

    handleChange(); // initial
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  const navItems = [
    { id: "overview", label: "Overview", icon: <LayoutDashboard size={20} /> },
    { id: "viewExpenses", label: "View Expenses", icon: <Wallet size={20} /> },
    { id: "reports", label: "Reports", icon: <PieChart size={20} /> },
    { id: "settings", label: "Settings", icon: <Settings size={20} /> },
  ];

  // Sidebar width logic:
  const widthClass = isDesktop
    ? collapsed
      ? "w-16"
      : "w-56"
    : "w-56";

  return (
    <>
      {/* Sidebar Container */}
      <div
        className={`
          fixed md:relative top-0 left-0 h-screen
          bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl
          border-r border-emerald-100/70 dark:border-slate-800
          shadow-lg flex flex-col z-40
          transition-[width,transform] duration-200 ease-out
          ${widthClass}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
        // Hover expand/collapse only on desktop
        onMouseEnter={() => {
          if (isDesktop) setCollapsed(false);
        }}
        onMouseLeave={() => {
          if (isDesktop) setCollapsed(true);
        }}
      >
        <div className="relative h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center px-3 h-16 border-b border-emerald-100/70 dark:border-slate-800">
            <span className="text-emerald-700 dark:text-emerald-300 font-bold text-2xl">
              💸
            </span>
            {/* Brand text – smoothly width/opacity animated */}
            <span
              className={`
                ml-2 text-xl font-bold text-emerald-700 dark:text-emerald-300 tracking-wide
                whitespace-nowrap overflow-hidden
                transition-[width,opacity] duration-200 ease-out
                ${collapsed ? "w-0 opacity-0" : "w-32 opacity-100"}
              `}
            >
              ExpensePro
            </span>
          </div>

          {/* Nav Items */}
          <div className="flex-1 mt-4 space-y-1 overflow-y-auto thin-scrollbar px-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileOpen(false);
                }}
                className={`
                  flex items-center w-full px-3 py-2.5 rounded-lg
                  text-sm md:text-[15px]
                  transition-colors duration-150 text-left
                  ${
                    activeTab === item.id
                      ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 font-semibold"
                      : "text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-slate-900/60"
                  }
                `}
              >
                <span className="flex items-center justify-center w-6">
                  {item.icon}
                </span>

                {/* Label: always rendered, but width/opacity animated */}
                <span
                  className={`
                    ml-3 whitespace-nowrap overflow-hidden
                    transition-[width,opacity] duration-200 ease-out
                    ${collapsed ? "w-0 opacity-0" : "w-36 opacity-100"}
                  `}
                >
                  {item.label}
                </span>
              </button>
            ))}
          </div>

          {/* Logout */}
          <div className="px-2 pt-2 pb-3 border-t border-emerald-100/60 dark:border-slate-800">
            <button
              onClick={() => {
                setMobileOpen(false);
                onLogout && onLogout();
              }}
              className="
                flex items-center w-full text-left 
                text-red-600 dark:text-red-400 
                px-3 py-2 rounded-lg 
                hover:bg-red-50 dark:hover:bg-slate-900/70
                transition-colors duration-150 text-sm
              "
            >
              <span className="flex items-center justify-center w-6">
                <LogOut size={20} />
              </span>
              <span
                className={`
                  ml-3 whitespace-nowrap overflow-hidden
                  transition-[width,opacity] duration-200 ease-out
                  ${collapsed ? "w-0 opacity-0" : "w-28 opacity-100"}
                `}
              >
                Logout
              </span>
            </button>
          </div>

          {/* Footer */}
          <div className="px-2 pb-4 text-center text-xs text-slate-500 dark:text-slate-500 border-t border-emerald-50/70 dark:border-slate-900">
            <span
              className={`
                inline-block whitespace-nowrap overflow-hidden
                transition-[width,opacity] duration-200 ease-out
                ${collapsed ? "w-0 opacity-0" : "w-40 opacity-100"}
              `}
            >
              © {new Date().getFullYear()} ExpensePro
            </span>
          </div>
        </div>
      </div>

      {/* Mobile Toggle Button */}
      <button
        onClick={() => setMobileOpen((s) => !s)}
        aria-label={mobileOpen ? "Close menu" : "Open menu"}
        className="
          md:hidden fixed top-4 left-4 z-50
          bg-emerald-600 text-white p-2 rounded-lg shadow-md
        "
      >
        {mobileOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
      </button>
    </>
  );
}
