import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
const API_BASE = `${import.meta.env.VITE_BACKEND_URL}/api`

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

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleChange = (e) => {
    // CHANGED: Destructured name and value to be used throughout the function.
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

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
    if (!formData.email) {
      return toast.warn("Please enter your email address first!");
    }

    // CHANGED: Added validation check before sending OTP.
    if (tab === "signup") {
      const allValid = Object.values(passwordValidations).every(Boolean);
      if (!allValid) {
        return toast.warn("Please create a strong password before sending an OTP.");
      }
    }

    setIsOtpLoading(true);
    try {
      const response = await api.post(`${API_BASE}/auth/send-otp`, { email: formData.email });
      toast.success(response.data.message || "An OTP has been sent to your email!");
      setOtpSent(true);
      setCountdown(60);
    } catch (err) {
      console.error("OTP Send Error:", err);
      toast.error(err.response?.data?.message || "Failed to send OTP. Please check your server.");
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
        response = await api.post(`${API_BASE}/auth/login`, {
          email: formData.email,
          password: formData.password,
        });
        toast.success("Login successful! Redirecting...");
      } else {
        response = await api.post(`${API_BASE}/auth/signup`, {
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
        }, 1000);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "An error occurred. Please try again.");
    } finally {
      setTimeout(() => setIsFormLoading(false), 500);
    }
  };

  const handleGoogleSignIn = () => {
    toast.info("Redirecting you to Google...");
    window.location.href = `${import.meta.env.VITE_BACKEND_URL}/api/auth/google`
  };

  const formTransition = {
    type: "spring",
    stiffness: 250,
    damping: 25,
  };

  const inputVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.05, type: "spring", stiffness: 120 },
    }),
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4 bg-gradient-to-br from-green-300 via-blue-400 to-lime-500  dark:from-green-700 dark:via-blue-400 dark:to-green-700 transition-colors duration-500">
      {/* Animated Glow Orbs */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full blur-3xl top-[-10%] left-[-10%] bg-green-400/30 dark:bg-green-700/40"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ repeat: Infinity, duration: 12, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full blur-3xl bottom-[-10%] right-[-10%] bg-lime-400/30 dark:bg-lime-700/40"
        animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.4, 0.3] }}
        transition={{ repeat: Infinity, duration: 14, ease: "easeInOut" }}
      />

      {/* Main Card Container */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md p-4 z-10 rounded-2xl shadow-2xl backdrop-blur-xl bg-white/60 dark:bg-gray-800/60 border border-white/50 dark:border-gray-500/70"
      >
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-center text-sm md:text-xl font-bold mb-2 text-gray-800 dark:text-gray-100"
        >
          Manage Your Expenses <br></br> With
          <p className="text-green-500 text-2xl">ExpensePro</p>
        </motion.h1>

        {/* Currency Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.1, 1] }}
          transition={{ duration: 0.8, ease: "backOut" }}
          className="flex justify-center mb-2"
        >
          <motion.svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 200 200"
            className="w-16 h-16"
            animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
          >
            <defs>
              <linearGradient id="moneyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22C55E" />
                <stop offset="100%" stopColor="#4ADE80" />
              </linearGradient>
            </defs>
            <motion.rect x="50" y="80" width="100" height="60" rx="10" fill="url(#moneyGrad)" stroke="#fff" strokeWidth="3" />
            <motion.rect x="45" y="70" width="100" height="60" rx="10" fill="url(#moneyGrad)" stroke="#fff" strokeWidth="2" />
            <text x="50%" y="115" textAnchor="middle" fill="white" fontSize="36" fontWeight="700" fontFamily="sans-serif">₹</text>
          </motion.svg>
        </motion.div>

        {/* Tab Switcher */}
        <div className="flex justify-around mb-5">
          {["login", "signup"].map((type) => (
            <button
              key={type}
              onClick={() => setTab(type)}
              className={`relative text-base font-semibold transition-colors duration-300 cursor-pointer px-3 py-1 ${tab === type
                ? "text-green-700 dark:text-green-400"
                : "text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-300"
                }`}
            >
              {type === "login" ? "Login" : "Sign Up"}
              {tab === type && (
                <motion.div
                  layoutId="underline"
                  className="absolute -bottom-1 left-0 right-0 h-[3px] bg-green-500 dark:bg-green-400 rounded-full"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
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
            initial={{ opacity: 0, x: tab === "login" ? -30 : 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: tab === "login" ? 30 : -30 }}
            transition={formTransition}
            className="space-y-4"
          >
            {tab === "signup" && (
              <motion.input
                custom={0}
                variants={inputVariants}
                initial="hidden"
                animate="visible"
                type="text"
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 text-base rounded-lg outline-none border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-green-400 dark:focus:ring-green-500"
                required
              />
            )}
            <motion.input
              custom={1}
              variants={inputVariants}
              initial="hidden"
              animate="visible"
              type="email"
              name="email"
              autoComplete="none"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 text-base rounded-lg outline-none border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-green-400 dark:focus:ring-green-500"
              required
            />
            <motion.input
              custom={2}
              variants={inputVariants}
              initial="hidden"
              animate="visible"
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="current-password"
              className="w-full px-4 py-2 text-base rounded-lg outline-none border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-green-400 dark:focus:ring-green-500"
              required
            />

            {tab === "signup" && (
              <PasswordValidationUI validations={passwordValidations} />
            )}

            {tab === "signup" && (
              <motion.div custom={3} variants={inputVariants} initial="hidden" animate="visible" className="flex items-center gap-2">
                <input
                  type="text"
                  name="otp"
                  placeholder="Enter OTP"
                  value={formData.otp}
                  onChange={handleChange}
                  className="flex-1 px-4 py-2 text-base rounded-lg outline-none border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-green-400 dark:focus:ring-green-500"
                  required
                />
                <button
                  type="button"
                  onClick={sendOtp}
                  disabled={isOtpLoading || countdown > 0}
                  className="w-28 text-center px-3 py-2 text-sm font-semibold rounded-lg transition-colors bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed dark:bg-green-500 dark:hover:bg-green-600"
                >
                  {isOtpLoading
                    ? "Sending..."
                    : countdown > 0
                      ? `Resend (${countdown}s)`
                      : otpSent
                        ? "Resend"
                        : "Send OTP"}
                </button>
              </motion.div>
            )}
            <motion.button
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={isFormLoading}
              className="w-full py-2 text-base font-semibold rounded-lg shadow-md transition-all cursor-pointer bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed dark:bg-green-500 dark:hover:bg-green-600 dark:disabled:bg-gray-600 dark:text-gray-900"
            >
              {isFormLoading ? "Processing..." : tab === "login" ? "Login" : "Sign Up"}
            </motion.button>

            {tab === "login" && (
              <p className="text-sm text-center text-gray-600 dark:text-gray-400 mt-3">
                <a href="/forgot-password" className="text-blue-600 hover:underline">
                  Forgot Password?
                </a>
              </p>
            )}
          </motion.form>
        </AnimatePresence>

        {/* Google Sign-in */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mt-5"
        >
          <a
            onClick={handleGoogleSignIn}
            className="flex items-center justify-center gap-3 w-full py-2 rounded-lg shadow-sm transition border cursor-pointer border-gray-300 bg-white hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600"
          >
            <img src="https://www.svgrepo.com/show/355037/google.svg" alt="Google" className="w-5 h-5" />
            <span className="font-medium text-gray-700 text-sm dark:text-gray-200">Continue with Google</span>
          </a>
        </motion.div>
      </motion.div>
    </div>
  );
}

// --- Helper Components ---

// CHANGED: This component now combines the strength meter and the individual requirement list.
const PasswordValidationUI = ({ validations }) => {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0, marginTop: 0 }}
      animate={{ opacity: 1, height: 'auto', marginTop: '0.5rem' }}
      exit={{ opacity: 0, height: 0, marginTop: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <PasswordStrengthMeter validations={validations} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 pl-1 mt-2">
        <PasswordRequirement isValid={validations.length} text="At least 8 characters" />
        <PasswordRequirement isValid={validations.uppercase} text="One uppercase letter" />
        <PasswordRequirement isValid={validations.lowercase} text="One lowercase letter" />
        <PasswordRequirement isValid={validations.number} text="One number" />
        <PasswordRequirement isValid={validations.specialChar} text="One special character" />
      </div>
    </motion.div>
  );
};

const PasswordRequirement = ({ isValid, text }) => (
  <p className={`text-xs flex items-center transition-colors duration-300 ${isValid ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
    <motion.span animate={{ scale: isValid ? 1.1 : 0.8, opacity: isValid ? 1 : 0.7 }} className="mr-1.5">{isValid ? '✓' : '•'}</motion.span>
    {text}
  </p>
);

// NEW: Component to calculate and display the password strength bar and text.
const PasswordStrengthMeter = ({ validations }) => {
  const strengthScore = Object.values(validations).filter(Boolean).length;

  let strengthText = "";
  let strengthColor = "";

  switch (strengthScore) {
    case 1:
    case 2:
      strengthText = "Weak";
      strengthColor = "bg-red-500";
      break;
    case 3:
      strengthText = "Medium";
      strengthColor = "bg-orange-500";
      break;
    case 4:
      strengthText = "Strong";
      strengthColor = "bg-yellow-500";
      break;
    case 5:
      strengthText = "Very Strong";
      strengthColor = "bg-green-500";
      break;
    default:
      strengthText = "";
      strengthColor = "bg-gray-300 dark:bg-gray-700";
  }

  return (
    <div className="mt-2">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Password Strength:</span>
        <span className={`text-xs font-bold ${strengthScore === 5 ? 'text-green-500' :
          strengthScore === 4 ? 'text-yellow-500' :
            strengthScore === 3 ? 'text-orange-500' :
              'text-red-500'
          }`}>{strengthText}</span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
        <motion.div
          className={`h-2 rounded-full ${strengthColor}`}
          initial={{ width: 0 }}
          animate={{ width: `${(strengthScore / 5) * 100}%` }}
          transition={{ duration: 0.4, ease: "circOut" }}
        />
      </div>
    </div>
  );
};

