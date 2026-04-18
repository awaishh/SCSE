/**
 * JoinGuildViaLink — handles guild invite deep links.
 * URL: /guild/join/:guildId
 *
 * Logged in  → join guild → redirect to /guild
 * Not logged in → redirect to /login?returnUrl=...
 */
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useGuild } from "../context/GuildContext";

const JoinGuildViaLink = () => {
  const { guildId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { joinGuild } = useGuild();
  const [status, setStatus] = useState("Joining guild...");

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate(`/login?returnUrl=/guild/join/${guildId}`, { replace: true });
      return;
    }

    // Already in a guild
    if (user.guildId) {
      setStatus("You're already in a guild. Leave it first to join another.");
      setTimeout(() => navigate("/guild"), 2500);
      return;
    }

    joinGuild(guildId)
      .then(() => {
        setStatus("Joined! Redirecting...");
        navigate("/guild", { replace: true });
      })
      .catch(() => {
        setStatus("Failed to join. Redirecting...");
        setTimeout(() => navigate("/guild"), 2000);
      });
  }, [authLoading, user]);

  return (
    <div className="min-h-screen bg-[#13121B] font-['Satoshi'] flex items-center justify-center">
      <div className="text-center">
        <span className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin inline-block" />
        <p className="text-sm text-[#A9A8B8] mt-4">{status}</p>
      </div>
    </div>
  );
};

export default JoinGuildViaLink;
