import { useState, useEffect } from "react";
import QRCode from "qrcode";
import { useGuild } from "../context/GuildContext";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const BASE_URL = window.location.origin;

// QR invite card component
const InviteCard = ({ guildId }) => {
  const [qr, setQr] = useState(null);
  const [copied, setCopied] = useState(false);
  const inviteUrl = `${BASE_URL}/guild/join/${guildId}`;

  useEffect(() => {
    QRCode.toDataURL(inviteUrl, {
      width: 160,
      margin: 2,
      color: { dark: "#111827", light: "#ffffff" },
    }).then(setQr);
  }, [inviteUrl]);

  const copy = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Invite link copied!");
  };

  return (
    <div className="rounded-3xl p-[1px] bg-gradient-to-br from-[#3f3a56] to-[#262337]">
      <div className="rounded-[calc(1.5rem-1px)] bg-[#171624]/95 p-5 flex flex-col items-center gap-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#B7FF2A]">Invite Link</p>
      <p className="text-xs text-[#A9A8B8] text-center">Share this QR or link. Anyone who scans can join your guild instantly.</p>
      {qr ? (
        <img src={qr} alt="Guild invite QR" className="rounded-lg border border-[#302E46]" style={{ width: 140, height: 140 }} />
      ) : (
        <div className="w-36 h-36 bg-[#1C1A2A] rounded-lg animate-pulse" />
      )}
      <div className="w-full bg-[#181827] border border-[#302E46] rounded-xl px-3 py-2 flex items-center gap-2">
        <p className="text-xs text-[#A9A8B8] truncate flex-1 font-mono">{inviteUrl}</p>
        <button
          onClick={copy}
          className="text-xs font-bold text-[#B7FF2A] hover:text-white shrink-0"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      </div>
    </div>
  );
};

