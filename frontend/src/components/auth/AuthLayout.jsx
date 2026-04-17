const AuthLayout = ({ children }) => {
  return (
    <div className="flex h-screen w-full overflow-hidden font-sans">

      {/* ══════════════════════════════
          LEFT — Deep Charcoal Panel
      ══════════════════════════════ */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-[#111827] px-16 py-14">

        {/* Logo */}
        <div>
          <div className="flex items-center gap-2">
            <span className="text-white font-bold text-lg tracking-tight">Battle</span>
            <span className="text-violet-400 font-bold text-lg tracking-tight">Arena</span>
          </div>
        </div>

        {/* Hero */}
        <div>
          <p className="text-violet-400 text-xs font-semibold uppercase tracking-[0.25em] mb-6">
            Multiplayer Coding Platform
          </p>

          <h1 className="text-white font-bold leading-tight mb-6"
            style={{ fontSize: "52px", fontFamily: "'Newsreader', serif" }}>
            Where coders<br />
            become<br />
            <span className="text-violet-400 italic">champions.</span>
          </h1>

          <p className="text-gray-400 text-base leading-relaxed" style={{ maxWidth: "340px" }}>
            Compete in real-time coding battles. Battle Royale, Blitz, ICPC, Knockout — your rank is earned, not given.
          </p>


        </div>

        {/* Footer */}
        <div>
          <p className="text-gray-600 text-xs">© 2025 Battle Arena</p>
        </div>
      </div>

      {/* ══════════════════════════════
          RIGHT — White Form Panel
      ══════════════════════════════ */}
      <div className="flex-1 flex items-center justify-center bg-white overflow-y-auto px-8 py-12">
        <div className="w-full max-w-[400px]">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
