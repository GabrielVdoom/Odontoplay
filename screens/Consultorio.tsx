import { useSceneMetrics, useSceneBackdrop, FRIENDLY_FONT, SceneOverlay, getTabletConsultorioLayout, getTabletContentScale, imagePointY } from "../utils/responsive";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  BackHandler,
  Easing,
  Image,
  ImageBackground,
  ImageSourcePropType,
  Platform,
  Pressable,
  StyleSheet,
  StyleProp,
  TextStyle,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { AudioPlayer, createAudioPlayer } from "expo-audio";
import { disposeAudioPlayer } from "../utils/audio";
import { LinearGradient } from "expo-linear-gradient";
import { RootStackParamList } from "../App";
import {
  THEME_MUSIC_DUCKED_VOLUME,
  THEME_MUSIC_VOLUME,
  useThemeMusic,
} from "../contexts/ThemeMusicContext";
import { preloadConsultorioImages } from "../services/imagePreload";
import { saveGameProgress } from "../services/progress";
import { getPhoneScreenMetrics } from "../utils/responsive";

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

const gameFont = Platform.OS === "web" ? FRIENDLY_FONT : "Nunito_800ExtraBold";

const PHONE_DENTIST_SCALE = 1.06;

const instrumentTargetPosition = { left: 100, top: 342 };
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

const characterIntroAudio = {
  menino: require("../assets/audio/lucas.mp3"),
  menina: require("../assets/audio/laura.mp3"),
} as const;

const instrumentPracticeAudio = [
  require("../assets/audio/motor.mp3"),
  require("../assets/audio/spray.mp3"),
  require("../assets/audio/sugador.mp3"),
  require("../assets/audio/explorador.mp3"),
  require("../assets/audio/espelho.mp3"),
] as const;

const INSTRUMENT_AUDIO_DELAY_MS = 700;

const completionAudio = require("../assets/audio/parabens.mp3");

const practiceTextsByInstrumentId: Record<string, string> = {
  "instrumento-1":
    "A dentista usa o motor para limpar os dentinhos com cuidado. Ele gira rapidinho e faz um barulhinho, mas não dói nada!",
  "instrumento-2":
    "A dentista usa o spray para jogar um pouquinho de água ou ar. Assim a boca fica limpinha durante o atendimento!",
  "instrumento-3":
    "O sugador ajuda a tirar a saliva da boca. Ele faz um barulhinho divertido e deixa tudo mais confortável!",
  "instrumento-4":
    "O explorador ajuda a dentista a olhar cada cantinho dos dentinhos e descobrir onde precisa cuidar melhor.",
  "instrumento-5":
    "O espelhinho ajuda a dentista a enxergar os dentinhos por todos os lados, até os cantinhos escondidos!",
};