const Guild = () => {
  const { user } = useAuth();
  const { guild, leaderboard, loading, createGuild, joinGuild, leaveGuild, fetchGuild, fetchLeaderboard, setGuild } = useGuild();

  const [tab, setTab] = useState("my");
  const [createName, setCreateName] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [showInvite, setShowInvite] = useState(false);

  useEffect(() => {
    if (user?.guildId && !guild) fetchGuild(user.guildId);
    fetchLeaderboard();
  }, [user]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!createName.trim()) return toast.error("Guild name is required");
    await createGuild(createName.trim(), createDesc.trim());
    setTab("my");
  };

  const handleJoin = async (guildId) => {
    await joinGuild(guildId);
    setTab("my");
  };

  const handleLeave = async () => {
    if (!confirm("Leave your guild?")) return;
    await leaveGuild();
    setGuild(null);
  };

  const isOwner = guild && (guild.ownerId?._id === user?._id || guild.ownerId === user?._id);
  const guildId = guild?._id;

  return (
    <div className="min-h-[100dvh] bg-[#13121B] text-white font-['Rajdhani'] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_18%_20%,rgba(183,255,42,0.1),transparent_34%),radial-gradient(circle_at_85%_72%,rgba(0,225,255,0.08),transparent_30%)]" />
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="mb-8 border-b border-[#2f2b45] pb-6">
          <p className="text-[10px] font-semibold text-[#8f8ca3] uppercase tracking-[0.24em] mb-3">team operations</p>
          <h1 className="text-3xl sm:text-4xl font-[Oxanium] font-black tracking-tight uppercase">Guild HQ</h1>
          <p className="text-[#A9A8B8] text-sm mt-3">Compete together, rise together</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 w-fit flex-wrap">
          {[
            { id: "my", label: "My Guild" },
            { id: "create", label: "Create" },
            { id: "browse", label: "Leaderboard" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-[0.16em] transition-all ${
                tab === t.id ? "bg-[#B7FF2A] text-[#13121B]" : "bg-[#1b1a29] text-[#A9A8B8] hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── MY GUILD ── */}
        {tab === "my" && (
          <div>
            {guild ? (
              <div className="space-y-6">
                {/* Guild header */}
                <div className="rounded-3xl p-[1px] bg-gradient-to-br from-[#3f3a56] to-[#262337]">
                  <div className="rounded-[calc(1.5rem-1px)] bg-[#171624]/95 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-[Oxanium] font-black tracking-tight">{guild.name}</h2>
                      {guild.description && <p className="text-[#A9A8B8] text-sm mt-1">{guild.description}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-black text-[#B7FF2A] leading-none">{guild.guildRating?.toFixed(0)}</p>
                      <p className="text-[10px] text-[#A9A8B8] uppercase tracking-[0.2em] mt-1">Rating</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-[#A9A8B8]">
                    <span>{guild.members?.length} / {guild.maxMembers} members</span>
                    {isOwner && <span className="bg-amber-500/15 text-amber-300 font-bold px-2 py-0.5 rounded-full uppercase tracking-[0.12em]">Owner</span>}
                  </div>
                  </div>
                </div>

                {/* Invite section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-[#A9A8B8] uppercase tracking-wide">Invite Members</p>
                    <button
                      onClick={() => setShowInvite(!showInvite)}
                      className="text-xs font-semibold text-[#B7FF2A] hover:text-white uppercase tracking-[0.16em]"
                    >
                      {showInvite ? "Hide" : "Show QR & Link"}
                    </button>
                  </div>
                  {showInvite && guildId && <InviteCard guildId={guildId} />}
                  {!showInvite && (
                    <div
                      onClick={() => setShowInvite(true)}
                      className="rounded-2xl p-5 flex items-center gap-4 cursor-pointer bg-[#171624]/95 hover:bg-[#1f1d2d] transition-colors"
                    >
                      <div className="w-10 h-10 bg-[#242235] rounded-lg flex items-center justify-center text-[#B7FF2A] text-lg font-bold">+</div>
                      <div>
                        <p className="text-sm font-semibold text-white">Invite people to your guild</p>
                        <p className="text-xs text-[#A9A8B8] mt-0.5">Share a QR code or invite link — they join instantly</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Members */}
                <div>
                  <p className="text-xs font-semibold text-[#A9A8B8] uppercase tracking-wide mb-3">
                    Members ({guild.members?.length})
                  </p>
                  <div className="rounded-3xl overflow-hidden bg-[#171624]/95 divide-y divide-[#2f2b45]">
                    {guild.members?.map((m) => {
                      const mid = m.userId?._id || m.userId;
                      const mname = m.userId?.name || "Member";
                      const mrating = m.userId?.rating ?? 1000;
                      const isMe = mid === user?._id;
                      const isGuildOwner = guild.ownerId?._id === mid || guild.ownerId === mid;
                      return (
                        <div key={mid} className={`flex items-center gap-3 px-4 py-3 ${isMe ? "bg-[rgba(183,255,42,0.08)]" : "bg-transparent"}`}>
                          <div className="w-8 h-8 rounded-full bg-[#2a273d] flex items-center justify-center text-xs font-bold text-[#d0cee0]">
                            {mname[0]?.toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold">
                              {mname} {isMe && <span className="text-[#B7FF2A] text-xs uppercase tracking-[0.12em]">(you)</span>}
                            </p>
                            <p className="text-xs text-[#A9A8B8]">Rating: {mrating}</p>
                          </div>
                          {isGuildOwner && (
                            <span className="text-[10px] bg-amber-500/15 text-amber-300 font-bold px-1.5 py-0.5 rounded uppercase tracking-[0.12em]">OWNER</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Leave */}
                <button
                  onClick={handleLeave}
                  disabled={loading}
                  className="w-full bg-red-500/10 text-red-300 hover:bg-red-500/20 py-3 rounded-full text-sm font-semibold uppercase tracking-[0.12em] transition-all"
                >
                  Leave Guild
                </button>
              </div>
            ) : (
              <div className="text-center py-16 rounded-3xl bg-[#171624]/95">
                <p className="text-[#A9A8B8] text-sm">You're not in a guild yet</p>
                <div className="flex gap-3 justify-center mt-4">
                  <button onClick={() => setTab("create")} className="px-4 py-2 bg-[#B7FF2A] text-[#13121B] text-xs font-semibold uppercase tracking-[0.14em] rounded-full">
                    Create Guild
                  </button>
                  <button onClick={() => setTab("browse")} className="px-4 py-2 bg-[#232137] text-xs font-semibold uppercase tracking-[0.14em] rounded-full hover:bg-[#2b2841]">
                    Browse Guilds
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── CREATE GUILD ── */}
        {tab === "create" && (
          <div className="max-w-md">
            {user?.guildId ? (
              <div className="text-center py-12 rounded-3xl bg-[#171624]/95">
                <p className="text-[#A9A8B8] text-sm">Leave your current guild before creating a new one</p>
              </div>
            ) : (
              <form onSubmit={handleCreate} className="space-y-5 rounded-3xl bg-[#171624]/95 p-6">
                <div>
                  <label className="block text-xs font-semibold text-[#A9A8B8] uppercase tracking-wide mb-1.5">
                    Guild Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Code Warriors"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    maxLength={30}
                    className="w-full px-4 py-3 rounded-xl border border-[#302E46] focus:border-[#B7FF2A] bg-[#11101a] text-sm outline-none transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#A9A8B8] uppercase tracking-wide mb-1.5">
                    Description
                  </label>
                  <textarea
                    placeholder="What's your guild about?"
                    value={createDesc}
                    onChange={(e) => setCreateDesc(e.target.value)}
                    maxLength={200}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-[#302E46] focus:border-[#B7FF2A] bg-[#11101a] text-sm outline-none transition-all resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#B7FF2A] hover:bg-[#a1e520] disabled:opacity-60 text-[#13121B] py-3.5 rounded-full text-xs font-semibold uppercase tracking-[0.14em] transition-all flex items-center justify-center gap-2"
                >
                  {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Create Guild"}
                </button>
              </form>
            )}
          </div>
        )}

        {/* ── LEADERBOARD ── */}
        {tab === "browse" && (
          <div className="space-y-3">
            {leaderboard.length === 0 ? (
              <p className="text-[#A9A8B8] text-sm text-center py-12">No guilds yet</p>
            ) : (
              leaderboard.map((g, i) => (
                <div key={g._id} className="flex items-center gap-4 px-5 py-4 rounded-2xl bg-[#171624]/95 hover:bg-[#1f1d2d] transition-all">
                  <span className={`text-sm font-black w-6 text-center ${i === 0 ? "text-amber-500" : i === 1 ? "text-[#A9A8B8]" : i === 2 ? "text-amber-700" : "text-gray-300"}`}>
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-bold">{g.name}</p>
                    <p className="text-xs text-[#A9A8B8]">{g.memberCount} members</p>
                  </div>
                  <div className="text-right mr-4">
                    <p className="text-sm font-black text-[#B7FF2A]">{g.guildRating?.toFixed(0)}</p>
                    <p className="text-[10px] text-[#A9A8B8] uppercase tracking-wide">Rating</p>
                  </div>
                  {!user?.guildId && (
                    <button
                      onClick={() => handleJoin(g._id)}
                      disabled={loading}
                      className="px-3 py-1.5 bg-[#B7FF2A] hover:bg-[#A6F11F] text-[#13121B] text-[10px] font-semibold uppercase tracking-[0.14em] rounded-full transition-all"
                    >
                      Join
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Guild;
