"use client";
import { useEffect, useState } from "react";
import { Formik } from "formik";
import { useRouter } from "next/navigation";
import { AppButton, AppInput, AppLoader, AppSelect } from "@/themes/components";
import UserServices from "@/services/user";
import { setFlashData } from "@/helpers/router";
import { RegisteredUser } from "@/data/users";
import {
    editUserFormSchema,
    formatBirthYear,
    toEditFormValues,
    UserFormValues,
} from "@/helpers/user-form";

export interface UsuarioFormProps {
    userID: string;
}

export default function UsuarioForm({ userID }: UsuarioFormProps) {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<RegisteredUser | null>(null);

    useEffect(() => {
        const loadUser = async () => {
            const response = await UserServices.getById(userID);

            if (!response.success || !response.user) {
                setFlashData({ error: "Cadastro não encontrado" });
                router.replace("/admin/usuarios");
                return;
            }

            setUser(response.user);
            setLoading(false);
        };

        void loadUser();
    }, [router, userID]);

    const handleOnSubmit = async (data: UserFormValues) => {
        if (!user) {
            return;
        }

        setError(null);
        const response = await UserServices.update({ ...data, id: user.id });

        if (response.success) {
            setFlashData({ success: "Cadastro atualizado com sucesso" });
            router.replace("/admin/usuarios");
        } else if (response.error) {
            setError(response.error);
        }
    };

    if (loading || !user) {
        return (
            <div className="flex justify-center py-10">
                <AppLoader size={48} />
            </div>
        );
    }

    return (
        <Formik<UserFormValues>
            initialValues={toEditFormValues(user)}
            validationSchema={editUserFormSchema}
            onSubmit={handleOnSubmit}
        >
            {({ handleChange, handleSubmit, isSubmitting, isValid, errors, values, setFieldValue }) => (
                <form className="grid gap-2 lg:grid-cols-2">
                    <AppInput placeholder="Nome da criança" label="Nome:" name="nome" onChange={handleChange} icon="person" error={errors.nome} value={values.nome} />
                    <AppInput placeholder="Ano de nascimento (opcional)" label="Ano de nascimento (opcional):" name="dataNascimento" onChange={(e) => setFieldValue("dataNascimento", formatBirthYear(e.target.value))} icon="calendar" error={errors.dataNascimento} value={values.dataNascimento} />
                    <AppSelect label="Gênero (opcional):" onChange={handleChange} name="genero" value={values.genero}>
                        <option value="">Não informado</option>
                        <option value="Masculino">Masculino</option>
                        <option value="Feminino">Feminino</option>
                    </AppSelect>
                    <AppInput placeholder="Digite o email" label="Email:" name="email" onChange={handleChange} icon="email" error={errors.email} value={values.email} />
                    <AppInput placeholder="Nova senha (opcional)" label="Senha:" name="senha" type="password" onChange={handleChange} icon="locked" openPassword error={errors.senha} value={values.senha} />
                    <AppSelect label="Status:" onChange={handleChange} name="status" value={values.status}>
                        <option value="Ativo">Ativo</option>
                        <option value="Pendente">Pendente</option>
                        <option value="Inativo">Inativo</option>
                    </AppSelect>

                    <div className="min-h-[24px] lg:col-span-2">
                        {error && <p className="text-[15px] text-[red]">{error}</p>}
                    </div>
                    <div className="lg:col-span-2">
                        <AppButton title="Salvar alterações" icon="checkmark" onClick={() => handleSubmit()} disabled={!isValid || isSubmitting} />
                    </div>
                </form>
            )}
        </Formik>
    );
}
