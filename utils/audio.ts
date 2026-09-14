import type { AudioPlayer } from "expo-audio";

const disposedPlayers = new WeakSet<AudioPlayer>();

// A narration can finish before its screen effect cleans up.
export function disposeAudioPlayer(player: AudioPlayer | null) {
  if (!player || disposedPlayers.has(player)) return;
  disposedPlayers.add(player);
  player.remove();
}
