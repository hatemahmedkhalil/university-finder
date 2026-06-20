import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import api from "../api/axios";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    if (!token) { setStatus("invalid"); return; }
    api.get(`/auth/verify-email?token=${token}`)
      .then(() => setStatus("success"))
      .catch(() => setStatus("invalid"));
  }, [token]);

  if (status === "loading") return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-500">Verifying your email...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-md text-center">
        {status === "success" ? (
          <>
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Email verified!</h2>
            <p className="text-gray-500 mb-6">Your account is now active. You can sign in.</p>
            <Link to="/login" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition">
              Go to Login
            </Link>
          </>
        ) : (
          <>
            <div className="text-5xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid link</h2>
            <p className="text-gray-500 mb-6">This verification link is invalid or has already been used.</p>
            <Link to="/" className="text-blue-600 hover:underline">Go Home</Link>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
