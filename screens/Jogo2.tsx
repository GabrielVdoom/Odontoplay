import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  BackHandler,
  Dimensions,
  Image,
  ImageBackground,
  ImageSourcePropType,
  PanResponder,
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
import {
  CharacterOption,
  defaultPreferences,
  getCurrentUserProfile,
  saveGameProgress,
  saveUserPreferences,
  UserPreferences,
} from "../services/progress";

const { width, height } = Dimensions.get("window");

const MOUTH_HITBOX = {
  x: width * 0.30,
  y: height * 0.30,
  width: width * 0.40,
  height: height * 0.13,
};

const BRUSH_HITBOX = {
  x: width * 0.58,
  y: height - 245,
  width: width * 0.36,
  height: 170,
};

const REQUIRED_RUB_DISTANCE = 260;
const MOUTH_FAST_TRANSITION = 820;
const MOUTH_CLEAN_TRANSITION = 1100;

const characterImages = {
  menina: {
    dirty: require("../assets/jogo2/menina_bocasuja.png"),
    foam: require("../assets/jogo2/menina_espuma.png"),
    clean: require("../assets/jogo2/menina_limpa.png"),
  },
  menino: {
    dirty: require("../assets/jogo2/menino_bocasuja.png"),
    foam: require("../assets/jogo2/menino_espuma.png"),
    clean: require("../assets/jogo2/menino_limpo.png"),
  },
};

const finalAssets = {
  background: require("../assets/jogo2/resultado_background.png"),
  tooth: require("../assets/jogo2/dente.png"),
  retry: require("../assets/jogo2/botao_jogarnovamente2.png"),
  finish: require("../assets/jogo2/botao_concluir.png"),
  sair: require("../assets/shared/exit3.png"),
  stars: {
    1: require("../assets/jogo2/star1.png"),
    2: require("../assets/jogo2/star2.png"), 
    3: require("../assets/jogo2/star3.png"),
  },
};

type Props = NativeStackScreenProps<RootStackParamList, "Jogo2">;
type GameStep = "pasta" | "escova" | "copo";
type MouthState = "dirty" | "foam" | "clean";

type ItemConfig = {
  id: GameStep;
  source: ImageSourcePropType;
  imageStyle: object;
};

const gameItems: ItemConfig[] = [
  {
    id: "copo",
    source: require("../assets/jogo2/copo.png"),
    imageStyle: { width: 118, height: 150, resizeMode: "contain" },
  },
  {
    id: "pasta",
    source: require("../assets/jogo2/pasta.png"),
    imageStyle: { width: 110, height: 150, resizeMode: "contain" },
  },
  {
    id: "escova",
    source: require("../assets/jogo2/escova.png"),
    imageStyle: { width: 115, height: 165, top: 10, resizeMode: "stretch" },
  },
  
];

const expectedOrder: GameStep[] = ["pasta", "escova", "copo"];

