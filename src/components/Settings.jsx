import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import Appearance from "./Appearance";
import {
  User,
  Shield,
  Database,
  Edit3,
  Save,
  Trash2,
} from "lucide-react";
import api from "../config/axiosConfig"; // Axios instance
import axios from 'axios'

// --- Main Settings Component ---
export default function Settings({ onUpdate }) {

  const navigate = useNavigate();
  const [userData, setUserData] = useState({ name: "", email: "", profilePic: "" });
  const [loading, setLoading] = useState(true);

  // Form states
  const [nameInput, setNameInput] = useState("");
  const [passwordData, setPasswordData] = useState({ oldPassword: "", newPassword: "" });
  const [newProfilePicBase64, setNewProfilePicBase64] = useState(null);
  const [profilePicPreview, setProfilePicPreview] = useState(null);

  // UI & loading states
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isDeletingData, setIsDeletingData] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);


  // --- Initial Data Fetch ---
  useEffect(() => {

    if (!localStorage.getItem("authToken")) {
      navigate("/login");
    }

    const fetchUserData = async () => {
      setLoading(true);
      try {
        const res = await api.get("/user/me"); // interceptor sends token
        setUserData(res.data || { name: "", email: "", profilePic: "" });
        setNameInput(res.data.name || "");
      } catch (err) {
        console.error(err);
        toast.error("Session expired or failed to load user data.");
        localStorage.removeItem("authToken");
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [navigate]);



  // --- Handlers ---
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    const input = e.target;
    if (!file) return;

    if (file.size > 1048576) {
      input.value = null;
      return toast.error("Image is too large! (Max 1MB)");
    }
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      input.value = null;
      return toast.error("Invalid file type. Upload JPG, PNG, WEBP, or GIF.");
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      setNewProfilePicBase64(reader.result);
      setProfilePicPreview(reader.result);
      input.value = null;
    };
    reader.onerror = () => {
      input.value = null;
      toast.error("Failed to read image file.");
    };
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (!nameInput.trim()) return toast.warn("Name cannot be empty.");
    setIsSavingProfile(true);

    try {
      const payload = { name: nameInput.trim() };
      if (newProfilePicBase64) payload.profilePic = newProfilePicBase64;

      const res = await api.put("/user/update-profile", payload);
      setUserData(res.data.user);
      setNameInput(res.data.user.name);
      setNewProfilePicBase64(null);
      setProfilePicPreview(null);
      if (typeof onUpdate === "function") onUpdate();
      toast.success("Profile updated!");
    } catch (err) {
      console.error("Profile Update Error:", err);
      toast.error(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    const { oldPassword, newPassword } = passwordData;
    if (!oldPassword || !newPassword) return toast.warn("Fill both password fields.");
    if (newPassword.length < 6) return toast.warn("New password must be at least 6 characters.");
    if (oldPassword === newPassword) return toast.warn("New password cannot match old password.");

    setIsSavingPassword(true);
    try {
      await api.put("/user/change-password", { oldPassword, newPassword });
      toast.success("Password changed successfully!");
      setPasswordData({ oldPassword: "", newPassword: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password.");
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleExport = async () => {
    try {
      const res = await api.get("/user/export", { responseType: "blob" });
      setLoading(true);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "transactions.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("CSV exported successfully!");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to export CSV.");
    }finally{
      setLoading(false)
    }
  };

  const handleDeleteAllTransactions = async () => {
    setIsDeletingData(true);

    try {
      const res = await api.delete("/user/delete-all-transactions");
      toast.success(res.data.message || "All transactions deleted!");
      if (typeof onUpdate === "function") onUpdate();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to delete transactions.");
    } finally {
      setDeleteModalOpen(false);
      setIsDeletingData(false);
    }
  };

  if (loading) return <p className="text-center  mt-20 text-gray-600 dark:text-gray-400">Loading settings...</p>;

  const avatarName = userData.name || userData.email?.split("@")[0] || "User";
  const profileImageSrc =
    profilePicPreview ||
    userData.profilePic ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(avatarName)}&background=random&color=fff&bold=true`;

  return (
    <div className="h-full overflow-y-auto scroll-smooth mt-11 p-2 md:p-4 space-y-6 pb-10 bg-transparent dark:text-gray-200 ">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-700 text-center">Settings</h1>

      {/* Profile Card */}
      <SettingsCard icon={User} title="Profile Information">
        <form onSubmit={handleProfileUpdate} className="space-y-4">
          <div className="flex flex-col items-center gap-4">
            <div className="relative group">
              <img
                src={profileImageSrc}
                alt="Profile"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    avatarName
                  )}&background=random&color=fff&bold=true`;
                }}
                className="transition-all duration-300 w-24 h-24 rounded-full object-cover border-2 border-green-500 shadow-md bg-gray-300 dark:bg-gray-600"
              />
              <label
                htmlFor="profilePicInput"
                className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                title="Change profile picture"
              >
                <Edit3 size={24} />
              </label>
              <input
                type="file"
                id="profilePicInput"
                accept="image/png, image/jpeg, image/webp, image/gif"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            <div className="w-full text-center">
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Full Name</label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="w-full max-w-sm mx-auto p-2 rounded border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-400 dark:bg-gray-700 dark:text-gray-200"
                required
              />
            </div>
            <div className="w-full text-center">
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Email</label>
              <p className="text-gray-500 dark:text-gray-400 text-sm">{userData.email || "N/A"}</p>
            </div>
          </div>
          <button
            type="submit"
            disabled={isSavingProfile}
            className="w-full flex items-center justify-center gap-2 mt-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <Save size={18} /> {isSavingProfile ? "Saving..." : "Save Profile"}
          </button>
        </form>
      </SettingsCard>

      {/* Security Card */}
      <SettingsCard icon={Shield} title="Security">
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Current Password</label>
            <input
              type="password"
              value={passwordData.oldPassword}
              onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
              className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-400 dark:bg-gray-700 dark:text-gray-200"
              required
              autoComplete="current-password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">New Password</label>
            <input
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-400 dark:bg-gray-700 dark:text-gray-200"
              required
              minLength={6}
              autoComplete="new-password"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Must be at least 6 characters long.</p>
          </div>
          <button
            type="submit"
            disabled={isSavingPassword}
            className="w-full flex items-center justify-center gap-2 mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSavingPassword ? "Updating..." : "Change Password"}
          </button>
        </form>
      </SettingsCard>

      {/* Appearance Card */}
      <Appearance />



      {/* Data Management Card */}
      <SettingsCard icon={Database} title="Data Management">
        <div className="space-y-4">
          <button
            onClick={handleExport}
            disabled={setLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 dark:bg-gray-500 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? "Exporting your data..." : "Export All Data as CSV"}
          </button>
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-r-lg">
            <p className="text-sm font-semibold text-red-800 dark:text-red-300">Danger Zone</p>
            <p className="text-xs text-red-700 dark:text-red-400 mt-1">
              Deleting your data is permanent and cannot be undone.
            </p>
            <button
              onClick={() => setDeleteModalOpen(true)}
              className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:bg-red-400 disabled:cursor-not-allowed"
            >
              <Trash2 size={16} /> Delete All Transactions
            </button>
          </div>
        </div>
      </SettingsCard>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg w-full max-w-sm text-center"
            >
              <h3 className="text-lg font-bold text-red-600 dark:text-red-400">Are you absolutely sure?</h3>
              <p className="my-3 text-sm text-gray-600 dark:text-gray-300">
                This action is irreversible. All transaction data will be permanently deleted.
              </p>
              <div className="flex justify-center gap-4 mt-4">
                <button
                  onClick={() => setDeleteModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400 text-gray-800 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAllTransactions}
                  disabled={isDeletingData}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white disabled:bg-red-400 disabled:cursor-not-allowed"
                >
                  {isDeletingData ? "Deleting..." : "Yes, Delete Everything"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Helper Components ---
const SettingsCard = ({ icon: Icon, title, children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700"
  >
    <div className="flex items-center gap-3 mb-4">
      <Icon className="text-green-600 dark:text-green-500" size={20} />
      <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">{title}</h2>
    </div>
    <div className="text-gray-700 dark:text-gray-300">{children}</div>
  </motion.div>
);

const ThemeButton = ({ icon: Icon, label, theme, activeTheme, setTheme }) => (
  <button
    onClick={() => setTheme(theme)}
    aria-label={`Switch to ${label} theme`}
    className={`relative flex items-center justify-center gap-2 py-2 px-3 text-sm rounded-md transition-colors w-full ${activeTheme === theme
      ? "text-green-800 dark:text-green-300"
      : "text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-600/50"
      }`}
  >
    {activeTheme === theme && (
      <motion.div
        layoutId="theme-active-pill"
        className="absolute inset-0 bg-white dark:bg-gray-600 rounded-md shadow"
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      />
    )}
    <span className="relative z-10">
      <Icon size={16} />
    </span>
    <span className="relative z-10">{label}</span>
  </button>
);
