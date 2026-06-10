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

type Props = NativeStackScreenProps<RootStackParamList, "SelecaoJogos">;
type GreetingGender = "Masculino" | "Feminino" | null;

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
        <Text style={styles.greetingText} numberOfLines={1}>
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
    top: 36,
    right: 18,
    zIndex: 50,
    alignItems: "flex-end",
  },
  greetingCard: {
    position: "absolute",
    top: 50,
    left: 16,
    width: 200,
    minHeight: 55,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.94)",
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    zIndex: 45,
    elevation: 45,
    borderWidth: 1.5,
    borderColor: "rgba(232, 219, 219, 0.95)",
    shadowColor: "#1F6FB2",
    shadowOpacity: 0.18,
    shadowRadius: 6,
  },
  greetingIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    color: "#173A6A",
    fontSize: 17,
    fontWeight: "400",
  },
  musicButton: {
    width: 100,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  musicButtonImage: {
    position: "absolute",
    top: 20,
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  musicButtonHidden: {
    opacity: 0,
  },
  logoArea: {
    position: "absolute",
    top: -150,
    left: 36,
    right: 36,
    height: 805,
    zIndex: 0,
    elevation: 0,
    alignItems: "center",
  },
  logo: {
    width: 320,
    height: 805,
    resizeMode: "contain",
  },
  spacer: {
    height: 395,
  },
  gamesWrapper: {
    position: "relative",
    paddingHorizontal: 30,
    paddingBottom: 76,
    height: 392,
    zIndex: 10,
    elevation: 10,
  },
  gameCard: {
    position: "absolute",
    left: 25,
    right: 25,
    minHeight: 240,
    zIndex: 11,
    elevation: 11,
  },
  gameCardBackground: {
    flex: 1,
    paddingLeft: 22,
    paddingRight: 74,
    justifyContent: "center",
  },
  gameCardJogo1: {
    top: -15,
  },
  gameCardJogo2: {
    top: 120,
  },
  gameCardImage: {
    resizeMode: "stretch",
  },
  gameTextBlock: {
    maxWidth: "100%",
  },
  gameTitle: {
    marginLeft: 8,
    fontSize: 20,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  gameSubtitle: {
    marginLeft: 8,
    marginTop: 3,
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  playButtonWrapper: {
    position: "absolute",
    right: -6,
    top: 6,
    bottom: 6,
    justifyContent: "center",
    zIndex: 20,
    elevation: 20,
  },
  playButtonImage: {
    width: 130,
    height: 160,
    resizeMode: "contain",
  },
});
