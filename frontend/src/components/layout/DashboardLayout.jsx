import React, { useEffect, useRef } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from "../../context/AuthContext";
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Users, Code2, Trophy, Crown, LogOut, Bell, Terminal } from 'lucide-react';
import styles from './DashboardLayout.module.css';

gsap.registerPlugin(ScrollTrigger);

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const scrollRef = useRef(null);
  let lenisRef = useRef(null);

  useEffect(() => {
    // Initialize Lenis on the scrolling container, NOT the absolute body
    // since the layout divides sidebar and main content.
    const lenis = new Lenis({
      wrapper: scrollRef.current,
      content: scrollRef.current.firstElementChild,
      duration: 1.2,
      smoothTouch: true,
    });
    lenisRef.current = lenis;

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    // Provide scroll positions to ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);

    return () => {
      gsap.ticker.remove(lenis.raf);
      lenis.destroy();
    };
  }, []);

  // When route changes, scroll to top
  useEffect(() => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: true });
    }
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const pageTitle = location.pathname.split('/').pop() || 'PLAYERS';

  return (
    <div className={styles.layoutContainer}>
      
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <Code2 className={styles.logoIcon} size={28} />
          <span>KRYPTCODE</span>
        </div>
        
        <div className={styles.menuLabel}>MENU</div>
        
        <nav className={styles.navMenu}>
          <NavLink 
            to="/dashboard/players" 
            className={({isActive}) => `${styles.navItem} ${isActive ? styles.active : ''}`}
          >
            <Users size={20} />
            PLAYERS
          </NavLink>
          
          <NavLink 
            to="/dashboard/teams" 
            className={({isActive}) => `${styles.navItem} ${isActive ? styles.active : ''}`}
          >
            <Terminal size={20} />
            TEAMS
          </NavLink>
          
          <NavLink 
            to="/dashboard/tournaments" 
            className={({isActive}) => `${styles.navItem} ${isActive ? styles.active : ''}`}
          >
            <Trophy size={20} />
            TOURNAMENTS
          </NavLink>
          
          <NavLink 
            to="/dashboard/leaderboard" 
            className={({isActive}) => `${styles.navItem} ${isActive ? styles.active : ''}`}
          >
            <Crown size={20} />
            LEADERBOARD
          </NavLink>
        </nav>

        <button className={styles.logoutBtn} onClick={handleLogout}>
          <LogOut size={20} />
          LOG OUT
        </button>
      </aside>

      {/* Scrollable Main Content */}
      <main className={styles.mainContent} ref={scrollRef}>
        <div>
          {/* Top Header */}
          <header className={styles.topHeader}>
            <h1 className={styles.pageTitle}>{pageTitle.replace('-', ' ')}</h1>
            <div className={styles.userWidget}>
              <Bell size={18} className="text-[#A9A8B8]" />
              <div className={styles.statusDot}></div>
              <span className={styles.username}>{user?.name || 'DEV_USER'}</span>
              <div className={styles.avatarSmall}>
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'dev'}`} alt="user avatar" />
              </div>
            </div>
          </header>

          {/* Sub-Pages render here */}
          <div className={styles.pageContainer}>
            <Outlet />
          </div>
        </div>
      </main>

    </div>
  );
}