export default function ConsultorioScreen({ navigation }: Props) {
  const metrics = useSceneMetrics();
  const tablet = metrics.isTabletLayout;
  const styles = tablet ? createTabletStyles(metrics) : createPhoneStyles(getPhoneScreenMetrics(metrics));
  const motion = tablet ? metrics.scale : (value: number) => value;

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
  const isGirlCharacter = selectedCharacter === "menina";
  const completionBackground = isGirlCharacter
    ? require("../assets/jogo1/background_meninafeliz3.png")
    : require("../assets/jogo1/background_meninofeliz.png");
  const gameplayBackground = isGirlCharacter
    ? require("../assets/jogo1/background_menina3.png")
    : require("../assets/jogo1/background_menino3.png");
  useSceneBackdrop(showCompletion ? completionBackground : gameplayBackground);
  const { setMusicVolume } = useThemeMusic();
  const dentistProgress = useRef(new Animated.Value(0)).current;
  const completionProgress = useRef(new Animated.Value(0)).current;
  const instructionsProgress = useRef(new Animated.Value(1)).current;
  const initialDentistProgress = useRef(new Animated.Value(0)).current;
  const selectedInstrumentProgress = useRef(new Animated.Value(0)).current;
  const lessonCardScale = useRef(new Animated.Value(0.94)).current;
  const audioScreenActiveRef = useRef(false);
  const introAudioRequestRef = useRef(0);
  const introAudioRef = useRef<AudioPlayer | null>(null);
  const introAudioDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const practiceAudioRef = useRef<AudioPlayer | null>(null);
  const completionAudioRef = useRef<AudioPlayer | null>(null);

  // Each navigation entry starts a fresh round, even if the screen stayed mounted.
  useFocusEffect(
    useCallback(() => {
      setVisitedInstrumentIds([]);
      setLastRewardEarned(false);
      setShowCompletion(false);
      setSelectedInstrumentId(null);
      setAnimatedInstrumentId(null);
      setLessonInstrumentId(null);
      setLessonStage(null);
      setShowInstructions(false);
      setShowCharacterSelection(true);
      dentistProgress.setValue(0);
    }, [dentistProgress])
  );

  useEffect(() => {
    void preloadConsultorioImages().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!showCompletion) {
      completionProgress.setValue(0);
      return;
    }

    const animation = Animated.timing(completionProgress, {
      toValue: 1,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [completionProgress, showCompletion]);

  // Navigation can blur a screen without unmounting it. Invalidate pending
  // playback before releasing the players, including during a quick exit/re-entry.
  useFocusEffect(useCallback(() => {
    audioScreenActiveRef.current = true;

    return () => {
      audioScreenActiveRef.current = false;
      introAudioRequestRef.current += 1;
      if (introAudioDelayRef.current) {
        clearTimeout(introAudioDelayRef.current);
        introAudioDelayRef.current = null;
      }

      disposeAudioPlayer(introAudioRef.current);
      introAudioRef.current = null;
      disposeAudioPlayer(practiceAudioRef.current);
      practiceAudioRef.current = null;
      disposeAudioPlayer(completionAudioRef.current);
      completionAudioRef.current = null;
      void setMusicVolume(THEME_MUSIC_VOLUME);
    };
  }, [setMusicVolume]));

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

  useFocusEffect(useCallback(() => {
    if (lessonStage !== "practice") {
      disposeAudioPlayer(practiceAudioRef.current);
      practiceAudioRef.current = null;
      return;
    }

    const audioSource = instrumentPracticeAudio[lessonInstrumentIndex] ?? instrumentPracticeAudio[0];
    let isActive = true;
    let currentSound: AudioPlayer | null = null;
    let audioDelay: ReturnType<typeof setTimeout> | null = null;

    const playPracticeAudio = async () => {
      try {
        if (practiceAudioRef.current) {
          disposeAudioPlayer(practiceAudioRef.current);
          practiceAudioRef.current = null;
        }

        await setMusicVolume(THEME_MUSIC_DUCKED_VOLUME);

        if (!isActive || !audioScreenActiveRef.current) return;
        const sound = createAudioPlayer(audioSource);

        currentSound = sound;
        practiceAudioRef.current = sound;

        sound.addListener("playbackStatusUpdate", (status) => {
          if (isActive && status.isLoaded && status.didJustFinish) {
            void setMusicVolume(THEME_MUSIC_VOLUME);
            disposeAudioPlayer(sound);

            if (practiceAudioRef.current === sound) {
              practiceAudioRef.current = null;
            }
          }
        });
        sound.play();
      } catch {
        if (isActive) {
          void setMusicVolume(THEME_MUSIC_VOLUME);
        }
        disposeAudioPlayer(currentSound);
        if (practiceAudioRef.current === currentSound) {
          practiceAudioRef.current = null;
        }
      }
    };

    audioDelay = setTimeout(() => {
      void playPracticeAudio();
    }, INSTRUMENT_AUDIO_DELAY_MS);

    return () => {
      isActive = false;

      if (audioDelay) {
        clearTimeout(audioDelay);
      }

      if (currentSound) {
        disposeAudioPlayer(currentSound);
      }

      if (practiceAudioRef.current === currentSound) {
        practiceAudioRef.current = null;
      }

      void setMusicVolume(THEME_MUSIC_VOLUME);
    };
  }, [lessonInstrumentIndex, lessonStage, setMusicVolume]));

  useFocusEffect(useCallback(() => {
    if (!showCompletion) {
      disposeAudioPlayer(completionAudioRef.current);
      completionAudioRef.current = null;
      return;
    }

    let isActive = true;
    let currentSound: AudioPlayer | null = null;

    const playCompletionAudio = async () => {
      try {
        if (completionAudioRef.current) {
          disposeAudioPlayer(completionAudioRef.current);
          completionAudioRef.current = null;
        }

        await setMusicVolume(THEME_MUSIC_DUCKED_VOLUME);

        if (!isActive || !audioScreenActiveRef.current) return;
        const sound = createAudioPlayer(completionAudio);

        currentSound = sound;
        completionAudioRef.current = sound;

        sound.addListener("playbackStatusUpdate", (status) => {
          if (isActive && status.isLoaded && status.didJustFinish) {
            void setMusicVolume(THEME_MUSIC_VOLUME);
            disposeAudioPlayer(sound);

            if (completionAudioRef.current === sound) {
              completionAudioRef.current = null;
            }
          }
        });
        sound.play();
      } catch {
        if (isActive) {
          void setMusicVolume(THEME_MUSIC_VOLUME);
        }
        disposeAudioPlayer(currentSound);
        if (completionAudioRef.current === currentSound) {
          completionAudioRef.current = null;
        }
      }
    };

    void playCompletionAudio();

    return () => {
      isActive = false;

      if (currentSound) {
        disposeAudioPlayer(currentSound);
      }

      if (completionAudioRef.current === currentSound) {
        completionAudioRef.current = null;
      }

      void setMusicVolume(THEME_MUSIC_VOLUME);
    };
  }, [setMusicVolume, showCompletion]));

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
    outputRange: [motion(70), 0],
  });

  const dentistTranslateY = dentistProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [motion(18), 0],
  });

  const dentistScale = dentistProgress.interpolate({
    inputRange: [0, 1],
    outputRange: tablet ? [0.94, 1] : [0.94 * PHONE_DENTIST_SCALE, PHONE_DENTIST_SCALE],
  });

  const floorPanelTranslateY = dentistProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [motion(36), 0],
  });

  const selectedOrigin = animatedInstrumentId
    ? instrumentOriginPositions[animatedInstrumentId]
    : null;

  const selectedInstrumentTranslateX = selectedInstrumentProgress.interpolate({
    inputRange: [0, 1],
    outputRange: selectedOrigin
      ? [0, motion(instrumentTargetPosition.left - selectedOrigin.left)]
      : [0, 0],
  });

  const selectedInstrumentTranslateY = selectedInstrumentProgress.interpolate({
    inputRange: [0, 1],
    outputRange: selectedOrigin
      ? [0, motion(instrumentTargetPosition.top - selectedOrigin.top)]
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

  const childName = selectedCharacter === "menina" ? "Laura" : "Lucas";
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
    setLessonStage("success");
  };

  const finishLessonCard = () => {
    if (lessonInstrument) {
      const completesGame = lastRewardEarned && visitedInstrumentIds.length === instrumentos.length - 1;
      saveViewedInstrument(lessonInstrument.id);
      if (completesGame) {
        setShowCompletion(true);
      }
    }

    setSelectedInstrumentId(null);
    setAnimatedInstrumentId(null);
    closeLessonCard();
  };

  const playCharacterIntroAudio = async () => {
    if (!audioScreenActiveRef.current) return;
    const request = ++introAudioRequestRef.current;
    let sound: AudioPlayer | null = null;
    const isCurrentRequest = () =>
      audioScreenActiveRef.current && request === introAudioRequestRef.current;

    try {
      if (introAudioRef.current) {
        disposeAudioPlayer(introAudioRef.current);
        introAudioRef.current = null;
      }

      await setMusicVolume(THEME_MUSIC_DUCKED_VOLUME);

      if (!isCurrentRequest()) return;
      const player = createAudioPlayer(characterIntroAudio[selectedCharacter]);
      sound = player;

      player.addListener("playbackStatusUpdate", (status) => {
        if (isCurrentRequest() && status.isLoaded && status.didJustFinish) {
          void setMusicVolume(THEME_MUSIC_VOLUME);
          disposeAudioPlayer(player);

          if (introAudioRef.current === player) {
            introAudioRef.current = null;
          }
        }
      });

      introAudioRef.current = player;
      player.play();
    } catch {
      disposeAudioPlayer(sound);
      if (isCurrentRequest()) {
        void setMusicVolume(THEME_MUSIC_VOLUME);
        introAudioRef.current = null;
      }
    }
  };

  const stopCharacterIntroAudio = async () => {
    introAudioRequestRef.current += 1;
    if (introAudioDelayRef.current) {
      clearTimeout(introAudioDelayRef.current);
      introAudioDelayRef.current = null;
    }

    if (introAudioRef.current) {
      disposeAudioPlayer(introAudioRef.current);
      introAudioRef.current = null;
    }

    await setMusicVolume(THEME_MUSIC_VOLUME);
  };

  const scheduleCharacterIntroAudio = () => {
    // Repeated taps replace the previous introduction, including pending starts.
    void stopCharacterIntroAudio();
    if (!audioScreenActiveRef.current) return;
    if (introAudioDelayRef.current) {
      clearTimeout(introAudioDelayRef.current);
    }

    introAudioDelayRef.current = setTimeout(() => {
      introAudioDelayRef.current = null;
      void playCharacterIntroAudio();
    }, 800);
  };

  const startGameplay = () => {
    void stopCharacterIntroAudio();
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
    completionProgress.setValue(0);
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
      <Animated.Image
        source={completionBackground}
        fadeDuration={0}
        style={[styles.backgroundLayer, { opacity: completionProgress }]}
      />
      <View style={styles.overlay} />

      {!showInstructions && !showCharacterSelection && !showCompletion ? (
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
          <Ionicons name="chevron-back" size={tablet ? 30 * metrics.contentScale : 30} color="#FFFFFF" />
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
            shouldShowNextInstrumentBubble && styles.nextInstrumentBubble,
            {
              opacity: dentistProgress,
            },
          ]}
        >
          <Image
            source={require("../assets/jogo1/balao.png")}
            style={[
              styles.instrumentBubbleImage,
              shouldShowNextInstrumentBubble && styles.nextInstrumentBubbleImage,
            ]}
          />
          <View
            style={[
              styles.instrumentBubbleTextBox,
              shouldShowNextInstrumentBubble && styles.nextInstrumentBubbleTextBox,
            ]}
          >
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
              <Text style={styles.nextInstrumentBubbleTitle}>
                Que tal conhecer os{"\n"}
                <Text style={styles.instrumentBubbleTextHighlight}>outros instrumentos?</Text>
              </Text>
            )}
          </View>
        </Animated.View>
      ) : null}

      <Animated.View
        style={[
          styles.floorPanelWrapper,
          showCompletion && styles.completionTrayLayer,
          {
            opacity: dentistProgress,
            transform: [{ translateY: floorPanelTranslateY }],
          },
        ]}
      >
        <InstrumentTray
          completedIds={visitedInstrumentIds}
          animateStars={!showCompletion}
          onSelect={showCompletion ? undefined : (id) => {
            setLessonInstrumentId(id);
            setLessonStage("instrument");
          }}
        />
      </Animated.View>

      {showCompletion ? (
        <CompletionCelebration
          progress={completionProgress}
          isGirl={isGirlCharacter}
          onRetry={retryGame}
          onExit={() => navigation.goBack()}
        />
      ) : null}

      {lessonStage && lessonInstrument ? (
        <SceneOverlay tablet={tablet} animated={true} style={styles.lessonOverlay}>
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
                    <Ionicons name="medical" size={tablet ? 15 * metrics.contentScale : 15} color="#8FD5FF" />
                    <View style={styles.instrumentDividerLine} />
                  </View>
                  <Text style={styles.lessonDescription}>
                    {lessonInstrument.descricao}
                  </Text>
                </View>

                <Pressable
                  style={[styles.lessonPrimaryButton, styles.lessonPracticeButton]}
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
                      size={tablet ? 23 * metrics.contentScale : 23}
                      color="#FFFFFF"
                      style={styles.lessonPrimaryButtonLeftIcon}
                    />
                    <View style={styles.lessonPrimaryButtonCopy}>
                      <Text
                        style={styles.lessonPrimaryButtonText}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.78}
                      >
                        {"Mostrar na prática!"}
                      </Text>
                      <Text
                        style={styles.lessonPrimaryButtonSubtext}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.78}
                      >
                        Vamos ver como funciona
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={tablet ? 24 * metrics.contentScale : 24}
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
                <View style={styles.practiceDescriptionCard}>
                  <Text style={styles.practiceDescription}>
                    {practiceTextsByInstrumentId[lessonInstrument.id]}
                  </Text>
                </View>

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
                      size={tablet ? 30 * metrics.contentScale : 30}
                      color="#FFFFFF"
                      style={styles.lessonPrimaryButtonLeftIcon}
                    />
                    <View style={styles.lessonPrimaryButtonCopy}>
                      <Text
                        style={styles.lessonPrimaryButtonEntendiText}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.8}
                      >
                        Entendi!
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={tablet ? 24 * metrics.contentScale : 24}
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
                  <LinearGradient
                    colors={["#5FD142", "#49BE31", "#2EA721"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.successButtonGradient}
                  >
                    <Text
                      style={styles.successButtonText}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.8}
                    >
                      Continuar
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={tablet ? 25 * metrics.contentScale : 25}
                      color="#FFFFFF"
                      style={styles.successButtonRightIcon}
                    />
                  </LinearGradient>
                </Pressable>
              </>
            )}
          </Animated.View>
        </SceneOverlay>
      ) : null}

      {showInstructions ? (
        <ConsultorioIntro
          selectedCharacter={selectedCharacter}
          initialDentistProgress={initialDentistProgress}
          startGameplay={startGameplay}
        />
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
                scheduleCharacterIntroAudio();
              }}
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
                  style={styles.characterButtonRightIcon}
                />
              </LinearGradient>
            </Pressable>
          </View>
        </SceneOverlay>
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
  const metrics = useSceneMetrics();
  const tablet = metrics.isTabletLayout;
  const styles = tablet ? createTabletStyles(metrics) : createPhoneStyles(getPhoneScreenMetrics(metrics));

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
  const metrics = useSceneMetrics();
  const tablet = metrics.isTabletLayout;
  const scene = tablet ? metrics : getPhoneScreenMetrics(metrics);
  const styles = tablet ? createTabletStyles(metrics) : createPhoneStyles(scene);
  const { width: screenWidth, height: screenHeight } = scene;

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
                width: tablet ? metrics.scale(particle.width) : particle.width,
                height: tablet ? metrics.scale(particle.height) : particle.height,
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

