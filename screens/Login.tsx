import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
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

const { width, height } = Dimensions.get("window");

// RESPONSIVO
const FORM_TOP = height * 0.51;
const REGISTER_TOP = height * 0.78;
const REGISTER_WIDTH = width * 0.68;
const DEMO_TOP = height * 0.87;

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

export default function LoginScreen({ navigation }: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const { stopMusic } = useThemeMusic();

  useFocusEffect(
    useCallback(() => {
      void stopMusic();
    }, [stopMusic])
  );

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

      await updateDoc(doc(db, "usuarios", credential.user.uid), {
        ultimoAcesso: new Date().toISOString(),
      });

      navigation.replace("SelecaoJogos");
    } catch {
      alert("Email ou senha incorretos.");
    }
  };

  return (
    <ImageBackground
      source={require("../assets/login/background_login6.png")}
      style={styles.background}
      imageStyle={styles.bgImage}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
      >
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
                <View
                  style={[
                    styles.inputWrapper,
                    touched.email && errors.email && styles.inputError,
                  ]}
                >
                  <View style={styles.iconCircle}>
                    <FontAwesome name="envelope" size={20} color="#ffffff" />
                  </View>

                  <TextInput
                    style={styles.input}
                    placeholder={
                      touched.email && errors.email
                        ? errors.email
                        : "Digite seu email"
                    }
                    placeholderTextColor={
                      touched.email && errors.email ? "#E74C3C" : "#999"
                    }
                    onChangeText={handleChange("email")}
                    value={values.email}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>

                <View
                  style={[
                    styles.inputWrapper,
                    touched.password && errors.password && styles.inputError,
                  ]}
                >
                  <View style={styles.iconCircle}>
                    <FontAwesome name="lock" size={25} color="#ffffff" />
                  </View>

                  <TextInput
                    style={styles.input}
                    placeholder={
                      touched.password && errors.password
                        ? errors.password
                        : "Digite sua senha"
                    }
                    secureTextEntry={!showPassword}
                    placeholderTextColor={
                      touched.password && errors.password ? "#E74C3C" : "#999"
                    }
                    onChangeText={handleChange("password")}
                    value={values.password}
                  />

                  <Pressable
                    style={styles.eyeButton}
                    hitSlop={10}
                    onPress={() => setShowPassword((prev) => !prev)}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off" : "eye"}
                      size={22}
                      color="#7F8C8D"
                    />
                  </Pressable>
                </View>

                <Pressable style={styles.button} onPress={() => handleSubmit()}>
                  <Image
                    source={require("../assets/login/botao_entrar_verde.png")}
                    style={styles.buttonImage}
                  />
                  <Text style={styles.buttonText}>Entrar</Text>
                </Pressable>
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
            <FontAwesome name="user-plus" size={18} color="#FFFFFF" />
          </View>

          <Text style={styles.registerButtonText}>
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
            <FontAwesome name="rocket" size={22} color="#2B7DCD" />
          </View>
          <View style={styles.demoButtonTextBox}>
            <Text style={styles.demoButtonText}>Entrar sem cadastro</Text>
          </View>
        </Pressable>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width,
    height,
  },

  bgImage: {
    resizeMode: "cover",
  },

  container: {
    flex: 1,
    paddingHorizontal: 25,
  },

  formArea: {
    top: FORM_TOP,
    left: 0,
    right: 0,
    zIndex: 5,
  },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",  //#F5F7FA
    borderRadius: 30,
    paddingHorizontal: 15,
    height: 55,
    marginBottom: 12,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#3498DB",
    alignItems: "center",
    justifyContent: "center",
  },

  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: "#333",
  },

  eyeButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    elevation: 2,
  },

  button: {
    height: 68,
    marginTop: 4,
    width: 260,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
    zIndex: 20,
    elevation: 20,
  },

  buttonImage: {
    width: 290,
    height: 290,
    resizeMode: "contain",
  },

  buttonText: {
    color: "#FFF",
    fontSize: 26,
    marginLeft: 10,
    fontWeight: "bold",
    position: "absolute",
    width: "100%",
    textAlign: "center",
  },

  registerButtonArea: {
    position: "absolute",
    top: REGISTER_TOP,
    width: width * 0.65,
    height: 40,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#FFF9E8",
    borderRadius: 20,
    borderWidth: 1.3,
    borderColor: "#F5C84B",
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 5,
    zIndex: 4,
    elevation: 4,
  },

  registerButtonIcon: {
    width: 30,
    height: 30,
    borderRadius: 16,
    backgroundColor: "#3498DB",
    alignItems: "center",
    justifyContent: "center",
  },

  registerButtonText: {
    flex: 1,
    color: "#1B2B44",
    fontSize: 13.5,
    fontWeight: "800",
    textAlign: "center",
  },

  registerButtonHighlight: {
    color: "#1676D2",
  },

  separatorArea: {
    position: "absolute",
    top: DEMO_TOP - 36,
    width: REGISTER_WIDTH * 0.78,
    height: 32,
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
    marginHorizontal: 12,
    color: "#95A5A6",
    fontWeight: "bold",
    fontSize: 16,
  },

  demoButton: {
    position: "absolute",
    top: DEMO_TOP + 2,
    width: width * 0.60,
    height: 48,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1.6,
    borderColor: "#2B79BE",
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 7,
    elevation: 5,
  },

  demoButtonIconSlot: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },

  demoButtonTextBox: {
    flex: 1,
    justifyContent: "center",
  },

  demoButtonText: {
    color: "#194B90",
    fontWeight: "900",
    fontSize: 16,
    lineHeight: 21,
  },
});
