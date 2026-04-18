import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Search, ChevronLeft, ChevronRight, Activity, Terminal, Shield, Code2 } from 'lucide-react';
import styles from './Landing.module.css';

gsap.registerPlugin(ScrollTrigger);

const roleData = [
  { id: 'frontend', label: 'FRONTEND', icon: <Code2 size={48} />, bg: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=300&auto=format&fit=crop' },
  { id: 'backend', label: 'BACKEND', icon: <Terminal size={48} />, bg: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=300&auto=format&fit=crop' },
  { id: 'fullstack', label: 'FULLSTACK', icon: <Activity size={48} />, bg: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?q=80&w=300&auto=format&fit=crop' },
  { id: 'devops', label: 'DEVOPS', icon: <Shield size={48} />, bg: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?q=80&w=300&auto=format&fit=crop' },
];

export default function Landing() {
  const navigate = useNavigate();
  const [activeRole, setActiveRole] = useState('frontend');
  
  const containerRef = useRef(null);
  const bgTextRef = useRef(null);
  const heroRef = useRef(null);
  const featureRef = useRef(null);

  useEffect(() => {
    // Initialize Lenis
    const lenis = new Lenis({
      smoothTouch: true,
      duration: 1.2
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Sync GSAP with Lenis
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    const ctx = gsap.context(() => {
      // Background Text Parallax
      gsap.to(bgTextRef.current, {
        xPercent: -30,
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
        }
      });

      // Hero Intro Animation
      const tl = gsap.timeline();
      tl.from(".nav-anim", { y: -20, opacity: 0, duration: 0.8, stagger: 0.1, ease: "power3.out" })
        .from(".hero-title-line", { y: 40, opacity: 0, duration: 1, stagger: 0.2, ease: "expo.out" }, "-=0.4")
        .from(".hero-cards", { x: 100, opacity: 0, rotationY: 45, duration: 1.2, ease: "power3.out" }, "-=0.8");

      // Feature Section Scroll
      gsap.from(".feature-text", {
        x: -50,
        opacity: 0,
        scrollTrigger: {
          trigger: featureRef.current,
          start: "top 60%",
          end: "top 30%",
          scrub: 1,
        }
      });

      // Dashboard Cards Stagger
      gsap.from(".dash-card-anim", {
        y: 100,
        opacity: 0,
        scale: 0.9,
        stagger: 0.2,
        scrollTrigger: {
          trigger: ".dash-grid-trigger",
          start: "top 70%",
          end: "top 20%",
          scrub: 1,
        }
      });

    }, containerRef);
    return () => {
      ctx.revert();
      gsap.ticker.remove(lenis.raf);
      lenis.destroy();
    };
  }, []);

  return (
    <div className={styles.landingContainer} ref={containerRef}>
        
        {/* Background Typography */}
        <div className={styles.giantBackgroundLetters} ref={bgTextRef}>
          <span>KRYPTCODE</span>
          <span>BATTLE</span>
          <span>SYNC</span>
          <span>COMPILE</span>
          <span>WIN</span>
        </div>

        {/* Hero Section */}
        <section className={styles.heroSection} ref={heroRef}>
          <div className={styles.framedPanel}>
            
            {/* Nav */}
            <nav className={styles.topNav}>
              <div className={`${styles.logo} nav-anim`}>
                <Code2 className={styles.logoIcon} />
                <span>KRYPTCODE</span>
              </div>
              <div className={`${styles.navLinks} nav-anim`}>
                <span className={styles.navLink}>TOURNAMENTS</span>
                <span className={styles.navLink}>LEADERBOARD</span>
                <span className={styles.navLink}>ARENA</span>
              </div>
              <button 
                className={`${styles.registerBtn} nav-anim`}
                onClick={() => navigate('/register')}
              >
                REGISTER
              </button>
            </nav>

            {/* Content */}
            <div className={styles.heroContent}>
              <div className={styles.headline}>
                <h1 className="hero-title-line">
                  FIND YOUR <br/>
                  <span className={styles.outlinedLine}>PERFECT</span> 
                  CODING SQUAD
                </h1>
                <p className={`${styles.heroSubtitle} hero-title-line`}>
                  Over 100k developers are joining skill-matched multiplayer coding battles. Real-time editor sync, hidden test cases, pure skill.
                </p>
              </div>

              {/* Stat Cards Stack */}
              <div className={`hero-cards ${styles.cardsCluster}`}>
                {[1, 2, 3].map((card, idx) => (
                  <div key={idx} className={styles.playerCard}>
                    <div className={styles.cardHeader}>
                      <div className={styles.avatar}>
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${card+10}`} alt="avatar" />
                      </div>
                      <div className={styles.playerInfo}>
                        <h4>DevMaster_{card}</h4>
                        <p>ELO: {2100 - (card*150)} • Python</p>
                      </div>
                    </div>
                    <div className={styles.statsGrid}>
                      <div className={styles.statItem}>
                        <span className={styles.statLabel}>WIN RATE</span>
                        <span className={styles.statValue}>{(68 - card * 4)}%</span>
                      </div>
                      <div className={styles.statItem}>
                        <span className={styles.statLabel}>RANK</span>
                        <span className={styles.statValue}>Diamond</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Controls */}
            <div className={styles.heroBottom}>
              <div className={styles.roleSelector}>
                <h3>YOUR CLASS</h3>
                <div className={styles.rolesGrid}>
                  {roleData.map((role) => (
                    <div 
                      key={role.id}
                      className={`${styles.roleCard} ${activeRole === role.id ? styles.active : ''} hero-title-line`}
                      onClick={() => setActiveRole(role.id)}
                    >
                      <img src={role.bg} alt={role.label} />
                      <span>{role.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`${styles.rankWidget} hero-title-line`}>
                <h3>YOUR RANK</h3>
                <div className={styles.rankBox}>
                  <ChevronLeft className={styles.chevron} />
                  <div className={styles.rankDisplay}>
                    {/* Placeholder for custom diamond rank icon */}
                    <div style={{width: 60, height: 60, background: 'linear-gradient(135deg, #A6F11F, #4A4763)', clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)'}}></div>
                    <span className={styles.rankName}>DIAMOND 1</span>
                  </div>
                  <ChevronRight className={styles.chevron} />
                </div>
              </div>

              <button className={`${styles.searchBtn} hero-title-line`}>
                <Search size={24} />
              </button>
            </div>

          </div>
        </section>

        {/* Feature Story */}
        <section className={styles.featureSection} ref={featureRef}>
          <div className={styles.featureGrid}>
            <div className={`${styles.featureText} feature-text`}>
              <h2>COMPETE IN REAL-TIME</h2>
              <p>
                Experience coding interviews turned into an e-sport. 
                Write logic collaboratively or go solo in Battle Royale mode. 
                Our sandboxed execution engine runs your code securely while the live scoreboard updates instantly.
              </p>
            </div>
            <div>
              {/* Decorative elements for the right side */}
              <div style={{width: '100%', height: '400px', border: '1px solid var(--border-dark)', borderRadius: '22px', background: 'var(--surface-panel)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-lime)'}}>
                [LIVE EDITOR SYNC VISUALIZATION]
              </div>
            </div>
          </div>
        </section>

        {/* Dashboard Showcase */}
        <section className={`${styles.showcaseSection} dash-grid-trigger`}>
          <div className={styles.featureGrid}>
             <div className={styles.featureText}>
              <h2 style={{color: 'var(--text-white)', WebkitTextStroke: '0'}}>CHOOSE YOUR BATTLE</h2>
            </div>
          </div>
          
          <div className={styles.grid2x2}>
            <div className={`${styles.dashCard} dash-card-anim`}>
              <h3>BATTLE ROYALE</h3>
              <p>2-8 players. All solve the same problem. First to finish or last remaining player wins.</p>
            </div>
            <div className={`${styles.dashCard} dash-card-anim`}>
              <h3>TEAM DUEL</h3>
              <p>2v2 / 3v3 action. Collaborate in a shared editor to solve algorithm challenges together.</p>
            </div>
            <div className={`${styles.dashCard} dash-card-anim`}>
              <h3>KNOCKOUT TOURNAMENT</h3>
              <p>Bracket-style 1v1 rounds. Winners advance to the finals dynamically.</p>
            </div>
            <div className={`${styles.dashCard} dash-card-anim`}>
              <h3>SPECTATOR MODE</h3>
              <p>Join as a viewer. Watch live matches, track submissions and see the timeline unfold.</p>
            </div>
          </div>
        </section>

        {/* Footer CTA */}
        <section className={styles.ctaSection}>
          <div className={styles.ctaBanner}>
            <h2>JOIN US AND START COMPETING TOGETHER</h2>
            <button className={styles.bannerBtn} onClick={() => navigate('/register')}>ENTER ARENA</button>
          </div>
        </section>

      </div>
  );
}
