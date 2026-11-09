import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Image,
  ImageBackground,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { Formik } from "formik";
import * as Yup from "yup";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { doc, updateDoc } from "firebase/firestore";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { RootStackParamList } from "../App";
import { auth, db } from "../services/firebase";
import { useThemeMusic } from "../contexts/ThemeMusicContext";
import { useSceneMetrics, useFormScroll, TabletFormScroll, getTabletAuthLayout, WEB_IMAGE_FILL } from "../utils/responsive";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

export default function LoginScreen({ navigation }: Props) {
  const metrics = useSceneMetrics();
  const tablet = metrics.isTabletLayout;
  const styles = tablet ? createTabletStyles(metrics) : createPhoneStyles(metrics);
  const formScroll = useFormScroll(tablet);
  const inputIconSize = (value: number) => tablet ? Math.round(value * Math.min(1.25 * metrics.contentScale, metrics.scale(1))) : value;
  const { height } = metrics;
  const PASSWORD_FOCUS_SHIFT = -Math.min(height * 0.18, 145);

  const [showPassword, setShowPassword] = useState(false);
  const { stopMusic } = useThemeMusic();
  const screenShift = useRef(new Animated.Value(0)).current;
  const passwordFocusedRef = useRef(false);
  const tabletEmailRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const passwordInputRef = useRef<React.ComponentRef<typeof TextInput>>(null);

  useFocusEffect(
    useCallback(() => {
      void stopMusic();
    }, [stopMusic])
  );

  const animateScreenShift = useCallback(
    (toValue: number) => {
      Animated.timing(screenShift, {
        toValue,
        duration: 220,
        useNativeDriver: true,
      }).start();
    },
    [screenShift]
  );

  useEffect(() => {
    const keyboardHideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      passwordFocusedRef.current = false;
      animateScreenShift(0);
    });

    return () => keyboardHideSubscription.remove();
  }, [animateScreenShift]);

  const loginSchema = Yup.object().shape({
    email: Yup.string().email("Email inválido").required("Email obrigatório"),
    password: Yup.string().required("Senha obrigatória"),
  });

  const handleLogin = async (values: { email: string; password: string }) => {
    try {
      const credential = await signInWithEmailAndPassword(
        auth,
        values.email.trim().toLowerCase(),
        values.password
      );

      try {
        await updateDoc(doc(db, "usuarios", credential.user.uid), {
          ultimoAcesso: new Date().toISOString(),
        });
      } catch (error) {
        // A partial deletion may leave Auth intact with no profile. Allow access
        // to the account deletion control without recreating the document.
        if ((error as { code?: string }).code !== "not-found") throw error;
      }

      navigation.replace("SelecaoJogos");
    } catch {
      alert("Email ou senha incorretos.");
    }
  };

  const handlePasswordFocus = () => {
    passwordFocusedRef.current = true;
    if (tablet) formScroll.onFocus(passwordInputRef.current);
    else animateScreenShift(PASSWORD_FOCUS_SHIFT);
  };

  const handlePasswordBlur = () => {
    passwordFocusedRef.current = false;
    animateScreenShift(0);
  };

  return (
    <View style={styles.screen}>
      <Animated.View
        style={[
          styles.shiftLayer,
          {
            transform: [{ translateY: screenShift }],
          },
        ]}
      >
        <ImageBackground
          source={tablet ? require("../assets/login/background_login_tablet.png") : require("../assets/login/background_login6.png")}
          style={styles.background}
          imageStyle={styles.bgImage}
        >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={tablet ? { flex: 1 } : styles.container}
      >
        <TabletFormScroll enabled={tablet} scroll={formScroll} style={styles.container}>

        {/* FORMULÁRIO */}
        <View style={styles.formArea}>
          <Formik
            initialValues={{ email: "", password: "" }}
            validationSchema={loginSchema}
            onSubmit={handleLogin}
            validateOnBlur
            validateOnChange={false}
          >
            {({ handleChange, handleSubmit, values, errors, touched }) => (
              <>
                <View style={styles.formStack}>
                <View
                  style={[
                    styles.inputWrapper,
                    touched.email && errors.email && styles.inputError,
                  ]}
                >
                  <View style={styles.iconCircle}>
                    <FontAwesome name="envelope" size={inputIconSize(20)} color="#ffffff" />
                  </View>

                  <TextInput
                    ref={tablet ? tabletEmailRef : undefined}
                    onFocus={tablet ? () => formScroll.onFocus(tabletEmailRef.current) : undefined}
                    style={styles.input}
                    placeholder={
                      touched.email && errors.email
                        ? errors.email
                        : "Digite seu email"
                    }
                    placeholderTextColor={
                      touched.email && errors.email ? "#E74C3C" : (tablet ? "#58748D" : "#999")
                    }
                    onChangeText={handleChange("email")}
                    value={values.email}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    returnKeyType="next"
                    submitBehavior="submit"
                    onSubmitEditing={() => passwordInputRef.current?.focus()}
                  />
                </View>

                <View
                  style={[
                    styles.inputWrapper,
                    touched.password && errors.password && styles.inputError,
                  ]}
                >
                  <View style={styles.iconCircle}>
                    <FontAwesome name="lock" size={inputIconSize(25)} color="#ffffff" />
                  </View>

                  <TextInput
                    ref={passwordInputRef}
                    style={styles.input}
                    placeholder={
                      touched.password && errors.password
                        ? errors.password
                        : "Digite sua senha"
                    }
                    secureTextEntry={!showPassword}
                    onFocus={handlePasswordFocus}
                    onBlur={handlePasswordBlur}
                    placeholderTextColor={
                      touched.password && errors.password ? "#E74C3C" : (tablet ? "#58748D" : "#999")
                    }
                    onChangeText={handleChange("password")}
                    value={values.password}
                    returnKeyType="go"
                    submitBehavior="blurAndSubmit"
                    onSubmitEditing={() => handleSubmit()}
                  />

                  <Pressable
                    style={styles.eyeButton}
                    hitSlop={10}
                    onPress={() => setShowPassword((prev) => !prev)}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off" : "eye"}
                      size={inputIconSize(22)}
                      color="#7F8C8D"
                    />
                  </Pressable>
                </View>

                <Pressable style={styles.button} onPress={() => handleSubmit()}>
                  <Image
                    source={require("../assets/login/botao_entrar_verde.png")}
                    style={styles.buttonImage}
                  />
                  <Text
                    style={styles.buttonText}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.82}
                  >
                    Entrar
                  </Text>
                </Pressable>
                </View>
              </>
            )}
          </Formik>
        </View>

        {/* BOTÃO CADASTRO (INDEPENDENTE) */}
        <Pressable
          style={styles.registerButtonArea}
          onPress={() => navigation.navigate("Cadastro")}
        >
          <View style={styles.registerButtonIcon}>
            <FontAwesome name="user-plus" size={tablet ? 18 * metrics.contentScale : 18} color="#FFFFFF" />
          </View>

          <Text
            style={styles.registerButtonText}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.72}
          >
            Não tem conta?{" "}
            <Text style={styles.registerButtonHighlight}>Cadastre-se</Text>
          </Text>

        </Pressable>

        <View style={styles.separatorArea}>
          <View style={styles.separatorLine} />
          <Text style={styles.separatorText}>ou</Text>
          <View style={styles.separatorLine} />
        </View>

        <Pressable
          style={styles.demoButton}
          onPress={async () => {
            await signOut(auth).catch(() => null);
            navigation.replace("SelecaoJogos");
          }}
        >
          <View style={styles.demoButtonIconSlot}>
            <FontAwesome name="rocket" size={tablet ? 27 * metrics.contentScale : 22} color="#2B7DCD" />
          </View>
          <View style={styles.demoButtonTextBox}>
            <Text
              style={styles.demoButtonText}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.72}
            >
              Entrar sem cadastro
            </Text>
          </View>
        </Pressable>
              </TabletFormScroll>
