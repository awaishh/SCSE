import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
    <div className="border-2 border-violet-100 rounded-xl p-5 flex flex-col items-center gap-3 bg-violet-50/30">
      <p className="text-xs font-bold uppercase tracking-widest text-violet-600">Invite Link</p>
      <p className="text-xs text-gray-400 text-center">Share this QR or link — anyone who scans/clicks joins your guild</p>
      {qr ? (
        <img src={qr} alt="Guild invite QR" className="rounded-lg border border-gray-100" style={{ width: 140, height: 140 }} />
      ) : (
        <div className="w-36 h-36 bg-gray-100 rounded-lg animate-pulse" />
      )}
      <div className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 flex items-center gap-2">
        <p className="text-xs text-gray-400 truncate flex-1 font-mono">{inviteUrl}</p>
        <button
          onClick={copy}
          className="text-xs font-bold text-violet-600 hover:text-violet-700 shrink-0"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
};

const Guild = () => {
  const { user } = useAuth();
  const { guild, leaderboard, loading, createGuild, joinGuild, leaveGuild, fetchGuild, fetchLeaderboard, setGuild } = useGuild();
  const navigate = useNavigate();

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
    <div className="min-h-screen bg-white text-[#111827]">
      {/* Nav */}
      <nav className="border-b border-gray-100 px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="font-bold">Battle</span>
          <span className="font-bold text-violet-600">Arena</span>
          <span className="mx-2 text-gray-200">|</span>
          <span className="text-sm text-gray-500">Guilds</span>
        </div>
        <button onClick={() => navigate("/dashboard")} className="text-xs text-gray-400 hover:text-[#111827] transition-colors">
          ← Dashboard
        </button>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Guilds</h1>
          <p className="text-gray-400 text-sm mt-1">Compete together, rise together</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg mb-8 w-fit">
          {[
            { id: "my", label: "My Guild" },
            { id: "create", label: "Create" },
            { id: "browse", label: "Leaderboard" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-5 py-2 rounded-md text-sm font-semibold transition-all ${
                tab === t.id ? "bg-white text-[#111827] shadow-sm" : "text-gray-500 hover:text-[#111827]"
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
                <div className="border border-gray-100 rounded-xl p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-bold">{guild.name}</h2>
                      {guild.description && <p className="text-gray-400 text-sm mt-1">{guild.description}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-violet-600">{guild.guildRating?.toFixed(0)}</p>
                      <p className="text-xs text-gray-400 uppercase tracking-wide">Rating</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span>{guild.members?.length} / {guild.maxMembers} members</span>
                    {isOwner && <span className="bg-amber-50 text-amber-600 font-bold px-2 py-0.5 rounded-full">Owner</span>}
                  </div>
                </div>

                {/* Invite section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Invite Members</p>
                    <button
                      onClick={() => setShowInvite(!showInvite)}
                      className="text-xs font-semibold text-violet-600 hover:text-violet-700"
                    >
                      {showInvite ? "Hide" : "Show QR & Link"}
                    </button>
                  </div>
                  {showInvite && guildId && <InviteCard guildId={guildId} />}
                  {!showInvite && (
                    <div
                      onClick={() => setShowInvite(true)}
                      className="border-2 border-dashed border-violet-200 rounded-xl p-5 flex items-center gap-4 cursor-pointer hover:border-violet-400 transition-colors"
                    >
                      <div className="w-10 h-10 bg-violet-50 rounded-lg flex items-center justify-center text-violet-600 text-lg font-bold">+</div>
                      <div>
                        <p className="text-sm font-semibold text-[#111827]">Invite people to your guild</p>
                        <p className="text-xs text-gray-400 mt-0.5">Share a QR code or invite link — they join instantly</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Members */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                    Members ({guild.members?.length})
                  </p>
                  <div className="space-y-2">
                    {guild.members?.map((m) => {
                      const mid = m.userId?._id || m.userId;
                      const mname = m.userId?.name || "Member";
                      const mrating = m.userId?.rating ?? 1000;
                      const isMe = mid === user?._id;
                      const isGuildOwner = guild.ownerId?._id === mid || guild.ownerId === mid;
                      return (
                        <div key={mid} className={`flex items-center gap-3 px-4 py-3 rounded-lg ${isMe ? "bg-violet-50 border border-violet-100" : "bg-gray-50"}`}>
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold">
                            {mname[0]?.toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold">
                              {mname} {isMe && <span className="text-violet-500 text-xs">(you)</span>}
                            </p>
                            <p className="text-xs text-gray-400">Rating: {mrating}</p>
                          </div>
                          {isGuildOwner && (
                            <span className="text-[10px] bg-amber-100 text-amber-600 font-bold px-1.5 py-0.5 rounded">OWNER</span>
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
                  className="w-full border-2 border-red-200 text-red-500 hover:bg-red-50 py-3 rounded-lg text-sm font-semibold transition-all"
                >
                  Leave Guild
                </button>
              </div>
            ) : (
              <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
                <p className="text-gray-400 text-sm">You're not in a guild yet</p>
                <div className="flex gap-3 justify-center mt-4">
                  <button onClick={() => setTab("create")} className="px-4 py-2 bg-[#111827] text-white text-sm font-semibold rounded-lg">
                    Create Guild
                  </button>
                  <button onClick={() => setTab("browse")} className="px-4 py-2 border border-gray-200 text-sm font-semibold rounded-lg hover:border-gray-300">
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
              <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                <p className="text-gray-400 text-sm">Leave your current guild before creating a new one</p>
              </div>
            ) : (
              <form onSubmit={handleCreate} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Guild Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Code Warriors"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    maxLength={30}
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-violet-600 text-sm outline-none transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Description
                  </label>
                  <textarea
                    placeholder="What's your guild about?"
                    value={createDesc}
                    onChange={(e) => setCreateDesc(e.target.value)}
                    maxLength={200}
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-violet-600 text-sm outline-none transition-all resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#111827] hover:bg-gray-800 disabled:opacity-60 text-white py-3.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2"
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
              <p className="text-gray-400 text-sm text-center py-12">No guilds yet</p>
            ) : (
              leaderboard.map((g, i) => (
                <div key={g._id} className="flex items-center gap-4 px-5 py-4 border border-gray-100 rounded-xl hover:border-gray-200 transition-all">
                  <span className={`text-sm font-black w-6 text-center ${i === 0 ? "text-amber-500" : i === 1 ? "text-gray-400" : i === 2 ? "text-amber-700" : "text-gray-300"}`}>
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-bold">{g.name}</p>
                    <p className="text-xs text-gray-400">{g.memberCount} members</p>
                  </div>
                  <div className="text-right mr-4">
                    <p className="text-sm font-black text-violet-600">{g.guildRating?.toFixed(0)}</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Rating</p>
                  </div>
                  {!user?.guildId && (
                    <button
                      onClick={() => handleJoin(g._id)}
                      disabled={loading}
                      className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-lg transition-all"
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
