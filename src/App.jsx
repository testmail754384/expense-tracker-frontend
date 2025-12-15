import { ToastContainer } from "react-toastify";
import { useState, useEffect } from "react";
import "react-toastify/dist/ReactToastify.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Auth from "./pages/Auth";
import './index.css'
import Dashboard from "./pages/Dashboard";
import ForgotPassword from "./pages/ForgotPassword ";
import ResetPassword from "./pages/ResetPassword";
import { UserProvider } from "./context/UserContext";




function App() {

const [activeTheme, setActiveTheme] = useState(
    localStorage.getItem("theme") || "light"
  );

  useEffect(() => {
    const root = document.documentElement;
    if (activeTheme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("theme", activeTheme);
  }, [activeTheme]);

   const toggleTheme = () => {
    setActiveTheme(activeTheme === "dark" ? "light" : "dark");
  };



  return (
    <>
    <UserProvider>
        <ToastContainer
        position="top-center"
        autoClose={2800}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        toastClassName="expense-toast"
        bodyClassName="expense-toast-body"
        progressClassName="expense-toast-progress"
      />
      <BrowserRouter>
      <Routes>
        
        <Route path="*" element={<Auth />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/dashboard" element={<Dashboard/>} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />  
      </Routes>
    </BrowserRouter>
    </UserProvider>
    </>
    
  );
}

export default App;
