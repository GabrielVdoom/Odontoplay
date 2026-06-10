import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  BackHandler,
  Dimensions,
  Image,
  ImageBackground,
  ImageSourcePropType,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { RootStackParamList } from "../App";
import { preloadConsultorioImages } from "../services/imagePreload";
import { saveGameProgress } from "../services/progress";

type Props = NativeStackScreenProps<RootStackParamList, "Consultorio">;

type Jogo1Objeto = {
  id: string;
  ordem: number;
  nome: string;
  descricao: string;
  imageSource: ImageSourcePropType;
  itemStyle?: object;
};

type ConsultorioCharacter = "menino" | "menina";

const instrumentTargetPosition = { left: 100, top: 342 };
const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const friendlyTextFont = Platform.select({
  android: "sans-serif-rounded",
  ios: "Avenir Next",
  default: "Arial",
});
const friendlyBoldFont = Platform.select({
  android: "sans-serif-rounded",
  ios: "AvenirNext-Bold",
  default: "Arial",
});
const completionConfetti = [
  { x: 0.04, delay: 80, duration: 5400, color: "#FF6CA8", width: 5, height: 22, rotation: -20 },
  { x: 0.12, delay: 520, duration: 5880, color: "#55D273", width: 5, height: 25, rotation: 24 },
  { x: 0.20, delay: 1040, duration: 5200, color: "#38C7E7", width: 4, height: 19, rotation: -35 },
  { x: 0.28, delay: 1540, duration: 5700, color: "#FF78AB", width: 5, height: 24, rotation: 18 },
  { x: 0.36, delay: 2100, duration: 5320, color: "#AC75E9", width: 4, height: 21, rotation: -12 },
  { x: 0.44, delay: 2660, duration: 5900, color: "#FFD542", width: 5, height: 20, rotation: 32 },
  { x: 0.56, delay: 310, duration: 5520, color: "#50CFE7", width: 4, height: 24, rotation: -28 },
  { x: 0.64, delay: 850, duration: 5800, color: "#FF7C45", width: 5, height: 20, rotation: 15 },
  { x: 0.72, delay: 1380, duration: 5260, color: "#FF6CA8", width: 5, height: 24, rotation: -32 },
  { x: 0.80, delay: 1910, duration: 5740, color: "#55D273", width: 4, height: 21, rotation: 25 },
  { x: 0.88, delay: 2380, duration: 5460, color: "#38C7E7", width: 5, height: 24, rotation: -16 },
  { x: 0.96, delay: 2880, duration: 5960, color: "#AC75E9", width: 4, height: 20, rotation: 30 },
  { x: 0.06, delay: 3040, duration: 5620, color: "#FFD542", width: 4, height: 23, rotation: -25 },
  { x: 0.14, delay: 3540, duration: 5220, color: "#FF6CA8", width: 5, height: 21, rotation: 22 },
  { x: 0.22, delay: 3900, duration: 5820, color: "#55D273", width: 4, height: 25, rotation: -34 },
  { x: 0.30, delay: 4300, duration: 5480, color: "#38C7E7", width: 5, height: 20, rotation: 17 },
  { x: 0.38, delay: 3380, duration: 6000, color: "#FF7C45", width: 4, height: 23, rotation: -18 },
  { x: 0.46, delay: 4060, duration: 5360, color: "#AC75E9", width: 5, height: 19, rotation: 28 },
  { x: 0.54, delay: 3220, duration: 5860, color: "#55D273", width: 4, height: 22, rotation: -30 },
  { x: 0.62, delay: 3740, duration: 5500, color: "#FF78AB", width: 5, height: 24, rotation: 19 },
  { x: 0.70, delay: 4220, duration: 5920, color: "#FFD542", width: 4, height: 20, rotation: -23 },
  { x: 0.78, delay: 3480, duration: 5240, color: "#38C7E7", width: 5, height: 25, rotation: 26 },
  { x: 0.86, delay: 3980, duration: 5780, color: "#FF6CA8", width: 4, height: 21, rotation: -31 },
  { x: 0.94, delay: 4480, duration: 5440, color: "#55D273", width: 5, height: 23, rotation: 16 },
] as const;

const completionStars = [
  { x: 0.07, delay: 530, duration: 4600, size: 19 },
  { x: 0.23, delay: 1750, duration: 4100, size: 16 },
  { x: 0.38, delay: 220, duration: 4900, size: 22 },
  { x: 0.58, delay: 1240, duration: 4300, size: 17 },
  { x: 0.76, delay: 440, duration: 4700, size: 20 },
  { x: 0.91, delay: 1610, duration: 4050, size: 18 },
] as const;

const instrumentos: Jogo1Objeto[] = [
  {
    id: "instrumento-1",
    ordem: 1,
    nome: "Motor",
    descricao: "Este motor ajuda a dentista a limpar e cuidar dos dentinhos com muito cuidado.",
    imageSource: require("../assets/jogo1/instrumento-1.png"),
  },
  {
    id: "instrumento-2",
    ordem: 2,
    nome: "Spray ar/água",
    descricao: "Este spray solta ar ou água para ajudar durante o atendimento no consultório.",
    imageSource: require("../assets/jogo1/instrumento-2.2.png"),
  },
  {
    id: "instrumento-3",
    ordem: 3,
    nome: "Sugador",
    descricao: "O sugador puxa a água (saliva) da boca para deixar tudo sequinho enquanto cuidamos dos dentes.",
    imageSource: require("../assets/jogo1/instrumento-3.png"),
  },
  {
    id: "instrumento-4",
    ordem: 4,
    nome: "Explorador",
    descricao: "Este explorador ajuda a dentista a observar os dentinhos e encontrar onde precisa de cuidado.",
    imageSource: require("../assets/jogo1/instrumento-4.png"),
  },
  {
    id: "instrumento-5",
    ordem: 5,
    nome: "Espelho",
    descricao: "O espelhinho deixa a dentista enxergar melhor cada cantinho da boca.",
    imageSource: require("../assets/jogo1/instrumento-5.png"),
  },
];

const instrumentOriginSlots = [
  { left: 38, top: 620 },
  { left: 112, top: 620 },
  { left: 192, top: 620 },
  { left: 266, top: 620 },
  { left: 330, top: 618 },
];

const practiceImages = [
  require("../assets/jogo1/pratica-1.png"),
  require("../assets/jogo1/pratica-2.2.png"),
  require("../assets/jogo1/pratica-3.png"),
  require("../assets/jogo1/pratica-4.png"),
  require("../assets/jogo1/pratica-5.png"),
] as const;

const girlPracticeImages = [
  require("../assets/jogo1/pratica-1-feminina.png"),
  require("../assets/jogo1/pratica-2-feminina.png"),
  require("../assets/jogo1/pratica-3-feminina.png"),
  require("../assets/jogo1/pratica-4-feminina.png"),
  require("../assets/jogo1/pratica-5-feminina.png"),
] as const;

const practiceTexts = [
  "A dentista usa o motor para limpar os dentinhos com cuidado. Ele gira rapidinho, faz um barulhinho, mas não dói nada!",
  "A dentista usa o spray ar/água para jogar um pouquinho de água ou ar. Assim a boca fica limpinha durante o atendimento!",
  "O sugador ajuda a tirar a saliva da boca. Ele faz um barulhinho divertido e deixa tudo mais confortável!",
  "O explorador ajuda a dentista a olhar cada cantinho dos dentinhos e descobrir onde precisa cuidar melhor.",
  "O espelhinho ajuda a dentista a enxergar os dentinhos por todos os lados, até os cantinhos escondidos!",
] as const;

