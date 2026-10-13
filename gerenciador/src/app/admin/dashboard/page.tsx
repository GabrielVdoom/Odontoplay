"use client";
import { useEffect, useState } from "react";
import { AppLoader, AppMainContainer } from "@/themes/components";
import { DashboardData } from "@/data/users";
import UserServices from "@/services/user";

const statusStyles = {
  Ativo: "bg-emerald-100 text-emerald-700",
  Pendente: "bg-amber-100 text-amber-700",
  Inativo: "bg-slate-200 text-slate-700",
};

const defaultDashboardData: DashboardData = {
  totalUsers: 0,
  activeUsers: 0,
  pendingUsers: 0,
  todayRegistrations: 0,
  recentUsers: [],
};

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData>(defaultDashboardData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const data = await UserServices.getDashboardData();
      setDashboardData(data);
      setLoading(false);
    })();
  }, []);

  return (
    <AppMainContainer
      title="Dashboard"
      eyebrow="Visão geral do gerenciador"
      description="Acompanhe os principais indicadores e cadastros do OdontoPlay."
    >
      {loading && <div className="flex justify-center"><AppLoader size={50} className="self-center" /></div>}

      {!loading && <>
        <div className="grid gap-4">
          <section className="grid gap-4 md:grid-cols-2">
            <article className="rounded-[28px] bg-[linear-gradient(135deg,#1d4ed8_0%,#0f766e_100%)] p-6 text-white shadow-[0_22px_60px_rgba(29,78,216,0.24)] md:col-span-2">
              <p className="text-xs uppercase tracking-[0.3em] text-white/70">Base de usuários</p>
              <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="text-4xl font-semibold">{dashboardData.totalUsers} cadastros</h2>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-white/80">
                    Visão consolidada para consulta, acompanhamento e manutenção dos usuários do aplicativo.
                  </p>
                </div>
                <div className="rounded-[24px] bg-white/12 px-5 py-4 text-sm">
                  <p className="font-semibold">{dashboardData.todayRegistrations} novos cadastros hoje</p>
                  <p className="mt-1 text-white/70">Atualização com base nos registros disponíveis no sistema.</p>
                </div>
              </div>
            </article>

            <article className="rounded-[26px] border border-white/80 bg-white/85 p-6">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Usuários ativos</p>
              <h3 className="mt-3 text-3xl font-semibold text-slate-950">{dashboardData.activeUsers}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">Cadastros com situação ativa no banco.</p>
            </article>

            <article className="rounded-[26px] border border-white/80 bg-white/85 p-6">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Pendentes</p>
              <h3 className="mt-3 text-3xl font-semibold text-slate-950">{dashboardData.pendingUsers}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">Usuários que ainda podem exigir revisão cadastral.</p>
            </article>

          </section>

        </div>

        <div className="mt-4 rounded-[28px] border border-white/80 bg-white/85 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Cadastros recentes</p>
              <h3 className="mt-2 text-2xl font-semibold text-slate-950">Preview da lista administrativa</h3>
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {dashboardData.recentUsers.map((user) => (
              <article key={user.id} className="rounded-[24px] bg-slate-50 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-lg font-semibold text-slate-950">{user.nome}</h4>
                    <p className="mt-1 text-sm text-slate-500">Ano: {user.dataNascimento || "Não informado"}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[user.status]}`}>
                    {user.status}
                  </span>
                </div>
                <div className="mt-4 grid gap-2 text-sm text-slate-600">
                  <p>ID: {user.codigo}</p>
                  <p>Email: {user.email}</p>
                  <p>Último acesso: {user.ultimoAcesso}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </>}
    </AppMainContainer>
  );
}
