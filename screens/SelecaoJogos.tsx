import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  ImageBackground,
  ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { signOut } from "firebase/auth";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { RootStackParamList } from "../App";
import { useThemeMusic } from "../contexts/ThemeMusicContext";
import { getCurrentUserProfile } from "../services/progress";
import { auth } from "../services/firebase";
import { useSceneMetrics, WEB_IMAGE_FILL } from "../utils/responsive";
import AccountDeletionControl from "./AccountDeletionControl";

type Props = NativeStackScreenProps<RootStackParamList, "SelecaoJogos">;
type GreetingGender = "Masculino" | "Feminino" | null;

export default function SelecaoJogosScreen({ navigation }: Props) {
  const metrics = useSceneMetrics();
  const tablet = metrics.isTabletLayout;
  const insets = useSafeAreaInsets();
  const styles = metrics.isTabletLayout ? createTabletStyles(metrics, metrics.topInset) : createPhoneStyles(metrics, insets.top);
  const { scale: s } = metrics;

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
      <View style={styles.safeArea}>
        <View style={styles.content}>
          <Pressable
            style={styles.backIconButton}
            hitSlop={0}
            onPress={handleBackToLogin}
          >
            <Ionicons name="chevron-back" size={tablet ? 30 * metrics.contentScale : 30} color="#FFFFFF" />
          </Pressable>

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
          <FontAwesome name="user" size={tablet ? 24 * metrics.contentScale : 24} color="#FFFFFF" />
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

          <View pointerEvents="none" style={styles.logoArea}>
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

          <Pressable
            style={[styles.musicControlArea, styles.musicButton]}
            onPress={toggleMusic}
            accessibilityRole="button"
            accessibilityLabel={isPlaying ? "Desativar música" : "Ativar música"}
          >
            <Image
              pointerEvents="none"
              source={require("../assets/selecao-jogos/botao_musica_desativado.png")}
              style={[styles.musicButtonImage, isPlaying && styles.musicButtonHidden]}
            />
            <Image
              pointerEvents="none"
              source={require("../assets/selecao-jogos/botao_musica_roxo5.png")}
              style={[styles.musicButtonImage, !isPlaying && styles.musicButtonHidden]}
            />
          </Pressable>
        </View>
      </View>
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
  const metrics = useSceneMetrics();
  const styles = metrics.isTabletLayout ? createTabletStyles(metrics) : createPhoneStyles(metrics);
  return (
    <View pointerEvents={metrics.isTabletLayout ? "box-none" : undefined} style={[styles.gameCard, cardStyle]}>
      <ImageBackground
        source={cardImage}
        pointerEvents={metrics.isTabletLayout ? "box-none" : undefined}
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

function createPhoneStyles(metrics: ReturnType<typeof useSceneMetrics>, topInset = 0) {
  const { scale: s, moderateScale: ms } = metrics;

  return StyleSheet.create({
  background: {
    flex: 1,
  },
  backgroundImage: {
    ...WEB_IMAGE_FILL,
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
    top: Math.max(s(66), topInset),
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
    top: Math.max(s(36), topInset) + s(20),
    right: s(10),
    zIndex: 50,
    elevation: 50,
  },
  accountCardArea: {
    position: "absolute",
    top: Math.max(s(60), topInset),
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
    ...WEB_IMAGE_FILL,
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
}


// Tablet-only styles. The phone styles above are preserved from the pre-tablet snapshot.
function createTabletStyles(metrics: ReturnType<typeof useSceneMetrics>, topInset = 0) {
  const { width, height, backgroundHeight, scale: s, moderateScale: ms } = metrics;
  const backSize = Math.max(44, s(42));
  const accountLeft = Math.max(s(68), s(18) + backSize + s(8));
  const greetingWidth = Math.min(width - accountLeft - s(118), Math.max(s(200), 180));
  // The PNG canvas includes transparent space above and below the card.
  // Keep the canvas aspect ratio and position its play target in that same
  // coordinate space, independently of text padding and intrinsic image size.
  const zoom = metrics.contentScale;
  const gutter = Math.max(16, Math.min(32 * zoom, width * 0.04));
  const bottomGap = Math.max(gutter, metrics.bottomInset + 12 * zoom);
  const artworkScale = 0.82;
  const cardWidth = Math.min(width - gutter * 2, 760 * zoom) * 0.88;
  const cardHeight = cardWidth * 1024 / 1536;
  const visibleCardHeight = cardHeight * 0.48;
  const cardGap = Math.max(16, Math.min(28 * zoom, height * 0.025));
  const groupHeight = visibleCardHeight * 2 + cardGap;
  const logoTop = Math.max(topInset + 100 * zoom, height * 0.12);
  const logoHeight = Math.max(120, height - bottomGap - groupHeight - logoTop - gutter);
  const contentLift = height * 0.09;
  const playSize = Math.max(80, Math.min(144 * zoom, cardWidth * 0.22));

  return StyleSheet.create({
  background: {
    flex: 1,
  },
  backgroundImage: {
    width: "100%",
    height: backgroundHeight,
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
    top: topInset + s(18),
    left: s(18),
    width: backSize,
    height: backSize,
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
    top: topInset + s(20),
    right: s(10),
    zIndex: 50,
    elevation: 50,
  },
  accountCardArea: {
    position: "absolute",
    top: topInset + s(12),
    left: accountLeft,
    zIndex: 45,
    elevation: 45,
    paddingBottom: s(8),
  },
  greetingCard: {
    width: greetingWidth,
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
    width: Math.max(s(175), 180),
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
    fontSize: ms(13),
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
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  musicButtonHidden: {
    opacity: 0,
  },
  logoArea: {
    position: "absolute",
    top: logoTop - contentLift,
    left: gutter,
    right: gutter,
    height: logoHeight,
    zIndex: 0,
    elevation: 0,
    alignItems: "center",
  },
  logo: {
    width: Math.min(width - gutter * 2, 700 * zoom) * artworkScale,
    height: logoHeight,
    resizeMode: "contain",
  },
  spacer: {
    height: 0,
  },
  gamesWrapper: {
    position: "absolute",
    left: (width - cardWidth) / 2,
    bottom: bottomGap + contentLift,
    width: cardWidth,
    height: groupHeight,
    zIndex: 10,
    elevation: 10,
  },
  gameCard: {
    position: "absolute",
    left: 0,
    right: 0,
    height: cardHeight,
    zIndex: 11,
    elevation: 11,
  },
  gameCardBackground: {
    width: cardWidth,
    height: cardHeight,
    justifyContent: "center",
  },
  gameCardJogo1: {
    top: -cardHeight * 0.24,
  },
  gameCardJogo2: {
    top: visibleCardHeight + cardGap - cardHeight * 0.24,
  },
  gameCardImage: {
    width: cardWidth,
    height: cardHeight,
    resizeMode: "contain",
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
    right: cardWidth * 0.06,
    top: (cardHeight - playSize) / 2,
    width: playSize,
    height: playSize,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
    elevation: 20,
  },
  playButtonImage: {
    width: s(130) * artworkScale * 1.3,
    height: s(160) * artworkScale * 1.3,
    resizeMode: "contain",
  },
});
}
