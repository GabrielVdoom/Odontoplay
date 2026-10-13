import Cookies from "js-cookie";
import {
    collection,
    doc,
    getDoc,
    getDocs,
    orderBy,
    query,
} from "firebase/firestore";
import {
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signOut,
} from "firebase/auth";
import { DashboardData, RegisteredUser, UserStatus } from "@/data/users";
import { UserFormValues } from "@/helpers/user-form";
import { auth, db } from "@/lib/firebase";
import { isAdminEmail } from "@/services/admin-access";

type UserFilter = {
    name?: string;
    email?: string;
    status?: string;
};

type UserListResponse = {
    success: boolean;
    users: RegisteredUser[];
};

type UserByIdResponse = {
    success: boolean;
    user: RegisteredUser | null;
};

type UserMutationResponse = {
    success: boolean;
    error?: string;
};

const USERS_COLLECTION = "usuarios";
function isToday(dateValue: string) {
    return new Date(dateValue).toDateString() === new Date().toDateString();
}

function formatBirthYear(value: unknown) {
    const cleaned = String(value ?? "").replace(/\D/g, "").slice(0, 8);
    const yearMatch = cleaned.match(/\d{4}$/);

    return yearMatch?.[0] ?? cleaned.slice(0, 4);
}

function mapUser(id: string, data: Record<string, unknown>): RegisteredUser {
    const progresso = data.progresso && typeof data.progresso === "object"
        ? data.progresso as RegisteredUser["progresso"]
        : undefined;

    return {
        id,
        codigo: Number(data.codigo ?? 0),
        nome: String(data.nome ?? ""),
        dataNascimento: formatBirthYear(data.dataNascimento),
        genero: data.genero === "Feminino" || data.genero === "Masculino" ? data.genero : "",
        email: String(data.email ?? ""),
        status: (["Ativo", "Pendente", "Inativo"].includes(String(data.status)) ? data.status : "Ativo") as UserStatus,
        criadoEm: String(data.criadoEm ?? ""),
        ultimoAcesso: String(data.ultimoAcesso ?? ""),
        progresso,
    };
}

async function fetchUsers(): Promise<RegisteredUser[]> {
    const usersQuery = query(collection(db, USERS_COLLECTION), orderBy("codigo", "asc"));
    const snapshot = await getDocs(usersQuery);

    return snapshot.docs.map((userDoc) => mapUser(userDoc.id, userDoc.data() as Record<string, unknown>));
}

const UserServices = {
    login: async (email: string, password: string): Promise<{ success: boolean, message?: string }> => {
        try {
            const normalizedEmail = email.trim().toLowerCase();

            if (!isAdminEmail(normalizedEmail)) {
                return { success: false, message: "Usuário sem permissão administrativa." };
            }

            const credential = await signInWithEmailAndPassword(auth, normalizedEmail, password);

            if (!isAdminEmail(credential.user.email)) {
                await signOut(auth);
                Cookies.remove("user");
                return { success: false, message: "Usuário sem permissão administrativa." };
            }

            Cookies.set("user", JSON.stringify({
                uid: credential.user.uid,
                name: "Administrador",
                email: credential.user.email,
                role: "Administrador",
            }), { expires: 7, sameSite: "strict" });
            return { success: true };
        }

        catch {
            return { success: false, message: "Login incorreto" };
        }
    },

    getCurrentUser: () => {
        const user = Cookies.get("user");
        return user ? JSON.parse(user) : null;
    },

    resetPassword: async (email: string): Promise<{ success: boolean }> => {
        try {
            await sendPasswordResetEmail(auth, email.trim().toLowerCase());
            return { success: true };
        } catch {
            return { success: false };
        }
    },

    logout: async (): Promise<{ success: boolean }> => {
        await signOut(auth);
        Cookies.remove("user");
        return { success: true };
    },

    getAll: async (filter: UserFilter = {}): Promise<UserListResponse> => {
        const normalizedName = String(filter.name ?? "").toLowerCase().trim();
        const normalizedEmail = String(filter.email ?? "").toLowerCase().trim();
        const normalizedStatus = String(filter.status ?? "-1");
        const users = await fetchUsers();

        return {
            success: true,
            users: users.filter((user) => {
                const matchesName =
                    !normalizedName ||
                    user.nome.toLowerCase().includes(normalizedName);
                const matchesEmail = !normalizedEmail || user.email.toLowerCase().includes(normalizedEmail);
                const matchesStatus = normalizedStatus === "-1" || user.status === normalizedStatus;

                return matchesName && matchesEmail && matchesStatus;
            }),
        };
    },

    getDashboardData: async (): Promise<DashboardData> => {
        const users = await fetchUsers();

        return {
            totalUsers: users.length,
            activeUsers: users.filter((user) => user.status === "Ativo").length,
            pendingUsers: users.filter((user) => user.status === "Pendente").length,
            todayRegistrations: users.filter((user) => user.criadoEm && isToday(user.criadoEm)).length,
            recentUsers: [...users]
                .sort((firstUser, secondUser) => (
                    new Date(secondUser.criadoEm).getTime() - new Date(firstUser.criadoEm).getTime()
                ))
                .slice(0, 4),
        };
    },

    getById: async (id: string): Promise<UserByIdResponse> => {
        const userRef = doc(db, USERS_COLLECTION, id);
        const snapshot = await getDoc(userRef);

        if (!snapshot.exists()) {
            return { success: false, user: null };
        }

        return {
            success: true,
            user: mapUser(snapshot.id, snapshot.data() as Record<string, unknown>),
        };
    },

    create: async (user: UserFormValues): Promise<UserMutationResponse> => {
        try {
            const token = await auth.currentUser?.getIdToken();

            if (!token) {
                return { success: false, error: "Sessão administrativa expirada." };
            }

            const response = await fetch("/api/admin/users", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(user),
            });
            const data = await response.json();

            if (!response.ok) {
                return { success: false, error: data?.error ?? "Não foi possível criar o cadastro." };
            }

            return { success: true };
        } catch (error: any) {
            if (error?.code === "auth/email-already-in-use") {
                return { success: false, error: "Este email já está cadastrado." };
            }

            if (error?.code === "auth/weak-password") {
                return { success: false, error: "A senha precisa ter pelo menos 6 caracteres." };
            }

            return { success: false, error: "Não foi possível criar o cadastro." };
        }
    },

    update: async (user: UserFormValues & { id: string }): Promise<UserMutationResponse> => {
        try {
            const token = await auth.currentUser?.getIdToken();

            if (!token) {
                return { success: false, error: "Sessão administrativa expirada." };
            }

            const response = await fetch(`/api/admin/users/${user.id}`, {
                method: "PATCH",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(user),
            });
            const data = await response.json();

            if (!response.ok) {
                return { success: false, error: data?.error ?? "Não foi possível atualizar o cadastro." };
            }

            return { success: true };
        } catch (error: any) {
            if (error?.code === "auth/email-already-in-use") {
                return { success: false, error: "Este email já está cadastrado." };
            }

            return { success: false, error: "Não foi possível atualizar o cadastro." };
        }
    },

    delete: async (id: string): Promise<UserMutationResponse> => {
        try {
            const token = await auth.currentUser?.getIdToken();

            if (!token) {
                return { success: false, error: "Sessão administrativa expirada." };
            }

            const response = await fetch(`/api/admin/users/${id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
            });
            const data = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    error: data?.error ?? "Não foi possível excluir o cadastro.",
                };
            }

            return { success: true };
        } catch {
            return { success: false, error: "Não foi possível excluir o cadastro." };
        }
    }
}

export default UserServices;
