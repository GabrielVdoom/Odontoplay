import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { isAdminEmail } from "@/services/admin-access";

const USERS_COLLECTION = "usuarios";

function normalizeBirthYear(value: unknown) {
    const cleaned = String(value ?? "").replace(/\D/g, "").slice(0, 8);
    const yearMatch = cleaned.match(/\d{4}$/);

    return yearMatch?.[0] ?? cleaned.slice(0, 4);
}

async function validateAdmin(request: Request) {
    const authorization = request.headers.get("authorization");
    const token = authorization?.startsWith("Bearer ")
        ? authorization.replace("Bearer ", "")
        : null;

    if (!token) {
        return false;
    }

    const decodedToken = await adminAuth.verifyIdToken(token);
    return isAdminEmail(decodedToken.email);
}

export async function POST(request: Request) {
    try {
        const isAdmin = await validateAdmin(request);

        if (!isAdmin) {
            return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
        }

        const user = await request.json();
        const email = String(user.email ?? "").trim().toLowerCase();
        const senha = String(user.senha ?? "");

        if (!email || !senha || senha.length < 6) {
            return NextResponse.json(
                { error: "Informe email e senha com pelo menos 6 caracteres." },
                { status: 400 },
            );
        }

        const usersSnapshot = await adminDb.collection(USERS_COLLECTION).get();
        const codigo = usersSnapshot.docs.reduce((maximum, document) => {
            const code = Number(document.data().codigo);
            return Number.isSafeInteger(code) && code > maximum ? code : maximum;
        }, 0) + 1;
        const createdUser = await adminAuth.createUser({
            email,
            password: senha,
        });
        const now = new Date().toISOString();

        await adminDb.collection(USERS_COLLECTION).doc(createdUser.uid).set({
            codigo,
            nome: String(user.nome ?? "").trim(),
            dataNascimento: normalizeBirthYear(user.dataNascimento),
            genero: user.genero === "Feminino" ? "Feminino" : "Masculino",
            email,
            status: ["Ativo", "Pendente", "Inativo"].includes(String(user.status)) ? user.status : "Ativo",
            criadoEm: now,
            ultimoAcesso: now,
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        if (error?.code === "auth/email-already-exists") {
            return NextResponse.json({ error: "Este email já está cadastrado." }, { status: 409 });
        }

        if (error instanceof Error && error.message === "Firebase Admin não configurado.") {
            return NextResponse.json(
                { error: "Configure o Firebase Admin para criar contas pelo gerenciador." },
                { status: 500 },
            );
        }

        return NextResponse.json({ error: "Não foi possível criar o cadastro." }, { status: 500 });
    }
}
