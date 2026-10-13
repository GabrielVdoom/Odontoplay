"use client";
import { useState } from "react";
import { Formik } from "formik";
import { useRouter } from "next/navigation";
import { AppButton, AppInput, AppSelect } from "@/themes/components";
import UserServices from "@/services/user";
import { setFlashData } from "@/helpers/router";
import {
    defaultUserFormValues,
    formatBirthYear,
    userFormSchema,
    UserFormValues,
} from "@/helpers/user-form";

export default function UsuarioForm() {
    const router = useRouter();
    const [ error, setError ] = useState<string | null>(null);

    const handleOnSubmit = async (data: UserFormValues) => {
        setError(null);
        const { success, error } =  await UserServices.create(data);
        if (success) {
            setFlashData({success: "Cadastro criado com sucesso"});
            router.replace("/admin/usuarios");
        } else if (error) {
            setError(error);
        }
    }

    return (    
        <Formik<UserFormValues>
            initialValues={defaultUserFormValues}
            validationSchema={userFormSchema}
            onSubmit={handleOnSubmit}
        >
            {({handleChange, handleSubmit, isSubmitting, isValid, errors, setFieldValue, values}) => (
                <form className="grid gap-2 lg:grid-cols-2">
                    <AppInput placeholder="Nome da criança" label="Nome:" name="nome" onChange={handleChange} icon="person" error={errors.nome} value={values.nome} />
                    <AppInput placeholder="Ano de nascimento (opcional)" label="Ano de nascimento (opcional):" name="dataNascimento" value={values.dataNascimento} onChange={(e) => setFieldValue("dataNascimento", formatBirthYear(e.target.value))} icon="calendar" error={errors.dataNascimento} />
                    <AppSelect label="Gênero (opcional):" onChange={handleChange} name="genero" value={values.genero}>
                        <option value="">Não informado</option>
                        <option value="Masculino">Masculino</option>
                        <option value="Feminino">Feminino</option>
                    </AppSelect>
                    <AppInput placeholder="Digite o email" label="Email:" name="email" onChange={handleChange} icon="email" error={errors.email} value={values.email} />
                    <AppInput placeholder="Senha inicial" label="Senha:" name="senha" type="password" onChange={handleChange} icon="locked" openPassword error={errors.senha} value={values.senha} />
                    <AppSelect label="Status:" onChange={handleChange} name="status" value={values.status}>
                        <option value="Ativo">Ativo</option>
                        <option value="Pendente">Pendente</option>
                        <option value="Inativo">Inativo</option>
                    </AppSelect>

                    {error && <p className="my-3 text-[15px] text-[tomato] lg:col-span-2">{error}</p>}
                    <div className="lg:col-span-2">
                        <AppButton title="Salvar cadastro" icon="checkmark" onClick={() => handleSubmit()} disabled={!isValid || isSubmitting}/>
                    </div>
                </form>
            )}
        </Formik>
    )
}
