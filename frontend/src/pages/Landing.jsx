import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import styles from './Landing.module.css';

gsap.registerPlugin(ScrollTrigger);

export default function Landing() {
  const navigate = useNavigate();
  
  const containerRef = useRef(null);
  const bgTextRef = useRef(null);
  const heroRef = useRef(null);
  const featureRef = useRef(null);

  useEffect(() => {
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
      tl.from(".hero-title-line", { y: 40, opacity: 0, duration: 1, stagger: 0.2, ease: "expo.out" })
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
    };
  }, []);

  return (
    <div 
      className={styles.landingContainer} 
      ref={containerRef}
      style={{ 
        backgroundImage: `url('/assets/two.png')`, 
        backgroundSize: 'cover', 
        backgroundAttachment: 'fixed', 
        backgroundPosition: 'center',
        // Fallback or blend color
        backgroundColor: '#13121B',
        backgroundBlendMode: 'overlay'
      }}
    >
        
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
                        <img src={`/assets/avatar${card}.png`} alt="avatar" />
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
              {/* High-fidelity generated Hero illustration */}
              <div style={{
                width: '100%', 
                height: '400px', 
                borderRadius: '22px', 
                overflow: 'hidden', 
                position: 'relative', 
                boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                border: '1px solid rgba(183,255,42,0.2)'
              }}>
                <img 
                  src="/assets/one.png" 
                  alt="Esports Hacker" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  className="hover:scale-105 transition-transform duration-700"
                />
                {/* Gradient overlay so it fades into the dark theme gracefully */}
                <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(to top, #13121B, transparent 50%)'}} />
              </div>
            </div>
          </div>
        </section>

        {/* Dashboard Showcase */}
        <section className={`${styles.showcaseSection} dash-grid-trigger`}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
             <h2 className="hero-title-line" style={{fontFamily: 'var(--font-heading)', fontSize: '3rem', color: 'var(--text-white)'}}>
               CHOOSE YOUR BATTLE
             </h2>
          </div>
          
          <div className={styles.grid2x2}>
            <div className={`${styles.dashCard} dash-card-anim`} style={{ backgroundImage: `url('/assets/card1.png')` }}>
              <div className={styles.dashCardContent}>
                <h3>BATTLE ROYALE</h3>
                <p>2-8 players. All solve the same problem. First to finish or last remaining player wins.</p>
              </div>
            </div>
            <div className={`${styles.dashCard} dash-card-anim`} style={{ backgroundImage: `url('/assets/card2.png')` }}>
              <div className={styles.dashCardContent}>
                <h3>TEAM DUEL</h3>
                <p>2v2 / 3v3 action. Collaborate in a shared editor to solve algorithm challenges together.</p>
              </div>
            </div>
            <div className={`${styles.dashCard} dash-card-anim`} style={{ backgroundImage: `url('/assets/card3.png')` }}>
              <div className={styles.dashCardContent}>
                <h3>KNOCKOUT TOURNAMENT</h3>
                <p>Bracket-style 1v1 rounds. Winners advance to the finals dynamically.</p>
              </div>
            </div>
            <div className={`${styles.dashCard} dash-card-anim`} style={{ backgroundImage: `url('/assets/card4.png')` }}>
              <div className={styles.dashCardContent}>
                <h3>SPECTATOR MODE</h3>
                <p>Join as a viewer. Watch live matches, track submissions and see the timeline unfold.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer CTA */}
        <section className={styles.ctaSection}>
          <div className={styles.ctaBanner} style={{ backgroundImage: `url('/assets/three.png')`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
            {/* Overlay to ensure text readability */}
            <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(183, 255, 42, 0.85)', backdropFilter: 'blur(2px)', zIndex: 1 }} />
            
            <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <h2 style={{ maxWidth: '600px', lineHeight: 1.1 }}>JOIN US AND START COMPETING TOGETHER</h2>
              <button className={styles.bannerBtn} onClick={() => navigate('/register')}>ENTER ARENA</button>
            </div>
          </div>
        </section>

      </div>
  );
}
