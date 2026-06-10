import React, { useEffect } from "react";
import { ImageBackground, StyleSheet } from "react-native";
import { onAuthStateChanged } from "firebase/auth";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";
import { auth } from "../services/firebase";
import { preloadInitialImages } from "../services/imagePreload";

type Props = NativeStackScreenProps<RootStackParamList, "Splash">;

export default function Splash({ navigation }: Props) {
  useEffect(() => {
    let isMounted = true;

    const loadApp = async () => {
      const minSplashTime = new Promise((resolve) => setTimeout(resolve, 2500));
      const currentUser = await new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          unsubscribe();
          resolve(user);
        });
      });

      try {
        await Promise.all([preloadInitialImages(), minSplashTime]);
      } catch {
        await minSplashTime;
      }

      if (isMounted) {
        navigation.replace(currentUser ? "SelecaoJogos" : "Login");
      }
    };

    void loadApp();

    return () => {
      isMounted = false;
    };
  }, [navigation]);

  return (
    <ImageBackground
      source={require("../assets/splash/splash.png")}
      style={styles.background}
      imageStyle={styles.backgroundImage}
    />
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },

  backgroundImage: {
    resizeMode: "cover",
  },
});
