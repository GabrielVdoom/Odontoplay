import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  BackHandler,
  Image,
  ImageBackground,
  ImageSourcePropType,
  PanResponder,
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
import { preloadJogo2Images } from "../services/imagePreload";
import {
  CharacterOption,
  defaultPreferences,
  getCurrentUserProfile,
  saveGameProgress,
  saveUserPreferences,
  UserPreferences,
} from "../services/progress";
import { getPhoneScreenMetrics, WEB_IMAGE_FILL, ScreenViewport, useSceneMetrics, useSceneBackdrop, FRIENDLY_FONT, SceneOverlay, containsPoint, getTabletActivityLayout, type HitRect } from "../utils/responsive";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const gameFont = Platform.OS === "web" ? FRIENDLY_FONT : "Nunito_800ExtraBold";

function getPhoneTargets({ width, height }: { width: number; height: number }) {
  return {
    mouth: { x: width * 0.30, y: height * 0.30, width: width * 0.40, height: height * 0.13 },
    brush: { x: width * 0.58, y: height - 245, width: width * 0.36, height: 170 },
  };
}

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
  const metrics = useSceneMetrics();
  const tablet = metrics.isTabletLayout;
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const tabletStyles = tablet ? createTabletStyles(metrics, preferences.personagemJogo2) : undefined;
  const styles = tabletStyles ?? createPhoneStyles(getPhoneScreenMetrics(metrics));
  const renderedItems = tablet ? getTabletGameItems(metrics.scale, getTabletActivityLayout(metrics.width, metrics.height).itemScale) : gameItems;
  const mouthTarget = useRef<React.ComponentRef<typeof View>>(null);
  const brushTarget = useRef<React.ComponentRef<typeof View>>(null);
  const targets = useRef<{ mouth: HitRect | null; brush: HitRect | null }>({ mouth: null, brush: null });
  const refreshTargets = () => {
    if (!tablet) return;
    // PanResponder reports page coordinates; measure in the same coordinate
    // system so Android's status bar cannot shift the target away from its art.
    mouthTarget.current?.measure((_left,_top,width,height,x,y) => { targets.current.mouth = {x,y,width,height}; });
    brushTarget.current?.measure((_left,_top,width,height,x,y) => { targets.current.brush = {x,y,width,height}; });
  };

  const [mouthState, setMouthState] = useState<MouthState>("dirty");
  const [completedSteps, setCompletedSteps] = useState<GameStep[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [activeRub, setActiveRub] = useState(false);
  const [showFinal, setShowFinal] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [showCharacterSelection, setShowCharacterSelection] = useState(false);
  const [brushHasPaste, setBrushHasPaste] = useState(false);
  const [lastSavedFinalKey, setLastSavedFinalKey] = useState("");
  const [isDraggingItem, setIsDraggingItem] = useState(false);
  const foamOpacity = useRef(new Animated.Value(0)).current;
  const cleanOpacity = useRef(new Animated.Value(0)).current;
  const sparkleOpacity = useRef(new Animated.Value(0)).current;
  const sparkleScale = useRef(new Animated.Value(0.82)).current;
  const mouthStateRef = useRef<MouthState>("dirty");

  useEffect(() => {
    void preloadJogo2Images().catch(() => undefined);
  }, []);

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

  const resetGameplayState = () => {
    setMouthState("dirty");
    mouthStateRef.current = "dirty";
    setCompletedSteps([]);
    setMistakes(0);
    setActiveRub(false);
    setShowFinal(false);
    setBrushHasPaste(false);
    setIsDraggingItem(false);
    setLastSavedFinalKey("");
    foamOpacity.setValue(0);
    cleanOpacity.setValue(0);
    sparkleOpacity.setValue(0);
    sparkleScale.setValue(0.82);
  };

  const selectCharacter = (personagemJogo2: CharacterOption) => {
    resetGameplayState();
    setPreferences((currentPreferences) => ({
      ...currentPreferences,
      personagemJogo2,
    }));
  };

  const confirmCharacterSelection = async () => {
    resetGameplayState();
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
          <Ionicons name="chevron-back" size={tablet ? 30 * metrics.contentScale : 30} color="#FFFFFF" />
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
          {tabletStyles && <View ref={mouthTarget} collapsable={false} pointerEvents="none" style={tabletStyles.mouthTarget} onLayout={refreshTargets} />}
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
        style={[styles.itemsPanel, isDraggingItem && styles.itemsPanelDragging]}
        imageStyle={styles.itemsPanelImage}
      >
        <View style={styles.itemsRow}>
          {renderedItems.map((item) => (
            <DraggableItem
              key={item.id}
              item={item}
              targets={targets}
              refreshTargets={refreshTargets}
              brushTarget={brushTarget}
              completed={completedSteps.includes(item.id)}
              brushHasPaste={brushHasPaste}
              onRubActive={setActiveRub}
              onComplete={handleStepComplete}
              onPastaOnMouth={handlePastaOnMouth}
              onPrepareBrush={handlePrepareBrush}
              onDragChange={setIsDraggingItem}
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
        <SceneOverlay tablet={tablet} animated={false} style={styles.instructionsOverlay}>
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
                <Text
                  style={styles.instructionsButtonText}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                >
                  Continuar
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={tablet ? 21 * metrics.contentScale : 21}
                  color="#FFFFFF"
                  style={styles.primaryButtonRightIcon}
                />
              </LinearGradient>
            </Pressable>
          </View>
        </SceneOverlay>
      ) : null}

      {showCharacterSelection ? (
        <SceneOverlay tablet={tablet} animated={false} style={styles.characterSelectionOverlay}>
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
                <Text
                  style={styles.characterContinueText}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                >
                  Começar
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={tablet ? 21 * metrics.contentScale : 21}
                  color="#FFFFFF"
                  style={styles.primaryButtonRightIcon}
                />
              </LinearGradient>
            </Pressable>
          </View>
        </SceneOverlay>
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
  const metrics = useSceneMetrics();
  const styles = metrics.isTabletLayout ? createTabletStyles(metrics) : createPhoneStyles(getPhoneScreenMetrics(metrics));

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
  targets, refreshTargets, brushTarget,
  completed,
  onComplete,
  onRubActive,
  onPastaOnMouth,
  onPrepareBrush,
  onDragChange,
  brushHasPaste,
}: {
  item: ItemConfig;
  targets: React.MutableRefObject<{ mouth: HitRect | null; brush: HitRect | null }>;
  refreshTargets: () => void;
  brushTarget: React.RefObject<React.ComponentRef<typeof View> | null>;
  completed: boolean;
  onComplete: (step: GameStep) => void;
  onRubActive: (active: boolean) => void;
  onPastaOnMouth: () => void;
  onPrepareBrush: () => void;
  onDragChange: (active: boolean) => void;
  brushHasPaste: boolean;
}) {
  const metrics = useSceneMetrics();
  const tablet = metrics.isTabletLayout;
  const phoneMetrics = getPhoneScreenMetrics(metrics);
  const styles = tablet ? createTabletStyles(metrics) : createPhoneStyles(phoneMetrics);
  const hitboxes = getPhoneTargets(phoneMetrics);
  const phoneTargets = useRef(hitboxes);
  phoneTargets.current = hitboxes;
  const refreshRef = useRef(refreshTargets);
  refreshRef.current = refreshTargets;
  const scaleRef = useRef(metrics.scale(1));
  scaleRef.current = tablet ? styles.characterStage.width / 345 : metrics.scale(1);

  const pan = useRef(new Animated.ValueXY()).current;
  const rubDistance = useRef(0);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const gestureCompleted = useRef(false);
  const brushHasPasteRef = useRef(brushHasPaste);
  const onCompleteRef = useRef(onComplete);
  const onRubActiveRef = useRef(onRubActive);
  const onPastaOnMouthRef = useRef(onPastaOnMouth);
  const onPrepareBrushRef = useRef(onPrepareBrush);
  const onDragChangeRef = useRef(onDragChange);

  useEffect(() => {
    brushHasPasteRef.current = brushHasPaste;
    onCompleteRef.current = onComplete;
    onRubActiveRef.current = onRubActive;
    onPastaOnMouthRef.current = onPastaOnMouth;
    onPrepareBrushRef.current = onPrepareBrush;
    onDragChangeRef.current = onDragChange;
  }, [brushHasPaste, onComplete, onRubActive, onPastaOnMouth, onPrepareBrush, onDragChange]);

  const isInsideMouth = (x: number, y: number) =>
    containsPoint(tablet ? targets.current.mouth : phoneTargets.current.mouth, x, y);

  const isInsideBrush = (x: number, y: number) =>
    containsPoint(tablet ? targets.current.brush : phoneTargets.current.brush, x, y);

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
        if (tablet) refreshRef.current();
        rubDistance.current = 0;
        lastPoint.current = null;
        gestureCompleted.current = false;
        onRubActiveRef.current(false);
        onDragChangeRef.current(true);
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

        if (rubDistance.current >= REQUIRED_RUB_DISTANCE * (tablet ? scaleRef.current : 1)) {
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
        onDragChangeRef.current(false);

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
        onDragChangeRef.current(false);
        resetPosition();
      },
    })
  ).current;

  return (
    <Animated.View
      {...(tablet ? { ref: item.id === "escova" ? brushTarget : undefined, onLayout: refreshTargets, collapsable: false } : {})}
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

function FinalContent({
  stars,
  onRetry,
  onExit,
}: {
  stars: 1 | 2 | 3;
  onRetry: () => void;
  onExit: () => void;
}) {
  const metrics = useSceneMetrics();
  const insets = useSafeAreaInsets();
  const tablet = metrics.isTabletLayout;
  const styles = tablet ? createTabletFinalStyles(metrics, metrics.topInset) : createFinalStyles(metrics, insets.top);
  useSceneBackdrop(finalAssets.background);
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
      <Text style={styles.finalSubtitle} numberOfLines={tablet ? 2 : undefined} adjustsFontSizeToFit={tablet ? true : undefined} minimumFontScale={tablet ? 0.85 : undefined}>{subtitleByStars[stars]}</Text>

      <View style={styles.finalToothArea}>
        <Image source={finalAssets.tooth} style={styles.toothImage} />
        <Text style={styles.toothText} numberOfLines={tablet ? 1 : undefined} adjustsFontSizeToFit={tablet ? true : undefined} minimumFontScale={tablet ? 0.85 : undefined}>{toothTextByStars[stars]}</Text>
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

function createPhoneStyles(metrics: ReturnType<typeof getPhoneScreenMetrics>) {
const { scale: s, moderateScale: ms } = metrics;
const { mouth } = getPhoneTargets(metrics);
return StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: "#EEF5FF",
  },

  backgroundImage: {
    ...WEB_IMAGE_FILL,
    resizeMode: "cover",
  },

  overlay: {
    flex: 1,
  },

  exitButton: {
    position: "absolute",
    top: s(48),
    right: s(18),
    zIndex: 40,
  },

  exitButtonImage: {
    width: s(132),
    height: s(110),
    resizeMode: "contain",
  },

  backIconButton: {
    position: "absolute",
    top: s(48),
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

  rubFeedback: {
    position: "absolute",
    left: mouth.x + mouth.width - 25,
    top: mouth.y - 12,
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
    top: s(94),
    zIndex: 4,
    alignItems: "center",
  },

  characterStage: {
    width: s(345),
    height: s(610),
  },

  character: {
    width: s(345),
    height: s(610),
    resizeMode: "contain",
  },

  characterLayer: {
    position: "absolute",
    left: 0,
    top: 0,
  },

  itemsPanel: {
    position: "absolute",
    left: s(14),
    right: s(10),
    bottom: s(65),
    height: s(180),
    zIndex: 6,
    paddingHorizontal: s(10),
    paddingVertical: s(14),
    alignItems: "center",
    justifyContent: "center",
  },

  itemsPanelDragging: {
    zIndex: 60,
    elevation: 60,
  },

  itemsPanelImage: {
    ...WEB_IMAGE_FILL,
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
    bottom: s(210),
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 25,
  },

  gameFinishButtonPressable: {
    width: s(150),
    height: s(150),
    alignItems: "center",
    justifyContent: "center",
  },

  gameFinishButton: {
    width: s(150),
    height: s(150),
    resizeMode: "contain",
  },

  characterSelectionOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 30,
    backgroundColor: "rgba(17, 74, 121, 0.28)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: s(28),
  },

  characterSelectionBox: {
    width: "93%",
    maxWidth: s(350),
    height: s(500),
    padding: s(10),
    borderRadius: s(28),
    backgroundColor: "rgba(250, 254, 255, 0.98)",
    borderWidth: 2,
    borderColor: "#64B5F6",
    paddingHorizontal: s(16),
    paddingVertical: s(22),
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
    gap: s(10),
  },

  characterSelectionToothSlot: {
    width: s(44),
    height: s(44),
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },

  characterSelectionTooth: {
    width: s(134),
    height: s(104),
    resizeMode: "contain",
  },

  characterSelectionTitle: {
    fontFamily: gameFont,
    color: "#1557A7",
    fontSize: ms(26),
    lineHeight: ms(30),
    fontWeight: "900",
    textAlign: "left",
    letterSpacing: 0.2,
    textShadowColor: "rgba(149, 220, 255, 0.25)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },

  characterSelectionSubtitle: {
    fontFamily: gameFont,
    marginTop: s(8),
    color: "#15376C",
    fontSize: ms(15),
    fontWeight: "800",
    textAlign: "center",
  },

  characterCardsRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    gap: s(12),
  },

  characterCardsPanel: {
    width: "100%",
    marginTop: s(24),
    borderRadius: s(20),
    backgroundColor: "rgba(238, 249, 255, 0.72)",
    borderWidth: 1,
    borderColor: "rgba(192, 234, 255, 0.86)",
    paddingHorizontal: s(10),
    paddingTop: s(12),
    paddingBottom: s(12),
  },

  characterCard: {
    position: "relative",
    width: "46%",
    height: s(206),
    borderRadius: s(22),
    borderWidth: 2,
    paddingHorizontal: s(8),
    paddingTop: s(10),
    paddingBottom: s(10),
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
    ...StyleSheet.absoluteFill,
    borderRadius: s(19),
  },
  characterCardIconSlot: {
    width: s(112),
    height: s(112),
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },

  characterCardIcon: {
    width: s(255),
    height: s(255),
    resizeMode: "contain",
  },

  characterCardTitle: {
    fontFamily: gameFont,
    marginTop: s(8),
    fontSize: ms(25),
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
    fontFamily: gameFont,
    marginTop: s(30),
    color: "#1D4E91",
    fontSize: ms(17),
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: 0.15,
    textShadowColor: "rgba(186, 234, 255, 0.25)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },

  characterContinueButton: {
    marginTop: s(13),
    minWidth: s(190),
    height: s(46),
    borderRadius: s(23),
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
    borderRadius: s(23),
    borderWidth: 2.5,
    borderColor: "rgba(196, 237, 255, 0.95)",
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: s(18),
  },

  primaryButtonRightIcon: {
    position: "absolute",
    right: s(18),
  },

  characterContinueText: {
    fontFamily: gameFont,
    color: "#FFFFFF",
    fontSize: ms(19),
    lineHeight: ms(24),
    fontWeight: "900",
    textShadowColor: "rgba(4, 68, 123, 0.45)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 2,
    width: "100%",
    textAlign: "center",
    includeFontPadding: false,
  },

  instructionsOverlay: {
    ...StyleSheet.absoluteFill,
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
    marginTop: 5,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
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
    fontFamily: gameFont,
    color: "#2F64B1",
    fontSize: 23,
    lineHeight: 30,
    fontWeight: "900",
    textAlign: "left",
  },

  instructionsIntro: {
    fontFamily: gameFont,
    marginTop: 15,
    color: "#15376c",
    fontSize: 17,
    marginBottom: 5,
    lineHeight: 20,
    fontWeight: "800",
    textAlign: "center",
  },

  instructionsBadge: {
    fontFamily: gameFont,
    marginTop: 25,
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
    paddingBottom: 10,
  },

  instructionsStep: {
    minHeight: 60,
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
    fontFamily: gameFont,
    marginTop: 21,
    color: "#1D4E91",
    fontSize: 17,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: 0.15,
    textShadowColor: "rgba(186, 234, 255, 0.25)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
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
    fontFamily: gameFont,
    color: "#FFFFFF",
    fontSize: 19,
    lineHeight: 24,
    fontWeight: "900",
    textShadowColor: "rgba(4, 68, 123, 0.45)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 2,
    width: "100%",
    textAlign: "center",
    includeFontPadding: false,
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
}

function FinalScreen(props: React.ComponentProps<typeof FinalContent>) {
  const tablet = useSceneMetrics().isTabletLayout;
  return tablet ? <FinalContent {...props} /> : <ScreenViewport><FinalContent {...props} /></ScreenViewport>;
}

function createFinalStyles(metrics: ReturnType<typeof useSceneMetrics>, topInset: number) {
  const { scale: s, moderateScale: ms } = metrics;
  return StyleSheet.create({
  finalContainer: {
    flex: 1,
    backgroundColor: "#7FD2FF",
    overflow: "hidden",
  },

  finalBackgroundImage: {
    ...WEB_IMAGE_FILL,
    resizeMode: "cover",
  },

  finalTitle: {
    position: "absolute",
    top: Math.max(s(82), topInset),
    left: 0,
    right: 0,
    color: "#FFFFFF",
    fontSize: ms(39),
    fontWeight: "900",
    textAlign: "center",
    zIndex: 5,
  },

  finalSubtitle: {
    position: "absolute",
    top: s(140),
    left: "11%",
    width: "78%",
    color: "#FF79B4",
    fontSize: ms(25),
    fontWeight: "900",
    textAlign: "center",
    zIndex: 5,
  },

  finalToothArea: {
    position: "absolute",
    top: s(200),
    left: 0,
    right: 0,
    height: s(390),
    alignItems: "center",
    justifyContent: "center",
    zIndex: 4,
  },

  toothImage: {
    position: "absolute",
    width: s(820),
    aspectRatio: 1536 / 1024,
    resizeMode: "contain",
  },

  toothText: {
    position: "absolute",
    top: s(80),
    left: 0,
    right: 0,
    color: "#F6C400",
    fontSize: ms(28),
    fontWeight: "900",
    textAlign: "center",
    zIndex: 6,
  },

  starsImage: {
    top: s(-30),
    width: s(250),
    height: s(150),
  },

  retryButtonBox: {
    position: "absolute",
    top: s(583),
    left: 0,
    right: 0,
    height: s(74),
    alignItems: "center",
    zIndex: 30,
    elevation: 30,
  },

  retryButton: {
    width: s(260),
    height: s(74),
    resizeMode: "contain",
  },

  finalExitButtonBox: {
    position: "absolute",
    top: s(669),
    left: 0,
    right: 0,
    height: s(66),
    alignItems: "center",
    zIndex: 10,
    elevation: 10,
  },

  sairButton: {
    width: s(198),
    height: s(66),
    resizeMode: "contain",
  },

  });
}


function getTabletGameItems(scale: (value: number) => number, maxScale = Number.POSITIVE_INFINITY): ItemConfig[] {
  const s = (value: number) => Math.min(scale(value) * 1.2, value * maxScale);
  return [
  {
    id: "copo",
    source: require("../assets/jogo2/copo.png"),
    imageStyle: { width: s(118), height: s(150), resizeMode: "contain" },
  },
  {
    id: "pasta",
    source: require("../assets/jogo2/pasta.png"),
    imageStyle: { width: s(110), height: s(150), resizeMode: "contain" },
  },
  {
    id: "escova",
    source: require("../assets/jogo2/escova.png"),
    imageStyle: { width: s(115), height: s(165), top: s(10), resizeMode: "contain" },
  },

];

}

function createTabletFinalStyles(metrics: ReturnType<typeof useSceneMetrics>, topInset: number) {
  const { backgroundHeight } = metrics;
  const originalUnit = metrics.scale(1);
  const bottomMargin = Math.max(metrics.bottomInset + 16, metrics.height * 0.08);
  const resultHeight = 735;
  const unit = Math.min(originalUnit * 1.18, 1.6 * metrics.contentScale, metrics.width / 440,
    (metrics.height - bottomMargin) / resultHeight);
  const s = (value: number) => value * unit;
  const ms = (value: number) => metrics.moderateScale(value) * unit / originalUnit;
  const sceneTop = Math.max(0, Math.min((metrics.height - s(800)) / 2, metrics.height - bottomMargin - s(resultHeight)));
  return StyleSheet.create({
  finalContainer: {
    flex: 1,
    backgroundColor: "#7FD2FF",
    overflow: "hidden",
  },

  finalBackgroundImage: {
    width: "100%",
    height: backgroundHeight,
    resizeMode: "cover",
  },

  finalTitle: {
    position: "absolute",
    top: Math.max(sceneTop + s(82), topInset),
    left: 0,
    right: 0,
    color: "#FFFFFF",
    fontSize: Math.min(ms(39), s(44)),
    fontWeight: "900",
    textAlign: "center",
    zIndex: 5,
  },

  finalSubtitle: {
    position: "absolute",
    top: sceneTop + s(140),
    left: "11%",
    width: "78%",
    color: "#FF79B4",
    fontSize: Math.min(ms(25), s(26)),
    lineHeight: Math.min(ms(30), s(32)),
    fontWeight: "900",
    textAlign: "center",
    zIndex: 5,
  },

  finalToothArea: {
    position: "absolute",
    top: sceneTop + s(200),
    left: 0,
    right: 0,
    height: s(390),
    alignItems: "center",
    justifyContent: "center",
    zIndex: 4,
  },

  toothImage: {
    position: "absolute",
    width: s(820),
    aspectRatio: 1536 / 1024,
    resizeMode: "contain",
  },

  toothText: {
    position: "absolute",
    top: s(80),
    left: 0,
    right: 0,
    color: "#F6C400",
    fontSize: Math.min(ms(28), s(28)),
    fontWeight: "900",
    textAlign: "center",
    zIndex: 6,
  },

  starsImage: {
    top: s(-30),
    width: s(250),
    height: s(150),
  },

  retryButtonBox: {
    position: "absolute",
    top: sceneTop + s(583),
    left: 0,
    right: 0,
    height: s(74),
    alignItems: "center",
    zIndex: 30,
    elevation: 30,
  },

  retryButton: {
    width: s(260),
    height: s(74),
    resizeMode: "contain",
  },

  finalExitButtonBox: {
    position: "absolute",
    top: sceneTop + s(669),
    left: 0,
    right: 0,
    height: s(66),
    alignItems: "center",
    zIndex: 10,
    elevation: 10,
  },

  sairButton: {
    width: s(198),
    height: s(66),
    resizeMode: "contain",
  },

  });
}

// Tablet-only styles. The phone styles above are preserved from the pre-tablet snapshot.
function createTabletStyles(metrics: ReturnType<typeof useSceneMetrics>, character?: CharacterOption) {
const { scale: s, moderateScale: ms, backgroundHeight } = metrics;
const layout = getTabletActivityLayout(metrics.width, metrics.height, metrics.bottomInset);
const characterTop = Math.max(metrics.topInset + s(52), metrics.height * 0.10);
const portraitWidth = Math.min(1, Math.max(0, (metrics.width / metrics.height - 5 / 8) / 0.07));
const characterLift = character === "menina" ? s(12 + 48 * portraitWidth) : 0;
const characterHeight = Math.min(metrics.height * 0.80 * metrics.contentScale,
  metrics.height - characterTop - metrics.bottomInset, s(760));
const characterWidth = characterHeight * 345 / 610;
const characterScale = characterWidth / 345;
const c = (value: number) => value * characterScale;
const instructionsTextScale = 1.16;
return StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: "#EEF5FF",
  },

  backgroundImage: {
    width: "100%",
    height: backgroundHeight,
    resizeMode: "cover",
  },

  overlay: {
    flex: 1,
  },

  exitButton: {
    position: "absolute",
    top: Math.max(s(48), metrics.topInset),
    right: s(18),
    zIndex: 40,
  },

  exitButtonImage: {
    width: s(132),
    height: s(110),
    resizeMode: "contain",
  },

  backIconButton: {
    position: "absolute",
    top: s(48),
    left: s(18),
    width: Math.max(44, s(42)),
    height: Math.max(44, s(42)),
    borderRadius: s(21),
    backgroundColor: "rgba(5, 47, 121, 0.52)",
    borderWidth: s(1),
    borderColor: "rgba(205, 237, 255, 0.5)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 120,
    elevation: 120,
    shadowColor: "#03194C",
    shadowOffset: { width: 0, height: s(3) },
    shadowOpacity: 0.22,
    shadowRadius: s(5),
  },

  rubFeedback: {
    position: "absolute",
    left: metrics.width / 2 + s(40),
    top: s(300) - characterLift,
    zIndex: 12,
  },

  sparkleDot: {
    width: s(18),
    height: s(18),
    borderRadius: s(9),
    backgroundColor: "#FFFFFF",
    borderWidth: s(3),
    borderColor: "#8EE8FF",
  },

  sparkleDotSmall: {
    width: s(12),
    height: s(12),
    borderRadius: s(6),
    marginLeft: s(26),
    marginTop: s(-4),
    backgroundColor: "#FFF5A8",
    borderWidth: s(2.5),
    borderColor: "#FFFFFF",
  },

  sparkleDotTiny: {
    width: s(8),
    height: s(8),
    borderRadius: s(4),
    marginLeft: s(10),
    marginTop: s(8),
    backgroundColor: "#FFFFFF",
  },

  characterWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    top: characterTop - characterLift,
    zIndex: 4,
    alignItems: "center",
  },

  characterStage: {
    width: characterWidth,
    height: characterHeight,
  },

  character: {
    width: characterWidth,
    height: characterHeight,
    resizeMode: "contain",
  },

  mouthTarget: {
    position: "absolute",
    left: c(345 * 0.31),
    top: c((610 - 345 * 1.5) / 2 + 345 * 1.5 * 0.32),
    width: c(345 * 0.36),
    height: c(345 * 1.5 * 0.18),
    zIndex: 1,
  },

  characterLayer: {
    position: "absolute",
    left: 0,
    top: 0,
  },

  itemsPanel: {
    position: "absolute",
    left: layout.trayLeft,
    width: layout.trayWidth,
    bottom: layout.trayBottom,
    height: layout.trayHeight,
    zIndex: 6,
    paddingHorizontal: layout.padding,
    paddingVertical: layout.padding,
    alignItems: "center",
    justifyContent: "center",
  },

  itemsPanelDragging: {
    zIndex: 60,
    elevation: 60,
  },

  itemsPanelImage: {
    width: layout.trayWidth,
    height: layout.trayHeight,
    resizeMode: "contain",
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
    bottom: layout.trayBottom + layout.trayHeight + s(14),
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 25,
  },

  gameFinishButtonPressable: {
    width: s(165),
    // The square image has transparent margins around the pink button.
    height: Math.max(44, s(62)),
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  gameFinishButton: {
    width: s(165),
    height: s(165),
    resizeMode: "contain",
  },

  characterSelectionOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 30,
    backgroundColor: "rgba(17, 74, 121, 0.28)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: s(28),
  },

  characterSelectionBox: {
    width: "93%",
    maxWidth: s(385),
    minHeight: s(500),
    padding: s(10),
    borderRadius: s(28),
    backgroundColor: "rgba(250, 254, 255, 0.98)",
    borderWidth: s(2),
    borderColor: "#64B5F6",
    paddingHorizontal: s(16),
    paddingVertical: s(22),
    alignItems: "center",
    justifyContent: "flex-start",
    shadowColor: "#075B9C",
    shadowOffset: { width: 0, height: s(5) },
    shadowOpacity: 0.12,
    shadowRadius: s(12),
    elevation: 5,
  },

  characterSelectionHeader: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: s(10),
  },

  characterSelectionToothSlot: {
    width: s(44),
    height: s(44),
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },

  characterSelectionTooth: {
    width: s(134),
    height: s(104),
    resizeMode: "contain",
  },

  characterSelectionTitle: {
    fontFamily: FRIENDLY_FONT,
    color: "#1557A7",
    fontSize: ms(26),
    lineHeight: ms(30),
    fontWeight: "900",
    textAlign: "left",
    letterSpacing: 0.2,
    textShadowColor: "rgba(149, 220, 255, 0.25)",
    textShadowOffset: { width: 0, height: s(1) },
    textShadowRadius: s(1),
  },

  characterSelectionSubtitle: {
    fontFamily: FRIENDLY_FONT,
    marginTop: s(8),
    color: "#15376C",
    fontSize: ms(15),
    fontWeight: "800",
    textAlign: "center",
  },

  characterCardsRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    gap: s(12),
  },

  characterCardsPanel: {
    width: "100%",
    marginTop: s(24),
    borderRadius: s(20),
    backgroundColor: "rgba(238, 249, 255, 0.72)",
    borderWidth: s(1),
    borderColor: "rgba(192, 234, 255, 0.86)",
    paddingHorizontal: s(10),
    paddingTop: s(12),
    paddingBottom: s(12),
  },

  characterCard: {
    position: "relative",
    width: "46%",
    height: s(206),
    borderRadius: s(22),
    borderWidth: s(2),
    paddingHorizontal: s(8),
    paddingTop: s(10),
    paddingBottom: s(10),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    shadowColor: "#176EAE",
    shadowOffset: { width: 0, height: s(2) },
    shadowOpacity: 0.06,
    shadowRadius: s(4),
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
    borderWidth: s(3),
    backgroundColor: "rgba(224, 244, 255, 0.52)",
    shadowColor: "#3498DB",
    shadowOffset: { width: 0, height: s(3) },
    shadowOpacity: 0.1,
    shadowRadius: s(6),
    elevation: 3,
    transform: [{ scale: 1.01 }],
  },

  characterCardGirlActive: {
    borderColor: "#E94491",
    borderWidth: s(3),
    backgroundColor: "rgba(255, 237, 247, 0.58)",
    shadowColor: "#F48FBE",
    shadowOffset: { width: 0, height: s(3) },
    shadowOpacity: 0.1,
    shadowRadius: s(6),
    elevation: 3,
    transform: [{ scale: 1.01 }],
  },
  characterCardGradient: {
    ...StyleSheet.absoluteFill,
    borderRadius: s(19),
  },
  characterCardIconSlot: {
    width: s(112),
    height: s(112),
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },

  characterCardIcon: {
    width: s(255),
    height: s(255),
    resizeMode: "contain",
  },

  characterCardTitle: {
    fontFamily: FRIENDLY_FONT,
    marginTop: s(8),
    fontSize: ms(25),
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
    fontFamily: FRIENDLY_FONT,
    marginTop: s(30),
    color: "#1D4E91",
    fontSize: ms(21),
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: 0.15,
    textShadowColor: "rgba(186, 234, 255, 0.25)",
    textShadowOffset: { width: 0, height: s(1) },
    textShadowRadius: s(1),
  },

  characterContinueButton: {
    marginTop: s(13),
    minWidth: s(190),
    height: Math.max(44, s(46)),
    borderRadius: s(23),
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#02649F",
    shadowOffset: { width: 0, height: s(7) },
    shadowOpacity: 0.32,
    shadowRadius: s(11),
    elevation: 9,
    overflow: "hidden",
  },

  characterContinueGradient: {
    width: "100%",
    height: "100%",
    borderRadius: s(23),
    borderWidth: s(2.5),
    borderColor: "rgba(196, 237, 255, 0.95)",
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: s(18),
  },

  primaryButtonRightIcon: {
    position: "absolute",
    right: s(18),
  },

  characterContinueText: {
    fontFamily: FRIENDLY_FONT,
    color: "#FFFFFF",
    fontSize: ms(19),
    lineHeight: ms(24),
    fontWeight: "900",
    textShadowColor: "rgba(4, 68, 123, 0.45)",
    textShadowOffset: { width: 0, height: s(2) },
    textShadowRadius: s(2),
    width: "100%",
    textAlign: "center",
    includeFontPadding: false,
  },

  instructionsOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 50,
    backgroundColor: "rgba(17, 74, 121, 0.28)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: s(28),
  },

  instructionsBox: {
    width: "93%",
    maxWidth: s(400),
    minHeight: s(500),
    borderRadius: s(26),
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    borderWidth: s(2),
    borderColor: "#64B5F6",
    paddingHorizontal: s(16),
    paddingVertical: s(20),
    alignItems: "center",
    shadowColor: "#0369A1",
    shadowOpacity: 0.22,
    shadowRadius: s(18),
    elevation: 10,
  },

  instructionsHeader: {
    marginTop: s(5),
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: s(3),
  },

  instructionsToothIconSlot: {
    width: s(44),
    height: s(44),
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },

  instructionsToothIcon: {
    right: s(10),
    width: s(120),
    height: s(120),
    resizeMode: "contain",
  },

  instructionsTitle: {
    flexShrink: 1,
    fontFamily: FRIENDLY_FONT,
    color: "#2F64B1",
    fontSize: ms(23) * instructionsTextScale,
    lineHeight: ms(30) * instructionsTextScale,
    fontWeight: "900",
    textAlign: "left",
  },

  instructionsIntro: {
    fontFamily: FRIENDLY_FONT,
    marginTop: s(15),
    color: "#15376c",
    fontSize: ms(17) * instructionsTextScale,
    marginBottom: s(5),
    lineHeight: ms(20) * instructionsTextScale,
    fontWeight: "800",
    textAlign: "center",
  },

  instructionsBadge: {
    fontFamily: FRIENDLY_FONT,
    marginTop: s(25),
    minWidth: s(160),
    borderRadius: s(24),
    backgroundColor: "#3498DB",
    color: "#FFFFFF",
    fontSize: ms(15.5) * instructionsTextScale,
    fontWeight: "800",
    textAlign: "center",
    paddingVertical: s(7),
    overflow: "hidden",
    zIndex: 2,
  },

  instructionsSteps: {
    width: "100%",
    marginTop: s(-5),
    borderRadius: s(16),
    backgroundColor: "#EFFBFF",
    borderWidth: s(1),
    borderColor: "#D7F0FF",
    paddingHorizontal: s(12),
    paddingTop: s(14),
    paddingBottom: s(10),
  },

  instructionsStep: {
    minHeight: s(60),
    flexDirection: "row",
    alignItems: "center",
    gap: s(9),
  },

  instructionsStepNumber: {
    width: s(26),
    height: s(26),
    borderRadius: s(13),
    backgroundColor: "#3498DB",
    color: "#FFFFFF",
    fontSize: ms(15) * instructionsTextScale,
    lineHeight: ms(26),
    fontWeight: "900",
    textAlign: "center",
    overflow: "hidden",
  },

  instructionsStepIcon: {
    width: s(36),
    color: "#1D8FE8",
    fontSize: ms(24) * instructionsTextScale,
    textAlign: "center",
  },

  instructionsHandImage: {
    width: s(75),
    height: s(75),
    resizeMode: "contain",
  },

  instructionsBrushImage: {
    width: s(70),
    height: s(70),
    resizeMode: "contain",
  },

  instructionsToothImage: {
    width: s(90),
    height: s(90),
    resizeMode: "contain",
  },

  instructionsStepImageSlot: {
    width: s(36),
    height: s(36),
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },

  instructionsStepText: {
    flex: 1,
    color: "#243B63",
    fontSize: ms(14) * instructionsTextScale,
    lineHeight: ms(18) * instructionsTextScale,
    fontWeight: "400",
  },

  instructionsStepDivider: {
    height: s(1),
    marginLeft: s(40),
    backgroundColor: "#D6EAF8",
  },

  instructionsReady: {
    fontFamily: FRIENDLY_FONT,
    marginTop: s(21),
    color: "#1D4E91",
    fontSize: ms(21),
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: 0.15,
    textShadowColor: "rgba(186, 234, 255, 0.25)",
    textShadowOffset: { width: 0, height: s(1) },
    textShadowRadius: s(1),
  },

  instructionsButton: {
    marginTop: s(12),
    minWidth: s(205),
    height: Math.max(44, s(46)),
    borderRadius: s(23),
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#02649F",
    shadowOffset: { width: 0, height: s(7) },
    shadowOpacity: 0.32,
    shadowRadius: s(11),
    elevation: 9,
    overflow: "hidden",
  },

  instructionsButtonGradient: {
    width: "100%",
    height: "100%",
    borderRadius: s(23),
    borderWidth: s(2.5),
    borderColor: "rgba(196, 237, 255, 0.95)",
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: s(18),
  },

  instructionsButtonText: {
    fontFamily: FRIENDLY_FONT,
    color: "#FFFFFF",
    fontSize: ms(19) * instructionsTextScale,
    lineHeight: ms(24) * instructionsTextScale,
    fontWeight: "900",
    textShadowColor: "rgba(4, 68, 123, 0.45)",
    textShadowOffset: { width: 0, height: s(2) },
    textShadowRadius: s(2),
    width: "100%",
    textAlign: "center",
    includeFontPadding: false,
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

}