export default function Jogo2Screen({ navigation }: Props) {
  const [mouthState, setMouthState] = useState<MouthState>("dirty");
  const [completedSteps, setCompletedSteps] = useState<GameStep[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [activeRub, setActiveRub] = useState(false);
  const [showFinal, setShowFinal] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [showCharacterSelection, setShowCharacterSelection] = useState(false);
  const [preferences, setPreferences] =
    useState<UserPreferences>(defaultPreferences);
  const [brushHasPaste, setBrushHasPaste] = useState(false);
  const [lastSavedFinalKey, setLastSavedFinalKey] = useState("");
  const foamOpacity = useRef(new Animated.Value(0)).current;
  const cleanOpacity = useRef(new Animated.Value(0)).current;
  const sparkleOpacity = useRef(new Animated.Value(0)).current;
  const sparkleScale = useRef(new Animated.Value(0.82)).current;
  const mouthStateRef = useRef<MouthState>("dirty");

  useFocusEffect(
    useCallback(() => {
      const backSubscription = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          if (showFinal) {
            setShowFinal(false);
            return true;
          }

          if (showCharacterSelection) {
            setShowCharacterSelection(false);
            setShowInstructions(true);
            return true;
          }

          if (!showInstructions) {
            setShowCharacterSelection(true);
            return true;
          }

          return false;
        }
      );

      return () => backSubscription.remove();
    }, [showCharacterSelection, showFinal, showInstructions])
  );

  useEffect(() => {
    mouthStateRef.current = mouthState;
  }, [mouthState]);

  useEffect(() => {
    const loadPreferences = async () => {
      const profile = await getCurrentUserProfile();
      const userPreferences = profile?.preferencias as
        | Partial<UserPreferences>
        | undefined;

      if (!userPreferences) {
        return;
      }

      setPreferences({
        personagemJogo2:
          userPreferences.personagemJogo2 === "menino" ? "menino" : "menina",
        tomPele:
          userPreferences.tomPele === "claro" ||
          userPreferences.tomPele === "escuro"
            ? userPreferences.tomPele
            : "medio",
      });
    };

    void loadPreferences();
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(sparkleOpacity, {
        toValue: activeRub ? 1 : 0,
        duration: activeRub ? 120 : 180,
        useNativeDriver: true,
      }),
      Animated.spring(sparkleScale, {
        toValue: activeRub ? 1 : 0.82,
        useNativeDriver: true,
        friction: 4,
        tension: 90,
      }),
    ]).start();
  }, [activeRub, sparkleOpacity, sparkleScale]);

  const stars = useMemo<1 | 2 | 3>(() => {
    const completedInCorrectOrder = expectedOrder.every(
      (step, index) => completedSteps[index] === step
    );

    if (
      mistakes === 0 &&
      completedSteps.length === expectedOrder.length &&
      completedInCorrectOrder &&
      mouthState === "clean"
    ) {
      return 3;
    }

    if (completedSteps.length >= 2) {
      return 2;
    }

    return 1;
  }, [completedSteps, mistakes, mouthState]);

  const selectedCharacterImages =
    characterImages[preferences.personagemJogo2];

  const hasCompletedCorrectSequence = (steps: GameStep[]) =>
    mistakes === 0 && steps.length === expectedOrder.length;

  const selectCharacter = (personagemJogo2: CharacterOption) => {
    setPreferences((currentPreferences) => ({
      ...currentPreferences,
      personagemJogo2,
    }));
  };

  const confirmCharacterSelection = async () => {
    await saveUserPreferences(preferences);
    setShowCharacterSelection(false);
  };

  useEffect(() => {
    if (!showFinal) {
      return;
    }

    const finalKey = `${stars}-${completedSteps.join("-")}-${mouthState}-${mistakes}`;

    if (lastSavedFinalKey === finalKey) {
      return;
    }

    setLastSavedFinalKey(finalKey);

    void saveGameProgress("jogo2", {
      titulo: "Escove os dentes",
      concluido: true,
      estrelas: stars,
      ultimaPontuacao: stars,
    });
  }, [completedSteps, lastSavedFinalKey, mistakes, mouthState, showFinal, stars]);

  const animateMouthForStep = (
    step: GameStep,
    nextMouthState: MouthState,
    preserveCleanBase = false
  ) => {
    if (step === "pasta") {
      const isStartingFromCleanMouth =
        mouthStateRef.current === "clean" || preserveCleanBase;

      Animated.parallel([
        Animated.timing(foamOpacity, {
          toValue: 1,
          duration: MOUTH_FAST_TRANSITION,
          useNativeDriver: true,
        }),
        Animated.timing(cleanOpacity, {
          toValue: isStartingFromCleanMouth ? 1 : 0,
          duration: MOUTH_FAST_TRANSITION,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    if (step === "escova") {
      const isStartingFromCleanMouth =
        mouthStateRef.current === "clean" || preserveCleanBase;

      Animated.parallel([
        Animated.timing(cleanOpacity, {
          toValue: isStartingFromCleanMouth ? 1 : nextMouthState === "clean" ? 1 : 0.42,
          duration: MOUTH_FAST_TRANSITION,
          useNativeDriver: true,
        }),
        Animated.timing(foamOpacity, {
          toValue: nextMouthState === "foam" ? 0.45 : 0,
          duration: MOUTH_FAST_TRANSITION,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    Animated.parallel([
      Animated.timing(cleanOpacity, {
        toValue: 1,
        duration: MOUTH_CLEAN_TRANSITION,
        useNativeDriver: true,
      }),
      Animated.timing(foamOpacity, {
        toValue: 0,
        duration: MOUTH_CLEAN_TRANSITION,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const getNextMouthState = (step: GameStep, currentSteps: GameStep[]): MouthState => {
    if (step === "copo") {
      return "clean";
    }

    if (step === "escova" && mouthStateRef.current === "clean") {
      return "clean";
    }

    return "foam";
  };

  const handleStepComplete = (step: GameStep) => {
    setCompletedSteps((currentSteps) => {
      const preserveCleanBase = hasCompletedCorrectSequence(currentSteps);
      const nextMouthState = getNextMouthState(step, currentSteps);
      const isFirstCupOnDirtyMouth =
        step === "copo" &&
        currentSteps.length === 0 &&
        mouthStateRef.current === "dirty";

      if (currentSteps.includes(step)) {
        if (step !== "pasta") {
          setMouthState(nextMouthState);
          animateMouthForStep(step, nextMouthState, preserveCleanBase);
        }

        return currentSteps;
      }

      const nextStepIndex = currentSteps.length;
      const didRespectOrder = expectedOrder[nextStepIndex] === step;

      if (!didRespectOrder) {
        setMistakes((currentMistakes) => currentMistakes + 1);
      }

      const nextSteps = [...currentSteps, step];

      if (step !== "pasta" && !isFirstCupOnDirtyMouth) {
        setMouthState(nextMouthState);
        animateMouthForStep(step, nextMouthState, preserveCleanBase);
      }

      return nextSteps;
    });
  };

  const handlePrepareBrush = () => {
    setBrushHasPaste(true);

    setCompletedSteps((currentSteps) => {
      if (currentSteps.includes("pasta")) {
        return currentSteps;
      }

      const didRespectOrder = expectedOrder[currentSteps.length] === "pasta";

      if (!didRespectOrder) {
        setMistakes((currentMistakes) => currentMistakes + 1);
      }

      return [...currentSteps, "pasta"];
    });
  };

  const handlePastaOnMouth = () => {
    const preserveCleanBase = hasCompletedCorrectSequence(completedSteps);
    setMistakes((currentMistakes) => currentMistakes + 1);
    setMouthState("foam");
    animateMouthForStep("pasta", "foam", preserveCleanBase);
  };

  const resetGame = () => {
    setMouthState("dirty");
    setCompletedSteps([]);
    setMistakes(0);
    setActiveRub(false);
    setShowFinal(false);
    setBrushHasPaste(false);
    setLastSavedFinalKey("");
    foamOpacity.setValue(0);
    cleanOpacity.setValue(0);
    sparkleOpacity.setValue(0);
    sparkleScale.setValue(0.82);
  };

  if (showFinal) {
    return (
      <FinalScreen
        stars={stars}
        onRetry={resetGame}
        onExit={() => navigation.goBack()}
      />
    );
  }

  return (
    <ImageBackground
      source={require("../assets/shared/background_consultorio.png")}
      style={styles.background}
      imageStyle={styles.backgroundImage}
    >
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
          hitSlop={10}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={30} color="#FFFFFF" />
        </Pressable>
      ) : null}

      <Animated.View
        pointerEvents="none"
        style={[
          styles.rubFeedback,
          { opacity: sparkleOpacity, transform: [{ scale: sparkleScale }] },
        ]}
      >
        <View style={styles.sparkleDot} />
        <View style={styles.sparkleDotSmall} />
        <View style={styles.sparkleDotTiny} />
      </Animated.View>

      <View style={styles.characterWrapper}>
        <View style={styles.characterStage}>
          <Image
            source={selectedCharacterImages.dirty}
            style={[styles.character, styles.characterLayer]}
          />
          <Animated.Image
            source={selectedCharacterImages.clean}
            style={[
              styles.character,
              styles.characterLayer,
              { opacity: cleanOpacity },
            ]}
          />
          <Animated.Image
            source={selectedCharacterImages.foam}
            style={[
              styles.character,
              styles.characterLayer,
              { opacity: foamOpacity },
            ]}
          />
        </View>
      </View>

      <ImageBackground
        source={require("../assets/shared/rectangle-2.png")}
        style={styles.itemsPanel}
        imageStyle={styles.itemsPanelImage}
      >
        <View style={styles.itemsRow}>
          {gameItems.map((item) => (
            <DraggableItem
              key={item.id}
              item={item}
              completed={completedSteps.includes(item.id)}
              brushHasPaste={brushHasPaste}
              onRubActive={setActiveRub}
              onComplete={handleStepComplete}
              onPastaOnMouth={handlePastaOnMouth}
              onPrepareBrush={handlePrepareBrush}
            />
          ))}
        </View>
      </ImageBackground>

      <View style={styles.gameFinishButtonArea} pointerEvents="box-none">
        <Pressable
          style={styles.gameFinishButtonPressable}
          onPress={() => setShowFinal(true)}
        >
          <Image source={finalAssets.finish} style={styles.gameFinishButton} />
        </Pressable>
      </View>

      {showInstructions ? (
        <View style={styles.instructionsOverlay}>
          <View style={styles.instructionsBox}>
            <View style={styles.instructionsHeader}>
              <View style={styles.instructionsToothIconSlot}>
                <Image
                  source={require("../assets/jogo2/dente_titulo.png")}
                  style={styles.instructionsToothIcon}
                />
              </View>
              <Text style={styles.instructionsTitle}>
                Bem-vindo(a) ao{"\n"}Desafio do Sorriso!
              </Text>
            </View>

            <Text style={styles.instructionsIntro}>
              Siga os passos e ajude a manter o sorriso saudável.
            </Text>

            <Text style={styles.instructionsBadge}>Como jogar</Text>

            <View style={styles.instructionsSteps}>
              <View style={styles.instructionsStep}>
                <Text style={styles.instructionsStepNumber}>1</Text>
                <View style={styles.instructionsStepImageSlot}>
                  <Image
                    source={require("../assets/jogo2/maozinha.png")}
                    style={styles.instructionsHandImage}
                  />
                </View>
                <Text style={styles.instructionsStepText}>
                  Coloque a pasta de dente na escova.
                </Text>
              </View>

              <View style={styles.instructionsStepDivider} />

              <View style={styles.instructionsStep}>
                <Text style={styles.instructionsStepNumber}>2</Text>
                <View style={styles.instructionsStepImageSlot}>
                  <Image
                    source={require("../assets/jogo2/escovinha.png")}
                    style={styles.instructionsBrushImage}
                  />
                </View>
                <Text style={styles.instructionsStepText}>
                  Escove os dentinhos com a escova preparada.
                </Text>
              </View>

              <View style={styles.instructionsStepDivider} />

              <View style={styles.instructionsStep}>
                <Text style={styles.instructionsStepNumber}>3</Text>
                <View style={styles.instructionsStepImageSlot}>
                  <Image
                    source={require("../assets/jogo2/dentinho.png")}
                    style={styles.instructionsToothImage}
                  />
                </View>
                <Text style={styles.instructionsStepText}>
                  Enxague com água e deixe o sorriso brilhando!
                </Text>
              </View>
            </View>

            <Text style={styles.instructionsReady}>Pronto(a)? Vamos começar!</Text>
            <Pressable
              style={styles.instructionsButton}
              onPress={() => {
                setShowInstructions(false);
                setShowCharacterSelection(true);
              }}
            >
              <LinearGradient
                colors={["#62C8FF", "#2F9BDF", "#176FB9"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.instructionsButtonGradient}
              >
                <Text style={styles.instructionsButtonText}>Continuar</Text>
                <Ionicons
                  name="chevron-forward"
                  size={21}
                  color="#FFFFFF"
                  style={styles.primaryButtonRightIcon}
                />
              </LinearGradient>
            </Pressable>
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

              <View>
                <Text style={styles.characterSelectionTitle}>
                  Escolha seu{"\n"}personagem!
                </Text>
              </View>
            </View>

            <View style={styles.characterCardsPanel}>
              <View style={styles.characterCardsRow}>
                <CharacterCard
                  type="menino"
                  title="Menino"
                  active={preferences.personagemJogo2 === "menino"}
                  onPress={() => selectCharacter("menino")}
                />

                <CharacterCard
                  type="menina"
                  title="Menina"
                  active={preferences.personagemJogo2 === "menina"}
                  onPress={() => selectCharacter("menina")}
                />
              </View>
            </View>

            <Text style={styles.characterSelectionReady}>
              Pronto(a)? Vamos começar!
            </Text>

            <Pressable
              style={styles.characterContinueButton}
              onPress={confirmCharacterSelection}
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
                  style={styles.primaryButtonRightIcon}
                />
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      ) : null}
    </ImageBackground>
  );
}

function CharacterCard({
  type,
  title,
  active,
  onPress,
}: {
  type: "menino" | "menina";
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

function DraggableItem({
  item,
  completed,
  onComplete,
  onRubActive,
  onPastaOnMouth,
  onPrepareBrush,
  brushHasPaste,
}: {
  item: ItemConfig;
  completed: boolean;
  onComplete: (step: GameStep) => void;
  onRubActive: (active: boolean) => void;
  onPastaOnMouth: () => void;
  onPrepareBrush: () => void;
  brushHasPaste: boolean;
}) {
  const pan = useRef(new Animated.ValueXY()).current;
  const rubDistance = useRef(0);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const gestureCompleted = useRef(false);
  const brushHasPasteRef = useRef(brushHasPaste);
  const onCompleteRef = useRef(onComplete);
  const onRubActiveRef = useRef(onRubActive);
  const onPastaOnMouthRef = useRef(onPastaOnMouth);
  const onPrepareBrushRef = useRef(onPrepareBrush);

  useEffect(() => {
    brushHasPasteRef.current = brushHasPaste;
    onCompleteRef.current = onComplete;
    onRubActiveRef.current = onRubActive;
    onPastaOnMouthRef.current = onPastaOnMouth;
    onPrepareBrushRef.current = onPrepareBrush;
  }, [brushHasPaste, onComplete, onRubActive, onPastaOnMouth, onPrepareBrush]);

  const isInsideMouth = (x: number, y: number) =>
    x >= MOUTH_HITBOX.x &&
    x <= MOUTH_HITBOX.x + MOUTH_HITBOX.width &&
    y >= MOUTH_HITBOX.y &&
    y <= MOUTH_HITBOX.y + MOUTH_HITBOX.height;

  const isInsideBrush = (x: number, y: number) =>
    x >= BRUSH_HITBOX.x &&
    x <= BRUSH_HITBOX.x + BRUSH_HITBOX.width &&
    y >= BRUSH_HITBOX.y &&
    y <= BRUSH_HITBOX.y + BRUSH_HITBOX.height;

  const resetPosition = () => {
    Animated.spring(pan, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: false,
      friction: 5,
      tension: 60,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        rubDistance.current = 0;
        lastPoint.current = null;
        gestureCompleted.current = false;
        onRubActiveRef.current(false);
      },
      onPanResponderMove: (_, gestureState) => {
        pan.setValue({ x: gestureState.dx, y: gestureState.dy });

        if (item.id === "escova" && !brushHasPasteRef.current) {
          onRubActiveRef.current(false);
          return;
        }

        const point = { x: gestureState.moveX, y: gestureState.moveY };
        const insideMouth = isInsideMouth(point.x, point.y);

        if (!insideMouth || gestureCompleted.current) {
          lastPoint.current = insideMouth ? point : null;
          onRubActiveRef.current(false);
          return;
        }

        if (lastPoint.current) {
          const distance = Math.hypot(
            point.x - lastPoint.current.x,
            point.y - lastPoint.current.y
          );
          rubDistance.current += distance;
        }

        lastPoint.current = point;
        onRubActiveRef.current(true);

        if (rubDistance.current >= REQUIRED_RUB_DISTANCE) {
          gestureCompleted.current = true;
          onRubActiveRef.current(false);
          if (item.id === "pasta") {
            onPastaOnMouthRef.current();
          } else {
            onCompleteRef.current(item.id);
          }
          resetPosition();
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        lastPoint.current = null;
        onRubActiveRef.current(false);

        if (
          item.id === "pasta" &&
          !gestureCompleted.current &&
          isInsideBrush(gestureState.moveX, gestureState.moveY)
        ) {
          gestureCompleted.current = true;
          onPrepareBrushRef.current();
        }

        resetPosition();
      },
      onPanResponderTerminate: () => {
        lastPoint.current = null;
        onRubActiveRef.current(false);
        resetPosition();
      },
    })
  ).current;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.draggableItem,
        { transform: pan.getTranslateTransform() },
      ]}
    >
      <Image
        source={
          item.id === "escova" && brushHasPaste
            ? require("../assets/jogo2/escovacompasta_clean.png")
            : item.source
        }
        style={item.imageStyle}
      />
    </Animated.View>
  );
}

function FinalScreen({
  stars,
  onRetry,
  onExit,
}: {
  stars: 1 | 2 | 3;
  onRetry: () => void;
  onExit: () => void;
}) {
  const titleByStars = {
    1: "Boa tentativa!",
    2: "Muito bem!",
    3: "Parabéns!",
  };

  const subtitleByStars = {
    1: "Vamos deixar os dentes ainda mais limpinhos!",
    2: "Faltou só um pouquinho!",
    3: "Você cuidou muito bem dos dentinhos!",
  };

  const toothTextByStars = {
    1: "Você começou bem!",
    2: "Quase lá!",
    3: "Perfeito!",
  };

  return (
    <ImageBackground
      source={finalAssets.background}
      style={styles.finalContainer}
      imageStyle={styles.finalBackgroundImage}
    >

      <Text style={styles.finalTitle}>{titleByStars[stars]}</Text>
      <Text style={styles.finalSubtitle}>{subtitleByStars[stars]}</Text>

      <View style={styles.finalToothArea}>
        <Image source={finalAssets.tooth} style={styles.toothImage} />
        <Text style={styles.toothText}>{toothTextByStars[stars]}</Text>
        <Image source={finalAssets.stars[stars]} style={styles.starsImage} />
      </View>

      <Pressable style={styles.retryButtonBox} onPress={onRetry}>
        <Image source={finalAssets.retry} style={styles.retryButton} />
      </Pressable>

      <Pressable style={styles.finalExitButtonBox} onPress={onExit}>
        <Image source={finalAssets.sair} style={styles.sairButton} />
      </Pressable>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: "#EEF5FF",
  },

  backgroundImage: {
    resizeMode: "cover",
  },

  overlay: {
    flex: 1,
  },

  exitButton: {
    position: "absolute",
    top: 48,
    right: 18,
    zIndex: 40,
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

  rubFeedback: {
    position: "absolute",
    left: MOUTH_HITBOX.x + MOUTH_HITBOX.width - 25,
    top: MOUTH_HITBOX.y - 12,
    zIndex: 12,
  },

  sparkleDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#FFFFFF",
    borderWidth: 3,
    borderColor: "#8EE8FF",
  },

  sparkleDotSmall: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: 26,
    marginTop: -4,
    backgroundColor: "#FFF5A8",
    borderWidth: 2.5,
    borderColor: "#FFFFFF",
  },

  sparkleDotTiny: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 10,
    marginTop: 8,
    backgroundColor: "#FFFFFF",
  },

  characterWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 94,
    zIndex: 4,
    alignItems: "center",
  },

  characterStage: {
    width: 345,
    height: 610,
  },

  character: {
    width: 345,
    height: 610,
    resizeMode: "contain",
  },

  characterLayer: {
    position: "absolute",
    left: 0,
    top: 0,
  },

  itemsPanel: {
    position: "absolute",
    left: 14,
    right: 10,
    bottom: 65,
    height: 180,
    zIndex: 6,
    paddingHorizontal: 10,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  itemsPanelImage: {
    resizeMode: "stretch",
  },

  itemsRow: {
    width: "100%",
    height: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  draggableItem: {
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
  },

  gameFinishButtonArea: {
    position: "absolute",
    bottom: 210,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 25,
  },

  gameFinishButtonPressable: {
    width: 150,
    height: 150,
    alignItems: "center",
    justifyContent: "center",
  },

  gameFinishButton: {
    width: 150,
    height: 150,
    resizeMode: "contain",
  },

  finalContainer: {
    flex: 1,
    backgroundColor: "#7FD2FF",
    overflow: "hidden",
  },

  finalBackgroundImage: {
    resizeMode: "cover",
  },

  finalTitle: {
    position: "absolute",
    top: 82,
    left: 0,
    right: 0,
    color: "#FFFFFF",
    fontSize: 39,
    fontWeight: "900",
    textAlign: "center",
    zIndex: 5,
  },

  finalSubtitle: {
    position: "absolute",
    top: 140,
    left: "11%",
    width: "78%",
    color: "#FF79B4",
    fontSize: 25,
    fontWeight: "900",
    textAlign: "center",
    zIndex: 5,
  },

  finalToothArea: {
    position: "absolute",
    top: 200,
    left: 0,
    right: 0,
    height: 390,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 4,
  },

  toothImage: {
    position: "absolute",
    width: 820,
    resizeMode: "contain",
  },

  toothText: {
    position: "absolute",
    top: 80,
    left: 0,
    right: 0,
    color: "#F6C400",
    fontSize: 28,
    fontWeight: "900",
    textAlign: "center",
    zIndex: 6,
  },

  starsImage: {
    top:-30,
    width: 250,
    height: 150,
  },

  retryButtonBox: {
    position: "absolute",
    top: 583,
    left: 0,
    right: 0,
    height: 74,
    alignItems: "center",
    zIndex: 30,
    elevation: 30,
  },

  retryButton: {
    width: 260,
    height: 74,
    resizeMode: "contain",
  },

  finalExitButtonBox: {
    position: "absolute",
    top: 675,
    left: 0,
    right: 0,
    height: 60,
    alignItems: "center",
    zIndex: 10,
    elevation: 10,
  },

  sairButton: {                                          
    width: 180,
    height: 60,
    resizeMode: "contain",
  },

  characterSelectionOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 30,
    backgroundColor: "rgba(17, 74, 121, 0.28)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },

  characterSelectionBox: {
    width: "93%",
    maxWidth: 350,
    height: 500,
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

  characterSelectionSubtitle: {
    fontFamily: "Nunito_800ExtraBold",
    marginTop: 8,
    color: "#15376C",
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
  },

  characterCardsRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },

  characterCardsPanel: {
    width: "100%",
    marginTop: 24,
    borderRadius: 20,
    backgroundColor: "rgba(238, 249, 255, 0.72)",
    borderWidth: 1,
    borderColor: "rgba(192, 234, 255, 0.86)",
    paddingHorizontal: 10,
    paddingTop: 12,
    paddingBottom: 12,
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
    marginTop: 25,
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
    marginTop: 13,
    minWidth: 190,
    height: 46,
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

  primaryButtonRightIcon: {
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

  instructionsOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
    backgroundColor: "rgba(17, 74, 121, 0.28)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },

  instructionsBox: {
    width: "93%",
    maxWidth: 350,
    height: 500,
    borderRadius: 26,
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    borderWidth: 2,
    borderColor: "#64B5F6",
    paddingHorizontal: 16,
    paddingVertical: 20,
    alignItems: "center",
    shadowColor: "#0369A1",
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 10,
  },

  instructionsHeader: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },

  instructionsToothIconSlot: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },

  instructionsToothIcon: {
    right: 10,
    width: 120,
    height: 120,
    resizeMode: "contain",
  },

  instructionsTitle: {
    fontFamily: "Nunito_800ExtraBold",
    color: "#2F64B1",
    fontSize: 21,
    lineHeight: 26,
    fontWeight: "900",
    textAlign: "left",
  },

  instructionsIntro: {
    fontFamily: "Nunito_800ExtraBold",
    marginTop: 15,
    color: "#15376c",
    fontSize: 17,
    marginBottom: 5,
    lineHeight: 20,
    fontWeight: "800",
    textAlign: "center",
  },

  instructionsBadge: {
    fontFamily: "Nunito_800ExtraBold",
    marginTop: 13,
    minWidth: 160,
    borderRadius: 24,
    backgroundColor: "#3498DB",
    color: "#FFFFFF",
    fontSize: 15.5,
    fontWeight: "800",
    textAlign: "center",
    paddingVertical: 7,
    overflow: "hidden",
    zIndex: 2,
  },

  instructionsSteps: {
    width: "100%",
    marginTop: -5,
    borderRadius: 16,
    backgroundColor: "#EFFBFF",
    borderWidth: 1,
    borderColor: "#D7F0FF",
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 8,
  },

  instructionsStep: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  instructionsStepNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#3498DB",
    color: "#FFFFFF",
    fontSize: 15,
    lineHeight: 26,
    fontWeight: "900",
    textAlign: "center",
    overflow: "hidden",
  },

  instructionsStepIcon: {
    width: 36,
    color: "#1D8FE8",
    fontSize: 24,
    textAlign: "center",
  },

  instructionsHandImage: {
    width: 75,
    height: 75,
    resizeMode: "contain",
  },

  instructionsBrushImage: {
    width: 70,
    height: 70,
    resizeMode: "contain",
  },

  instructionsToothImage: {
    width: 90,
    height: 90,
    resizeMode: "contain",
  },

  instructionsStepImageSlot: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },

  instructionsStepText: {
    flex: 1,
    color: "#243B63",
    fontSize: 13,
    lineHeight: 16,
    fontWeight: "400",
  },

  instructionsStepDivider: {
    height: 1,
    marginLeft: 40,
    backgroundColor: "#D6EAF8",
  },

  instructionsReady: {
    fontFamily: "Nunito_800ExtraBold",
    marginTop: 11,
    color: "#243B63",
    fontSize: 17,
    fontWeight: "900",
    textAlign: "center",
  },

  instructionsButton: {
    marginTop: 12,
    minWidth: 190,
    height: 46,
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

  instructionsButtonGradient: {
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

  instructionsButtonText: {
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
  /*
  sairButton: {   usado no exit3
    top: 35,
    width: 190,
    height: 300,
    resizeMode: "contain",
  },
  */

});
