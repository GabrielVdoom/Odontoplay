import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Audio } from "expo-av";

type ThemeMusicContextValue = {
  isPlaying: boolean;
  startMusic: () => Promise<void>;
  stopMusic: () => Promise<void>;
  toggleMusic: () => Promise<void>;
};

const ThemeMusicContext = createContext<ThemeMusicContextValue | null>(null);

export function ThemeMusicProvider({ children }: { children: ReactNode }) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const loadMusic = useCallback(async () => {
    if (soundRef.current) {
      return soundRef.current;
    }

    const { sound } = await Audio.Sound.createAsync(
      require("../assets/audio/Odontoplay.mp3"),
      {
        isLooping: true,
        shouldPlay: false,
        volume: 0.45,
      }
    );

    soundRef.current = sound;
    return sound;
  }, []);

  const startMusic = useCallback(async () => {
    const sound = await loadMusic();
    const status = await sound.getStatusAsync();

    if (status.isLoaded && !status.isPlaying) {
      await sound.playAsync();
      setIsPlaying(true);
    }
  }, [loadMusic]);

  const stopMusic = useCallback(async () => {
    const sound = soundRef.current;

    if (!sound) {
      setIsPlaying(false);
      return;
    }

    const status = await sound.getStatusAsync();

    if (status.isLoaded && status.isPlaying) {
      await sound.pauseAsync();
    }

    setIsPlaying(false);
  }, []);

  const toggleMusic = useCallback(async () => {
    const sound = await loadMusic();
    const status = await sound.getStatusAsync();

    if (!status.isLoaded) {
      return;
    }

    if (status.isPlaying) {
      await sound.pauseAsync();
      setIsPlaying(false);
      return;
    }

    await sound.playAsync();
    setIsPlaying(true);
  }, [loadMusic]);

  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });

    return () => {
      soundRef.current?.unloadAsync();
      soundRef.current = null;
    };
  }, []);

  return (
    <ThemeMusicContext.Provider
      value={{
        isPlaying,
        startMusic,
        stopMusic,
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
