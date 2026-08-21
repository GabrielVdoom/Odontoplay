import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  ImageBackground,
  ImageSourcePropType,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { FontAwesome } from "@expo/vector-icons";
import { RootStackParamList } from "../App";
import { useThemeMusic } from "../contexts/ThemeMusicContext";
import { getCurrentUserProfile } from "../services/progress";
import { getScreenMetrics } from "../utils/responsive";

type Props = NativeStackScreenProps<RootStackParamList, "SelecaoJogos">;
type GreetingGender = "Masculino" | "Feminino" | null;
const { scale: s, moderateScale: ms } = getScreenMetrics();

export default function SelecaoJogosScreen({ navigation }: Props) {
  const [greeting, setGreeting] = useState("Seja bem-vindo!");
  const [greetingGender, setGreetingGender] = useState<GreetingGender>(null);
  const { isPlaying, startMusic, toggleMusic } = useThemeMusic();

  useEffect(() => {
    startMusic();
  }, [startMusic]);

  useEffect(() => {
    const loadProfile = async () => {
      const profile = await getCurrentUserProfile();

      if (!profile) {
        setGreeting("Seja bem-vindo!");
        setGreetingGender(null);
        return;
      }

      const name = String(profile.nome ?? "").trim();
      const firstName = name.split(/\s+/)[0];
      const gender = String(profile.genero ?? "");

      setGreeting(firstName ? `Olá, ${firstName}!` : "Seja bem-vindo!");
      setGreetingGender(gender === "Feminino" ? "Feminino" : "Masculino");
    };

    void loadProfile();
  }, []);

  const handleGamePress = (gameId: string, title: string) => {
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

  return (
    <ImageBackground
      source={require("../assets/selecao-jogos/background_selecao9.png")}
      style={styles.background}
      imageStyle={styles.backgroundImage}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
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

          <View style={styles.greetingCard}>
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
  musicControlArea: {
    position: "absolute",
    top: s(36),
    right: s(18),
    zIndex: 50,
    alignItems: "flex-end",
  },
  greetingCard: {
    position: "absolute",
    top: s(50),
    left: s(16),
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
    top: s(-150),
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
