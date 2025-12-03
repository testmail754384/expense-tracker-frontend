import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Appearance from "./Appearance";
import { User, Shield, Database, Edit3, Save, Trash2 } from "lucide-react";
import api from "../config/axiosConfig";

// --- Main Settings Component ---
export default function Settings({ onUpdate, activeTheme, setActiveTheme }) {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    profilePic: "",
  });
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Form states
  const [nameInput, setNameInput] = useState("");
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
  });
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
      return;
    }

    const fetchUserData = async () => {
      setLoading(true);
      try {
        const res = await api.get("/user/me");
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
    if (
      !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(
        file.type
      )
    ) {
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
    if (!oldPassword || !newPassword)
      return toast.warn("Fill both password fields.");
    if (newPassword.length < 6)
      return toast.warn("New password must be at least 6 characters.");
    if (oldPassword === newPassword)
      return toast.warn("New password cannot match old password.");

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
    setIsExporting(true);
    try {
      const res = await api.get("/user/export", { responseType: "blob" });
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
    } finally {
      setIsExporting(false);
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
      toast.error(
        err.response?.data?.message || "Failed to delete transactions."
      );
    } finally {
      setDeleteModalOpen(false);
      setIsDeletingData(false);
    }
  };

  if (loading)
    return (
      <p className="text-center mt-20 text-gray-600 dark:text-gray-400">
        Loading settings...
      </p>
    );

  const avatarName = userData.name || userData.email?.split("@")[0] || "User";
  const profileImageSrc =
    profilePicPreview ||
    userData.profilePic ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      avatarName
    )}&background=random&color=fff&bold=true`;

  return (
    <div className="h-full overflow-y-auto scroll-smooth mt-11 p-3 md:p-4 pb-10 bg-transparent dark:text-gray-200">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white/90 text-center">
          Settings
        </h1>

        {/* Top: Profile + Security (2 columns on large screens) */}
        <div className="grid gap-6 lg:grid-cols-2">
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
                    className="transition-all duration-150 w-20 h-20 md:w-24 md:h-24 rounded-full object-cover border-2 border-green-500 shadow-sm bg-gray-300 dark:bg-gray-600"
                  />
                  <label
                    htmlFor="profilePicInput"
                    className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-xs"
                    title="Change profile picture"
                  >
                    <Edit3 size={18} />
                  </label>
                  <input
                    type="file"
                    id="profilePicInput"
                    accept="image/png, image/jpeg, image/webp, image/gif"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
                <div className="w-full text-center space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="w-full max-w-xs mx-auto p-2 rounded border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-400 dark:bg-gray-700 dark:text-gray-200 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                      Email
                    </label>
                    <p className="text-gray-500 dark:text-gray-400 text-sm break-all">
                      {userData.email || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
              <button
                type="submit"
                disabled={isSavingProfile}
                className="w-full flex items-center justify-center gap-2 mt-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
              >
                <Save size={16} />{" "}
                {isSavingProfile ? "Saving..." : "Save Profile"}
              </button>
            </form>
          </SettingsCard>

          {/* Security Card */}
          <SettingsCard icon={Shield} title="Security">
            <form onSubmit={handlePasswordChange} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordData.oldPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      oldPassword: e.target.value,
                    })
                  }
                  className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-400 dark:bg-gray-700 dark:text-gray-200 text-sm"
                  required
                  autoComplete="current-password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      newPassword: e.target.value,
                    })
                  }
                  className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-400 dark:bg-gray-700 dark:text-gray-200 text-sm"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Must be at least 6 characters long.
                </p>
              </div>
              <button
                type="submit"
                disabled={isSavingPassword}
                className="w-full flex items-center justify-center gap-2 mt-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
              >
                {isSavingPassword ? "Updating..." : "Change Password"}
              </button>
            </form>
          </SettingsCard>
        </div>

        {/* Appearance Card - single column */}
        <SettingsCard icon={User} title="Appearance">
          <Appearance
            activeTheme={activeTheme}
            setActiveTheme={setActiveTheme}
          />
        </SettingsCard>

        {/* Data Management Card */}
        <SettingsCard icon={Database} title="Data Management">
          <div className="space-y-4">
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 dark:bg-gray-500 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
            >
              {isExporting ? "Exporting your data..." : "Export All Data as CSV"}
            </button>
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-r-lg">
              <p className="text-sm font-semibold text-red-800 dark:text-red-300">
                Danger Zone
              </p>
              <p className="text-xs text-red-700 dark:text-red-400 mt-1">
                Deleting your data is permanent and cannot be undone.
              </p>
              <button
                onClick={() => setDeleteModalOpen(true)}
                className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:bg-red-400 disabled:cursor-not-allowed text-sm"
              >
                <Trash2 size={16} /> Delete All Transactions
              </button>
            </div>
          </div>
        </SettingsCard>

        {/* Delete Confirmation Modal */}
        {deleteModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg w-full max-w-sm text-center">
              <h3 className="text-lg font-bold text-red-600 dark:text-red-400">
                Are you absolutely sure?
              </h3>
              <p className="my-3 text-sm text-gray-600 dark:text-gray-300">
                This action is irreversible. All transaction data will be
                permanently deleted.
              </p>
              <div className="flex justify-center gap-4 mt-4">
                <button
                  onClick={() => setDeleteModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400 text-gray-800 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-200 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAllTransactions}
                  disabled={isDeletingData}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white disabled:bg-red-400 disabled:cursor-not-allowed text-sm"
                >
                  {isDeletingData ? "Deleting..." : "Yes, Delete Everything"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Helper Components ---
const SettingsCard = ({ icon: Icon, title, children }) => (
  <div className="bg-white dark:bg-gray-800 p-4 md:p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
    <div className="flex items-center gap-3 mb-3">
      <Icon className="text-green-600 dark:text-green-500" size={18} />
      <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
        {title}
      </h2>
    </div>
    <div className="text-gray-700 dark:text-gray-300 text-sm">{children}</div>
  </div>
);
