import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import Lenis from "lenis";
import CommonNavbar from "./CommonNavbar";

const AppShell = () => {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.05,
      smoothWheel: true,
      smoothTouch: true,
    });

    let rafId = 0;
    const raf = (time) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };

    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return (
    <div>
      <CommonNavbar />
      <Outlet />
    </div>
  );
};

export default AppShell;
