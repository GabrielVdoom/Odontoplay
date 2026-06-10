import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

export type CharacterOption = "menina" | "menino";
export type SkinToneOption = "claro" | "medio" | "escuro";
export type GameProgressId = "jogo1" | "jogo2";

export type GameProgressPayload = {
  titulo: string;
  concluido: boolean;
  estrelas: number;
  tentativas?: number;
  melhorPontuacao?: number;
  ultimaPontuacao?: number;
  instrumentosVistos?: string[];
};

export type UserPreferences = {
  personagemJogo2: CharacterOption;
  tomPele: SkinToneOption;
};

export const defaultPreferences: UserPreferences = {
  personagemJogo2: "menina",
  tomPele: "medio",
};

export async function getCurrentUserProfile() {
  const user = auth.currentUser;

  if (!user) {
    return null;
  }

  const snapshot = await getDoc(doc(db, "usuarios", user.uid));

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: user.uid,
    ...snapshot.data(),
  } as Record<string, unknown> & { id: string };
}

export async function saveUserPreferences(preferences: UserPreferences) {
  const user = auth.currentUser;

  if (!user) {
    return;
  }

  await setDoc(
    doc(db, "usuarios", user.uid),
    {
      preferencias: preferences,
      ultimoAcesso: new Date().toISOString(),
    },
    { merge: true }
  );
}

export async function saveGameProgress(
  gameId: GameProgressId,
  progress: GameProgressPayload
) {
  const user = auth.currentUser;

  if (!user) {
    return;
  }

  const snapshot = await getDoc(doc(db, "usuarios", user.uid));
  const currentData = snapshot.exists() ? snapshot.data() : {};
  const currentProgress = (currentData.progresso ?? {}) as Record<
    string,
    GameProgressPayload
  >;
  const previousGameProgress = currentProgress[gameId] ?? {};
  const previousAttempts = Number(previousGameProgress.tentativas ?? 0);
  const previousBest = Number(previousGameProgress.melhorPontuacao ?? 0);
  const nextBest = Math.max(previousBest, progress.estrelas);
  const now = new Date().toISOString();

  await setDoc(
    doc(db, "usuarios", user.uid),
    {
      progresso: {
        ...currentProgress,
        [gameId]: {
          ...previousGameProgress,
          ...progress,
          melhorPontuacao: progress.melhorPontuacao ?? nextBest,
          ultimaPontuacao: progress.ultimaPontuacao ?? progress.estrelas,
          tentativas: progress.tentativas ?? previousAttempts + 1,
          atualizadoEm: now,
        },
      },
      ultimoAcesso: now,
    },
    { merge: true }
  );
}
