import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Button from "../components/UI/Button";
import Input from "../components/UI/Input";
import toast from "react-hot-toast";

const Setup2FA = () => {
  const { setup2FA, verify2FA, user } = useAuth();
  const navigate = useNavigate();
  const [qrData, setQrData] = useState(null);
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.isTwoFactorEnabled) return;
    initSetup();
  }, []);

  const initSetup = async () => {
    setLoading(true);
    try {
      const res = await setup2FA();
      setQrData(res);
    } catch (error) {
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
    } catch (error) {
      // handled in context
    } finally {
      setIsVerifying(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(qrData.secret);
    toast.success("Secret copied to clipboard");
  };

  if (user?.isTwoFactorEnabled) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#13121B] px-4">
        <div className="w-full max-w-md bg-[#181827] rounded-2xl border border-[rgba(183,255,42,0.2)] p-8 text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-white">2FA Already Enabled</h2>
          <p className="text-[#A9A8B8] mt-2 text-sm">Your account is secured with two-factor authentication.</p>
          <Button className="mt-6" onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#13121B] px-4 py-12">
      <div className="w-full max-w-md bg-[#181827] rounded-2xl shadow-2xl border border-[#302E46] p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white">Setup Two-Factor Auth</h1>
          <p className="text-[#A9A8B8] text-sm mt-2">
            Scan the QR code with Google Authenticator or Authy
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-[#B7FF2A] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : qrData ? (
          <div className="space-y-6">
            {/* QR Code */}
            <div className="bg-white rounded-xl p-4 flex justify-center">
              <img src={qrData.qrCode} alt="2FA QR Code" className="w-48 h-48" />
            </div>

            {/* Manual secret */}
            <div>
              <p className="text-xs text-[#A9A8B8] uppercase tracking-wider mb-2">Manual Entry Key</p>
              <div className="flex gap-2 items-center bg-[#1C1A2A] rounded-lg p-3 border border-[#302E46]">
                <code className="flex-1 text-sm text-gray-300 break-all">{qrData.secret}</code>
                <button
                  onClick={copySecret}
                  className="text-[#B7FF2A] text-xs font-bold hover:text-[#A6F11F] shrink-0"
                >
                  Copy
                </button>
              </div>
            </div>

            {/* Verify form */}
            <div className="border-t border-[#302E46] pt-6">
              <p className="text-sm text-[#A9A8B8] mb-4">
                After scanning, enter the 6-digit code to confirm setup:
              </p>
              <form onSubmit={handleVerify}>
                <Input
                  label="Verification Code"
                  placeholder="000000"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                />
                <Button type="submit" loading={isVerifying}>
                  Verify & Enable 2FA
                </Button>
              </form>
            </div>
          </div>
        ) : (
          <p className="text-center text-red-400">Failed to load 2FA setup. Please try again.</p>
        )}
      </div>
    </div>
  );
};

export default Setup2FA;
