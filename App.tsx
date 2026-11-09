import React from "react";
import { Text, TextInput } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider, initialWindowMetrics } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { ScreenViewport, TabletOnlyViewport } from "./utils/responsive";

import Login from "./screens/Login";
import Cadastro from "./screens/Cadastro";
import SelecaoJogos from "./screens/SelecaoJogos";
import Consultorio from "./screens/Consultorio";
import Jogo2 from "./screens/Jogo2";
import Splash from "./screens/Splash";
import { ThemeMusicProvider } from "./contexts/ThemeMusicContext";

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Cadastro: undefined;
  SelecaoJogos: undefined;
  Consultorio: undefined;
  Jogo2: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function LoginPage(props: React.ComponentProps<typeof Login>) {
  return <ScreenViewport backgroundSource={require("./assets/login/background_login6.png")} tabletBackgroundSource={require("./assets/login/background_login_tablet.png")}><Login {...props} /></ScreenViewport>;
}
function CadastroPage(props: React.ComponentProps<typeof Cadastro>) {
  return <ScreenViewport backgroundSource={require("./assets/cadastro/background_frutiger6.png")} tabletBackgroundSource={require("./assets/cadastro/background_cadastro_tablet.png")}><Cadastro {...props} /></ScreenViewport>;
}
function SelecaoPage(props: React.ComponentProps<typeof SelecaoJogos>) {
  return <ScreenViewport backgroundSource={require("./assets/selecao-jogos/background_selecao9.png")}><SelecaoJogos {...props} /></ScreenViewport>;
}
function ConsultorioPage(props: React.ComponentProps<typeof Consultorio>) {
  return <TabletOnlyViewport backgroundSource={require("./assets/shared/background_consultorio.png")}><Consultorio {...props} /></TabletOnlyViewport>;
}
function Jogo2Page(props: React.ComponentProps<typeof Jogo2>) {
  return <TabletOnlyViewport backgroundSource={require("./assets/shared/background_consultorio.png")}><Jogo2 {...props} /></TabletOnlyViewport>;
}
function SplashPage(props: React.ComponentProps<typeof Splash>) {
  return <TabletOnlyViewport backgroundSource={require("./assets/splash/splash.png")}><Splash {...props} /></TabletOnlyViewport>;
}

const MAX_FONT_SIZE_MULTIPLIER = 1.12;
const textDefaults = Text as unknown as { defaultProps?: React.ComponentProps<typeof Text> };
const textInputDefaults = TextInput as unknown as { defaultProps?: React.ComponentProps<typeof TextInput> };

textDefaults.defaultProps = {
  ...textDefaults.defaultProps,
  maxFontSizeMultiplier: MAX_FONT_SIZE_MULTIPLIER,
};

textInputDefaults.defaultProps = {
  ...textInputDefaults.defaultProps,
  maxFontSizeMultiplier: MAX_FONT_SIZE_MULTIPLIER,
};

export default function App() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
    <StatusBar style="light" />
    <ThemeMusicProvider>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="Splash" component={SplashPage} />
          <Stack.Screen name="Login" component={LoginPage} />
          <Stack.Screen name="Cadastro" component={CadastroPage} />
          <Stack.Screen name="SelecaoJogos" component={SelecaoPage} />
          <Stack.Screen name="Consultorio" component={ConsultorioPage} />
          <Stack.Screen name="Jogo2" component={Jogo2Page} />
        </Stack.Navigator>
      </NavigationContainer>
    </ThemeMusicProvider>
    </SafeAreaProvider>
  );
}
