"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import UserServices from "@/services/user";
import { getFlashData } from "@/helpers/router";
import { RegisteredUser } from "@/data/users";
import { AppButton, AppInput, AppLoader, AppModal, AppSelect } from "@/themes/components";

const statusBadge = {
    Ativo: "bg-emerald-100 text-emerald-700",
    Pendente: "bg-amber-100 text-amber-700",
    Inativo: "bg-slate-200 text-slate-700",
};

const defaultFilter = {
    name: "",
    email: "",
    status: "-1",
};

function formatDateTime(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: "America/Fortaleza",
    }).format(date);
}

export default function UserList() {
    const params = useSearchParams();
    const [users, setUsers] = useState<RegisteredUser[]>([]);
    const [userRemove, setUserRemove] = useState<RegisteredUser | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState(defaultFilter);

    const loadUsers = useCallback(async () => {
        setLoading(true);
        const { success, users } = await UserServices.getAll(filter);

        if (success) {
            const hasActiveFilters = Boolean(filter.name.trim() || filter.email.trim() || filter.status !== "-1");
            setUsers(users);
            setError(users.length === 0 && hasActiveFilters ? "Cadastro não encontrado" : null);
            if (users.length > 0) setSuccess(null);
        }

        setLoading(false);
    }, [filter]);

    const handleRemove = (user: RegisteredUser) => {
        setUserRemove(user);
        setSuccess(null);
        setError(null);
    }

    const handleModalConfirm = async () => {
        if (!userRemove) return;

        setLoading(true);
        const response = await UserServices.delete(userRemove.id);
        setLoading(false);

        if (response.success) {
            setUserRemove(null);
            setSuccess("Cadastro removido com sucesso!");
            setError(null);
            await loadUsers();
        } else if (response.error) {
            setError(response.error);
            setSuccess(null);
        }
    }

    useEffect(() => {
        loadUsers();

        const data = getFlashData();
        if (data?.success) setSuccess(data.success);
        if (data?.error) setError(data.error);

        const errorParam = params.get("error");
        if (errorParam) setError(errorParam);
    }, [loadUsers, params]);

    return (
        <>
            <h3 className="text-[18px] font-bold text-slate-900">Filtros</h3>
            <div className="flex flex-col border-b border-slate-200 p-2">
                <div className="flex flex-col gap-2 md:flex-row md:items-start">
                    <AppInput className="md:max-w-[285px]" type="text" label="Nome" value={filter.name} onChange={(e) => setFilter((current) => ({ ...current, name: e.target.value }))} />
                    <AppInput className="md:max-w-[285px]" type="email" label="Email" value={filter.email} onChange={(e) => setFilter((current) => ({ ...current, email: e.target.value }))} />

                    <AppSelect className="md:max-w-[170px]" label="Status" value={filter.status} onChange={(e) => setFilter((current) => ({ ...current, status: e.target.value }))}>
                        <option value="-1">Todos</option>
                        <option value="Ativo">Ativo</option>
                        <option value="Pendente">Pendente</option>
                        <option value="Inativo">Inativo</option>
                    </AppSelect>
                </div>
                <AppButton title="Filtrar" className="w-[100px]" type="outline" onClick={loadUsers} />
            </div>

            {success && <p className="mt-4 rounded-full bg-[#6eef01] p-1 px-5 text-center color-[white]">{success}</p>}
            {error && <p className="mt-4 rounded-full bg-[red] p-1 px-5 text-center color-[white]">{error}</p>}

            {loading && <div className="flex justify-center"><AppLoader size={50} className="self-center" /></div>}
            {!loading && <div className="mt-4 overflow-x-auto rounded-[28px] border border-white/80 bg-white/90 shadow-[0_22px_60px_rgba(15,23,42,0.08)]">
                <table className="min-w-full bg-white/0">
                    <thead className="bg-slate-50/90">
                        <tr>
                            <th className="px-4 py-4 text-left text-sm font-semibold text-gray-600">ID</th>
                            <th className="px-4 py-4 text-left text-sm font-semibold text-gray-600">Criança</th>
                            <th className="px-4 py-4 text-left text-sm font-semibold text-gray-600">Cadastro</th>
                            <th className="px-4 py-4 text-left text-sm font-semibold text-gray-600">Email</th>
                            <th className="px-4 py-4 text-left text-sm font-semibold text-gray-600">Gênero</th>
                            <th className="px-4 py-4 text-left text-sm font-semibold text-gray-600">Status</th>
                            <th className="px-4 py-4 text-left text-sm font-semibold text-gray-600">Ações</th>
                        </tr>
                    </thead>

                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id}>
                                <td className="border-b border-gray-100 px-4 py-4 text-sm font-semibold text-slate-900">
                                    {user.codigo}
                                </td>
                                <td className="border-b border-gray-100 px-4 py-4 text-sm">
                                    <p className="font-semibold text-slate-900">{user.nome}</p>
                                    <p className="mt-1 text-slate-500">Ano: {user.dataNascimento || "Não informado"}</p>
                                </td>
                                <td className="border-b border-gray-100 px-4 py-4 text-sm">
                                    <p className="font-medium text-slate-900">Criado em {formatDateTime(user.criadoEm)}</p>
                                    <p className="mt-1 text-slate-500">Último acesso: {formatDateTime(user.ultimoAcesso)}</p>
                                </td>
                                <td className="border-b border-gray-100 px-4 py-4 text-sm">
                                    <p>{user.email}</p>
                                </td>
                                <td className="border-b border-gray-100 px-4 py-4 text-sm">{user.genero || "Não informado"}</td>
                                <td className="border-b border-gray-100 px-4 py-4 text-sm">
                                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge[user.status]}`}>
                                        {user.status}
                                    </span>
                                </td>
                                <td className="border-b border-gray-100 px-4 py-4 text-sm">
                                    <Link href={`/admin/usuarios/editar/${user.id}`}>
                                        <i className="ion-edit mx-[10px] cursor-pointer text-[20px] text-[#1aab67]" />
                                    </Link>
                                    <i className="ion-ios-trash mx-[10px] cursor-pointer text-[20px] text-[#ed1b2d]" onClick={() => handleRemove(user)} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>}

            {userRemove && <AppModal title="Excluir cadastro">
                <p>Deseja realmente remover o cadastro de {userRemove.nome}?</p>
                <div className="flex justify-center gap-8 p-[20px]">
                    <AppButton title="Sim" icon="checkmark" form="round" color="#428f01" onClick={handleModalConfirm} />
                    <AppButton title="Cancelar" icon="close" color="tomato" form="round" onClick={() => setUserRemove(null)} />
                </div>
            </AppModal>}
        </>
    )
}
