import { Asset } from "expo-asset";

const initialImages = [
  require("../assets/splash/splash.png"),
  require("../assets/login/background_login6.png"),
  require("../assets/login/background_login_tablet.png"),
  require("../assets/login/botao_entrar_verde.png"),
  require("../assets/cadastro/background_frutiger6.png"),
  require("../assets/cadastro/background_cadastro_tablet.png"),
  require("../assets/cadastro/botao_entrar_azul.png"),
  require("../assets/selecao-jogos/background_selecao9.png"),
  require("../assets/selecao-jogos/botao_musica_desativado.png"),
  require("../assets/selecao-jogos/botao_musica_roxo5.png"),
  require("../assets/selecao-jogos/botao-play.png"),
  require("../assets/selecao-jogos/card1.png"),
  require("../assets/selecao-jogos/card8.png"),
  require("../assets/selecao-jogos/logo_selecao.png"),
];

const consultorioImages = [
  require("../assets/jogo1/background_menina3.png"),
  require("../assets/jogo1/background_meninafeliz3.png"),
  require("../assets/jogo1/background_menino3.png"),
  require("../assets/jogo1/background_meninofeliz.png"),
  require("../assets/jogo1/pratica-1.png"),
  require("../assets/jogo1/pratica-2.2.png"),
  require("../assets/jogo1/pratica-3.png"),
  require("../assets/jogo1/pratica-4.png"),
  require("../assets/jogo1/pratica-5.png"),
  require("../assets/jogo1/pratica-1-feminina.png"),
  require("../assets/jogo1/pratica-2-feminina.png"),
  require("../assets/jogo1/pratica-3-feminina.png"),
  require("../assets/jogo1/pratica-4-feminina.png"),
  require("../assets/jogo1/pratica-5-feminina.png"),
  require("../assets/jogo1/1star.png"),
  require("../assets/jogo1/dentista-1.png"),
  require("../assets/jogo1/dentista-2.png"),
  require("../assets/jogo1/balao.png"),
  require("../assets/jogo1/instrumento-1.png"),
  require("../assets/jogo1/instrumento-2.2.png"),
  require("../assets/jogo1/instrumento-3.png"),
  require("../assets/jogo1/instrumento-4.png"),
  require("../assets/jogo1/instrumento-5.png"),
  require("../assets/jogo1/titulo3.png"),
  require("../assets/jogo2/botao_jogarnovamente2.png"),
  require("../assets/jogo2/dente_titulo.png"),
  require("../assets/jogo2/icone_menina2.png"),
  require("../assets/jogo2/icone_menino2.png"),
  require("../assets/shared/botao_sair.png"),
  require("../assets/shared/rectangle.png"),
];

const jogo2Images = [
  require("../assets/shared/background_consultorio.png"),
  require("../assets/shared/botao_sair.png"),
  require("../assets/shared/exit3.png"),
  require("../assets/shared/rectangle-2.png"),
  require("../assets/jogo2/botao_concluir.png"),
  require("../assets/jogo2/botao_jogarnovamente2.png"),
  require("../assets/jogo2/copo.png"),
  require("../assets/jogo2/dente.png"),
  require("../assets/jogo2/dente_titulo.png"),
  require("../assets/jogo2/dentinho.png"),
  require("../assets/jogo2/escova.png"),
  require("../assets/jogo2/escovacompasta_clean.png"),
  require("../assets/jogo2/escovinha.png"),
  require("../assets/jogo2/icone_menina2.png"),
  require("../assets/jogo2/icone_menino2.png"),
  require("../assets/jogo2/maozinha.png"),
  require("../assets/jogo2/menina_bocasuja.png"),
  require("../assets/jogo2/menina_espuma.png"),
  require("../assets/jogo2/menina_limpa.png"),
  require("../assets/jogo2/menino_bocasuja.png"),
  require("../assets/jogo2/menino_espuma.png"),
  require("../assets/jogo2/menino_limpo.png"),
  require("../assets/jogo2/pasta.png"),
  require("../assets/jogo2/resultado_background.png"),
  require("../assets/jogo2/star1.png"),
  require("../assets/jogo2/star2.png"),
  require("../assets/jogo2/star3.png"),
];

const audioAssets = [
  require("../assets/audio/lucas.mp3"),
  require("../assets/audio/laura.mp3"),
  require("../assets/audio/motor.mp3"),
  require("../assets/audio/spray.mp3"),
  require("../assets/audio/sugador.mp3"),
  require("../assets/audio/explorador.mp3"),
  require("../assets/audio/espelho.mp3"),
  require("../assets/audio/parabens.mp3"),
];

const appAssets = [
  ...initialImages,
  ...consultorioImages,
  ...jogo2Images,
  ...audioAssets,
];

let initialPreloadPromise: Promise<void> | null = null;
let consultorioPreloadPromise: Promise<void> | null = null;
let jogo2PreloadPromise: Promise<void> | null = null;
let appPreloadPromise: Promise<void> | null = null;

export function preloadInitialImages() {
  if (!initialPreloadPromise) {
    initialPreloadPromise = Asset.loadAsync(initialImages).then(() => undefined);
  }

  return initialPreloadPromise;
}

export function preloadConsultorioImages() {
  if (!consultorioPreloadPromise) {
    consultorioPreloadPromise = Asset.loadAsync(consultorioImages).then(() => undefined);
  }

  return consultorioPreloadPromise;
}

export function preloadJogo2Images() {
  if (!jogo2PreloadPromise) {
    jogo2PreloadPromise = Asset.loadAsync(jogo2Images).then(() => undefined);
  }

  return jogo2PreloadPromise;
}

export function preloadAppAssets() {
  if (!appPreloadPromise) {
    appPreloadPromise = Asset.loadAsync(appAssets).then(() => undefined);
  }

  return appPreloadPromise;
}
