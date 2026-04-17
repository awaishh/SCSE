import { createContext, useContext, useState, useCallback } from "react";
import roomAPI from "../services/roomAPI";
import toast from "react-hot-toast";

const GuildContext = createContext(null);

export const GuildProvider = ({ children }) => {
  const [guild, setGuild] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);

  const createGuild = useCallback(async (name, description = "") => {
    setLoading(true);
    try {
      const { data } = await roomAPI.post("/guilds/create", { name, description });
      setGuild(data.data);
      toast.success("Guild created!");
      return data.data;
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create guild");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const joinGuild = useCallback(async (guildId) => {
    setLoading(true);
    try {
      const { data } = await roomAPI.post("/guilds/join", { guildId });
      setGuild(data.data);
      toast.success("Joined guild!");
      return data.data;
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to join guild");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const leaveGuild = useCallback(async () => {
    setLoading(true);
    try {
      await roomAPI.post("/guilds/leave");
      setGuild(null);
      toast.success("Left guild");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to leave guild");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchGuild = useCallback(async (guildId) => {
    setLoading(true);
    try {
      const { data } = await roomAPI.get(`/guilds/${guildId}`);
      setGuild(data.data);
      return data.data;
    } catch (err) {
      toast.error("Failed to load guild");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const { data } = await roomAPI.get("/guilds/leaderboard");
      setLeaderboard(data.data);
      return data.data;
    } catch {
      toast.error("Failed to load leaderboard");
    }
  }, []);

  return (
    <GuildContext.Provider value={{
      guild, leaderboard, loading,
      createGuild, joinGuild, leaveGuild, fetchGuild, fetchLeaderboard, setGuild,
    }}>
      {children}
    </GuildContext.Provider>
  );
};

export const useGuild = () => useContext(GuildContext);