function CompletionCelebration({
  progress,
  isGirl,
  onRetry,
  onExit,
}: {
  progress: Animated.Value;
  isGirl: boolean;
  onRetry: () => void;
  onExit: () => void;
}) {
  const metrics = useSceneMetrics();
  const styles = metrics.isTabletLayout ? createTabletStyles(metrics) : createPhoneStyles(getPhoneScreenMetrics(metrics));
  const girlTextColor = isGirl && { color: "#243B8F" };

  return (
    <>
      <CompletionConfetti />

      <Pressable style={styles.completionExitButton} onPress={onExit}>
        <Image
          source={require("../assets/shared/botao_sair.png")}
          style={styles.completionExitImage}
        />
      </Pressable>

      <Animated.View style={[styles.completionBubble, { opacity: progress }]}>
        <Image
          source={require("../assets/jogo1/balao.png")}
          fadeDuration={0}
          style={styles.completionBubbleImage}
        />
        <View style={styles.completionTitleRow}>
          <Text style={styles.completionTitleStar}>★</Text>
          <Text style={[styles.completionTitle, girlTextColor]}>
            Parabéns!
          </Text>
          <Text style={styles.completionTitleStar}>★</Text>
        </View>
        <View style={styles.completionHeadlineBox}>
          <Text style={[styles.completionHeadlineText, girlTextColor]}>
            Você concluiu todos os instrumentos!
          </Text>
        </View>
        <Text style={styles.completionSparkle}>✦</Text>
        <View style={styles.completionBubbleTail} />
      </Animated.View>

      <Pressable style={styles.completionRetryButton} onPress={onRetry}>
        <Image
          source={require("../assets/jogo2/botao_jogarnovamente2.png")}
          style={styles.completionRetryButtonImage}
        />
      </Pressable>
    </>
  );
}


function InstrumentTray({ completedIds, onSelect, animateStars }: {
  completedIds: string[];
  onSelect?: (id: string) => void;
  animateStars: boolean;
}) {
  const metrics = useSceneMetrics();
  const tablet = metrics.isTabletLayout;
  const styles = tablet ? createTabletStyles(metrics) : createPhoneStyles(getPhoneScreenMetrics(metrics));

  return (
        <ImageBackground
          source={require("../assets/shared/rectangle.png")}
          style={[styles.floorPanel, styles.gameFloorPanel]}
          imageStyle={[styles.floorPanelImage, styles.gameFloorPanelImage]}
        >
          {instrumentos.map((instrumento) => (
            <Pressable
              key={instrumento.id}
              disabled={!onSelect}
              onPress={() => onSelect?.(instrumento.id)}
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
          <View pointerEvents="none" style={styles.instrumentStarsLayer}>
            {instrumentos.map((instrumento) => (
              <View key={instrumento.id} style={styles.instrumentStarSlot}>
              {completedIds.includes(instrumento.id) ? (
                <EarnedInstrumentStar
                  label={`${instrumento.nome} concluído`}
                  animate={animateStars}
                />
              ) : null}
              </View>
            ))}
          </View>
        </ImageBackground>
  );
}

function EarnedInstrumentStar({ label, animate }: {
  label: string;
  animate: boolean;
}) {
  const metrics = useSceneMetrics();
  const tablet = metrics.isTabletLayout;
  const scene = tablet ? metrics : getPhoneScreenMetrics(metrics);
  const styles = tablet ? createTabletStyles(metrics) : createPhoneStyles(scene);
  const progress = useRef(new Animated.Value(animate ? 0 : 1)).current;

  useEffect(() => {
    if (!animate) {
      progress.setValue(1);
      return;
    }
    const animation = Animated.spring(progress, {
      toValue: 1,
      friction: 5,
      tension: 95,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [animate, progress]);

  return (
    <Animated.View
      accessible
      accessibilityRole="image"
      accessibilityLabel={label}
      pointerEvents="none"
      style={[styles.earnedInstrumentStar, {
        opacity: progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 1, 1], extrapolate: "clamp" }),
        transform: [
          { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [scene.scale(-16), 0] }) },
          { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }) },
          { rotate: progress.interpolate({ inputRange: [0, 1], outputRange: ["-18deg", "0deg"] }) },
        ],
      }]}
    >
      <Image source={require("../assets/jogo1/1star.png")} style={styles.earnedStarImage} />
    </Animated.View>
  );
}

// Measure an unconstrained copy so fitting uses the device's real font metrics.
// React Native Web does not implement adjustsFontSizeToFit; this also keeps previews faithful.
function IntroFittedText({ children, style, numberOfLines = 1 }: { children: React.ReactNode; style: StyleProp<TextStyle>; numberOfLines?: number }) {
  const flatStyle = StyleSheet.flatten(style) ?? {};
  const [availableWidth, setAvailableWidth] = useState(0);
  const [textWidth, setTextWidth] = useState(0);
  const fit = availableWidth && textWidth ? Math.min(1, availableWidth / (textWidth + 1)) : 1;
  return (
    <View style={{ width: flatStyle.width || "100%", position: flatStyle.position, left: flatStyle.left, right: flatStyle.right, minWidth: 0 }}
      onLayout={({ nativeEvent: { layout } }) => setAvailableWidth(layout.width)}>
      <View pointerEvents="none" accessible={false} importantForAccessibility="no-hide-descendants"
        aria-hidden style={{ position: "absolute", width: 10000, opacity: 0, alignItems: "flex-start" }}>
        <Text numberOfLines={numberOfLines} maxFontSizeMultiplier={1.12}
          style={[flatStyle, { position: "relative", width: "auto", alignSelf: "flex-start", left: undefined, right: undefined }]}
          onLayout={({ nativeEvent: { layout } }) => setTextWidth(layout.width)}>{children}</Text>
      </View>
      <Text numberOfLines={numberOfLines} maxFontSizeMultiplier={1.12}
        style={[flatStyle, { position: "relative", left: undefined, right: undefined, fontSize: (flatStyle.fontSize || 14) * fit }]}>{children}</Text>
    </View>
  );
}

