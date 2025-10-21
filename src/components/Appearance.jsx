import React, { useState, useEffect } from "react";
import { Palette, Sun, Moon, Monitor } from "lucide-react";
import { motion } from "framer-motion";

const Appearance = () => {
  const themes = [
    { name: "light", label: "Light", icon: Sun },
    { name: "dark", label: "Dark", icon: Moon },
    { name: "system", label: "System", icon: Monitor },
  ];

  // Local state
  const [activeTheme, setActiveTheme] = useState(() => localStorage.getItem("theme") || "system");

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    // Check for system preference only once when the effect runs
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    const applyTheme = (theme) => {
      let isDark = false;
      if (theme === "dark") isDark = true;
      else if (theme === "system") isDark = systemPrefersDark;

      // Apply 'dark' class based on the calculated theme preference
      root.classList.toggle("dark", isDark);
      localStorage.setItem("theme", theme);
    };

    applyTheme(activeTheme);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = (e) => {
      // Only re-apply if the user's saved setting is 'system'
      if (localStorage.getItem("theme") === "system") {
        applyTheme("system");
      }
    };

    // Modern and older event listener syntax for compatibility
    mediaQuery.addEventListener?.("change", listener);
    mediaQuery.addListener?.(listener);

    return () => {
      mediaQuery.removeEventListener?.("change", listener);
      mediaQuery.removeListener?.(listener);
    };
  }, [activeTheme]); // Re-run effect when activeTheme changes

  // Calculate the index for Framer Motion's 'x' animation
  const activeIndex = themes.findIndex((t) => t.name === activeTheme);

  

  return (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="bg-white/80 backdrop-blur-sm dark:bg-gray-700/80 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 w-full h-full mx-auto"
  >
    <div className="flex items-center gap-3 mb-4">
      <Palette className="text-green-600 dark:text-green-500" size={20} />
      <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">
        Appearance
      </h2>
    </div>

    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
      Choose how the app looks. 'System' matches your device settings.
    </p>

    {/* Theme Selection Tabs */}
    <div className="relative flex w-full bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
      {/* Sliding Pill */}
      <motion.div
        className="absolute top-0 left-0 h-full w-1/3 bg-green-500 dark:bg-green-600 rounded-lg shadow-md transition-colors"
        animate={{ x: `${activeIndex * 100}%` }}
        transition={{ type: "spring", stiffness: 350, damping: 35 }}
      />

      {/* Buttons */}
      {themes.map(({ name, label, icon: Icon }) => (
        <button
          key={name}
          onClick={() => setActiveTheme(name)}
          className={`flex-1 relative z-10 flex items-center justify-center gap-2 py-2 px-3 text-sm rounded-lg transition-colors duration-200 whitespace-nowrap
            ${
              activeTheme === name
                ? "text-white dark:text-gray-100 font-medium"
                : "text-gray-600 dark:text-gray-400 hover:bg-white/10 dark:hover:bg-gray-600/50"
            }`}
        >
          <Icon size={16} />
          <span>{label}</span>
        </button>
      ))}
    </div>
  </motion.div>
);

};

export default Appearance;