import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from "expo-audio";

type ThemeMusicContextValue = {
  isPlaying: boolean;
  startMusic: () => Promise<void>;
  stopMusic: () => Promise<void>;
  setMusicVolume: (volume: number) => Promise<void>;
  toggleMusic: () => Promise<void>;
};

const ThemeMusicContext = createContext<ThemeMusicContextValue | null>(null);
export const THEME_MUSIC_VOLUME = 0.20;
export const THEME_MUSIC_DUCKED_VOLUME = 0.05;

export function ThemeMusicProvider({ children }: { children: ReactNode }) {
  const soundRef = useRef<AudioPlayer | null>(null);
  const volumeRef = useRef(THEME_MUSIC_VOLUME);
  const [isPlaying, setIsPlaying] = useState(false);

  const loadMusic = useCallback(async () => {
    if (soundRef.current) {
      return soundRef.current;
    }

    const sound = createAudioPlayer(require("../assets/audio/Odontoplay.mp3"));
    sound.loop = true;
    sound.volume = volumeRef.current;

    soundRef.current = sound;
    return sound;
  }, []);

  const startMusic = useCallback(async () => {
    const sound = await loadMusic();

    if (!sound.playing) {
      sound.play();
      setIsPlaying(true);
    }
  }, [loadMusic]);

  const stopMusic = useCallback(async () => {
    const sound = soundRef.current;

    if (!sound) {
      setIsPlaying(false);
      return;
    }

    if (sound.playing) {
      sound.pause();
    }

    setIsPlaying(false);
  }, []);

  const setMusicVolume = useCallback(async (volume: number) => {
    const nextVolume = Math.max(0, Math.min(1, volume));
    volumeRef.current = nextVolume;

    const sound = soundRef.current;

    if (!sound) {
      return;
    }

    sound.volume = nextVolume;
  }, []);

  const toggleMusic = useCallback(async () => {
    const sound = await loadMusic();

    if (sound.playing) {
      sound.pause();
      setIsPlaying(false);
      return;
    }

    sound.play();
    setIsPlaying(true);
  }, [loadMusic]);

  useEffect(() => {
    void setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      interruptionMode: "duckOthers",
    }).catch((error) => console.warn("Audio configuration failed", error));

    return () => {
      soundRef.current?.remove();
      soundRef.current = null;
    };
  }, []);

  return (
    <ThemeMusicContext.Provider
      value={{
        isPlaying,
        startMusic,
        stopMusic,
        setMusicVolume,
        toggleMusic,
      }}
    >
      {children}
    </ThemeMusicContext.Provider>
  );
}

export function useThemeMusic() {
  const context = useContext(ThemeMusicContext);

  if (!context) {
    throw new Error("useThemeMusic must be used inside ThemeMusicProvider");
  }

  return context;
}