// Measure the safe content area, not the physical screen (which includes system bars).
function ConsultorioIntro({ selectedCharacter, initialDentistProgress, startGameplay }: {
  selectedCharacter: ConsultorioCharacter;
  initialDentistProgress: Animated.Value;
  startGameplay: () => void;
}) {
  const metrics = useSceneMetrics();
  const tablet = metrics.isTabletLayout;
  const styles = tablet ? createTabletStyles(metrics) : createPhoneStyles(getPhoneScreenMetrics(metrics));
  const motion = tablet ? metrics.scale : (value: number) => value;

  const window = useWindowDimensions();
  const [area, setArea] = useState({ width: tablet ? metrics.width : window.width, height: tablet ? metrics.height : window.height });
  const [cardHeight, setCardHeight] = useState(0);
  const isGirlCharacter = selectedCharacter === "menina";
  const childName = isGirlCharacter ? "Laura" : "Lucas";
  const greetingLead = isGirlCharacter ? "Essa é a" : "Este é o";
  const greetingText = `${greetingLead} ${childName}!`;
  const introStyles = tablet
    ? getTabletIntroStyles(area.width, area.height, cardHeight, styles, metrics.topInset, metrics.bottomInset)
    : getIntroStyles(area.width, area.height, cardHeight, styles);
  const initialDentistTranslateX = initialDentistProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [motion(70), 0],
  });

  const initialDentistTranslateY = initialDentistProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [motion(18), 0],
  });

  return (
        <SafeAreaView style={styles.instructionsLayer} edges={tablet ? [] : ["bottom", "left", "right"]}>
          <View style={introStyles.instructionsOverlay} onLayout={({ nativeEvent: { layout } }) => setArea({ width: layout.width, height: layout.height })}>
            <Animated.Image
              testID="intro-dentist"
              source={require("../assets/jogo1/dentista-1.png")}
              style={[
                introStyles.dentistaInicial,
                {
                  opacity: initialDentistProgress,
                  transform: [
                    { translateX: initialDentistTranslateX },
                    { translateY: initialDentistTranslateY },
                    ...(!tablet ? [{ scale: PHONE_DENTIST_SCALE }] : []),
                  ],
                },
              ]}
            />

            <View testID="intro-title" style={introStyles.instructionsVisitImageFrame}>
              <Image
                source={require("../assets/jogo1/titulo3.png")}
                style={styles.instructionsVisitImage}
              />
            </View>

            <View
              testID="intro-card"
              onLayout={({ nativeEvent: { layout } }) => setCardHeight(layout.height)}
              style={[
                introStyles.instructionsBoxFrame,
                isGirlCharacter && styles.instructionsBoxFrameGirl,
              ]}
            >
              <LinearGradient
                colors={["rgba(16, 94, 199, 0.99)", "rgba(5, 62, 153, 0.98)", "rgba(2, 42, 116, 0.99)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={introStyles.instructionsBox}
              >
              <View style={introStyles.instructionsHero}>
                <Text style={styles.instructionsCardSparkle}>{"\u2726"}</Text>
                <View style={introStyles.instructionsGreetingLogo}>
                  <IntroFittedText style={[introStyles.instructionsGreetingLayer, styles.instructionsGreetingStroke]}>
                    {greetingText}
                  </IntroFittedText>
                  <IntroFittedText style={[introStyles.instructionsGreetingLayer, styles.instructionsGreetingDepth]}>
                    {greetingText}
                  </IntroFittedText>
                  <IntroFittedText style={introStyles.instructionsGreeting}>
                    {greetingLead}{" "}
                    <Text
                      style={[
                        styles.instructionsName,
                        isGirlCharacter && styles.instructionsNameGirl,
                      ]}
                    >
                      {childName}!
                    </Text>
                  </IntroFittedText>
                </View>
                <Text style={styles.instructionsCardSparkle}>{"\u2726"}</Text>
              </View>
              <IntroFittedText style={introStyles.instructionsText}>
                Hoje é a primeira consulta {isGirlCharacter ? "dela" : "dele"}.
              </IntroFittedText>
              <LinearGradient
                colors={["rgba(95, 174, 245, 0.20)", "rgba(255, 255, 255, 0.06)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={introStyles.instructionsInvite}
              >
                <View style={introStyles.instructionsInviteIcon}>
                  <Ionicons name="search-outline" size={tablet ? 24 * metrics.contentScale : 24} color="#C9EBFF" />
                </View>
                <View style={styles.instructionsInviteCopy}>
                  <IntroFittedText style={introStyles.instructionsPromptLine} numberOfLines={2}>
                    Vamos ajudar {selectedCharacter === "menina" ? "a" : "o"}{" "}
                    <Text
                      style={[
                        styles.instructionsPromptName,
                        isGirlCharacter && styles.instructionsPromptNameGirl,
                      ]}
                    >
                      {childName}
                    </Text>
                    {" a conhecer\nos instrumentos do consultório?"}
                  </IntroFittedText>
                </View>
              </LinearGradient>
              <Pressable
                style={introStyles.instructionsButton}
                onPress={startGameplay}
              >
                <LinearGradient
                  colors={["#A8F45F", "#53CC20", "#27A814"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={introStyles.instructionsButtonGradient}
                >
                  <Text
                    style={introStyles.instructionsButtonText}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.8}
                    maxFontSizeMultiplier={1.12}
                  >
                    Começar
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={tablet ? 28 * metrics.contentScale : 28}
                    color="#FFFFFF"
                    style={introStyles.instructionsButtonIcon}
                  />
                </LinearGradient>
              </Pressable>
              </LinearGradient>
            </View>
          </View>
        </SafeAreaView>
  );
}

function getTabletIntroStyles(width: number, height: number, measuredCardHeight: number, styles: ReturnType<typeof createPhoneStyles> | ReturnType<typeof createTabletStyles>, topInset: number, bottomInset: number) {
  const scene = getTabletConsultorioLayout(width, height, topInset, bottomInset);
  const gutter = scene.gutter;
  const zoom = getTabletContentScale(width, height);
  // Extra vertical room in narrower portrait tablets can support a larger card.
  // Blend continuously between common 16:10 and 4:3 tablet proportions.
  const wideBalance = Math.min(1, Math.max(0, (width / height - 5 / 8) / (3 / 4 - 5 / 8)));
  const portraitBoost = 1 + 0.08 * Math.max(0, 1 - wideBalance * 2);
  const readabilityBoost = 1.16;
  const typeScale = Math.min(1.46, Math.max(1.23, width / zoom / 650 * 1.12)) * zoom * portraitBoost * readabilityBoost;
  const cardWidth = Math.min(width - gutter * 2, 330 * typeScale);
  const cardBottom = bottomInset + Math.max(0, 16 - 28 * wideBalance) * zoom;
  // The feet are baked into the background, as is the head used by the balloon.
  // onLayout measures the intrinsic card (transforms do not change that height),
  // so compact tablets can fit it below the feet without a measurement loop.
  const childFeetBottom = imagePointY(width, height, 854, 1842, 0.595);
  const cardRoom = Math.max(0, height - cardBottom - childFeetBottom - 8 * zoom);
  const buttonHeight = Math.min(100 * zoom, 64 * typeScale);
  const cardFit = measuredCardHeight > 0
    ? Math.min(1, Math.max(44 / buttonHeight, cardRoom / measuredCardHeight)) : 1;
  const base = getIntroStyles(cardWidth / zoom / 0.84, height / zoom, measuredCardHeight / zoom, styles);
  // Expand only spacing computed by the phone-shaped reference card; inherited
  // tablet colors, borders and effects already use the actual viewport metrics.
  const spacing = <T extends object>(style: T, keys: (keyof T)[]): T => {
    const result = { ...style };
    for (const key of keys) if (typeof style[key] === "number") {
      result[key] = (Number(style[key]) * zoom) as T[keyof T];
    }
    return result;
  };
  const titleTop = topInset + 16 * zoom;
  const titleHeight = Math.min(height * 0.22, 250 * zoom);
  return {
    ...base,
    instructionsOverlay: { ...base.instructionsOverlay, justifyContent: "flex-end" as const },
    instructionsBoxFrame: { ...spacing(base.instructionsBoxFrame, ["minHeight", "padding", "borderRadius"]), position: "absolute" as const, left: (width - cardWidth) / 2, bottom: cardBottom, width: cardWidth,
      transformOrigin: "50% 100%", transform: [{ scale: cardFit }] },
    instructionsBox: spacing(base.instructionsBox, ["minHeight", "paddingHorizontal", "paddingTop", "paddingBottom", "borderRadius"]),
    instructionsHero: spacing(base.instructionsHero, ["minHeight", "gap", "marginTop", "marginBottom"]),
    instructionsGreetingLogo: spacing(base.instructionsGreetingLogo, ["minHeight"]),
    instructionsInvite: spacing(base.instructionsInvite, ["gap", "paddingHorizontal", "paddingVertical", "marginTop", "marginBottom", "borderRadius"]),
    instructionsInviteIcon: spacing(base.instructionsInviteIcon, ["width", "height"]),
    instructionsVisitImageFrame: { ...base.instructionsVisitImageFrame, top: titleTop, left: gutter, right: gutter, width: width - gutter * 2, height: titleHeight },
    dentistaInicial: { ...base.dentistaInicial, width: scene.dentistWidth, height: scene.dentistHeight, right: scene.dentistRight, bottom: scene.dentistBottom },
    instructionsGreetingLayer: { ...base.instructionsGreetingLayer, fontSize: 30 * typeScale, lineHeight: 36 * typeScale },
    instructionsGreeting: { ...base.instructionsGreeting, fontSize: 30 * typeScale, lineHeight: 36 * typeScale },
    instructionsText: { ...base.instructionsText, fontSize: 17 * typeScale, lineHeight: 24 * typeScale },
    instructionsPromptLine: { ...base.instructionsPromptLine, fontSize: 14 * typeScale, lineHeight: 20 * typeScale },
    instructionsButton: { ...spacing(base.instructionsButton, ["marginTop", "borderRadius"]), height: buttonHeight },
    instructionsButtonGradient: spacing(base.instructionsButtonGradient, ["borderRadius"]),
    instructionsButtonText: { ...base.instructionsButtonText, fontSize: 26 * typeScale, lineHeight: 32 * typeScale, paddingHorizontal: 40 * zoom },
    instructionsButtonIcon: { ...base.instructionsButtonIcon, right: 16 * zoom, width: 30 * zoom },
  };
}

function getIntroStyles(width: number, height: number, measuredCardHeight: number, styles: ReturnType<typeof createPhoneStyles> | ReturnType<typeof createTabletStyles>) {
  const cardWidth = Math.min(width * 0.84, 430);
  const unit = cardWidth / (393 * 0.84);
  // Tighten vertical gaps on shorter viewports; text and controls retain their own sizes.
  const spacing = Math.min(1, Math.max(0.65, height / (760 * unit)));
  const cardMinHeight = 262 * unit;
  const cardHeight = measuredCardHeight || cardMinHeight;
  const cardTop = height - cardHeight;
  const titleHeight = Math.min(242 * unit, height * 0.31);
  const titleTop = Math.min(30 * unit, height * 0.035);
  const dentistOverlap = 142 * unit;
  const dentistHeight = Math.min(435 * unit, Math.max(0, cardTop - (titleTop + titleHeight * 0.82) + dentistOverlap));
  const promptSize = Math.min(16, Math.max(12, 13.8 * unit));
  const greetingFont = { fontSize: 30 * unit, lineHeight: 36 * unit };
  return {
    instructionsOverlay: { ...styles.instructionsOverlay, position: "relative" as const, flex: 1, paddingBottom: 0 },
    instructionsBoxFrame: { ...styles.instructionsBoxFrame, width: cardWidth, minHeight: cardMinHeight * spacing, padding: 4 * unit, borderRadius: 28 * unit },
    instructionsBox: { ...styles.instructionsBox, minHeight: (cardMinHeight - 8 * unit) * spacing, paddingHorizontal: 18 * unit, paddingTop: 23 * unit * spacing, paddingBottom: 14 * unit * spacing, borderRadius: 24 * unit },
    instructionsVisitImageFrame: { ...styles.instructionsVisitImageFrame, top: titleTop, height: titleHeight },
    // Keep the transparent image's lower body behind the card, as in the reference.
    dentistaInicial: {
      position: "absolute" as const,
      width: dentistHeight * 280 / 435,
      height: dentistHeight,
      right: width * 0.5 - 60 * unit - dentistHeight * 140 / 435,
      bottom: cardHeight - dentistOverlap + 12 * unit,
      resizeMode: "contain" as const,
      zIndex: 1,
    },
    instructionsHero: { ...styles.instructionsHero, minHeight: 52 * unit, gap: 6 * unit, marginTop: -10 * unit * spacing, marginBottom: 2 * unit },
    instructionsGreetingLogo: { ...styles.instructionsGreetingLogo, minWidth: 0, flex: 1, flexShrink: 1, minHeight: 42 * unit },
    instructionsGreetingLayer: { ...styles.instructionsGreetingLayer, ...greetingFont },
    instructionsGreeting: { ...styles.instructionsGreeting, ...greetingFont, width: "100%" as const },
    instructionsText: { ...styles.instructionsText, fontSize: 17 * unit, lineHeight: 24 * unit },
    instructionsInvite: { ...styles.instructionsInvite, gap: 8 * unit, paddingHorizontal: 10 * unit, paddingVertical: 11 * unit * spacing, marginTop: 12 * unit * spacing, marginBottom: 10 * unit * spacing, borderRadius: 20 * unit },
    instructionsInviteIcon: { ...styles.instructionsInviteIcon, width: 35 * unit, height: 35 * unit, flexShrink: 0 },
    instructionsPromptLine: { ...styles.instructionsPromptLine, fontSize: promptSize, lineHeight: 19 * unit },
    instructionsButton: { ...styles.instructionsButton, height: Math.max(44, 58 * unit), marginTop: 2 * unit, borderRadius: 29 * unit },
    instructionsButtonGradient: { ...styles.instructionsButtonGradient, borderRadius: 29 * unit },
    instructionsButtonIcon: { ...styles.instructionsButtonIcon, right: 30 * unit, width: 30 * unit },
    instructionsButtonText: { ...styles.instructionsButtonText, fontSize: 27 * unit, lineHeight: 32 * unit },
  };
}

function createPhoneStyles({ scale: s, moderateScale: ms }: ReturnType<typeof getPhoneScreenMetrics>) {
return StyleSheet.create({
  completionConfettiLayer: {
    ...StyleSheet.absoluteFill,
    zIndex: 9,
    elevation: 9,
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
    width: 132,
    height: 110,
    resizeMode: "contain",
  },
  completionBubble: {
    position: "absolute",
    left: 18,
    right: 68,
    top: 80,
    height: 222,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 8,
    transform: [{ translateX: -10 }],
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
    marginTop: -30,
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
  
    fontSize: 30,
    fontWeight: "900",
    textAlign: "center",
  },
  completionHeadlineBox: {
    marginTop: 7,
    alignItems: "center",
    justifyContent: "center",
    width: 238,
  },
  completionHeadlineText: {
    marginTop: 0,
    color: "#112D91",
    fontSize: 19,
    lineHeight: 26,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: 0,
  },
  completionSparkle: {
    display: "none",
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
  completionTrayLayer: {
    zIndex: 10,
  },
  characterSelectionOverlay: {
    ...StyleSheet.absoluteFill,
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
    fontFamily: gameFont,
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
    ...StyleSheet.absoluteFill,
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
    fontFamily: gameFont,
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
    fontFamily: gameFont,
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
  background: {
    flex: 1,
    backgroundColor: "#EEF5FF",
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFill,
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
    top: s(44),
    right: s(18),
    zIndex: 10,
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
  dentistaWrapper: {
    position: "absolute",
    left: s(18),
    bottom: s(184),
    zIndex: 4,
  },
  dentistaExplicando: {
    top: s(-15),
    left: s(135),
    width: s(300),
    height: s(435),
    resizeMode: "contain",
  },
  instrumentBubble: {
    position: "absolute",
    left: s(10),
    top: s(96),
    width: s(300),
    height: s(200),
    zIndex: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  nextInstrumentBubble: {
    height: s(158),
  },
  instrumentBubbleImage: {
    position: "absolute",
    width: s(320),
    height: s(200),
    resizeMode: "stretch",
    transform: [{ scaleX: -1 }],
  },
  nextInstrumentBubbleImage: {
    height: s(158),
  },
  instrumentBubbleTextBox: {
    width: s(248),
    minHeight: s(132),
    marginTop: s(-12),
    marginLeft: s(-6),
    alignItems: "center",
    justifyContent: "center",
  },
  nextInstrumentBubbleTextBox: {
    marginTop: s(-22),
  },
  initialInstrumentBubbleText: {
    marginTop: s(-5),
    fontFamily: gameFont,
    color: "#374255",
    fontSize: ms(19),
    lineHeight: ms(26),
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
    fontFamily: gameFont,
    color: "#374255",
    fontSize: ms(20),
    lineHeight: ms(29),
    fontWeight: "900",
    textAlign: "center",
    includeFontPadding: false,
    textShadowColor: "rgba(255, 255, 255, 0.95)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  floorPanelWrapper: {
    position: "absolute",
    left: s(20),
    right: s(13),
    bottom: s(65),
    height: s(290),
    zIndex: 6,
    overflow: "visible",
  },
  floorPanel: {
    flex: 1,
    paddingHorizontal: s(24),
    paddingVertical: s(16),
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  floorPanelImage: {
    resizeMode: "stretch",
    width: s(600),
    height: s(430),
    left: s(-120),
  },
  instrumentButton: {
    alignItems: "center",
    justifyContent: "flex-end",
  },
  gameFloorPanel: {
    paddingLeft: s(8),
    paddingRight: s(16),
  },
  // The asset includes large outer margins. Align its visible blue border with the reference.
  gameFloorPanelImage: {
    width: s(614),
    height: s(440),
    left: s(-129),
    top: s(-8),
  },
  // Match the instrument row without letting stars participate in its layout.
  instrumentStarsLayer: {
    position: "absolute",
    left: s(8),
    right: s(16),
    bottom: s(16),
    flexDirection: "row",
    justifyContent: "space-between",
  },
  instrumentStarSlot: {
    width: s(60),
    alignItems: "center",
  },
  earnedStarImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  earnedInstrumentStar: {
    position: "absolute",
    bottom: s(-14),
    width: s(40),
    height: s(42),
    alignItems: "center",
    justifyContent: "center",
  },
  instrumentoItem: {
    width: s(60),
    height: s(143),
    resizeMode: "contain",
  },
  lessonOverlay: {
    ...StyleSheet.absoluteFill,
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
    height: 64,
    marginTop: 16,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    overflow: "hidden",
  },
  lessonPracticeButton: {
    width: "104%",
  },
  lessonPrimaryButtonGradient: {
    width: "100%",
    height: 64,
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
    includeFontPadding: false,
    textShadowColor: "rgba(18, 18, 110, 0.45)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  lessonPrimaryButtonEntendiText: {
    color: "#ffffff",
    fontSize: 23,
    lineHeight: 28,
    fontWeight: "900",
    width: "100%",
    textAlign: "center",
    includeFontPadding: false,
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
    includeFontPadding: false,
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
  practiceDescriptionCard: {
    width: "100%",
    marginTop: 20,
    minHeight: 104,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#C7E4FF",
    backgroundColor: "#F5FBFF",
    alignItems: "stretch",
    justifyContent: "center",
    paddingVertical: 13,
    paddingHorizontal: 14,
    shadowColor: "#1D61B8",
    shadowOpacity: 0.09,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  practiceDescription: {
    width: "100%",
    color: "#173D87",
    fontSize: 18,
    lineHeight: 22,
    fontFamily: gameFont,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 0.2,
    includeFontPadding: false,
    textShadowColor: "rgba(255, 255, 255, 0.95)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
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
    fontSize: 19,
    lineHeight: 25,
    fontWeight: "600",
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
    height: 62,
    marginTop: 18,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#1F7F18",
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 8,
    overflow: "hidden",
  },
  successButtonGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 23,
    borderWidth: 2,
    borderColor: "rgba(219, 255, 172, 0.95)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 34,
    position: "relative",
  },
  successButtonText: {
    color: "#FFFFFF",
    fontSize: 22,
    lineHeight: 27,
    fontWeight: "900",
    width: "100%",
    textAlign: "center",
    includeFontPadding: false,
    transform: [{ translateX: -9 }],
    textShadowColor: "rgba(28, 94, 16, 0.45)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  successButtonRightIcon: {
    position: "absolute",
    right: 17,
  },
  instructionsLayer: {
    ...StyleSheet.absoluteFill,
    zIndex: 100,
    elevation: 100,
  },
  instructionsOverlay: {
    ...StyleSheet.absoluteFill,
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
    width: 35,
    height: 35,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#B6EEFF",
    alignItems: "center",
    justifyContent: "center",
  },
  instructionsInviteCopy: {
    minWidth: 0,
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
    textAlign: "left",
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
    lineHeight: 32,
    fontWeight: "900",
    width: "100%",
    textAlign: "center",
    includeFontPadding: false,
    transform: [{ translateX: -8 }],
    textShadowColor: "rgba(33, 92, 18, 0.58)",
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 3,
  },
});
}


// Tablet-only styles. The phone styles above are preserved from the pre-tablet snapshot.
function createTabletStyles(metrics: ReturnType<typeof useSceneMetrics>) {
const { scale: s, moderateScale: ms } = metrics;
const layout = getTabletConsultorioLayout(metrics.width, metrics.height, metrics.topInset, metrics.bottomInset);
const dentistHeight = layout.dentistHeight;
const dentistWidth = layout.dentistWidth;
const bubbleScale = 1.08;
const bubbleWidth = Math.min(metrics.width * 0.60, 440 * metrics.contentScale * bubbleScale);
// The child's head is part of the background PNG. Respect its position after
// cover cropping so the speech bubble cannot cover the child's face/hair.
const childHeadTop = imagePointY(metrics.width, metrics.backgroundHeight, 854, 1842, 0.34);
const preferredBubbleTop = Math.max(metrics.topInset + s(40), metrics.height * 0.08);
// Four explicit text lines must fit inside the rounded part, above the tail.
const bubbleHeight = Math.max(ms(26) * 4 + ms(48),
  Math.min(s(200), childHeadTop - preferredBubbleTop - 12)) * bubbleScale;
const minBubbleTop = metrics.topInset + 16;
const bubbleTop = Math.max(minBubbleTop, Math.min(preferredBubbleTop, childHeadTop - bubbleHeight - 12));
const availableBubbleHeight = childHeadTop - minBubbleTop - 12;
const instructionScale = Math.min(1.20, Math.max(bubbleScale, availableBubbleHeight / bubbleHeight * bubbleScale));
const instructionHeight = bubbleHeight * instructionScale / bubbleScale;
const instructionWidth = Math.min(metrics.width * 0.66, 440 * metrics.contentScale * instructionScale,
  metrics.width - layout.gutter - s(150) - 12);
const instructionTop = Math.max(minBubbleTop, Math.min(preferredBubbleTop, childHeadTop - instructionHeight - 12));
const nextInstructionHeight = Math.min(instructionHeight, s(158) * instructionScale);
const trayUnit = layout.trayHeight / (1280 * 0.27);
const trayInset = 16 * trayUnit;
const trayVerticalInset = 24 * trayUnit;
const instrumentSlot = (layout.trayWidth - trayInset * 2) / 5;
// Scale the phone card composition, rather than stretching it across a tablet.
const characterTextScale = 1.15;
const lessonCardWidthBoost = 1.08;
const lessonCardWidth = Math.min(metrics.width - layout.gutter * 2, s(300) * lessonCardWidthBoost);
const practiceCardWidth = Math.min(metrics.width - layout.gutter * 2, s(320) * lessonCardWidthBoost);
const successCardWidth = Math.min(metrics.width - layout.gutter * 2, s(286) * lessonCardWidthBoost);
// All demonstration assets are 1122 x 1402. Resize both dimensions together.
const practiceImageWidth = Math.min(practiceCardWidth - s(40), metrics.height * 0.4 * 1122 / 1402);
return StyleSheet.create({
  completionConfettiLayer: {
    ...StyleSheet.absoluteFill,
    zIndex: 9,
    elevation: 9,
  },
  completionConfettiPiece: {
    position: "absolute",
    top: 0,
    borderRadius: s(3),
  },
  completionConfettiStar: {
    position: "absolute",
    top: 0,
    color: "#FFD542",
    fontWeight: "900",
    textShadowColor: "rgba(255, 181, 35, 0.45)",
    textShadowOffset: { width: 0, height: s(1) },
    textShadowRadius: s(2),
  },
  completionExitButton: {
    position: "absolute",
    top: Math.max(s(44), metrics.topInset),
    right: s(18),
    zIndex: 20,
  },
  completionExitImage: {
    width: s(132),
    height: s(110),
    resizeMode: "contain",
  },
  completionBubble: {
    position: "absolute",
    left: layout.gutter,
    width: bubbleWidth,
    top: bubbleTop,
    height: bubbleHeight,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 8,
    transform: [{ translateX: 0 }],
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
    marginTop: s(-30),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: s(6),
    maxWidth: s(250),
  },
  completionTitleStar: {
    color: "#FFD24A",
    fontSize: ms(23),
    lineHeight: ms(27),
    fontWeight: "900",
    textShadowColor: "rgba(180, 106, 0, 0.28)",
    textShadowOffset: { width: 0, height: s(1) },
    textShadowRadius: s(1),
  },
  completionTitle: {
    color: "#E44D8C",

    fontSize: ms(30),
    fontWeight: "900",
    textAlign: "center",
  },
  completionHeadlineBox: {
    marginTop: s(7),
    alignItems: "center",
    justifyContent: "center",
    width: s(238),
  },
  completionHeadlineText: {
    marginTop: 0,
    color: "#112D91",
    fontSize: ms(19),
    lineHeight: ms(26),
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: 0,
  },
  completionSparkle: {
    display: "none",
  },
  completionRetryButton: {
    position: "absolute",
    left: s(72),
    right: s(72),
    bottom: layout.trayBottom + layout.trayHeight + layout.gutter,
    height: s(74),
    alignItems: "center",
    justifyContent: "center",
    zIndex: 12,
    elevation: 12,
  },
  completionRetryButtonImage: {
    top: 0,
    width: s(180),
    height: s(74),
    resizeMode: "contain",
  },
  completionTrayLayer: {
    zIndex: 10,
  },
  characterSelectionOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 70,
    backgroundColor: "rgba(17, 74, 121, 0.28)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: s(28),
  },
  characterSelectionBox: {
    width: "93%",
    maxWidth: s(385),
    minHeight: s(470),
    padding: s(10),
    borderRadius: s(28),
    backgroundColor: "rgba(250, 254, 255, 0.98)",
    borderWidth: s(2),
    borderColor: "rgba(126, 207, 250, 0.72)",
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
    flexShrink: 1,
    fontFamily: FRIENDLY_FONT,
    color: "#1557A7",
    fontSize: ms(26) * characterTextScale,
    lineHeight: ms(30) * characterTextScale,
    fontWeight: "900",
    textAlign: "left",
    letterSpacing: 0.2,
    textShadowColor: "rgba(149, 220, 255, 0.25)",
    textShadowOffset: { width: 0, height: s(1) },
    textShadowRadius: s(1),
  },
  characterCardsPanel: {
    width: "100%",
    marginTop: s(20),
    borderRadius: s(20),
    backgroundColor: "rgba(238, 249, 255, 0.72)",
    borderWidth: s(1),
    borderColor: "rgba(192, 234, 255, 0.86)",
    paddingHorizontal: s(10),
    paddingTop: s(12),
    paddingBottom: s(12),
  },
  characterCardsRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    gap: s(10),
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
    fontSize: ms(25) * characterTextScale,
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
    marginTop: s(12),
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
    marginTop: s(15),
    width: s(240),
    height: Math.max(44, s(52)),
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
  characterButtonRightIcon: {
    position: "absolute",
    right: s(18),
  },
  characterContinueText: {
    fontFamily: FRIENDLY_FONT,
    color: "#FFFFFF",
    fontSize: ms(19) * characterTextScale,
    lineHeight: ms(24) * characterTextScale,
    fontWeight: "900",
    textShadowColor: "rgba(4, 68, 123, 0.45)",
    textShadowOffset: { width: 0, height: s(2) },
    textShadowRadius: s(2),
    width: "100%",
    textAlign: "center",
    includeFontPadding: false,
  },
  background: {
    flex: 1,
    backgroundColor: "#EEF5FF",
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFill,
    width: "100%",
    height: metrics.backgroundHeight,
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
    top: Math.max(s(44), metrics.topInset),
    right: s(18),
    zIndex: 10,
  },
  exitButtonImage: {
    width: s(132),
    height: s(110),
    resizeMode: "contain",
  },
  backIconButton: {
    position: "absolute",
    top: Math.max(s(48), metrics.topInset),
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
  dentistaWrapper: {
    position: "absolute",
    right: layout.dentistRight,
    bottom: layout.dentistBottom,
    width: dentistWidth,
    height: dentistHeight,
    zIndex: 4,
  },
  dentistaExplicando: {
    top: 0,
    left: 0,
    width: dentistWidth,
    height: dentistHeight,
    resizeMode: "contain",
  },
  instrumentBubble: {
    position: "absolute",
    left: layout.gutter,
    top: instructionTop,
    width: instructionWidth,
    height: instructionHeight,
    zIndex: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  nextInstrumentBubble: {
    height: nextInstructionHeight,
  },
  instrumentBubbleImage: {
    position: "absolute",
    width: instructionWidth,
    height: instructionHeight,
    resizeMode: "stretch",
    transform: [{ scaleX: -1 }],
  },
  nextInstrumentBubbleImage: {
    height: nextInstructionHeight,
  },
  instrumentBubbleTextBox: {
    width: instructionWidth * 0.80,
    minHeight: Math.min(s(132) * instructionScale, instructionHeight * 0.78),
    marginTop: s(-12) * instructionScale,
    marginLeft: s(-6),
    alignItems: "center",
    justifyContent: "center",
  },
  nextInstrumentBubbleTextBox: {
    marginTop: s(-22),
  },
  initialInstrumentBubbleText: {
    marginTop: s(-5),
    fontFamily: FRIENDLY_FONT,
    color: "#374255",
    fontSize: ms(19) * instructionScale,
    lineHeight: ms(26) * instructionScale,
    fontWeight: "900",
    textAlign: "center",
    includeFontPadding: false,
    textShadowColor: "rgba(255, 255, 255, 0.95)",
    textShadowOffset: { width: 0, height: s(1) },
    textShadowRadius: s(2),
  },
  instrumentBubbleTextHighlight: {
    color: "#0057C8",
    fontWeight: "900",
    textShadowColor: "rgba(70, 150, 255, 0.2)",
    textShadowOffset: { width: 0, height: s(1) },
    textShadowRadius: s(2),
  },
  nextInstrumentBubbleTitle: {
    fontFamily: FRIENDLY_FONT,
    color: "#374255",
    fontSize: ms(20) * instructionScale,
    lineHeight: ms(29) * instructionScale,
    fontWeight: "900",
    textAlign: "center",
    includeFontPadding: false,
    textShadowColor: "rgba(255, 255, 255, 0.95)",
    textShadowOffset: { width: 0, height: s(1) },
    textShadowRadius: s(2),
  },
  floorPanelWrapper: {
    position: "absolute",
    left: layout.trayLeft,
    width: layout.trayWidth,
    bottom: layout.trayBottom,
    height: layout.trayHeight,
    zIndex: 6,
    overflow: "visible",
  },
  floorPanel: {
    width: layout.trayWidth,
    height: layout.trayHeight,
    paddingHorizontal: trayInset,
    paddingVertical: trayVerticalInset,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    overflow: "hidden",
  },
  floorPanelImage: {
    resizeMode: "contain",
    width: layout.trayImageWidth,
    height: layout.trayImageHeight,
    left: layout.trayImageLeft,
    top: layout.trayImageTop,
  },
  instrumentButton: {
    width: instrumentSlot,
    height: layout.trayHeight - trayVerticalInset * 2,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  gameFloorPanel: {
    paddingLeft: trayInset,
    paddingRight: trayInset,
  },
  // The asset includes large outer margins. Align its visible blue border with the reference.
  gameFloorPanelImage: {
    width: layout.trayImageWidth,
    height: layout.trayImageHeight,
    left: layout.trayImageLeft,
    top: layout.trayImageTop,
  },
  // Match the instrument row without letting stars participate in its layout.
  instrumentStarsLayer: {
    position: "absolute",
    left: trayInset,
    right: trayInset,
    bottom: 8 * trayUnit,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  instrumentStarSlot: {
    width: instrumentSlot,
    alignItems: "center",
  },
  earnedStarImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  earnedInstrumentStar: {
    position: "absolute",
    bottom: 0,
    width: 68 * trayUnit,
    height: 71.4 * trayUnit,
    alignItems: "center",
    justifyContent: "center",
  },
  instrumentoItem: {
    width: instrumentSlot * 0.85,
    height: layout.trayHeight - trayVerticalInset * 2,
    resizeMode: "contain",
  },
  lessonOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 80,
    elevation: 0,
    backgroundColor: "rgba(10, 25, 55, 0.72)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: s(22),
  },
  instrumentLessonCard: {
    width: lessonCardWidth,
    minHeight: s(520),
    borderRadius: s(30),
    borderWidth: s(2.5),
    borderColor: "#D8ECFF",
    backgroundColor: "#F9FCFF",
    alignItems: "center",
    paddingHorizontal: s(18),
    paddingTop: s(34),
    paddingBottom: s(22),
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    overflow: "hidden",
  },
  practiceLessonCard: {
    width: practiceCardWidth,
    minHeight: s(610),
    borderRadius: s(24),
    borderWidth: s(2),
    borderColor: "#6EA8F7",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    paddingHorizontal: s(18),
    paddingTop: s(34),
    paddingBottom: s(24),
    shadowColor: "#0F3C88",
    shadowOpacity: 0.3,
    shadowRadius: s(18),
    elevation: 10,
  },
  successLessonCard: {
    width: successCardWidth,
    minHeight: s(480),
    borderRadius: s(22),
    borderWidth: s(2),
    borderColor: "#61C9A8",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    paddingHorizontal: s(22),
    paddingTop: s(54),
    paddingBottom: s(22),
    shadowColor: "#0F3C88",
    shadowOpacity: 0.28,
    shadowRadius: s(18),
    elevation: 10,
  },
  lessonCloseButton: {
    position: "absolute",
    top: s(10),
    right: s(10),
    width: Math.max(44, s(42)),
    height: Math.max(44, s(42)),
    borderRadius: s(21),
    backgroundColor: "#3939ff",
    borderWidth: s(2),
    borderColor: "#DCEBFF",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 8,
    shadowColor: "#143E82",
    shadowOffset: { width: 0, height: s(4) },
    shadowOpacity: 0.25,
    shadowRadius: s(6),
    elevation: 5,
  },
  lessonCloseText: {
    color: "#FFFFFF",
    fontSize: ms(30),
    lineHeight: ms(32),
    fontWeight: "900",
  },
  lessonInstrumentHalo: {
    position: "absolute",
    top: s(24),
    width: s(292),
    height: s(292),
    borderRadius: s(146),
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  lessonInstrumentHaloRing: {
    position: "absolute",
    width: s(226),
    height: s(226),
    borderRadius: s(113),
    borderWidth: s(4),
    borderColor: "#FFFFFF",
    backgroundColor: "#EDF5FF",
  },
  lessonInstrumentHaloDottedRing: {
    position: "absolute",
    width: s(244),
    height: s(244),
    borderRadius: s(122),
    borderWidth: s(2),
    borderStyle: "dotted",
    borderColor: "rgba(103, 148, 221, 0.18)",
  },
  lessonSparkleGroupRight: {
    position: "absolute",
    top: s(78),
    right: s(16),
    zIndex: 3,
  },
  lessonSparkleGroupLeft: {
    position: "absolute",
    left: s(16),
    bottom: s(58),
    zIndex: 3,
  },
  lessonSparkleLarge: {
    color: "#4F7FE8",
    fontSize: ms(25),
    lineHeight: ms(26),
    fontWeight: "900",
  },
  lessonSparkleSmall: {
    marginLeft: s(20),
    marginTop: s(-3),
    color: "#4F7FE8",
    fontSize: ms(18),
    lineHeight: ms(20),
    fontWeight: "900",
  },
  lessonInstrumentImage: {
    width: s(170),
    height: s(240),
    resizeMode: "contain",
    zIndex: 2,
  },
  instrumentTextBox: {
    width: "100%",
    marginTop: s(8),
    borderRadius: s(24),
    backgroundColor: "#FFFFFF",
    borderWidth: s(1.5),
    borderColor: "#EEF6FF",
    paddingHorizontal: s(16),
    paddingTop: s(16),
    paddingBottom: s(18),
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  instrumentTitleDivider: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: s(8),
    marginBottom: s(9),
  },
  instrumentDividerLine: {
    width: s(70),
    height: s(1.4),
    borderRadius: s(1),
    backgroundColor: "#C9E2FF",
  },
  lessonDescription: {
    color: "#263F82",
    fontSize: ms(16.5),
    lineHeight: ms(22),
    fontWeight: "600",
    textAlign: "center",
  },
  lessonPrimaryButton: {
    width: "98%",
    height: s(64),
    marginTop: s(16),
    borderRadius: s(23),
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    overflow: "hidden",
  },
  lessonPracticeButton: {
    width: "104%",
  },
  lessonPrimaryButtonGradient: {
    width: "100%",
    height: s(64),
    borderRadius: s(23),
    borderWidth: s(2),
    borderColor: "#A9C0FF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: s(34),
  },
  lessonPrimaryButtonCopy: {
    width: "100%",
    alignItems: "center",
    minWidth: 0,
  },
  lessonPrimaryButtonLeftIcon: {
    position: "absolute",
    left: s(14),
  },
  lessonPrimaryButtonRightIcon: {
    position: "absolute",
    right: s(14),
  },
  lessonPrimaryButtonText: {
    color: "#ffffff",
    fontSize: ms(18),
    lineHeight: ms(23),
    fontWeight: "900",
    width: "100%",
    textAlign: "center",
    includeFontPadding: false,
    textShadowColor: "rgba(18, 18, 110, 0.45)",
    textShadowOffset: { width: 0, height: s(2) },
    textShadowRadius: s(3),
  },
  lessonPrimaryButtonEntendiText: {
    color: "#ffffff",
    fontSize: ms(23),
    lineHeight: ms(28),
    fontWeight: "900",
    width: "100%",
    textAlign: "center",
    includeFontPadding: false,
    textShadowColor: "rgba(18, 18, 110, 0.45)",
    textShadowOffset: { width: 0, height: s(2) },
    textShadowRadius: s(3),
  },
  lessonPrimaryButtonSubtext: {
    marginTop: s(1),
    color: "#E8ECFF",
    fontSize: ms(13),
    lineHeight: ms(16),
    fontWeight: "600",
    width: "100%",
    textAlign: "center",
    includeFontPadding: false,
  },
  lessonInstrumentTitle: {
    color: "#0A4CB3",
    fontSize: ms(32),
    lineHeight: ms(37),
    fontWeight: "900",
    textAlign: "center",
    marginBottom: s(3),
    textShadowColor: "rgba(58, 125, 226, 0.12)",
    textShadowOffset: { width: 0, height: s(2) },
    textShadowRadius: s(3),
  },
  practiceTitle: {
    color: "#0A4CB3",
    fontSize: ms(32),
    lineHeight: ms(37),
    fontWeight: "900",
    textAlign: "center",
    marginBottom: s(18),
    textShadowColor: "rgba(58, 125, 226, 0.12)",
    textShadowOffset: { width: 0, height: s(2) },
    textShadowRadius: s(3),
  },
  practiceImage: {
    width: practiceImageWidth,
    height: practiceImageWidth * 1402 / 1122,
    borderRadius: s(14),
    resizeMode: "contain",
    borderWidth: s(2),
    borderColor: "#D7E8FF",
  },
  practiceDescriptionCard: {
    width: "100%",
    marginTop: s(20),
    minHeight: s(104),
    borderRadius: s(16),
    borderWidth: s(1.5),
    borderColor: "#C7E4FF",
    backgroundColor: "#F5FBFF",
    alignItems: "stretch",
    justifyContent: "center",
    paddingVertical: s(13),
    paddingHorizontal: s(14),
    shadowColor: "#1D61B8",
    shadowOpacity: 0.09,
    shadowRadius: s(7),
    shadowOffset: { width: 0, height: s(3) },
    elevation: 2,
  },
  practiceDescription: {
    width: "100%",
    color: "#173D87",
    fontSize: ms(18),
    lineHeight: ms(22),
    fontFamily: FRIENDLY_FONT,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 0.2,
    includeFontPadding: false,
    textShadowColor: "rgba(255, 255, 255, 0.95)",
    textShadowOffset: { width: 0, height: s(1) },
    textShadowRadius: s(1),
  },
  successCheckCircle: {
    position: "absolute",
    top: s(-40),
    width: s(82),
    height: s(82),
    borderRadius: s(41),
    backgroundColor: "#6BC449",
    borderWidth: s(3),
    borderColor: "#4E9F37",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2F7D22",
    shadowOpacity: 0.32,
    shadowRadius: s(8),
    elevation: 8,
  },
  successCheckText: {
    color: "#FFFFFF",
    fontSize: ms(46),
    lineHeight: ms(50),
    fontWeight: "900",
  },
  successTitle: {
    color: "#54A844",
    fontSize: ms(25),
    fontWeight: "900",
    textAlign: "center",
  },
  successDescription: {
    marginTop: s(10),
    color: "#1E3A8A",
    fontSize: ms(19),
    lineHeight: ms(25),
    fontWeight: "600",
    textAlign: "center",
  },
  successInstrumentImage: {
    width: "100%",
    maxWidth: s(220),
    marginTop: s(16),
    height: s(190),
    resizeMode: "contain",
  },
  successInstrumentName: {
    marginTop: s(12),
    color: "#1E3A8A",
    fontSize: ms(17),
    fontWeight: "900",
    textAlign: "center",
  },
  successRewardRow: {
    width: "92%",
    marginTop: s(12),
    paddingTop: 0,
    borderTopWidth: s(1),
    borderTopColor: "#DDEBFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 0,
  },
  successRewardStar: {
    width: s(55),
    height: s(55),
    resizeMode: "contain",
  },
  successRewardText: {
    color: "#1E3A8A",
    fontSize: ms(18),
    fontWeight: "600",
  },
  successButton: {
    width: "94%",
    height: s(62),
    marginTop: s(18),
    borderRadius: s(23),
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#1F7F18",
    shadowOffset: { width: 0, height: s(7) },
    shadowOpacity: 0.28,
    shadowRadius: s(10),
    elevation: 8,
    overflow: "hidden",
  },
  successButtonGradient: {
    width: "100%",
    height: "100%",
    borderRadius: s(23),
    borderWidth: s(2),
    borderColor: "rgba(219, 255, 172, 0.95)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: s(34),
    position: "relative",
  },
  successButtonText: {
    color: "#FFFFFF",
    fontSize: ms(22),
    lineHeight: ms(27),
    fontWeight: "900",
    width: "100%",
    textAlign: "center",
    includeFontPadding: false,
    transform: [{ translateX: s(-9) }],
    textShadowColor: "rgba(28, 94, 16, 0.45)",
    textShadowOffset: { width: 0, height: s(2) },
    textShadowRadius: s(3),
  },
  successButtonRightIcon: {
    position: "absolute",
    right: s(17),
  },
  instructionsLayer: {
    ...StyleSheet.absoluteFill,
    zIndex: 100,
    elevation: 100,
  },
  instructionsOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 100,
    elevation: 100,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: 0,
    paddingBottom: s(44),
  },
  instructionsBoxFrame: {
    width: "84%",
    minHeight: s(286),
    borderRadius: s(28),
    backgroundColor: "rgba(172, 223, 255, 0.94)",
    padding: s(4),
    shadowColor: "#03163F",
    shadowOffset: { width: 0, height: s(7) },
    shadowOpacity: 0.24,
    shadowRadius: s(12),
    elevation: 8,
    zIndex: 2,
    overflow: "hidden",
  },
  instructionsBoxFrameGirl: {
    backgroundColor: "rgba(255, 190, 223, 0.9)",
  },
  instructionsBox: {
    width: "100%",
    minHeight: s(278),
    borderRadius: s(24),
    backgroundColor: "#073F9F",
    paddingHorizontal: s(18),
    paddingTop: s(23),
    paddingBottom: s(14),
    alignItems: "center",
    justifyContent: "flex-start",
    overflow: "hidden",
  },
  instructionsVisitImageFrame: {
    position: "absolute",
    top: s(30),
    left: "6%",
    right: "6%",
    height: s(242),
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3,
    elevation: 3,
  },
  instructionsVisitImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
    transform: [{ scale: 1.10 }],
  },
  instructionsCardSparkle: {
    color: "#FFFFFF",
    width: s(18),
    fontSize: ms(18),
    fontWeight: "900",
    textAlign: "center",
    textShadowColor: "rgba(142, 223, 255, 0.85)",
    textShadowRadius: s(3),
    zIndex: 1,
  },
  instructionsHero: {
    position: "relative",
    width: "100%",
    minHeight: s(52),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: s(6),
    marginTop:s(-10),
    marginBottom: s(2),
  },
  instructionsGreetingLogo: {
    minWidth: s(236),
    minHeight: s(42),
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  instructionsGreetingLayer: {
    position: "absolute",
    left: 0,
    right: 0,
    fontFamily: friendlyBoldFont,
    fontSize: ms(30),
    lineHeight: ms(36),
    fontWeight: "900",
    textAlign: "center",
    includeFontPadding: false,
  },
  instructionsGreetingStroke: {
    color: "#062F7B",
    transform: [
      { translateX: 0 },
      { translateY: s(1) },
      { scale: 1.025 },
    ],
    textShadowColor: "#06245D",
    textShadowOffset: { width: 0, height: s(1) },
    textShadowRadius: s(1),
  },
  instructionsGreetingDepth: {
    color: "rgba(2, 23, 78, 0.24)",
    transform: [{ translateY: s(2) }],
    textShadowColor: "rgba(0, 14, 62, 0.2)",
    textShadowOffset: { width: 0, height: s(1) },
    textShadowRadius: s(1.5),
  },
  instructionsGreeting: {
    fontFamily: friendlyBoldFont,
    color: "#FDFEFF",
    fontSize: ms(30),
    lineHeight: ms(36),
    fontWeight: "900",
    textAlign: "center",
    includeFontPadding: false,
    textShadowColor: "rgba(255, 255, 255, 0.46)",
    textShadowOffset: { width: 0, height: s(-1) },
    textShadowRadius: s(1),
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
    fontSize: ms(17),
    lineHeight: ms(24),
    fontWeight: "700",
    textAlign: "center",
    textShadowColor: "#07316D",
    textShadowOffset: { width: 0, height: s(2) },
    textShadowRadius: s(2.5),
  },
  instructionsInvite: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: s(8),
    marginTop: s(12),
    paddingHorizontal: s(10),
    paddingVertical: s(11),
    marginBottom: s(10),
    borderRadius: s(20),
    borderWidth: s(1.5),
    borderColor: "rgba(198, 235, 255, 0.5)",
    backgroundColor: "rgba(15, 86, 190, 0.88)",
    shadowColor: "#001C58",
    shadowOffset: { width: 0, height: s(3) },
    shadowOpacity: 0.22,
    shadowRadius: s(5),
    elevation: 4,
    overflow: "hidden",
  },
  instructionsInviteIcon: {
    width: s(35),
    height: s(35),
    borderRadius: s(20),
    borderWidth: s(1),
    borderColor: "#B6EEFF",
    alignItems: "center",
    justifyContent: "center",
  },
  instructionsInviteCopy: {
    minWidth: 0,
    flex: 1,
    flexShrink: 1,
    justifyContent: "center",
  },
  instructionsPromptLine: {
    fontFamily: friendlyBoldFont,
    color: "#FFFFFF",
    width: "100%",
    flexShrink: 1,
    fontSize: ms(13.8),
    lineHeight: ms(19),
    fontWeight: "800",
    textAlign: "left",
    includeFontPadding: false,
    textShadowColor: "#07316D",
    textShadowOffset: { width: 0, height: s(1) },
    textShadowRadius: s(1.8),
  },
  instructionsPromptName: {
    color: "#D8F0FF",
  },
  instructionsPromptNameGirl: {
    color: "#FFE1F0",
  },
  instructionsButton: {
    marginTop: s(2),
    width: "85%",
    height: s(58),
    borderRadius: s(29),
    flexDirection: "row",
    gap: s(7),
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#145E12",
    shadowOffset: { width: 0, height: s(7) },
    shadowOpacity: 0.38,
    shadowRadius: s(9),
    elevation: 9,
    zIndex: 2,
    overflow: "hidden",
  },
  instructionsButtonGradient: {
    width: "100%",
    height: "100%",
    borderRadius: s(29),
    borderWidth: s(2),
    borderColor: "rgba(219, 255, 172, 0.9)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  instructionsButtonIcon: {
    position: "absolute",
    right: s(30),
    width: s(30),
    textAlign: "center",
  },
  instructionsButtonText: {
    fontFamily: friendlyBoldFont,
    color: "#FFFFFF",
    fontSize: ms(27),
    lineHeight: ms(32),
    fontWeight: "900",
    width: "100%",
    textAlign: "center",
    includeFontPadding: false,
    transform: [{ translateX: s(-8) }],
    textShadowColor: "rgba(33, 92, 18, 0.58)",
    textShadowOffset: { width: 0, height: s(3) },
    textShadowRadius: s(3),
  },
});
}
