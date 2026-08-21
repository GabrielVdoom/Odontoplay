import React from "react";
import { Text, TextInput } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

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

const MAX_FONT_SIZE_MULTIPLIER = 1.12;
const textDefaults = Text as unknown as { defaultProps?: Text["props"] };
const textInputDefaults = TextInput as unknown as { defaultProps?: TextInput["props"] };

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
    <ThemeMusicProvider>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="Splash" component={Splash} />
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="Cadastro" component={Cadastro} />
          <Stack.Screen name="SelecaoJogos" component={SelecaoJogos} />
          <Stack.Screen name="Consultorio" component={Consultorio} />
          <Stack.Screen name="Jogo2" component={Jogo2} />
        </Stack.Navigator>
      </NavigationContainer>
    </ThemeMusicProvider>
  );
}
