import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { isAdminEmail } from "@/services/admin-access";
import { birthYearSchema } from "@/helpers/user-form";

type RouteContext = {
    params: Promise<{
        userID: string;
    }>;
};

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

function normalizeStatus(status: unknown) {
    return ["Ativo", "Pendente", "Inativo"].includes(String(status))
        ? String(status)
        : "Ativo";
}

function normalizeBirthYear(value: unknown) {
    const cleaned = String(value ?? "").replace(/\D/g, "").slice(0, 8);
    const yearMatch = cleaned.match(/\d{4}$/);

    return yearMatch?.[0] ?? cleaned.slice(0, 4);
}

export async function PATCH(request: Request, { params }: RouteContext) {
    try {
        const isAdmin = await validateAdmin(request);

        if (!isAdmin) {
            return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
        }

        const { userID } = await params;
        const user = await request.json();
        const email = String(user.email ?? "").trim().toLowerCase();
        const senha = String(user.senha ?? "");
        const dataNascimento = normalizeBirthYear(user.dataNascimento);

        if ((user.dataNascimento && !dataNascimento) || !await birthYearSchema.isValid(dataNascimento)) {
            return NextResponse.json({ error: "Ano de nascimento inválido." }, { status: 400 });
        }

        if (!email) {
            return NextResponse.json({ error: "Informe um email valido." }, { status: 400 });
        }

        if (senha && senha.length < 6) {
            return NextResponse.json(
                { error: "A senha precisa ter pelo menos 6 caracteres." },
                { status: 400 },
            );
        }

        const authUpdate: { email: string; password?: string } = { email };

        if (senha) {
            authUpdate.password = senha;
        }

        await adminAuth.updateUser(userID, authUpdate);
        await adminDb.collection("usuarios").doc(userID).update({
            nome: String(user.nome ?? "").trim(),
            dataNascimento,
            genero: user.genero === "Feminino" || user.genero === "Masculino" ? user.genero : "",
            email,
            status: normalizeStatus(user.status),
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        if (error?.code === "auth/email-already-exists") {
            return NextResponse.json({ error: "Este email já está cadastrado." }, { status: 409 });
        }

        if (error?.code === "auth/user-not-found") {
            return NextResponse.json({ error: "Cadastro não encontrado no Firebase Auth." }, { status: 404 });
        }

        if (error instanceof Error && error.message === "Firebase Admin não configurado.") {
            return NextResponse.json(
                { error: "Configure o Firebase Admin para editar contas do Auth." },
                { status: 500 },
            );
        }

        return NextResponse.json(
            { error: "Não foi possível atualizar o cadastro." },
            { status: 500 },
        );
    }
}

export async function DELETE(request: Request, { params }: RouteContext) {
    try {
        const isAdmin = await validateAdmin(request);

        if (!isAdmin) {
            return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
        }

        const { userID } = await params;

        try {
            await adminAuth.deleteUser(userID);
        } catch (error: any) {
            if (error?.code !== "auth/user-not-found") {
                throw error;
            }
        }

        await adminDb.collection("usuarios").doc(userID).delete();

        return NextResponse.json({ success: true });
    } catch (error: any) {
        if (error instanceof Error && error.message === "Firebase Admin não configurado.") {
            return NextResponse.json(
                { error: "Configure o Firebase Admin para excluir contas do Auth." },
                { status: 500 },
            );
        }

        return NextResponse.json(
            { error: "Não foi possível excluir o cadastro." },
            { status: 500 },
        );
    }
}
