import { Asset } from "expo-asset";

const initialImages = [
  require("../assets/login/background_login6.png"),
  require("../assets/login/botao_entrar_verde.png"),
];

const consultorioImages = [
  require("../assets/jogo1/background_menina3.png"),
  require("../assets/jogo1/background_meninafeliz3.png"),
  require("../assets/jogo1/background_menino3.png"),
  require("../assets/jogo1/background_meninofeliz.png"),
  require("../assets/jogo1/pratica-1-feminina.png"),
  require("../assets/jogo1/pratica-2-feminina.png"),
  require("../assets/jogo1/pratica-3-feminina.png"),
  require("../assets/jogo1/pratica-4-feminina.png"),
  require("../assets/jogo1/pratica-5-feminina.png"),
  require("../assets/jogo1/dentista-1.png"),
  require("../assets/jogo1/dentista-2.png"),
  require("../assets/jogo1/balao.png"),
  require("../assets/shared/rectangle.png"),
];

let initialPreloadPromise: Promise<void> | null = null;
let consultorioPreloadPromise: Promise<void> | null = null;

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
