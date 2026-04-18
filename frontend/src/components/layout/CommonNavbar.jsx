import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Code2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import styles from "./CommonNavbar.module.css";

const protectedLinks = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/lobby", label: "Arena" },
  { to: "/guild", label: "Guild" },
  { to: "/leaderboard", label: "Leaderboard" },
  { to: "/match-history", label: "History" },
];

const CommonNavbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = Boolean(user);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const isLanding = location.pathname === "/";

  return (
    <header className={styles.navbarWrap}>
      <nav className={styles.topNav}>
        <Link to={isAuthenticated ? "/dashboard" : "/"} className={styles.logo}>
          <Code2 className={styles.logoIcon} />
          <span>KRYPTCODE</span>
        </Link>

        <div className={styles.navLinks}>
          {(isAuthenticated
            ? protectedLinks
            : [
                { to: "/", label: "Home" },
                { to: "/login", label: "Login" },
                { to: "/register", label: "Register" },
              ]
          ).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ""}`}
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className={styles.actions}>
          {isAuthenticated ? (
            <button onClick={handleLogout} className={styles.actionBtn}>
              Logout
            </button>
          ) : (
            <button
              onClick={() => navigate(isLanding ? "/register" : "/login")}
              className={styles.actionBtn}
            >
              {isLanding ? "Register" : "Sign In"}
            </button>
          )}
        </div>
      </nav>
    </header>
  );
};

export default CommonNavbar;