</KeyboardAvoidingView>
        </ImageBackground>
      </Animated.View>
    </View>
  );
}

function createPhoneStyles(metrics: ReturnType<typeof useSceneMetrics>) {
  const { width, height, scale: s, moderateScale: ms } = metrics;

  // RESPONSIVO
  const FORM_TOP = s(410);
  const REGISTER_TOP = s(635);
  const REGISTER_WIDTH = s(267);
  const DEMO_TOP = s(710);

  return StyleSheet.create({
  screen: {
    flex: 1,
    overflow: "hidden",
  },

  shiftLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    width,
    height,
  },

  background: {
    width,
    height,
  },

  bgImage: {
    ...WEB_IMAGE_FILL,
    resizeMode: "cover",
  },

  container: {
    flex: 1,
    paddingHorizontal: s(25),
  },

  formArea: {
    top: FORM_TOP,
    left: 0,
    right: 0,
    zIndex: 5,
  },

  formStack: {
    gap: s(12),
  },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",  //#F5F7FA
    borderRadius: s(30),
    paddingHorizontal: s(15),
    height: s(55),
    borderWidth: 1,
    borderColor: "#D6EAF8",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },

  inputError: {
    borderColor: "#E74C3C",
    backgroundColor: "#FFF5F5",
  },

  iconCircle: {
    width: s(40),
    height: s(40),
    borderRadius: s(20),
    backgroundColor: "#3498DB",
    alignItems: "center",
    justifyContent: "center",
  },

  input: {
    flex: 1,
    marginLeft: s(10),
    fontSize: ms(15),
    color: "#333",
  },

  eyeButton: {
    width: s(36),
    height: s(36),
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    elevation: 2,
  },

  button: {
    height: s(68),
    marginTop: s(4),
    width: s(260),
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
    zIndex: 20,
    elevation: 20,
  },

  buttonImage: {
    width: s(290),
    height: s(290),
    resizeMode: "contain",
  },

  buttonText: {
    color: "#FFF",
    fontSize: ms(26),
    lineHeight: ms(31),
    marginLeft: s(10),
    fontWeight: "bold",
    position: "absolute",
    width: "100%",
    textAlign: "center",
    includeFontPadding: false,
  },

  registerButtonArea: {
    position: "absolute",
    top: REGISTER_TOP,
    width: s(255),
    height: s(40),
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: s(5),
    backgroundColor: "#FFF9E8",
    borderRadius: s(20),
    borderWidth: 1.3,
    borderColor: "#F5C84B",
    paddingHorizontal: s(14),
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 5,
    zIndex: 4,
    elevation: 4,
  },

  registerButtonIcon: {
    width: s(30),
    height: s(30),
    borderRadius: s(16),
    backgroundColor: "#3498DB",
    alignItems: "center",
    justifyContent: "center",
  },

  registerButtonText: {
    flex: 1,
    minWidth: 0,
    color: "#1B2B44",
    fontSize: ms(13.5),
    lineHeight: ms(17),
    fontWeight: "800",
    textAlign: "center",
    includeFontPadding: false,
  },

  registerButtonHighlight: {
    color: "#1676D2",
  },

  separatorArea: {
    position: "absolute",
    top: DEMO_TOP - s(36),
    width: REGISTER_WIDTH * 0.78,
    height: s(32),
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  separatorLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: "#D6EAF8",
  },

  separatorText: {
    marginHorizontal: s(12),
    color: "#95A5A6",
    fontWeight: "bold",
    fontSize: ms(16),
  },

  demoButton: {
    position: "absolute",
    top: DEMO_TOP + s(2),
    maxWidth: s(236),
    height: s(48),
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: s(6),
    backgroundColor: "#FFFFFF",
    borderRadius: s(24),
    borderWidth: 1.6,
    borderColor: "#2B79BE",
    paddingHorizontal: s(14),
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 7,
    elevation: 5,
  },

  demoButtonIconSlot: {
    width: s(30),
    height: s(30),
    alignItems: "center",
    justifyContent: "center",
  },

  demoButtonTextBox: {
    flexShrink: 1,
    minWidth: 0,
    justifyContent: "center",
  },

  demoButtonText: {
    color: "#194B90",
    fontWeight: "900",
    fontSize: ms(16),
    lineHeight: ms(21),
    textAlign: "center",
    includeFontPadding: false,
  },
});
}


