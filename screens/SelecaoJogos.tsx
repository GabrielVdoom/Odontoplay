import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  ImageBackground,
  ImageSourcePropType,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { signOut } from "firebase/auth";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { RootStackParamList } from "../App";
import { useThemeMusic } from "../contexts/ThemeMusicContext";
import { getCurrentUserProfile } from "../services/progress";
import { auth } from "../services/firebase";
import { getScreenMetrics } from "../utils/responsive";
import AccountDeletionControl from "./AccountDeletionControl";

type Props = NativeStackScreenProps<RootStackParamList, "SelecaoJogos">;
type GreetingGender = "Masculino" | "Feminino" | null;
const { scale: s, moderateScale: ms } = getScreenMetrics();

export default function SelecaoJogosScreen({ navigation }: Props) {
  const [greeting, setGreeting] = useState("Seja bem-vindo!");
  const [greetingGender, setGreetingGender] = useState<GreetingGender>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [accountDeleted, setAccountDeleted] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [profileReady, setProfileReady] = useState(false);
  const hasAccount = !!auth.currentUser && !auth.currentUser.isAnonymous;
  const { isPlaying, startMusic, toggleMusic } = useThemeMusic();

  useEffect(() => {
    startMusic();
  }, [startMusic]);

  useEffect(() => {
    const loadProfile = async () => {
      const profile = await getCurrentUserProfile();
      setProfileReady(true);

      if (!profile) {
        setGreeting("Seja bem-vindo!");
        setGreetingGender(null);
        return;
      }

      const name = String(profile.nome ?? "").trim();
      const firstName = name.split(/\s+/)[0];
      const gender = String(profile.genero ?? "");

      setGreeting(firstName ? `Olá, ${firstName}!` : "Seja bem-vindo!");
      setGreetingGender(gender === "Feminino" || gender === "Masculino" ? gender : null);
    };

    void loadProfile().catch(() => {
      setProfileReady(true);
      Alert.alert("Não foi possível carregar sua conta", "Verifique sua conexão e tente novamente.");
    });
  }, []);

  const handleGamePress = (gameId: string, title: string) => {
    if (!profileReady) return;
    if (gameId === "jogo-1") {
      navigation.navigate("Consultorio");
      return;
    }

    if (gameId === "jogo-2") {
      navigation.navigate("Jogo2");
      return;
    }

    Alert.alert(title, "Esse jogo sera conectado na proxima etapa do Odontoplay.");
  };

  const handleBackToLogin = async () => {
    await signOut(auth).catch(() => null);
    navigation.reset({ index: 0, routes: [{ name: "Login" }] });
  };

  return (
    <ImageBackground
      source={require("../assets/selecao-jogos/background_selecao9.png")}
      style={styles.background}
      imageStyle={styles.backgroundImage}
    >
      {/* Preserve the existing Android spacing; the legacy view only applied insets on iOS. */}
      <SafeAreaView style={styles.safeArea} edges={Platform.OS === "ios" ? undefined : []}>
        <View style={styles.content}>
          <Pressable
            style={styles.backIconButton}
            hitSlop={0}
            onPress={handleBackToLogin}
          >
            <Ionicons name="chevron-back" size={30} color="#FFFFFF" />
          </Pressable>

          <View style={styles.musicControlArea}>
            <Pressable style={styles.musicButton} onPress={toggleMusic}>
              <Image
                source={require("../assets/selecao-jogos/botao_musica_desativado.png")}
                style={[
                  styles.musicButtonImage,
                  isPlaying && styles.musicButtonHidden,
                ]}
              />
              <Image
                source={require("../assets/selecao-jogos/botao_musica_roxo5.png")}
                style={[
                  styles.musicButtonImage,
                  !isPlaying && styles.musicButtonHidden,
                ]}
              />
            </Pressable>
          </View>

          <View style={styles.accountCardArea}>
          <Pressable
            style={styles.greetingCard}
            disabled={!hasAccount}
            accessibilityRole={hasAccount ? "button" : undefined}
            accessibilityLabel={hasAccount ? "Abrir opções da minha conta" : undefined}
            accessibilityState={hasAccount ? { expanded: accountMenuOpen } : undefined}
            onPress={() => {
              if (auth.currentUser && !auth.currentUser.isAnonymous) {
                setAccountMenuOpen((open) => !open);
              }
            }}
          >
            <View
              style={[
                styles.greetingIconCircle,
                greetingGender === "Feminino" && styles.greetingIconFemale,
                greetingGender === "Masculino" && styles.greetingIconMale,
              ]}
            >
          <FontAwesome name="user" size={24} color="#FFFFFF" />
        </View>
        <Text
          style={styles.greetingText}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.72}
        >
          {greeting}
        </Text>
          </Pressable>
          {hasAccount && accountMenuOpen && (
            <Pressable
              style={({ pressed }) => [
                styles.deleteAccountButton,
                pressed && styles.deleteAccountButtonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Excluir minha conta"
              accessibilityHint="Abre a confirmação antes de excluir sua conta"
              hitSlop={{ top: s(8), bottom: s(8), left: s(4), right: s(4) }}
              onPress={() => {
                if (auth.currentUser && !auth.currentUser.isAnonymous) setAccountOpen(true);
              }}
            >
              <Ionicons name="trash-outline" size={s(22)} color="#A52B38" />
              <Text style={styles.deleteAccountText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
                Excluir minha conta
              </Text>
            </Pressable>
          )}
          </View>

          <View style={styles.logoArea}>
            <Image
              source={require("../assets/selecao-jogos/logo_selecao.png")}
              style={styles.logo}
            />
          </View>

          <View style={styles.spacer} />

          <View style={styles.gamesWrapper}>
            <GameCard
              title=""
              subtitle=""
              cardImage={require("../assets/selecao-jogos/card1.png")}
              cardStyle={styles.gameCardJogo1}
              onPress={() => handleGamePress("jogo-1", "JOGO 1")}
            />

            <GameCard
              title=""
              subtitle=""
              cardImage={require("../assets/selecao-jogos/card8.png")}
              cardStyle={styles.gameCardJogo2}
              onPress={() => handleGamePress("jogo-2", "JOGO 2")}
            />
          </View>
        </View>
      </SafeAreaView>
      {(hasAccount || accountOpen) && <AccountDeletionControl
        visible={accountOpen}
        success={accountDeleted}
        iconBackgroundColor={greetingGender === "Feminino" ? "#fd92c7" : "#2F80ED"}
        onClose={() => setAccountOpen(false)}
        onDeleted={() => {
          setAccountDeleted(true);
          setAccountMenuOpen(false);
          setGreeting("Seja bem-vindo!");
          setGreetingGender(null);
        }}
        onContinue={() => {
          setAccountOpen(false);
          navigation.reset({ index: 0, routes: [{ name: "Login" }] });
        }}
      />}
    </ImageBackground>
  );
}

function GameCard({
  title,
  subtitle,
  cardImage,
  cardStyle,
  onPress,
}: {
  title: string;
  subtitle: string;
  cardImage: ImageSourcePropType;
  cardStyle: object;
  onPress: () => void;
}) {
  return (
    <View style={[styles.gameCard, cardStyle]}>
      <ImageBackground
        source={cardImage}
        style={styles.gameCardBackground}
        imageStyle={styles.gameCardImage}
      >
        <View style={styles.gameTextBlock}>
          <Text style={styles.gameTitle}>{title}</Text>
          <Text style={styles.gameSubtitle}>{subtitle}</Text>
        </View>

        <Pressable style={styles.playButtonWrapper} onPress={onPress}>
          <Image
            source={require("../assets/selecao-jogos/botao-play.png")}
            style={styles.playButtonImage}
          />
        </Pressable>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  backgroundImage: {
    resizeMode: "cover",
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  backIconButton: {
    position: "absolute",
    top: s(66),
    left: s(18),
    width: s(42),
    height: s(42),
    borderRadius: s(21),
    backgroundColor: "rgba(5, 47, 121, 0.52)",
    borderWidth: 1,
    borderColor: "rgba(205, 237, 255, 0.5)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 120,
    elevation: 120,
    shadowColor: "#03194C",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 5,
  },
  musicControlArea: {
    position: "absolute",
    top: s(36),
    right: s(10),
    zIndex: 50,
    alignItems: "flex-end",
  },
  accountCardArea: {
    position: "absolute",
    top: s(60),
    left: s(68),
    zIndex: 45,
    elevation: 45,
    paddingBottom: s(8),
  },
  greetingCard: {
    width: s(200),
    minHeight: s(55),
    borderRadius: s(30),
    backgroundColor: "rgba(255,255,255,0.94)",
    paddingHorizontal: s(10),
    flexDirection: "row",
    alignItems: "center",
    gap: s(9),
    zIndex: 45,
    elevation: 45,
    borderWidth: 1.5,
    borderColor: "rgba(232, 219, 219, 0.95)",
    shadowColor: "#1F6FB2",
    shadowOpacity: 0.18,
    shadowRadius: 6,
  },
  greetingIconCircle: {
    width: s(40),
    height: s(40),
    borderRadius: s(20),
    backgroundColor: "#2F80ED",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteAccountButton: {
    width: s(175),
    height: s(40),
    marginTop: s(8),
    marginLeft: s(8),
    paddingHorizontal: s(14),
    flexDirection: "row",
    alignItems: "center",
    gap: s(8),
    borderRadius: s(20),
    backgroundColor: "#FBE1E4",
    borderWidth: 1.1,
    borderColor: "#C66472",
    borderLeftWidth: 1.1,
    borderLeftColor: "#C66472",
  },
  deleteAccountButtonPressed: {
    backgroundColor: "#F6CFD3",
  },
  deleteAccountText: {
    flex: 1,
    minWidth: 0,
    color: "#A52B38",
    fontSize: s(13),
    lineHeight: s(20),
    fontWeight: "600",
    textAlign: "center",
    includeFontPadding: false,
  },
  greetingIconMale: {
    backgroundColor: "#2F80ED",
  },
  greetingIconFemale: {
    backgroundColor: "#fd92c7", 
  },
  greetingText: {
    left: 1,
    flex: 1,
    minWidth: 0,
    color: "#173A6A",
    fontSize: ms(17),
    lineHeight: ms(22),
    fontWeight: "400",
    includeFontPadding: false,
  },
  musicButton: {
    width: s(100),
    height: s(100),
    alignItems: "center",
    justifyContent: "center",
  },
  musicButtonImage: {
    position: "absolute",
    top: s(20),
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  musicButtonHidden: {
    opacity: 0,
  },
  logoArea: {
    position: "absolute",
    top: s(-130),
    left: s(36),
    right: s(36),
    height: s(805),
    zIndex: 0,
    elevation: 0,
    alignItems: "center",
  },
  logo: {
    width: s(320),
    height: s(805),
    resizeMode: "contain",
  },
  spacer: {
    height: s(395),
  },
  gamesWrapper: {
    position: "relative",
    paddingHorizontal: s(30),
    paddingBottom: s(76),
    height: s(392),
    zIndex: 10,
    elevation: 10,
  },
  gameCard: {
    position: "absolute",
    left: s(25),
    right: s(25),
    minHeight: s(240),
    zIndex: 11,
    elevation: 11,
  },
  gameCardBackground: {
    flex: 1,
    paddingLeft: s(22),
    paddingRight: s(74),
    justifyContent: "center",
  },
  gameCardJogo1: {
    top: s(-15),
  },
  gameCardJogo2: {
    top: s(120),
  },
  gameCardImage: {
    resizeMode: "stretch",
  },
  gameTextBlock: {
    maxWidth: "100%",
  },
  gameTitle: {
    marginLeft: s(8),
    fontSize: ms(20),
    fontWeight: "900",
    color: "#FFFFFF",
  },
  gameSubtitle: {
    marginLeft: s(8),
    marginTop: s(3),
    fontSize: ms(18),
    fontWeight: "800",
    color: "#FFFFFF",
  },
  playButtonWrapper: {
    position: "absolute",
    right: s(-6),
    top: s(6),
    bottom: s(6),
    justifyContent: "center",
    zIndex: 20,
    elevation: 20,
  },
  playButtonImage: {
    width: s(130),
    height: s(160),
    resizeMode: "contain",
  },
});
