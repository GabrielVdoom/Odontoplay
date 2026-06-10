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
  Modal,
} from "react-native";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { Formik } from "formik";
import * as Yup from "yup";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { collection, doc, getDocs, setDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { RootStackParamList } from "../App";
import { auth, db } from "../services/firebase";
import { useThemeMusic } from "../contexts/ThemeMusicContext";

const { width, height } = Dimensions.get("window");

// RESPONSIVO
const FORM_TOP = height * 0.285;
const LOGIN_BOTTOM = height * 0.16;
const LOGIN_WIDTH = width * 0.6;
const LOGIN_HEIGHT = 36;

type Props = NativeStackScreenProps<RootStackParamList, "Cadastro">;

type CadastroValues = {
  nome: string;
  dataNascimento: string;
  genero: string;
  email: string;
  senha: string;
  confirmaSenha: string;
};

export default function CadastroScreen({ navigation }: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [generoModal, setGeneroModal] = useState(false);
  const [showSenhaSubmitError, setShowSenhaSubmitError] = useState(false);
  const { stopMusic } = useThemeMusic();

  useFocusEffect(
    useCallback(() => {
      void stopMusic();
    }, [stopMusic])
  );

  const formatBirthYear = (value: string): string => value.replace(/\D/g, "").slice(0, 4);

  const isValidBirthYear = (value: string): boolean => {
    if (!/^\d{4}$/.test(value)) return false;

    const year = Number(value);
    const currentYear = new Date().getFullYear();

    return year >= 1900 && year <= currentYear;
  };

  const cadastroSchema = Yup.object().shape({
    nome: Yup.string().required("Nome obrigatório"),
    dataNascimento: Yup.string()
      .required("Ano obrigatório")
      .test(
        "valid-birth-year",
        "Ano inválido",
        (value) => !!value && isValidBirthYear(value)
      ),
    genero: Yup.string().required("Selecione o gênero"),
    email: Yup.string().email("Email inválido").required("Email obrigatório"),
    senha: Yup.string()
      .min(6, "Mínimo 6 caracteres")
      .required("Senha obrigatória"),
    confirmaSenha: Yup.string()
      .oneOf([Yup.ref("senha")], "Senhas não conferem")
      .required("Confirme a senha"),
  });

  const handleCadastro = async (values: CadastroValues) => {
    try {
      const snapshot = await getDocs(collection(db, "usuarios"));
      const codigo = snapshot.size + 1;

      const credential = await createUserWithEmailAndPassword(
        auth,
        values.email.trim().toLowerCase(),
        values.senha
      );

      const now = new Date().toISOString();

      await setDoc(doc(db, "usuarios", credential.user.uid), {
        codigo,
        nome: values.nome.trim(),
        dataNascimento: formatBirthYear(values.dataNascimento),
        genero: values.genero,
        email: values.email.trim().toLowerCase(),
        status: "Ativo",
        preferencias: {
          personagemJogo2: values.genero === "Masculino" ? "menino" : "menina",
          tomPele: "medio",
        },
        progresso: {
          jogo1: {
            titulo: "Conheça o consultório",
            concluido: false,
            estrelas: 0,
            instrumentosVistos: [],
            tentativas: 0,
          },
          jogo2: {
            titulo: "Escove os dentes",
            concluido: false,
            estrelas: 0,
            melhorPontuacao: 0,
            ultimaPontuacao: 0,
            tentativas: 0,
          },
        },
        criadoEm: now,
        ultimoAcesso: now,
      });

      alert("Cadastro realizado com sucesso!");
      await signOut(auth).catch(() => null);
      navigation.replace("Login");
    } catch (error: any) {
      let message = "Não foi possível concluir o cadastro.";

      if (error?.code === "auth/email-already-in-use") {
        message = "Este email já está cadastrado.";
      } else if (error?.code === "auth/invalid-email") {
        message = "Email inválido.";
      } else if (error?.code === "auth/weak-password") {
        message = "A senha precisa ter pelo menos 6 caracteres.";
      }

      alert(message);
    }
  };

  return (
    <ImageBackground
      source={require("../assets/cadastro/background_frutiger6.png")}
      style={styles.background}
      imageStyle={styles.bgImage}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.formArea}>
          <Formik
            initialValues={{
              nome: "",
              dataNascimento: "",
              genero: "",
              email: "",
              senha: "",
              confirmaSenha: "",
            }}
            validationSchema={cadastroSchema}
            onSubmit={handleCadastro}
            validateOnBlur
            validateOnChange
          >
            {({
              handleChange,
              handleSubmit,
              values,
              errors,
              touched,
              setFieldTouched,
              setFieldValue,
            }) => (
              <>
                {(() => {
                  const iconCircleStyle = [
                    styles.iconCircle,
                    values.genero === "Feminino" && styles.iconCircleFemale,
                  ];

                  return (
                    <>
                      <View
                        style={[
                          styles.inputWrapper,
                          touched.nome && errors.nome && styles.inputError,
                        ]}
                      >
                        <View style={iconCircleStyle}>
                          <FontAwesome name="child" size={22} color="#ffffff" />
                        </View>

                        <TextInput
                          style={styles.input}
                          placeholder={
                            touched.nome && errors.nome
                              ? errors.nome
                              : "Nome da criança"
                          }
                          placeholderTextColor={
                            touched.nome && errors.nome ? "#E74C3C" : "#999"
                          }
                          onChangeText={handleChange("nome")}
                          value={values.nome}
                        />
                      </View>

                      <View
                        style={[
                          styles.inputWrapper,
                          touched.dataNascimento &&
                            errors.dataNascimento &&
                            styles.inputError,
                        ]}
                      >
                        <View style={iconCircleStyle}>
                          <FontAwesome
                            name="birthday-cake"
                            size={19}
                            color="#ffffff"
                          />
                        </View>

                        <TextInput
                          style={styles.input}
                          placeholder={
                            touched.dataNascimento && errors.dataNascimento
                              ? errors.dataNascimento
                              : "Ano de nascimento"
                          }
                          placeholderTextColor={
                            touched.dataNascimento && errors.dataNascimento
                              ? "#E74C3C"
                              : "#999"
                          }
                          keyboardType="numeric"
                          maxLength={4}
                          onChangeText={(text) =>
                            setFieldValue("dataNascimento", formatBirthYear(text))
                          }
                          value={values.dataNascimento}
                        />
                      </View>

                      <View
                        style={[
                          styles.inputWrapper,
                          touched.genero &&
                            errors.genero &&
                            styles.inputError,
                        ]}
                      >
                        <View style={iconCircleStyle}>
                          <FontAwesome
                            name="venus-mars"
                            size={19}
                            color="#ffffff"
                          />
                        </View>

                        <Pressable
                          style={styles.input}
                          onPress={() => {
                            setFieldTouched("genero", true);
                            setGeneroModal(true);
                          }}
                        >
                          <Text
                            style={{
                              color:
                                touched.genero && errors.genero
                                  ? "#E74C3C"
                                  : values.genero
                                  ? "#333"
                                  : "#999",
                              fontSize: 15,
                            }}
                          >
                            {touched.genero && errors.genero
                              ? errors.genero
                              : values.genero || "Selecione o gênero"}
                          </Text>
                        </Pressable>
                      </View>

                      <View
                        style={[
                          styles.inputWrapper,
                          touched.email && errors.email && styles.inputError,
                        ]}
                      >
                        <View style={iconCircleStyle}>
                          <FontAwesome
                            name="envelope"
                            size={19}
                            color="#ffffff"
                          />
                        </View>

                        <TextInput
                          style={styles.input}
                          placeholder={
                            touched.email && errors.email
                              ? errors.email
                              : "Email do responsável"
                          }
                          placeholderTextColor={
                            touched.email && errors.email ? "#E74C3C" : "#999"
                          }
                          keyboardType="email-address"
                          autoCapitalize="none"
                          onChangeText={handleChange("email")}
                          value={values.email}
                        />
                      </View>

                      <View
                        style={[
                          styles.inputWrapper,
                          showSenhaSubmitError &&
                            errors.senha &&
                            styles.inputError,
                        ]}
                      >
                        <View style={iconCircleStyle}>
                          <FontAwesome name="lock" size={20} color="#ffffff" />
                        </View>

                        <View style={styles.inputFieldArea}>
                          <TextInput
                            style={[styles.input, styles.passwordInput]}
                            numberOfLines={1}
                            placeholder={
                              showSenhaSubmitError && errors.senha
                                ? errors.senha
                                : "Senha"
                            }
                            placeholderTextColor={
                              showSenhaSubmitError && errors.senha
                                ? "#E74C3C"
                                : "#999"
                            }
                            secureTextEntry={!showPassword}
                            onChangeText={(text) => {
                              setShowSenhaSubmitError(false);
                              handleChange("senha")(text);
                            }}
                            value={
                              showSenhaSubmitError && errors.senha
                                ? ""
                                : values.senha
                            }
                          />
                        </View>

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

                      <View
                        style={[
                          styles.inputWrapper,
                          showSenhaSubmitError &&
                            errors.confirmaSenha &&
                            styles.inputError,
                        ]}
                      >
                        <View style={iconCircleStyle}>
                          <FontAwesome name="lock" size={20} color="#ffffff" />
                        </View>

                        <View style={styles.inputFieldArea}>
                          <TextInput
                            style={[styles.input, styles.passwordInput]}
                            placeholder={
                              showSenhaSubmitError && errors.confirmaSenha
                                ? errors.confirmaSenha
                                : "Confirmar senha"
                            }
                            placeholderTextColor={
                              showSenhaSubmitError && errors.confirmaSenha
                                ? "#E74C3C"
                                : "#999"
                            }
                            secureTextEntry={!showPassword}
                            onChangeText={(text) => {
                              setShowSenhaSubmitError(false);
                              handleChange("confirmaSenha")(text);
                            }}
                            value={
                              showSenhaSubmitError && errors.confirmaSenha
                                ? ""
                                : values.confirmaSenha
                            }
                          />
                        </View>

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

                      <Pressable
                        style={[styles.button, styles.cadastrarButton]}
                        onPress={() => {
                          setShowSenhaSubmitError(true);
                          handleSubmit();
                        }}
                      >
                        <Image
                          source={require("../assets/cadastro/botao_entrar_azul.png")}
                          style={styles.buttonImage}
                        />
                        <Text style={styles.buttonText}>Cadastrar</Text>
                      </Pressable>

                      <Modal
                        transparent
                        visible={generoModal}
                        animationType="fade"
                      >
                        <View style={styles.modalOverlay}>
                          <View style={styles.modalBox}>
                            <Text style={styles.modalTitle}>
                              Selecionar gênero
                            </Text>

                            <Pressable
                              style={styles.modalOption}
                              onPress={() => {
                                setFieldValue("genero", "Masculino");
                                setGeneroModal(false);
                              }}
                            >
                              <Text>Masculino</Text>
                            </Pressable>

                            <Pressable
                              style={styles.modalOption}
                              onPress={() => {
                                setFieldValue("genero", "Feminino");
                                setGeneroModal(false);
                              }}
                            >
                              <Text>Feminino</Text>
                            </Pressable>

                            <Pressable
                              style={styles.modalCancel}
                              onPress={() => setGeneroModal(false)}
                            >
                              <Text style={{ color: "red" }}>Cancelar</Text>
                            </Pressable>
                          </View>
                        </View>
                      </Modal>
                    </>
                  );
                })()}
              </>
            )}
          </Formik>
        </View>

        <Pressable
          style={styles.loginButtonArea}
          onPress={() => navigation.replace("Login")}
        >
          

          <View style={styles.loginButtonIcon}>
            <Ionicons name="log-in-outline" size={21} color="#FFFFFF" />
          </View>

          <Text style={styles.loginButtonText}>
            Já tem conta?{" "}
            <Text style={styles.loginButtonHighlight}>Ir para Login</Text>
          </Text>
            
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
    paddingHorizontal: 48,
  },

  formArea: {
    width: "100%",
    marginTop: FORM_TOP,
  },

  inputWrapper: {
    left: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 30,
    paddingHorizontal: 15,
    height: 55, //estava em 45 antes da mudança do formulário
    marginBottom: 8,
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
    width: 35,
    height: 35,
    borderRadius: 20,
    backgroundColor: "#3498DB",
    alignItems: "center",
    justifyContent: "center",
  },

  iconCircleFemale: {
    backgroundColor: "#fd92c7",
  },

  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: "#333",
  },

  inputFieldArea: {
    flex: 1,
    justifyContent: "center",
    marginLeft: 10,
    height: "100%",
  },

  passwordInput: {
    marginLeft: 0,
    height: "100%",
    paddingVertical: 0,
    textAlignVertical: "center",
  },

  eyeButton: {
    width: 35,
    height: 35,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    elevation: 2,
  },

  button: {
    height: 68,
    marginTop: 5,
    width: 260,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
    zIndex: 10,
  },

  cadastrarButton: {
    transform: [{ translateX: 0 }, { translateY: 0 }],
  },

  buttonImage: {
    width: 270,
    height: 270,
    resizeMode: "contain",
  },

  buttonText: {
    color: "#FFF",
    fontSize: 26,
    marginLeft: 10,
    marginBottom: 5,
    fontWeight: "bold",
    position: "absolute",
    width: "100%",
    textAlign: "center",
  },

  loginButtonArea: {
    position: "absolute",
    bottom: LOGIN_BOTTOM -40,
    alignSelf: "center",
    width: LOGIN_WIDTH ,
    height: LOGIN_HEIGHT + 2,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#FFF9E8",
    borderRadius: 20,
    borderWidth: 1.3,
    borderColor: "#ffd76a",
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 5,
    elevation: 4,
  },

  loginButtonIcon: {
    width: 26,
    height: 26,
    borderRadius: 16,
    backgroundColor: "#3498DB",
    alignItems: "center",
    justifyContent: "center",
  },

  loginButtonText: {
    flex: 1,
    color: "#1B2B44",
    fontSize: 13.5,
    fontWeight: "800",
    textAlign: "center",
  },

  loginButtonHighlight: {
    color: "#1676D2",
    fontStyle: "italic",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalBox: {
    width: "80%",
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },

  modalOption: {
    width: "100%",
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#EEE",
    alignItems: "center",
  },

  modalCancel: {
    marginTop: 10,
    padding: 10,
  },
});
