import { useAuth } from "../context/AuthContext";
import Button from "../components/UI/Button";

const Dashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Simple Navbar */}
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold dark:text-white">SecureApp</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 dark:text-gray-400 hidden sm:block">
            Welcome, <span className="font-semibold">{user?.name || "User"}</span>
          </span>
          <Button variant="danger" className="w-auto py-1.5 px-3 text-sm" onClick={logout}>
            Logout
          </Button>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-4xl mx-auto p-8">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-8">
          <h2 className="text-2xl font-bold mb-6 dark:text-white flex items-center gap-2">
            Profile Dashboard
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <label className="text-xs uppercase font-bold text-gray-500 tracking-wider">Full Name</label>
                <p className="text-lg font-medium dark:text-gray-200">{user?.name || "N/A"}</p>
              </div>
              <div>
                <label className="text-xs uppercase font-bold text-gray-500 tracking-wider">Email Address</label>
                <p className="text-lg font-medium dark:text-gray-200">{user?.email || "N/A"}</p>
              </div>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-100 dark:border-blue-800/50">
              <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-2">Security Status</h3>
              <p className="text-sm text-blue-800 dark:text-blue-400">
                Your account is protected with JWT and short-lived access tokens. Refresh tokens are stored securely in HTTP-only cookies.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
