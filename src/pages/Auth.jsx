import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import api from "../config/axiosConfig"; // Axios instance

export default function Auth() {
  const [tab, setTab] = useState("login");
  const [isOtpLoading, setIsOtpLoading] = useState(false);
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const [passwordValidations, setPasswordValidations] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    specialChar: false,
  });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    otp: "",
  });

  // Reset form when switching tabs
  useEffect(() => {
    setFormData({ name: "", email: "", password: "", otp: "" });
    setOtpSent(false);
    setCountdown(0);
    setPasswordValidations({
      length: false,
      uppercase: false,
      lowercase: false,
      number: false,
      specialChar: false,
    });
  }, [tab]);

  // Resend Otp countdown
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => {
      setCountdown((c) => c - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "password" && tab === "signup") {
      const validations = {
        length: value.length >= 8,
        uppercase: /[A-Z]/.test(value),
        lowercase: /[a-z]/.test(value),
        number: /[0-9]/.test(value),
        specialChar: /[\W_]/.test(value),
      };
      setPasswordValidations(validations);
    }
  };

  const sendOtp = async () => {
    if (!formData.email) return toast.warn("Please enter your email address!");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) return toast.warn("Enter a valid email!");

    setIsOtpLoading(true);
    try {
      const response = await api.post(`/auth/send-otp`, {
        email: formData.email,
        name: formData.name,
      });
      toast.success(response.data.message || "OTP sent successfully!");
      setOtpSent(true);
      setCountdown(60);
    } catch (err) {
      console.error("OTP Send Error:", err);
      toast.error(err.response?.data?.message || "Failed to send OTP.");
    } finally {
      setIsOtpLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (tab === "signup") {
      const allValid = Object.values(passwordValidations).every(Boolean);
      if (!allValid) {
        return toast.error("Please ensure your password meets all criteria.");
      }
    }

    setIsFormLoading(true);
    try {
      let response;
      if (tab === "login") {
        response = await api.post(`/auth/login`, {
          email: formData.email,
          password: formData.password,
        });
        toast.success("Login successful! Redirecting...");
      } else {
        response = await api.post(`/auth/signup`, {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          otp: formData.otp,
        });
        toast.success("Signup successful! Welcome!");
      }

      if (response.data.token) {
        localStorage.setItem("authToken", response.data.token);
        setTimeout(() => {
          window.location.replace("/dashboard");
        }, 800);
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || "An error occurred. Please try again."
      );
    } finally {
      setIsFormLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    toast.info("Redirecting you to Google...");
    window.location.href = `${import.meta.env.VITE_BACKEND_URL}/api/auth/google`;
  };

  const formTransition = {
    type: "tween",
    duration: 0.25,
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-green-300 via-blue-400 to-lime-500 dark:from-green-700 dark:via-blue-500 dark:to-green-800 transition-colors duration-300">
      {/* Main Card Container (single simple animation) */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="w-full max-w-md p-5 rounded-2xl shadow-xl bg-white/80 dark:bg-gray-900/80 border border-white/40 dark:border-gray-700/70 backdrop-blur-sm"
      >
        <h1 className="text-center text-base md:text-xl font-bold mb-2 text-gray-800 dark:text-gray-100">
          Manage Your Expenses
          <br />
          With
          <span className="block text-green-500 text-2xl mt-0.5">
            ExpensePro
          </span>
        </h1>

        {/* Simple static icon (no infinite animation) */}
        <div className="flex justify-center mb-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 200 200"
            className="w-14 h-14"
          >
            <defs>
              <linearGradient id="moneyGradLite" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22C55E" />
                <stop offset="100%" stopColor="#4ADE80" />
              </linearGradient>
            </defs>
            <rect
              x="50"
              y="80"
              width="100"
              height="60"
              rx="10"
              fill="url(#moneyGradLite)"
              stroke="#fff"
              strokeWidth="3"
            />
            <rect
              x="45"
              y="70"
              width="100"
              height="60"
              rx="10"
              fill="url(#moneyGradLite)"
              stroke="#fff"
              strokeWidth="2"
            />
            <text
              x="50%"
              y="115"
              textAnchor="middle"
              fill="white"
              fontSize="32"
              fontWeight="700"
              fontFamily="sans-serif"
            >
              ₹
            </text>
          </svg>
        </div>

        {/* Tab Switcher */}
        <div className="flex justify-around mb-4">
          {["login", "signup"].map((type) => (
            <button
              key={type}
              onClick={() => {
                setTab(type);
              }}
              className={`relative text-sm md:text-base font-semibold transition-colors duration-200 px-3 py-1 ${
                tab === type
                  ? "text-green-700 dark:text-green-400"
                  : "text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-300"
              }`}
            >
              {type === "login" ? "Login" : "Sign Up"}
              {tab === type && (
                <motion.div
                  layoutId="auth-underline"
                  className="absolute -bottom-1 left-0 right-0 h-[2px] bg-green-500 dark:bg-green-400 rounded-full"
                  transition={{ type: "tween", duration: 0.2 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Form Fields */}
        <AnimatePresence mode="wait">
          <motion.form
            key={tab}
            onSubmit={handleSubmit}
            initial={{ opacity: 0, x: tab === "login" ? -10 : 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: tab === "login" ? 10 : -10 }}
            transition={formTransition}
            className="space-y-3"
          >
            {tab === "signup" && (
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-green-400 dark:focus:ring-green-500 outline-none"
                required
              />
            )}

            <input
              type="email"
              name="email"
              autoComplete="off"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-green-400 dark:focus:ring-green-500 outline-none"
              required
            />

            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="current-password"
              className="w-full px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-green-400 dark:focus:ring-green-500 outline-none"
              required
            />

            {tab === "signup" && (
              <>
                <PasswordValidationUI validations={passwordValidations} />

                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={sendOtp}
                    disabled={isOtpLoading || countdown > 0}
                    className="w-28 text-center px-3 py-2 text-xs font-semibold rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed dark:bg-green-500 dark:hover:bg-green-600"
                  >
                    {isOtpLoading
                      ? "Sending..."
                      : countdown > 0
                      ? `Resend (${countdown}s)`
                      : otpSent
                      ? "Resend"
                      : "Send OTP"}
                  </button>

                  {otpSent && (
                    <input
                      type="text"
                      name="otp"
                      placeholder="Enter OTP"
                      value={formData.otp}
                      onChange={handleChange}
                      className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-green-400 dark:focus:ring-green-500 outline-none"
                      required
                    />
                  )}
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isFormLoading}
              className="w-full py-2 text-sm font-semibold rounded-lg shadow-md bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed dark:bg-green-500 dark:hover:bg-green-600"
            >
              {isFormLoading
                ? "Processing..."
                : tab === "login"
                ? "Login"
                : "Sign Up"}
            </button>

            {tab === "login" && (
              <p className="text-xs text-center text-gray-600 dark:text-gray-400 mt-2">
                <a
                  href="/forgot-password"
                  className="text-blue-900 hover:underline dark:text-blue-400"
                >
                  Forgot Password?
                </a>
              </p>
            )}
          </motion.form>
        </AnimatePresence>

        {/* Google Sign-in */}
        <div className="mt-4">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="flex items-center justify-center gap-3 w-full py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700 text-sm"
          >
            <img
              src="https://www.svgrepo.com/show/355037/google.svg"
              alt="Google"
              className="w-4 h-4"
            />
            <span className="font-medium text-gray-700 dark:text-gray-200">
              Continue with Google
            </span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ---------- Helper Components ---------- */

const PasswordValidationUI = ({ validations }) => {
  return (
    <div className="mt-1">
      <PasswordStrengthMeter validations={validations} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1 mt-1">
        <PasswordRequirement
          isValid={validations.length}
          text="At least 8 characters"
        />
        <PasswordRequirement
          isValid={validations.uppercase}
          text="One uppercase letter"
        />
        <PasswordRequirement
          isValid={validations.lowercase}
          text="One lowercase letter"
        />
        <PasswordRequirement
          isValid={validations.number}
          text="One number"
        />
        <PasswordRequirement
          isValid={validations.specialChar}
          text="One special character"
        />
      </div>
    </div>
  );
};

const PasswordRequirement = ({ isValid, text }) => (
  <p
    className={`text-[11px] flex items-center transition-colors duration-200 ${
      isValid
        ? "text-green-600 dark:text-green-400"
        : "text-gray-500 dark:text-gray-400"
    }`}
  >
    <span className="mr-1.5">{isValid ? "✓" : "•"}</span>
    {text}
  </p>
);

const PasswordStrengthMeter = ({ validations }) => {
  const strengthScore = Object.values(validations).filter(Boolean).length;

  let strengthText = "";
  let textColor = "text-gray-400";
  let barColor = "bg-gray-300 dark:bg-gray-600";

  if (strengthScore > 0) {
    if (strengthScore <= 2) {
      strengthText = "Weak";
      textColor = "text-red-500";
      barColor = "bg-red-500";
    } else if (strengthScore === 3) {
      strengthText = "Medium";
      textColor = "text-orange-500";
      barColor = "bg-orange-500";
    } else if (strengthScore === 4) {
      strengthText = "Strong";
      textColor = "text-yellow-500";
      barColor = "bg-yellow-500";
    } else if (strengthScore === 5) {
      strengthText = "Very Strong";
      textColor = "text-green-500";
      barColor = "bg-green-500";
    }
  }

  const width = `${(strengthScore / 5) * 100}%`;

  return (
    <div className="mt-1">
      <div className="flex justify-between items-center mb-1">
        <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">
          Password Strength:
        </span>
        <span className={`text-[11px] font-bold ${textColor}`}>
          {strengthText}
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
        <motion.div
          className={`h-1.5 rounded-full ${barColor}`}
          initial={{ width: 0 }}
          animate={{ width }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        />
      </div>
    </div>
  );
};
