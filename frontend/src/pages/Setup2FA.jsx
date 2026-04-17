import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthLayout from "../components/auth/AuthLayout";
import toast from "react-hot-toast";

const Setup2FA = () => {
  const { setup2FA, verify2FA, user } = useAuth();
  const navigate = useNavigate();
  const [qrData, setQrData] = useState(null);
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.isTwoFactorEnabled) { setLoading(false); return; }
    initSetup();
  }, []);

  const initSetup = async () => {
    try {
      const res = await setup2FA();
      setQrData(res);
    } catch {
      // handled in context
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (code.length !== 6) return toast.error("Enter a 6-digit code");
    setIsVerifying(true);
    try {
      await verify2FA(code);
      navigate("/dashboard");
    } catch {
      // handled in context
    } finally {
      setIsVerifying(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(qrData.secret);
    toast.success("Secret copied!");
  };

  if (user?.isTwoFactorEnabled) {
    return (
      <AuthLayout>
        <div className="text-center">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-green-600 text-3xl">verified_user</span>
          </div>
          <h2 className="text-2xl font-bold tracking-[0.2em] uppercase text-[#1e1b4b]">2FA Enabled</h2>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#64748b] mt-3">
            Your account is secured with two-factor authentication
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="mt-10 w-full bg-[#6D28D9] hover:bg-[#6D28D9]/90 text-white py-4 text-[11px] uppercase tracking-[0.2em] font-bold transition-all rounded-sm"
          >
            Back to Dashboard
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold tracking-[0.3em] uppercase text-[#1e1b4b] inline-flex items-center">
          SETUP 2FA
          <span className="w-1.5 h-1.5 bg-[#6D28D9] rounded-full ml-1" />
        </h2>
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#64748b] mt-3 font-medium">
          Scan with Google Authenticator or Authy
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <span className="w-8 h-8 border-2 border-[#6D28D9] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : qrData ? (
        <div className="space-y-8">
          {/* QR Code */}
          <div className="border border-[#1e1b4b]/10 rounded-sm p-6 flex justify-center">
            <img src={qrData.qrCode} alt="2FA QR Code" className="w-44 h-44" />
          </div>

          {/* Manual key */}
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#64748b] mb-2 font-semibold">
              Manual Entry Key
            </p>
            <div className="flex gap-2 items-center border-b border-[#1e1b4b]/10 pb-3">
              <code className="flex-1 text-xs text-[#1e1b4b] break-all font-mono">{qrData.secret}</code>
              <button
                onClick={copySecret}
                className="text-[10px] uppercase tracking-[0.15em] text-[#6D28D9] font-bold hover:opacity-70 shrink-0"
              >
                Copy
              </button>
            </div>
          </div>

          {/* Verify */}
          <div className="border-t border-[#1e1b4b]/5 pt-6">
            <p className="text-[11px] text-[#64748b] mb-4">
              After scanning, enter the 6-digit code to activate:
            </p>
            <form onSubmit={handleVerify} className="space-y-6">
              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] text-[#64748b] mb-2 font-semibold">
                  Verification Code
                </label>
                <input
                  type="text"
                  placeholder="000000"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  className="input-underline text-center text-2xl tracking-[0.5em]"
                />
              </div>
              <button
                type="submit"
                disabled={isVerifying}
                className="w-full bg-[#6D28D9] hover:bg-[#6D28D9]/90 disabled:opacity-60 text-white py-4 text-[11px] uppercase tracking-[0.2em] font-bold transition-all rounded-sm flex items-center justify-center gap-2"
              >
                {isVerifying ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : "Verify & Enable"}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <p className="text-center text-sm text-red-500">Failed to load. Please try again.</p>
      )}
    </AuthLayout>
  );
};

export default Setup2FA;
