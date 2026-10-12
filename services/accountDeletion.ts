import AsyncStorage from "@react-native-async-storage/async-storage";
import { deleteUser, EmailAuthProvider, reauthenticateWithCredential, signOut } from "firebase/auth";
import { deleteDoc, doc } from "firebase/firestore";
import { auth, db } from "./firebase";

const keyFor = (uid: string) => `odontoplay:account-deletion:${uid}`;
let deleting = false;
let deletedUid: string | null = null;

export class AccountDeletionError extends Error {
  constructor(public code: string, message: string) { super(message); }
}

export function isAccountDeletionInProgress() {
  return deleting;
}

export async function deleteCurrentAccount(password?: string) {
  if (deleting) return false;
  deleting = true;
  try {
    const user = auth.currentUser;
    if (!user && !deletedUid) {
      throw new AccountDeletionError("no-session", "Não foi possível excluir sua conta. Verifique sua sessão e tente novamente.");
    }
    const uid = deletedUid ?? user!.uid;
    if (!deletedUid) {
      if (password !== undefined) {
        if (!user!.email) throw new AccountDeletionError("provider", "Não foi possível confirmar suas credenciais.");
        await reauthenticateWithCredential(user!, EmailAuthProvider.credential(user!.email, password));
      } else {
        const token = await user!.getIdTokenResult();
        if (Date.now() - Date.parse(token.authTime) > 4 * 60 * 1000) {
          throw new AccountDeletionError("auth/requires-recent-login", "Confirme sua senha para continuar.");
        }
      }
      await deleteDoc(doc(db, "usuarios", uid));
      await deleteUser(user!);
      deletedUid = uid;
    }
    await signOut(auth);

    await AsyncStorage.removeItem(keyFor(uid));
    deletedUid = null;
    return true;
  } finally {
    deleting = false;
  }
}

export function accountDeletionMessage(error: unknown) {
  const code = (error as { code?: string })?.code;
  if (["auth/invalid-credential", "auth/wrong-password", "auth/invalid-login-credentials"].includes(code ?? "")) {
    return "Senha incorreta. Confira sua senha e tente novamente.";
  }
  if (code === "auth/too-many-requests") return "Muitas tentativas. Aguarde um pouco e tente novamente.";
  if (code === "permission-denied") return "Não foi possível remover seus dados. Tente novamente.";
  if (error instanceof AccountDeletionError) return error.message;
  return "Não foi possível concluir a exclusão. Tente novamente.";
}
