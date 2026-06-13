import { useState, useEffect, useCallback } from "react";
import { useLang } from "../i18n/LanguageContext";

/**
 * SidebarAudioControls — Audio & Meditation toggles integrated into the sidebar.
 * Reads/writes to localStorage and controls the bgMusic audio element directly.
 */
const SidebarAudioControls = () => {
  const { t } = useLang();
  const [isMuted, setIsMuted] = useState(() => localStorage.getItem("tarotMuted") === "true");
  const [meditationMode, setMeditationMode] = useState(false);

  // Sync with TarotPage's audio via custom events
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.type === "muted") setIsMuted(detail.value);
      if (detail?.type === "meditation") setMeditationMode(detail.value);
    };
    window.addEventListener("tarot-audio-sync", handler);
    return () => window.removeEventListener("tarot-audio-sync", handler);
  }, []);

  const handleToggleMute = useCallback(() => {
    const next = !isMuted;
    setIsMuted(next);
    localStorage.setItem("tarotMuted", String(next));
    // Dispatch event so TarotPage picks it up
    window.dispatchEvent(new CustomEvent("sidebar-audio-toggle", { detail: { type: "muted", value: next } }));
  }, [isMuted]);

  const handleToggleMeditation = useCallback(() => {
    const next = !meditationMode;
    setMeditationMode(next);
    window.dispatchEvent(new CustomEvent("sidebar-audio-toggle", { detail: { type: "meditation", value: next } }));
  }, [meditationMode]);

  return (
    <div className="sidebar-audio-row">
      <button
        type="button"
        className={`sidebar-audio-btn ${meditationMode ? 'active' : ''}`}
        onClick={handleToggleMeditation}
        title={meditationMode ? t.sidebar.meditation.titleOn : t.sidebar.meditation.titleOff}
      >
        <span className="sidebar-audio-icon">{meditationMode ? "🧘" : "🕯️"}</span>
        <span className="sidebar-audio-label">{meditationMode ? t.sidebar.meditation.on : t.sidebar.meditation.off}</span>
      </button>

      <button
        type="button"
        className={`sidebar-audio-btn ${isMuted ? 'muted' : ''}`}
        onClick={handleToggleMute}
        title={isMuted ? t.sidebar.audio.titleOff : t.sidebar.audio.titleOn}
      >
        <span className="sidebar-audio-icon">{isMuted ? "🔇" : "🔊"}</span>
        <span className="sidebar-audio-label">{isMuted ? t.sidebar.audio.off : t.sidebar.audio.on}</span>
      </button>
    </div>
  );
};

export default SidebarAudioControls;
