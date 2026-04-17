import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Button from "../components/UI/Button";
import Input from "../components/UI/Input";
import { ShieldCheck, Copy, Check } from "lucide-react";
import toast from "react-hot-toast";

const Setup2FA = () => {
  const { setup2FA, verify2FA, user } = useAuth();
  const [data, setData] = useState(null);
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user?.isTwoFactorEnabled) {
      load2FA();
    }
  }, [user]);

  const load2FA = async () => {
    try {
      const res = await setup2FA();
      setData(res);
    } catch (error) {
      // Handled in context
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (code.length !== 6) return toast.error("Enter 6-digit code");
    
    setIsVerifying(true);
    try {
      await verify2FA(code);
    } catch (error) {
      // Handled in context
    } finally {
      setIsVerifying(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(data.secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Secret copied!");
  };

  if (user?.isTwoFactorEnabled) {
    return (
      <div className="max-w-md mx-auto mt-12 p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-xl text-center border border-green-100 dark:border-green-900/30">
        <ShieldCheck className="mx-auto text-green-500 mb-4" size={64} />
        <h2 className="text-2xl font-bold dark:text-white">2FA is Enabled</h2>
        <p className="text-gray-500 mt-2">Your account is secured with two-factor authentication.</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-12 p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800">
      <h2 className="text-2xl font-bold mb-6 dark:text-white flex items-center gap-2">
        <ShieldCheck className="text-blue-600" />
        Setup 2FA
      </h2>
      
      {data ? (
        <div className="space-y-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Scan this QR code in your authenticator app (Google Authenticator, Authy, etc.)
          </p>
          
          <div className="bg-white p-4 rounded-xl flex justify-center border border-gray-100">
            <img src={data.qrCode} alt="2FA QR Code" className="w-48 h-48" />
          </div>
          
          <div className="relative">
            <label className="text-xs font-bold text-gray-500 uppercase">Manual Secret Key</label>
            <div className="flex gap-2 mt-1">
              <code className="flex-1 bg-gray-50 dark:bg-gray-800 p-2 rounded text-sm break-all dark:text-gray-300 border border-gray-100 dark:border-gray-700">
                {data.secret}
              </code>
              <button onClick={copyToClipboard} className="p-2 text-gray-500 hover:text-blue-600">
                {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
              </button>
            </div>
          </div>
          
          <form onSubmit={handleVerify} className="pt-4 border-t border-gray-100 dark:border-gray-800">
            <Input
              label="Verification Code"
              placeholder="000000"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            />
            <Button type="submit" loading={isVerifying}>
              Verify & Enable
            </Button>
          </form>
        </div>
      ) : (
        <div className="py-12 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
};

export default Setup2FA;