export default function ConsultorioScreen({ navigation }: Props) {
  const [selectedInstrumentId, setSelectedInstrumentId] = useState<string | null>(null);
  const [animatedInstrumentId, setAnimatedInstrumentId] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showCharacterSelection, setShowCharacterSelection] = useState(true);
  const [selectedCharacter, setSelectedCharacter] = useState<ConsultorioCharacter>("menino");
  const [lessonStage, setLessonStage] = useState<"instrument" | "practice" | "success" | null>(null);
  const [lessonInstrumentId, setLessonInstrumentId] = useState<string | null>(null);
  const [visitedInstrumentIds, setVisitedInstrumentIds] = useState<string[]>([]);
  const [lastRewardEarned, setLastRewardEarned] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const dentistProgress = useRef(new Animated.Value(0)).current;
  const instructionsProgress = useRef(new Animated.Value(1)).current;
  const initialDentistProgress = useRef(new Animated.Value(0)).current;
  const selectedInstrumentProgress = useRef(new Animated.Value(0)).current;
  const lessonCardScale = useRef(new Animated.Value(0.94)).current;

  useEffect(() => {
    void preloadConsultorioImages().catch(() => undefined);
  }, []);

  useFocusEffect(
    useCallback(() => {
      const backSubscription = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          if (showCharacterSelection) {
            return false;
          }

          if (lessonStage === "success") {
            setLessonStage("practice");
            return true;
          }

          if (lessonStage === "practice") {
            setLessonStage("instrument");
            return true;
          }

          if (lessonStage === "instrument") {
            setLessonStage(null);
            setLessonInstrumentId(null);
            setLastRewardEarned(false);
            return true;
          }

          if (showCompletion) {
            navigation.goBack();
            return true;
          }

          return false;
        }
      );

      return () => backSubscription.remove();
    }, [lessonStage, navigation, showCharacterSelection, showCompletion])
  );

  useEffect(() => {
    selectedInstrumentProgress.setValue(0);

    if (!animatedInstrumentId) {
      return;
    }

    Animated.timing(selectedInstrumentProgress, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [animatedInstrumentId, selectedInstrumentProgress]);

  useEffect(() => {
    if (!lessonStage) {
      return;
    }

    lessonCardScale.setValue(0.94);

    Animated.spring(lessonCardScale, {
      toValue: 1,
      friction: 7,
      tension: 80,
      useNativeDriver: true,
    }).start();
  }, [lessonCardScale, lessonStage]);

  useEffect(() => {
    if (!showInstructions) {
      initialDentistProgress.setValue(0);
      return;
    }

    initialDentistProgress.setValue(0);
    Animated.spring(initialDentistProgress, {
      toValue: 1,
      friction: 8,
      tension: 58,
      useNativeDriver: true,
    }).start();
  }, [initialDentistProgress, showInstructions]);

  const selectedInstrument = useMemo(
    () => instrumentos.find((instrumento) => instrumento.id === animatedInstrumentId) ?? null,
    [animatedInstrumentId, instrumentos]
  );

  const lessonInstrument = useMemo(
    () => instrumentos.find((instrumento) => instrumento.id === lessonInstrumentId) ?? null,
    [instrumentos, lessonInstrumentId]
  );

  const lessonInstrumentIndex = useMemo(() => {
    if (!lessonInstrument) {
      return 0;
    }

    const index = instrumentos.findIndex((instrumento) => instrumento.id === lessonInstrument.id);
    return index >= 0 ? index : 0;
  }, [instrumentos, lessonInstrument]);

  const instrumentOriginPositions = useMemo(
    () =>
      Object.fromEntries(
        instrumentos.map((instrumento, index) => [
          instrumento.id,
          instrumentOriginSlots[index] ?? {
            left: instrumentOriginSlots[instrumentOriginSlots.length - 1].left + (index - 4) * 72,
            top: 620,
          },
        ])
      ) as Record<string, { left: number; top: number }>,
    [instrumentos]
  );

  const dentistTranslateX = dentistProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [70, 0],
  });

  const dentistTranslateY = dentistProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [18, 0],
  });

  const dentistScale = dentistProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.94, 1],
  });

  const floorPanelTranslateY = dentistProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [36, 0],
  });

  const initialDentistTranslateX = initialDentistProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [70, 0],
  });

  const initialDentistTranslateY = initialDentistProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [18, 0],
  });

  const selectedOrigin = animatedInstrumentId
    ? instrumentOriginPositions[animatedInstrumentId]
    : null;

  const selectedInstrumentTranslateX = selectedInstrumentProgress.interpolate({
    inputRange: [0, 1],
    outputRange: selectedOrigin
      ? [0, instrumentTargetPosition.left - selectedOrigin.left]
      : [0, 0],
  });

  const selectedInstrumentTranslateY = selectedInstrumentProgress.interpolate({
    inputRange: [0, 1],
    outputRange: selectedOrigin
      ? [0, instrumentTargetPosition.top - selectedOrigin.top]
      : [0, 0],
  });

  const selectedInstrumentScale = selectedInstrumentProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });

  const shouldShowNextInstrumentBubble =
    !showInstructions &&
    !lessonStage &&
    visitedInstrumentIds.length > 0 &&
    visitedInstrumentIds.length < instrumentos.length;

  const shouldShowInitialInstrumentBubble =
    !showInstructions && !lessonStage && visitedInstrumentIds.length === 0;

  const completionBackground =
    selectedCharacter === "menina"
      ? require("../assets/jogo1/background_meninafeliz3.png")
      : require("../assets/jogo1/background_meninofeliz.png");

  const childName = selectedCharacter === "menina" ? "Mariana" : "Lucas";
  const isGirlCharacter = selectedCharacter === "menina";
  const greetingLead = selectedCharacter === "menina" ? "Essa é a" : "Este é o";
  const greetingText = `${greetingLead} ${childName}!`;
  const currentPracticeImages = isGirlCharacter ? girlPracticeImages : practiceImages;
  const girlPink = "#EC6A9F";
  const boyBlue = "#243B8F";

  const closeLessonCard = () => {
    setLessonStage(null);
    setLessonInstrumentId(null);
    setLastRewardEarned(false);
  };

  const saveViewedInstrument = (instrumentId: string) => {
    setVisitedInstrumentIds((currentIds) => {
      if (currentIds.includes(instrumentId)) {
        return currentIds;
      }

      const nextIds = [...currentIds, instrumentId];
      const completedAll = instrumentos.length > 0 && nextIds.length >= instrumentos.length;

      void saveGameProgress("jogo1", {
        titulo: "Conheça o consultorio",
        concluido: completedAll,
        estrelas: nextIds.length,
        instrumentosVistos: nextIds,
      });

      return nextIds;
    });
  };

  const showSuccessLesson = () => {
    if (!lessonInstrument) {
      return;
    }

    setSelectedInstrumentId(lessonInstrument.id);
    setAnimatedInstrumentId(lessonInstrument.id);
    setLastRewardEarned(!visitedInstrumentIds.includes(lessonInstrument.id));
    saveViewedInstrument(lessonInstrument.id);
    setLessonStage("success");
  };

  const finishLessonCard = () => {
    const completedInstrumentIds = new Set(visitedInstrumentIds);

    if (lessonInstrument) {
      completedInstrumentIds.add(lessonInstrument.id);
    }

    setSelectedInstrumentId(null);
    setAnimatedInstrumentId(null);
    closeLessonCard();

    if (completedInstrumentIds.size >= instrumentos.length) {
      setShowCompletion(true);
    }
  };

  const startGameplay = () => {
    setShowInstructions(false);
    dentistProgress.setValue(0);

    Animated.spring(dentistProgress, {
      toValue: 1,
      friction: 8,
      tension: 62,
      useNativeDriver: true,
    }).start();
  };

  const retryGame = () => {
    setShowCompletion(false);
    setShowInstructions(true);
    setShowCharacterSelection(false);
    setSelectedInstrumentId(null);
    setAnimatedInstrumentId(null);
    setLessonInstrumentId(null);
    setLessonStage(null);
    setVisitedInstrumentIds([]);
    setLastRewardEarned(false);
    dentistProgress.setValue(0);
    instructionsProgress.setValue(1);
    initialDentistProgress.setValue(0);
  };

  if (showCompletion) {
    return (
      <CompletionScreen
        backgroundSource={completionBackground}
        isGirl={isGirlCharacter}
        onRetry={retryGame}
        onExit={() => navigation.goBack()}
      />
    );
  }

  return (
    <View style={styles.background}>
      <Image
        source={require("../assets/jogo1/background_menino3.png")}
        fadeDuration={0}
        style={[
          styles.backgroundLayer,
          isGirlCharacter && styles.backgroundLayerHidden,
        ]}
      />
      <Image
        source={require("../assets/jogo1/background_menina3.png")}
        fadeDuration={0}
        style={[
          styles.backgroundLayer,
          !isGirlCharacter && styles.backgroundLayerHidden,
        ]}
      />
      <View style={styles.overlay} />

      {!showInstructions && !showCharacterSelection ? (
        <Pressable style={styles.exitButton} onPress={() => navigation.goBack()}>
          <Image
            source={require("../assets/shared/botao_sair.png")}
            style={styles.exitButtonImage}
          />
        </Pressable>
      ) : null}

      {showInstructions || showCharacterSelection ? (
        <Pressable
          style={styles.backIconButton}
          hitSlop={0}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={30} color="#FFFFFF" />
        </Pressable>
      ) : null}

      <Animated.View
        style={[
          styles.dentistaWrapper,
          {
            opacity: dentistProgress,
            transform: [
              { translateX: dentistTranslateX },
              { translateY: dentistTranslateY },
              { scale: dentistScale },
            ],
          },
        ]}
      >
        <Image
          source={require("../assets/jogo1/dentista-2.png")}
          style={styles.dentistaExplicando}
        />
        
      </Animated.View>

      {shouldShowInitialInstrumentBubble || shouldShowNextInstrumentBubble ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.instrumentBubble,
            {
              opacity: dentistProgress,
            },
          ]}
        >
          <Image
            source={require("../assets/jogo1/balao.png")}
            style={styles.instrumentBubbleImage}
          />
          <View style={styles.instrumentBubbleTextBox}>
            {shouldShowInitialInstrumentBubble ? (
              <Text style={styles.initialInstrumentBubbleText}>
                <Text style={styles.instrumentBubbleTextHighlight}>Clique</Text>
                <Text> nos </Text>
                <Text style={styles.instrumentBubbleTextHighlight}>objetos</Text>
                <Text>{"\n"}para mostrar {isGirlCharacter ? "a" : "ao"} </Text>
                <Text style={styles.instrumentBubbleTextHighlight}>{childName}</Text>
                <Text>{"\n"}como funciona cada{"\n"}instrumento!</Text>
              </Text>
            ) : (
              <>
                <Text style={styles.nextInstrumentBubbleTitle}>
                  Que tal conhecer os{"\n"}
                  <Text style={styles.instrumentBubbleTextHighlight}>outros instrumentos?</Text>
                </Text>
                <Text style={styles.nextInstrumentBubbleText}>
                  Clique em outro objeto{"\n"}para descobrir!
                </Text>
              </>
            )}
          </View>
        </Animated.View>
      ) : null}

      <Animated.View
        style={[
          styles.floorPanelWrapper,
          {
            opacity: dentistProgress,
            transform: [{ translateY: floorPanelTranslateY }],
          },
        ]}
      >
        <ImageBackground
          source={require("../assets/shared/rectangle.png")}
          style={styles.floorPanel}
          imageStyle={styles.floorPanelImage}
        >
          {instrumentos.map((instrumento) => (
            <Pressable
              key={instrumento.id}
              onPress={() => {
                setLessonInstrumentId(instrumento.id);
                setLessonStage("instrument");
              }}
              style={[
                styles.instrumentButton,
              ]}
            >
              <Image
                source={instrumento.imageSource}
                style={[styles.instrumentoItem, instrumento.itemStyle]}
              />
            </Pressable>
          ))}
        </ImageBackground>
      </Animated.View>

      {lessonStage && lessonInstrument ? (
        <Animated.View
          style={styles.lessonOverlay}
        >
          <Animated.View
            style={[
              lessonStage === "instrument"
                ? styles.instrumentLessonCard
                : lessonStage === "practice"
                  ? styles.practiceLessonCard
                  : styles.successLessonCard,
              {
                transform: [{ scale: lessonCardScale }],
              },
            ]}
          >
            {lessonStage !== "success" ? (
              <Pressable style={styles.lessonCloseButton} onPress={closeLessonCard}>
                <Text style={styles.lessonCloseText}>{"\u00D7"}</Text>
              </Pressable>
            ) : null}

            {lessonStage === "instrument" ? (
              <>
                <View style={styles.lessonInstrumentHalo}>
                  <View style={styles.lessonInstrumentHaloRing} />
                  <View style={styles.lessonInstrumentHaloDottedRing} />
                  <View pointerEvents="none" style={styles.lessonSparkleGroupRight}>
                    <Text style={styles.lessonSparkleLarge}>{"\u2726"}</Text>
                    <Text style={styles.lessonSparkleSmall}>{"\u2726"}</Text>
                  </View>
                  <View pointerEvents="none" style={styles.lessonSparkleGroupLeft}>
                    <Text style={styles.lessonSparkleLarge}>{"\u2726"}</Text>
                    <Text style={styles.lessonSparkleSmall}>{"\u2726"}</Text>
                  </View>
                </View>
                <Image
                  source={lessonInstrument.imageSource}
                  style={styles.lessonInstrumentImage}
                />

                <View style={styles.instrumentTextBox}>
                  <Text style={styles.lessonInstrumentTitle}>{lessonInstrument.nome}</Text>
                  <View style={styles.instrumentTitleDivider}>
                    <View style={styles.instrumentDividerLine} />
                    <Ionicons name="medical" size={15} color="#8FD5FF" />
                    <View style={styles.instrumentDividerLine} />
                  </View>
                  <Text style={styles.lessonDescription}>
                    {lessonInstrument.descricao}
                  </Text>
                </View>

                <Pressable
                  style={styles.lessonPrimaryButton}
                  onPress={() => setLessonStage("practice")}
                >
                  <LinearGradient
                    colors={["#7568FF", "#4C46F7", "#3633D8"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.lessonPrimaryButtonGradient}
                  >
                    <Ionicons
                      name="sparkles"
                      size={23}
                      color="#FFFFFF"
                      style={styles.lessonPrimaryButtonLeftIcon}
                    />
                    <View style={styles.lessonPrimaryButtonCopy}>
                      <Text
                        style={styles.lessonPrimaryButtonText}
                        numberOfLines={1}
                      >
                        {"Mostrar na prática!"}
                      </Text>
                      <Text
                        style={styles.lessonPrimaryButtonSubtext}
                        numberOfLines={1}
                      >
                        Vamos ver como funciona
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={24}
                      color="#FFFFFF"
                      style={styles.lessonPrimaryButtonRightIcon}
                    />
                  </LinearGradient>
                </Pressable>
              </>
            ) : lessonStage === "practice" ? (
              <>
                <Text style={styles.practiceTitle}>{lessonInstrument.nome}</Text>
                <Image
                  source={currentPracticeImages[lessonInstrumentIndex] ?? currentPracticeImages[0]}
                  style={styles.practiceImage}
                />
                <Text style={styles.practiceDescription}>
                  {practiceTexts[lessonInstrumentIndex] ?? practiceTexts[0]}
                </Text>
                <Text style={styles.practiceHeart}>{"\u2661"}</Text>

                <Pressable
                  style={styles.lessonPrimaryButton}
                  onPress={showSuccessLesson}
                >
                  <LinearGradient
                    colors={["#7568FF", "#4C46F7", "#3633D8"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.lessonPrimaryButtonGradient}
                  >
                    <Ionicons
                      name="checkmark-circle"
                      size={23}
                      color="#FFFFFF"
                      style={styles.lessonPrimaryButtonLeftIcon}
                    />
                    <View style={styles.lessonPrimaryButtonCopy}>
                      <Text style={styles.lessonPrimaryButtonText}>Entendi!</Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={24}
                      color="#FFFFFF"
                      style={styles.lessonPrimaryButtonRightIcon}
                    />
                  </LinearGradient>
                </Pressable>
              </>
            ) : (
              <>
                <View style={styles.successCheckCircle}>
                  <Text style={styles.successCheckText}>{"\u2713"}</Text>
                </View>
                <Text style={styles.successTitle}>Muito bem!</Text>
                <Text style={styles.successDescription}>
                  Você aprendeu para que {"\n"} serve este instrumento!
                </Text>
                <Image
                  source={lessonInstrument.imageSource}
                  style={styles.successInstrumentImage}
                />
                <Text style={styles.successInstrumentName}>{lessonInstrument.nome}</Text>
                {lastRewardEarned ? (
                  <View style={styles.successRewardRow}>
                    <Image
                      source={require("../assets/jogo1/1star.png")}
                      style={styles.successRewardStar}
                    />
                    <Text style={styles.successRewardText}>+1 Estrelinha!</Text>
                  </View>
                ) : null}

                <Pressable style={styles.successButton} onPress={finishLessonCard}>
                  <Text style={styles.successButtonText}>Continuar</Text>
                </Pressable>
              </>
            )}
          </Animated.View>
        </Animated.View>
      ) : null}

      {showInstructions ? (
        <View style={styles.instructionsLayer}>
          <View style={styles.instructionsOverlay}>
            <Animated.Image
              source={require("../assets/jogo1/dentista-1.png")}
              style={[
                styles.dentistaInicial,
                isGirlCharacter && styles.dentistaInicialGirl,
                {
                  opacity: initialDentistProgress,
                  transform: [
                    { translateX: initialDentistTranslateX },
                    { translateY: initialDentistTranslateY },
                  ],
                },
              ]}
            />

            <View style={styles.instructionsVisitImageFrame}>
              <Image
                source={require("../assets/jogo1/titulo3.png")}
                style={styles.instructionsVisitImage}
              />
            </View>

            <View
              style={[
                styles.instructionsBoxFrame,
                isGirlCharacter && styles.instructionsBoxFrameGirl,
              ]}
            >
              <LinearGradient
                colors={["rgba(16, 94, 199, 0.99)", "rgba(5, 62, 153, 0.98)", "rgba(2, 42, 116, 0.99)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.instructionsBox}
              >
              <View style={styles.instructionsHero}>
                <Text style={styles.instructionsCardSparkle}>{"\u2726"}</Text>
                <View style={styles.instructionsGreetingLogo}>
                  <Text style={[styles.instructionsGreetingLayer, styles.instructionsGreetingStroke]}>
                    {greetingText}
                  </Text>
                  <Text style={[styles.instructionsGreetingLayer, styles.instructionsGreetingDepth]}>
                    {greetingText}
                  </Text>
                  <Text style={styles.instructionsGreeting}>
                    {greetingLead}{" "}
                    <Text
                      style={[
                        styles.instructionsName,
                        isGirlCharacter && styles.instructionsNameGirl,
                      ]}
                    >
                      {childName}!
                    </Text>
                  </Text>
                </View>
                <Text style={styles.instructionsCardSparkle}>{"\u2726"}</Text>
              </View>
              <Text style={styles.instructionsText}>
                Hoje é a primeira consulta {selectedCharacter === "menina" ? "dela" : "dele"}.{"\n"}
                {selectedCharacter === "menina" ? "Ela está" : "Ele está"} um
                pouquinho {selectedCharacter === "menina" ? "nervosa" : "nervoso"}.
              </Text>
              <LinearGradient
                colors={["rgba(95, 174, 245, 0.20)", "rgba(255, 255, 255, 0.06)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.instructionsInvite}
              >
                <View
                  style={[
                    styles.instructionsInviteIcon,
                    isGirlCharacter && styles.instructionsInviteIconGirl,
                  ]}
                >
                  <Ionicons
                    name="search-outline"
                    size={24}
                    color={isGirlCharacter ? "#FFD5E7" : "#C9EBFF"}
                  />
                </View>
                <View style={styles.instructionsInviteCopy}>
                  <Text style={styles.instructionsPromptLine}>
                    Vamos ajudar {selectedCharacter === "menina" ? "a" : "o"}{" "}
                    <Text
                      style={[
                        styles.instructionsPromptName,
                        isGirlCharacter && styles.instructionsPromptNameGirl,
                      ]}
                    >
                      {childName}
                    </Text>
                    {" a conhecer"}
                  </Text>
                  <Text style={styles.instructionsPromptLine}>
                    {"os instrumentos do consult\u00f3rio?"}
                  </Text>
                </View>
              </LinearGradient>
              <Pressable
                style={styles.instructionsButton}
                onPress={startGameplay}
              >
                <LinearGradient
                  colors={["#A8F45F", "#53CC20", "#27A814"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.instructionsButtonGradient}
                >
                  <Text style={styles.instructionsButtonText}>Começar</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={28}
                    color="#FFFFFF"
                    style={styles.instructionsButtonIcon}
                  />
                </LinearGradient>
              </Pressable>
              </LinearGradient>
            </View>
          </View>
        </View>
      ) : null}

      {showCharacterSelection ? (
        <View style={styles.characterSelectionOverlay}>
          <View style={styles.characterSelectionBox}>
            <View style={styles.characterSelectionHeader}>
              <View style={styles.characterSelectionToothSlot}>
                <Image
                  source={require("../assets/jogo2/dente_titulo.png")}
                  style={styles.characterSelectionTooth}
                />
              </View>

              <Text
                style={[
                  styles.characterSelectionTitle,
                ]}
              >
                Escolha seu{"\n"}personagem!
              </Text>
            </View>

            <View style={styles.characterCardsPanel}>
              <View style={styles.characterCardsRow}>
                <ConsultorioCharacterCard
                  type="menino"
                  title="Menino"
                  active={selectedCharacter === "menino"}
                  onPress={() => setSelectedCharacter("menino")}
                />

                <ConsultorioCharacterCard
                  type="menina"
                  title="Menina"
                  active={selectedCharacter === "menina"}
                  onPress={() => setSelectedCharacter("menina")}
                />
              </View>
            </View>

            <Text
              style={[
                styles.characterSelectionReady,
              ]}
            >
              Pronto(a)? Vamos começar!
            </Text>

            <Pressable
              style={styles.characterContinueButton}
              onPress={() => {
                setShowCharacterSelection(false);
                setShowInstructions(true);
              }}
            >
              <LinearGradient
                colors={["#62C8FF", "#2F9BDF", "#176FB9"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.characterContinueGradient}
              >
                <Text style={styles.characterContinueText}>Começar</Text>
                <Ionicons
                  name="chevron-forward"
                  size={21}
                  color="#FFFFFF"
                  style={styles.characterButtonRightIcon}
                />
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

function ConsultorioCharacterCard({
  type,
  title,
  active,
  onPress,
}: {
  type: ConsultorioCharacter;
  title: string;
  active: boolean;
  onPress: () => void;
}) {
  const isBoy = type === "menino";
  const iconSource = isBoy
    ? require("../assets/jogo2/icone_menino2.png")
    : require("../assets/jogo2/icone_menina2.png");

  return (
    <Pressable
      style={[
        styles.characterCard,
        isBoy ? styles.characterCardBoy : styles.characterCardGirl,
        active &&
          (isBoy
            ? styles.characterCardBoyActive
            : styles.characterCardGirlActive),
      ]}
      onPress={onPress}
    >
      <LinearGradient
        pointerEvents="none"
        colors={
          active
            ? isBoy
              ? ["#EAF9FF", "#BDEBFF"]
              : ["#FFF0F7", "#FFC9E3"]
            : isBoy
              ? ["#F9FDFF", "#DDF3FF"]
              : ["#FFF9FC", "#FFE0F0"]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.characterCardGradient}
      />
      <View pointerEvents="none" style={styles.characterCardIconSlot}>
        <Image source={iconSource} style={styles.characterCardIcon} />
      </View>

      <Text
        style={[
          styles.characterCardTitle,
          isBoy ? styles.characterCardTitleBoy : styles.characterCardTitleGirl,
          active && styles.characterCardTitleActive,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

function CompletionConfetti() {
  const progressValues = useRef(
    completionConfetti.map(() => new Animated.Value(0))
  ).current;
  const starProgressValues = useRef(
    completionStars.map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    const animations = progressValues.map((progress, index) => {
      const particle = completionConfetti[index];

      return Animated.loop(
        Animated.sequence([
          Animated.delay(particle.delay),
          Animated.timing(progress, {
            toValue: 1,
            duration: particle.duration,
            useNativeDriver: true,
          }),
          Animated.timing(progress, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
    });
    const starAnimations = starProgressValues.map((progress, index) => {
      const star = completionStars[index];

      return Animated.loop(
        Animated.sequence([
          Animated.delay(star.delay),
          Animated.timing(progress, {
            toValue: 1,
            duration: star.duration,
            useNativeDriver: true,
          }),
          Animated.timing(progress, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
    });

    animations.forEach((animation) => animation.start());
    starAnimations.forEach((animation) => animation.start());

    return () => {
      animations.forEach((animation) => animation.stop());
      starAnimations.forEach((animation) => animation.stop());
    };
  }, [progressValues, starProgressValues]);

  return (
    <View pointerEvents="none" style={styles.completionConfettiLayer}>
      {completionConfetti.map((particle, index) => {
        const progress = progressValues[index];

        return (
          <Animated.View
            key={`${particle.x}-${particle.color}`}
            style={[
              styles.completionConfettiPiece,
              {
                left: screenWidth * particle.x,
                width: particle.width,
                height: particle.height,
                backgroundColor: particle.color,
                opacity: progress.interpolate({
                  inputRange: [0, 0.08, 0.9, 1],
                  outputRange: [0, 1, 1, 0],
                }),
                transform: [
                  {
                    translateY: progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-40, screenHeight + 30],
                    }),
                  },
                  {
                    translateX: progress.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [-8, 10, -5],
                    }),
                  },
                  {
                    rotate: progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [
                        `${particle.rotation}deg`,
                        `${particle.rotation + 360}deg`,
                      ],
                    }),
                  },
                ],
              },
            ]}
          />
        );
      })}
      {completionStars.map((star, index) => {
        const progress = starProgressValues[index];

        return (
          <Animated.Text
            key={`star-${star.x}`}
            style={[
              styles.completionConfettiStar,
              {
                left: screenWidth * star.x,
                fontSize: star.size,
                opacity: progress.interpolate({
                  inputRange: [0, 0.08, 0.9, 1],
                  outputRange: [0, 1, 1, 0],
                }),
                transform: [
                  {
                    translateY: progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-45, screenHeight + 28],
                    }),
                  },
                  {
                    translateX: progress.interpolate({
                      inputRange: [0, 0.45, 1],
                      outputRange: [7, -10, 6],
                    }),
                  },
                  {
                    rotate: progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["0deg", "280deg"],
                    }),
                  },
                ],
              },
            ]}
          >
            {"\u2726"}
          </Animated.Text>
        );
      })}
    </View>
  );
}

function CompletionScreen({
  backgroundSource,
  isGirl,
  onRetry,
  onExit,
}: {
  backgroundSource: ImageSourcePropType;
  isGirl: boolean;
  onRetry: () => void;
  onExit: () => void;
}) {
  const completionDentistProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    completionDentistProgress.setValue(0);
    Animated.spring(completionDentistProgress, {
      toValue: 1,
      friction: 8,
      tension: 58,
      useNativeDriver: true,
    }).start();
  }, [completionDentistProgress]);

  const completionDentistTranslateX = completionDentistProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [85, 0],
  });

  const completionDentistTranslateY = completionDentistProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [22, 0],
  });

  return (
    <ImageBackground
      source={backgroundSource}
      style={styles.completionContainer}
      imageStyle={styles.completionBackground}
    >
      <CompletionConfetti />

      <Pressable style={styles.completionExitButton} onPress={onExit}>
        <Image
          source={require("../assets/shared/botao_sair.png")}
          style={styles.completionExitImage}
        />
      </Pressable>

      <View style={styles.completionBubble}>
        <Image
          source={require("../assets/jogo1/balao.png")}
          style={styles.completionBubbleImage}
        />
        <View style={styles.completionTitleRow}>
          <Text style={styles.completionTitleStar}>★</Text>
          <Text
            style={[
              styles.completionTitle,
              isGirl && { color: "#243B8F" },
            ]}
          >
            Parabéns!
          </Text>
          <Text style={styles.completionTitleStar}>★</Text>
        </View>
        <View style={styles.completionHeadlineBox}>
          <Text
            style={[
              styles.completionHeadlineLead,
              isGirl && { color: "#EC6A9F" },
            ]}
          >
            Você concluiu
          </Text>
          <Text
            style={[
              styles.completionHeadlineAccent,
              isGirl && { color: "#243B8F" },
            ]}
          >
            todos os instrumentos!
          </Text>
        </View>
        <Text style={styles.completionSparkle}>✦</Text>
        <View style={styles.completionBubbleTail} />
      </View>

      <Animated.Image
        source={require("../assets/jogo1/dentista-2.png")}
        style={[
          styles.completionDentist,
          {
            opacity: completionDentistProgress,
            transform: [
              { translateX: completionDentistTranslateX },
              { translateY: completionDentistTranslateY },
            ],
          },
        ]}
      />

      <Pressable style={styles.completionRetryButton} onPress={onRetry}>
        <Image
          source={require("../assets/jogo2/botao_jogarnovamente2.png")}
          style={styles.completionRetryButtonImage}
        />
      </Pressable>

      <ImageBackground
        source={require("../assets/shared/rectangle.png")}
        style={styles.completionFloorPanelWrapper}
        imageStyle={styles.floorPanelImage}
      >
        <View style={styles.floorPanel}>
        {instrumentos.map((instrumento) => (
          <View
            key={instrumento.id}
            style={[styles.instrumentButton, styles.completionInstrumentButton]}
          >
            <Image
              source={instrumento.imageSource}
              style={[styles.instrumentoItem, instrumento.itemStyle]}
            />
            <Image
              source={require("../assets/jogo1/1star.png")}
              style={styles.completionInstrumentStar}
            />
          </View>
        ))}
        </View>
      </ImageBackground>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  completionContainer: {
    flex: 1,
    backgroundColor: "#DCEBFF",
    overflow: "hidden",
  },
  completionBackground: {
    resizeMode: "cover",
  },
  completionConfettiLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 6,
  },
  completionConfettiPiece: {
    position: "absolute",
    top: 0,
    borderRadius: 3,
  },
  completionConfettiStar: {
    position: "absolute",
    top: 0,
    color: "#FFD542",
    fontWeight: "900",
    textShadowColor: "rgba(255, 181, 35, 0.45)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  completionExitButton: {
    position: "absolute",
    top: 44,
    right: 18,
    zIndex: 20,
  },
  completionExitImage: {
    width: 120,
    height: 100,
    resizeMode: "contain",
  },
  completionBubble: {
    position: "absolute",
    left: 18,
    right: 68,
    top: 108,
    height: 222,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 8,
  },
  completionBubbleImage: {
    right: 0,
    position: "absolute",
    width: "100%",
    height: "100%",
    resizeMode: "stretch",
    transform: [{ scaleX: -1 }],
  },
  completionBubbleTail: {
    display: "none",
  },
  completionTitleRow: {
    marginTop: -12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    maxWidth: 250,
  },
  completionTitleStar: {
    color: "#FFD24A",
    fontSize: 23,
    lineHeight: 27,
    fontWeight: "900",
    textShadowColor: "rgba(180, 106, 0, 0.28)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  completionTitle: {
    color: "#E44D8C",
    fontSize: 25,
    lineHeight: 29,
    fontWeight: "900",
    textAlign: "center",
  },
  completionHeadlineBox: {
    marginTop: 8,
    alignItems: "center",
    justifyContent: "center",
    maxWidth: 238,
  },
  completionHeadlineLead: {
    color: "#112D91",
    fontSize: 17,
    lineHeight: 21,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: 0.1,
  },
  completionHeadlineAccent: {
    marginTop: 1,
    color: "#112D91",
    fontSize: 19,
    lineHeight: 23,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: 0.15,
    textShadowColor: "rgba(255, 211, 74, 0.34)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  completionSparkle: {
    display: "none",
  },
  completionDentist: {
    position: "absolute",
    left: 153,
    bottom: 198,
    width: 300,
    height: 435,
    resizeMode: "contain",
    zIndex: 7,
  },
  completionRetryButton: {
    position: "absolute",
    left: 72,
    right: 72,
    top: 455,
    height: 74,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 12,
    elevation: 12,
  },
  completionRetryButtonImage: {
    top: 50,
    width: 180,
    height: 74,
    resizeMode: "contain",
  },
  completionFloorPanelWrapper: {
    position: "absolute",
    left: 14,
    right: 13,
    bottom: 65,
    height: 290,
    zIndex: 10,
  },
  completionInstrumentButton: {
    position: "relative",
  },
  completionInstrumentStar: {
    position: "absolute",
    bottom: -14,
    width: 40,
    height: 42,
    resizeMode: "contain",
  },
  characterSelectionOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 70,
    backgroundColor: "rgba(17, 74, 121, 0.28)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  characterSelectionBox: {
    width: "93%",
    maxWidth: 350,
    height: 470,
    padding: 10,
    borderRadius: 28,
    backgroundColor: "rgba(250, 254, 255, 0.98)",
    borderWidth: 2,
    borderColor: "rgba(126, 207, 250, 0.72)",
    paddingHorizontal: 16,
    paddingVertical: 22,
    alignItems: "center",
    justifyContent: "flex-start",
    shadowColor: "#075B9C",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  characterSelectionHeader: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  characterSelectionToothSlot: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
  characterSelectionTooth: {
    width: 134,
    height: 104,
    resizeMode: "contain",
  },
  characterSelectionTitle: {
    fontFamily: "Nunito_800ExtraBold",
    color: "#1557A7",
    fontSize: 26,
    lineHeight: 30,
    fontWeight: "900",
    textAlign: "left",
    letterSpacing: 0.2,
    textShadowColor: "rgba(149, 220, 255, 0.25)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  characterCardsPanel: {
    width: "100%",
    marginTop: 20,
    borderRadius: 20,
    backgroundColor: "rgba(238, 249, 255, 0.72)",
    borderWidth: 1,
    borderColor: "rgba(192, 234, 255, 0.86)",
    paddingHorizontal: 10,
    paddingTop: 12,
    paddingBottom: 12,
  },
  characterCardsRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },
  characterCard: {
    position: "relative",
    width: "46%",
    height: 206,
    borderRadius: 22,
    borderWidth: 2,
    paddingHorizontal: 8,
    paddingTop: 10,
    paddingBottom: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    shadowColor: "#176EAE",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  characterCardBoy: {
    borderColor: "#64B5F6",
  },
  characterCardGirl: {
    borderColor: "#F48FBE",
  },
  characterCardBoyActive: {
    borderColor: "#1489E8",
    borderWidth: 3,
    backgroundColor: "rgba(224, 244, 255, 0.52)",
    shadowColor: "#3498DB",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    transform: [{ scale: 1.01 }],
  },
  characterCardGirlActive: {
    borderColor: "#E94491",
    borderWidth: 3,
    backgroundColor: "rgba(255, 237, 247, 0.58)",
    shadowColor: "#F48FBE",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    transform: [{ scale: 1.01 }],
  },
  characterCardGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 19,
  },
  characterCardIconSlot: {
    width: 112,
    height: 112,
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
  characterCardIcon: {
    width: 255,
    height: 255,
    resizeMode: "contain",
  },
  characterCardTitle: {
    fontFamily: "Nunito_800ExtraBold",
    marginTop: 8,
    fontSize: 25,
    fontWeight: "900",
    textAlign: "center",
  },
  characterCardTitleBoy: {
    color: "#1F8CE3",
  },
  characterCardTitleGirl: {
    color: "#EB6AA3",
  },
  characterCardTitleActive: {
    transform: [{ scale: 1.02 }],
  },
  characterSelectionReady: {
    fontFamily: "Nunito_800ExtraBold",
    marginTop: 12,
    color: "#1D4E91",
    fontSize: 17,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: 0.15,
    textShadowColor: "rgba(186, 234, 255, 0.25)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  characterContinueButton: {
    marginTop: 15,
    width: 240,
    height: 52,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#02649F",
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.32,
    shadowRadius: 11,
    elevation: 9,
    overflow: "hidden",
  },
  characterContinueGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 23,
    borderWidth: 2.5,
    borderColor: "rgba(196, 237, 255, 0.95)",
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  characterButtonRightIcon: {
    position: "absolute",
    right: 18,
  },
  characterContinueText: {
    fontFamily: "Nunito_800ExtraBold",
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "900",
    textShadowColor: "rgba(4, 68, 123, 0.45)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 2,
    width: "100%",
    textAlign: "center",
  },
  background: {
    flex: 1,
    backgroundColor: "#EEF5FF",
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  backgroundLayerHidden: {
    opacity: 0,
  },
  overlay: {
    flex: 1,
  },
  exitButton: {
    position: "absolute",
    top: 44,
    right: 18,
    zIndex: 10,
  },
  exitButtonImage: {
    width: 120,
    height: 100,
    resizeMode: "contain",
  },
  backIconButton: {
    position: "absolute",
    top: 48,
    left: 18,
    width: 42,
    height: 42,
    borderRadius: 21,
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
  dentistaWrapper: {
    position: "absolute",
    left: 18,
    bottom: 184,
    zIndex: 4,
  },
  dentistaInicial: {
    top: 130,
    right: -60,
    bottom: 0,
    width: 280,
    height: 435,
    resizeMode: "contain",
    zIndex: 1,
  },
  dentistaInicialGirl: {
    top: 142,
  },
  dentistaExplicando: {
    top: -15,
    left: 135,
    width: 300,
    height: 435,
    resizeMode: "contain",
  },
  instrumentBubble: {
    position: "absolute",
    left: 10,
    top: 96,
    width: 300,
    height: 200,
    zIndex: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  instrumentBubbleImage: {
    position: "absolute",
    width: 320,
    height: 200,
    resizeMode: "stretch",
    transform: [{ scaleX: -1 }],
  },
  instrumentBubbleTextBox: {
    width: 248,
    minHeight: 132,
    marginTop: -12,
    marginLeft: -6,
    alignItems: "center",
    justifyContent: "center",
  },
  initialInstrumentBubbleText: {
    fontFamily: "Nunito_800ExtraBold",
    color: "#374255",
    fontSize: 19,
    lineHeight: 26,
    fontWeight: "900",
    textAlign: "center",
    includeFontPadding: false,
    textShadowColor: "rgba(255, 255, 255, 0.95)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  instrumentBubbleTextHighlight: {
    color: "#0057C8",
    fontWeight: "900",
    textShadowColor: "rgba(70, 150, 255, 0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  nextInstrumentBubbleTitle: {
    fontFamily: "Nunito_800ExtraBold",
    color: "#374255",
    fontSize: 20,
    lineHeight: 29,
    fontWeight: "900",
    textAlign: "center",
    includeFontPadding: false,
    textShadowColor: "rgba(255, 255, 255, 0.95)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  nextInstrumentBubbleText: {
    marginTop: 6,
    fontFamily: "Nunito_800ExtraBold",
    color: "#374255",
    fontSize: 17,
    lineHeight: 24,
    fontWeight: "900",
    textAlign: "center",
    includeFontPadding: false,
    textShadowColor: "rgba(255, 255, 255, 0.95)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  floorPanelWrapper: {
    position: "absolute",
    left: 14,
    right: 13,
    bottom: 65,
    height: 290,
    zIndex: 6,
  },
  floorPanel: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  floorPanelImage: {
    resizeMode: "stretch",
    width:600,
    height:430,
    left:-120,
    
  },
  instrumentButton: {
    alignItems: "center",
    justifyContent: "flex-end",
  },
  instrumentoItem: {
    width: 60,
    height: 140,
    resizeMode: "contain",
  },
  lessonOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 80,
    elevation: 0,
    backgroundColor: "rgba(10, 25, 55, 0.72)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
  },
  instrumentLessonCard: {
    width: "86%",
    minHeight: 520,
    borderRadius: 30,
    borderWidth: 2.5,
    borderColor: "#D8ECFF",
    backgroundColor: "#F9FCFF",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 34,
    paddingBottom: 22,
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    overflow: "hidden",
  },
  practiceLessonCard: {
    width: "92%",
    minHeight: 610,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#6EA8F7",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 34,
    paddingBottom: 24,
    shadowColor: "#0F3C88",
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 10,
  },
  successLessonCard: {
    width: "82%",
    minHeight: 480,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: "#61C9A8",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    paddingHorizontal: 22,
    paddingTop: 54,
    paddingBottom: 22,
    shadowColor: "#0F3C88",
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 10,
  },
  lessonCloseButton: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#3939ff",
    borderWidth: 2,
    borderColor: "#DCEBFF",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 8,
    shadowColor: "#143E82",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
  },
  lessonCloseText: {
    color: "#FFFFFF",
    fontSize: 30,
    lineHeight: 32,
    fontWeight: "900",
  },
  lessonInstrumentHalo: {
    position: "absolute",
    top: 24,
    width: 292,
    height: 292,
    borderRadius: 146,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  lessonInstrumentHaloRing: {
    position: "absolute",
    width: 226,
    height: 226,
    borderRadius: 113,
    borderWidth: 4,
    borderColor: "#FFFFFF",
    backgroundColor: "#EDF5FF",
  },
  lessonInstrumentHaloDottedRing: {
    position: "absolute",
    width: 244,
    height: 244,
    borderRadius: 122,
    borderWidth: 2,
    borderStyle: "dotted",
    borderColor: "rgba(103, 148, 221, 0.18)",
  },
  lessonSparkleGroupRight: {
    position: "absolute",
    top: 78,
    right: 16,
    zIndex: 3,
  },
  lessonSparkleGroupLeft: {
    position: "absolute",
    left: 16,
    bottom: 58,
    zIndex: 3,
  },
  lessonSparkleLarge: {
    color: "#4F7FE8",
    fontSize: 25,
    lineHeight: 26,
    fontWeight: "900",
  },
  lessonSparkleSmall: {
    marginLeft: 20,
    marginTop: -3,
    color: "#4F7FE8",
    fontSize: 18,
    lineHeight: 20,
    fontWeight: "900",
  },
  lessonInstrumentImage: {
    width: 170,
    height: 240,
    resizeMode: "contain",
    zIndex: 2,
  },
  instrumentTextBox: {
    width: "100%",
    marginTop: 8,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#EEF6FF",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 18,
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  instrumentTitleDivider: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 9,
  },
  instrumentDividerLine: {
    width: 70,
    height: 1.4,
    borderRadius: 1,
    backgroundColor: "#C9E2FF",
  },
  lessonDescription: {
    color: "#263F82",
    fontSize: 16.5,
    lineHeight: 22,
    fontWeight: "600",
    textAlign: "center",
  },
  lessonPrimaryButton: {
    width: "98%",
    minHeight: 64,
    marginTop: 16,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    overflow: "hidden",
  },
  lessonPrimaryButtonGradient: {
    width: "100%",
    minHeight: 64,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: "#A9C0FF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 34,
  },
  lessonPrimaryButtonCopy: {
    width: "100%",
    alignItems: "center",
    minWidth: 0,
  },
  lessonPrimaryButtonLeftIcon: {
    position: "absolute",
    left: 14,
  },
  lessonPrimaryButtonRightIcon: {
    position: "absolute",
    right: 14,
  },
  lessonPrimaryButtonText: {
    color: "#ffffff",
    fontSize: 18,
    lineHeight: 23,
    fontWeight: "900",
    width: "100%",
    textAlign: "center",
    textShadowColor: "rgba(18, 18, 110, 0.45)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  lessonPrimaryButtonSubtext: {
    marginTop: 1,
    color: "#E8ECFF",
    fontSize: 13,
    lineHeight: 16,
    fontWeight: "600",
    width: "100%",
    textAlign: "center",
  },
  lessonInstrumentTitle: {
    color: "#0A4CB3",
    fontSize: 32,
    lineHeight: 37,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 3,
    textShadowColor: "rgba(58, 125, 226, 0.12)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  practiceTitle: {
    color: "#0A4CB3",
    fontSize: 32,
    lineHeight: 37,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 18,
    textShadowColor: "rgba(58, 125, 226, 0.12)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  practiceImage: {
    width: "100%",
    height: 320,
    borderRadius: 14,
    resizeMode: "cover",
    borderWidth: 2,
    borderColor: "#D7E8FF",
  },
  practiceDescription: {
    marginTop: 20,
    color: "#1E3A8A",
    fontSize: 17,
    lineHeight: 23,
    fontWeight: "500",
    textAlign: "center",
    fontStyle:"italic"
  },
  practiceHeart: {
    position: "absolute",
    right: 18,
    bottom: 88,
    color: "#F16DA4",
    fontSize: 34,
    fontWeight: "900",
  },
  successCheckCircle: {
    position: "absolute",
    top: -40,
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: "#6BC449",
    borderWidth: 3,
    borderColor: "#4E9F37",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2F7D22",
    shadowOpacity: 0.32,
    shadowRadius: 8,
    elevation: 8,
  },
  successCheckText: {
    color: "#FFFFFF",
    fontSize: 46,
    lineHeight: 50,
    fontWeight: "900",
  },
  successTitle: {
    color: "#54A844",
    fontSize: 25,
    fontWeight: "900",
    textAlign: "center",
  },
  successDescription: {
    marginTop: 10,
    color: "#1E3A8A",
    fontSize: 16,
    lineHeight: 23,
    fontWeight: "700",
    textAlign: "center",
  },
  successInstrumentImage: {
    marginTop: 16,
    height: 190,
    resizeMode: "contain",
  },
  successInstrumentName: {
    marginTop: 12,
    color: "#1E3A8A",
    fontSize: 17,
    fontWeight: "900",
    textAlign: "center",
  },
  successRewardRow: {
    width: "92%",
    marginTop: 12,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: "#DDEBFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 0,
  },
  successRewardStar: {
    width: 55,
    height: 55,
    resizeMode: "contain",
  },
  successRewardText: {
    color: "#1E3A8A",
    fontSize: 18,
    fontWeight: "600",
  },
  successButton: {
    width: "94%",
    height: 58,
    marginTop: 18,
    borderRadius: 18,
    backgroundColor: "#6BC449",
    borderWidth: 2,
    borderColor: "#4E9F37",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2F7D22",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  successButtonText: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "900",
  },
  instructionsLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    elevation: 100,
  },
  instructionsOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    elevation: 100,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: 0,
    paddingBottom: 44,
  },
  instructionsBoxFrame: {
    width: "84%",
    minHeight: 286,
    borderRadius: 28,
    backgroundColor: "rgba(172, 223, 255, 0.94)",
    padding: 4,
    shadowColor: "#03163F",
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.24,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 2,
    overflow: "hidden",
  },
  instructionsBoxFrameGirl: {
    backgroundColor: "rgba(255, 190, 223, 0.9)",
  },
  instructionsBox: {
    width: "100%",
    minHeight: 278,
    borderRadius: 24,
    backgroundColor: "#073F9F",
    paddingHorizontal: 18,
    paddingTop: 23,
    paddingBottom: 14,
    alignItems: "center",
    justifyContent: "flex-start",
    overflow: "hidden",
  },
  instructionsVisitImageFrame: {
    position: "absolute",
    top: 30,
    left: "6%",
    right: "6%",
    height: 242,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3,
    elevation: 3,
  },
  instructionsVisitImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  instructionsCardSparkle: {
    color: "#FFFFFF",
    width: 18,
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
    textShadowColor: "rgba(142, 223, 255, 0.85)",
    textShadowRadius: 3,
    zIndex: 1,
  },
  instructionsHero: {
    position: "relative",
    width: "100%",
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop:-10,
    marginBottom: 2,
  },
  instructionsGreetingLogo: {
    minWidth: 236,
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  instructionsGreetingLayer: {
    position: "absolute",
    left: 0,
    right: 0,
    fontFamily: friendlyBoldFont,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "900",
    textAlign: "center",
    includeFontPadding: false,
  },
  instructionsGreetingStroke: {
    color: "#062F7B",
    transform: [
      { translateX: 0 },
      { translateY: 1 },
      { scale: 1.025 },
    ],
    textShadowColor: "#06245D",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  instructionsGreetingDepth: {
    color: "rgba(2, 23, 78, 0.24)",
    transform: [{ translateY: 2 }],
    textShadowColor: "rgba(0, 14, 62, 0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1.5,
  },
  instructionsGreeting: {
    fontFamily: friendlyBoldFont,
    color: "#FDFEFF",
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "900",
    textAlign: "center",
    includeFontPadding: false,
    textShadowColor: "rgba(255, 255, 255, 0.46)",
    textShadowOffset: { width: 0, height: -1 },
    textShadowRadius: 1,
  },
  instructionsName: {
    color: "#80CAFF",
  },
  instructionsNameGirl: {
    color: "#FFA3CE",
  },
  instructionsText: {
    fontFamily: friendlyTextFont,
    color: "#FFFFFF",
    width: "100%",
    fontSize: 17,
    lineHeight: 24,
    fontWeight: "700",
    textAlign: "center",
    textShadowColor: "#07316D",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 2.5,
  },
  instructionsInvite: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 10,
    paddingVertical: 11,
    marginBottom: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "rgba(198, 235, 255, 0.5)",
    backgroundColor: "rgba(15, 86, 190, 0.88)",
    shadowColor: "#001C58",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 5,
    elevation: 4,
    overflow: "hidden",
  },
  instructionsInviteIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#B6EEFF",
    backgroundColor: "rgba(55, 176, 238, 0.66)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#64D9FF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.34,
    shadowRadius: 6,
    elevation: 5,
  },
  instructionsInviteIconGirl: {
    borderColor: "#FFD5E7",
    backgroundColor: "rgba(232, 123, 179, 0.2)",
  },
  instructionsInviteCopy: {
    flex: 1,
    flexShrink: 1,
    justifyContent: "center",
  },
  instructionsPromptLine: {
    fontFamily: friendlyBoldFont,
    color: "#FFFFFF",
    width: "100%",
    flexShrink: 1,
    fontSize: 13.8,
    lineHeight: 19,
    fontWeight: "800",
    textAlign: "justify",
    includeFontPadding: false,
    textShadowColor: "#07316D",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1.8,
  },
  instructionsPromptName: {
    color: "#D8F0FF",
  },
  instructionsPromptNameGirl: {
    color: "#FFE1F0",
  },
  instructionsButton: {
    marginTop: 2,
    width: "85%",
    height: 58,
    borderRadius: 29,
    flexDirection: "row",
    gap: 7,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#145E12",
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.38,
    shadowRadius: 9,
    elevation: 9,
    zIndex: 2,
    overflow: "hidden",
  },
  instructionsButtonGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 29,
    borderWidth: 2,
    borderColor: "rgba(219, 255, 172, 0.9)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  instructionsButtonIcon: {
    position: "absolute",
    right: 30,
    width: 30,
    textAlign: "center",
  },
  instructionsButtonText: {
    fontFamily: friendlyBoldFont,
    color: "#FFFFFF",
    fontSize: 27,
    fontWeight: "900",
    transform: [{ translateX: -8 }],
    textShadowColor: "rgba(33, 92, 18, 0.58)",
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 3,
  },
});
