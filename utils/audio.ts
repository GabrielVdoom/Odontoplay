import type { AudioPlayer } from "expo-audio";

const disposedPlayers = new WeakSet<AudioPlayer>();

// A narration can finish before its screen effect cleans up.
export function disposeAudioPlayer(player: AudioPlayer | null) {
  if (!player || disposedPlayers.has(player)) return;
  disposedPlayers.add(player);
  // Stop immediately: remove() can only unregister the native player, leaving
  // playback alive until the underlying object is released.
  try {
    player.pause();
  } finally {
    player.remove();
  }
}
