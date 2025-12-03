import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { Lock, KeyRound, ShieldCheck } from "lucide-react";
import api from "../config/axiosConfig"; // Axios instance

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // NEW: State to hold the validation status for the new password.
  const [passwordValidations, setPasswordValidations] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    specialChar: false,
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mail = params.get("email");
    if (mail) setEmail(mail);
    setOtp("");
  }, []);

  const [cooldown, setCooldown] = useState(false);
  const [isResending, setIsResending] = useState(false);

  // NEW: Handler for new password input to perform real-time validation.
  const handlePasswordChange = (e) => {
    const { value } = e.target;
    setNewPassword(value);

    const validations = {
      length: value.length >= 8,
      uppercase: /[A-Z]/.test(value),
      lowercase: /[a-z]/.test(value),
      number: /[0-9]/.test(value),
      specialChar: /[\W_]/.test(value),
    };
    setPasswordValidations(validations);
  };

  const handleResend = async () => {
    if (cooldown || isResending) return;
    if (!email) {
      toast.error("Email is missing. Please go back and enter your email again.");
      return;
    }

    try {
      setIsResending(true);
      const res = await api.post(`/auth/resend-otp`, { email });
      toast.success(res.data.message);

      // start cooldown AFTER successful send
      setCooldown(true);
      setTimeout(() => setCooldown(false), 30000); // 30 seconds
    } catch (err) {
      toast.error(err.response?.data?.message || "Error resending OTP.");
    } finally {
      setIsResending(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (!otp || !newPassword) return toast.error("Please fill all fields.");

    // NEW: Guard clause to ensure the new password is strong.
    const allValid = Object.values(passwordValidations).every(Boolean);
    if (!allValid) {
      return toast.error("Please ensure your new password meets all criteria.");
    }

    try {
      setLoading(true);
      const res = await api.post(`/auth/reset-pass`, {
        email,
        otp,
        newPassword,
      });

      console.log(res);
      toast.success(res.data.message);
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch (err) {
      toast.error(err.response?.data?.message || "Error resetting password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900"
    >
      <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md p-8 rounded-2xl shadow-xl w-full max-w-sm border border-gray-300 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-center mb-4 text-gray-800 dark:text-gray-200">Reset Password</h2>
        <form onSubmit={handleReset} className="flex flex-col gap-4">
          <div className="flex items-center gap-2 border rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-700">
            <KeyRound className="text-gray-500 dark:text-gray-400" size={18} />
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter OTP"
              className="bg-transparent w-full outline-none text-gray-800 dark:text-gray-100"
            />
          </div>

          <div className="flex items-center gap-2 border rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-700">
            <Lock className="text-gray-500 dark:text-gray-400" size={18} />
            <input
              type="password"
              value={newPassword}
              onChange={handlePasswordChange}
              placeholder="Enter new password"
              className="bg-transparent w-full outline-none text-gray-800 dark:text-gray-100"
            />
          </div>

          {/* NEW: Password validation UI rendered here */}
          <PasswordValidationUI validations={passwordValidations} />

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
          >
            <ShieldCheck size={18} />
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        <button
          type="button"
          disabled={loading || cooldown || isResending}
          onClick={handleResend}
          className="text-sm text-blue-600 hover:underline mt-3 disabled:opacity-50"
        >
          {isResending ? "Sending OTP..." : "Resend OTP"}
        </button>

      </div>
    </motion.div>
  );
}

// --- Helper Components for Password Validation ---
const PasswordValidationUI = ({ validations }) => {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
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