// Tablet-only styles. The phone styles above are preserved from the pre-tablet snapshot.
function createTabletStyles(metrics: ReturnType<typeof useSceneMetrics>) {
  const { width, height } = metrics;
  const layout = getTabletAuthLayout(width, height, "login", metrics.bottomInset);
  const unit = layout.unit;
  const s = (value: number) => value * unit;
  const ms = metrics.moderateScale;

  // RESPONSIVO
  const inputHeight = Math.max(56, s(62));
  const fieldGap = s(10);
  const registerGap = s(10);
  const registerHeight = Math.max(52, s(48));
  const separatorHeight = s(24);
  const demoHeight = Math.max(56, s(56));
  const bottomPadding = Math.max(s(24), metrics.bottomInset + 16);
  // formStack has three children: two inputs and the primary button.
  const groupHeight = inputHeight * 2 + fieldGap * 2 + s(68) + s(4)
    + registerGap + registerHeight + separatorHeight + s(2) + demoHeight;
  const formTop = layout.regionTop + Math.max(0, (layout.regionBottom - layout.regionTop - groupHeight) / 2);
  // Space the secondary actions using the room below the existing form.
  const extraActionGap = Math.min(s(14), Math.max(0, (height - bottomPadding - formTop - groupHeight) / 2));
  const formWidth = layout.formWidth;
  const REGISTER_WIDTH = s(267);

  return StyleSheet.create({
  shiftLayer: { flex: 1, width, height },
  screen: {
    flex: 1,
    overflow: "hidden",
  },

  background: { flex: 1, width, height },

  bgImage: {
    width: layout.imageWidth,
    height: layout.imageHeight,
    left: layout.imageLeft,
    top: layout.imageTop,
    resizeMode: "contain",
  },

  container: {
    flexGrow: 1,
    minHeight: height,
    paddingBottom: bottomPadding,
    paddingHorizontal: (width - formWidth) / 2,
  },

  formArea: {
    marginTop: formTop,
    zIndex: 5,
  },

  formStack: {
    gap: fieldGap,
  },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",  //#F5F7FA
    borderRadius: inputHeight / 2,
    paddingHorizontal: s(15),
    height: inputHeight,
    borderWidth: 1.2,
    borderColor: "#2B79BE",
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 7,
    elevation: 4,
  },

  inputError: {
    borderColor: "#E74C3C",
    backgroundColor: "#FFF5F5",
  },

  iconCircle: {
    width: s(44),
    height: s(44),
    borderRadius: s(22),
    backgroundColor: "#3498DB",
    alignItems: "center",
    justifyContent: "center",
  },

  input: {
    flex: 1,
    marginLeft: s(10),
    fontSize: ms(18),
    fontWeight: "600",
    color: "#194B90",
  },

  eyeButton: {
    width: Math.max(44, s(36)),
    height: Math.max(44, s(36)),
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    elevation: 2,
  },

  button: {
    height: s(68),
    marginTop: s(4),
    width: s(260),
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
    zIndex: 20,
    elevation: 20,
  },

  buttonImage: {
    width: s(290),
    height: s(290),
    resizeMode: "contain",
  },

  buttonText: {
    color: "#FFF",
    fontSize: ms(26),
    lineHeight: ms(31),
    marginLeft: s(10),
    fontWeight: "bold",
    position: "absolute",
    width: "100%",
    textAlign: "center",
    includeFontPadding: false,
  },

  registerButtonArea: {
    marginTop: registerGap + extraActionGap,
    width: Math.min(formWidth, s(305)),
    height: registerHeight,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: s(5),
    backgroundColor: "#FFF9E8",
    borderRadius: s(20),
    borderWidth: 1.3,
    borderColor: "#F5C84B",
    paddingHorizontal: s(14),
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 5,
    zIndex: 4,
    elevation: 4,
  },

  registerButtonIcon: {
    width: s(30),
    height: s(30),
    borderRadius: s(16),
    backgroundColor: "#3498DB",
    alignItems: "center",
    justifyContent: "center",
  },

  registerButtonText: {
    flex: 1,
    minWidth: 0,
    color: "#1B2B44",
    fontSize: ms(16.5),
    lineHeight: ms(21),
    fontWeight: "800",
    textAlign: "center",
    includeFontPadding: false,
  },

  registerButtonHighlight: {
    color: "#1676D2",
  },

  separatorArea: {
    marginTop: 0,
    width: REGISTER_WIDTH * 0.78,
    height: separatorHeight + extraActionGap,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  separatorLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: "#D6EAF8",
  },

  separatorText: {
    marginHorizontal: s(12),
    color: "#95A5A6",
    fontWeight: "bold",
    fontSize: ms(16),
  },

  demoButton: {
    marginTop: s(2),
    maxWidth: formWidth,
    height: demoHeight,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: s(7),
    backgroundColor: "#FFFFFF",
    borderRadius: s(24),
    borderWidth: 1.6,
    borderColor: "#2B79BE",
    paddingHorizontal: s(14),
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 7,
    elevation: 5,
  },

  demoButtonIconSlot: {
    width: s(30),
    height: s(30),
    alignItems: "center",
    justifyContent: "center",
  },

  demoButtonTextBox: {
    flexShrink: 1,
    minWidth: 0,
    justifyContent: "center",
  },

  demoButtonText: {
    color: "#194B90",
    fontWeight: "900",
    fontSize: ms(19),
    lineHeight: ms(25),
    textAlign: "center",
    includeFontPadding: false,
  },
});
}
