import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ImageBackground,
  Platform,
  StatusBar,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { onAuthStateChanged } from "firebase/auth";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import LottieView from "lottie-react-native";
import * as NavigationBar from "expo-navigation-bar";
import { RootStackParamList } from "../App";
import { auth } from "../services/firebase";
import { preloadAppAssets } from "../services/imagePreload";

type Props = NativeStackScreenProps<RootStackParamList, "Splash">;

export default function Splash({ navigation }: Props) {
  const animationRef = useRef<LottieView>(null);
  const nextRouteRef = useRef<"SelecaoJogos" | "Login" | null>(null);
  const [appReady, setAppReady] = useState(false);
  const [cesmacSplashFinished, setCesmacSplashFinished] = useState(false);
  const [showOdontoPlaySplash, setShowOdontoPlaySplash] = useState(false);

  const showNavigationBar = useCallback(() => {
    if (Platform.OS === "android") {
      void NavigationBar.setVisibilityAsync("visible").catch(() => {});
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    if (Platform.OS === "android") {
      void NavigationBar.setVisibilityAsync("hidden").catch(() => {});
    }

    animationRef.current?.play();

    const loadApp = async () => {
      const currentUser = await new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          unsubscribe();
          resolve(user);
        });
      });

      try {
        await preloadAppAssets();
      } catch {
      }

      if (isMounted) {
        nextRouteRef.current = currentUser ? "SelecaoJogos" : "Login";
        setAppReady(true);
      }
    };

    void loadApp();

    return () => {
      isMounted = false;
      showNavigationBar();
    };
  }, [showNavigationBar]);

  useEffect(() => {
    const nextRoute = nextRouteRef.current;

    if (!appReady || !cesmacSplashFinished || !nextRoute) {
      return;
    }

    setShowOdontoPlaySplash(true);

    const navigationTimer = setTimeout(() => {
      showNavigationBar();
      navigation.replace(nextRoute);
    }, 2500);

    return () => clearTimeout(navigationTimer);
  }, [appReady, cesmacSplashFinished, navigation, showNavigationBar]);

  if (showOdontoPlaySplash) {
    return (
      <ImageBackground
        source={require("../assets/splash/splash.png")}
        style={styles.container}
        imageStyle={styles.backgroundImage}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={Platform.OS === "ios" ? undefined : []}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
      <LottieView
        ref={animationRef}
        source={require("../assets/splash/lottie_citec.json")}
        style={styles.animation}
        resizeMode="cover"
        autoPlay={false}
        loop={false}
        onAnimationFinish={() => setCesmacSplashFinished(true)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  animation: {
    width: "100%",
    height: "100%",
  },

  backgroundImage: {
    resizeMode: "cover",
  },
});
