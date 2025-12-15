import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";

export default function GoogleSuccess() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = params.get("token");

    if (token) {
      localStorage.setItem("authToken", token);
      toast.success("Google login successful!");
      navigate("/dashboard");
    } else {
      toast.error("Google login failed. Please try again.");
      navigate("/login");
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center text-gray-600">
      Signing you in…
    </div>
  );
}
