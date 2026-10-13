export type UserStatus = "Ativo" | "Pendente" | "Inativo";

export type RegisteredUser = {
  id: string;
  codigo: number;
  nome: string;
  dataNascimento: string;
  genero: "Masculino" | "Feminino" | "";
  email: string;
  status: UserStatus;
  criadoEm: string;
  ultimoAcesso: string;
  progresso?: {
    jogo1?: GameProgress;
    jogo2?: GameProgress;
  };
};

export type GameProgress = {
  titulo?: string;
  concluido?: boolean;
  estrelas?: number;
  tentativas?: number;
  melhorPontuacao?: number;
  ultimaPontuacao?: number;
  instrumentosVistos?: string[];
  atualizadoEm?: string;
};

export type DashboardData = {
  totalUsers: number;
  activeUsers: number;
  pendingUsers: number;
  todayRegistrations: number;
  recentUsers: RegisteredUser[];
};

