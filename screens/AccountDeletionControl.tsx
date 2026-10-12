import React, { useRef, useState } from "react";
import { ActivityIndicator, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { accountDeletionMessage, deleteCurrentAccount } from "../services/accountDeletion";
import { getScreenMetrics } from "../utils/responsive";

const { scale: s, moderateScale: ms } = getScreenMetrics();
export default function AccountDeletionControl({ visible, success = false, iconBackgroundColor = "#2F80ED", onClose, onDeleted, onContinue }: {
  visible: boolean; onClose: () => void; onDeleted: () => void;
  success?: boolean; onContinue: () => void;
  iconBackgroundColor?: string;
}) {
  const [error, setError] = useState("");
  const [needsPassword, setNeedsPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [availableHeight, setAvailableHeight] = useState<number | null>(null);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const lock = useRef(false);
  const close = () => {
    if (lock.current || success) return;
    Keyboard.dismiss();
    setError(""); setPassword(""); setNeedsPassword(false); onClose();
  };
  const remove = async () => {
    if (lock.current || success) return;
    if (needsPassword && !password) {
      setError("Informe sua senha para continuar.");
      return;
    }
    Keyboard.dismiss();
    lock.current = true; setBusy(true); setError("");
    try {
      const completed = await deleteCurrentAccount(needsPassword ? password : undefined);
      setPassword("");
      if (completed) onDeleted();
    } catch (failure) {
      setPassword("");
      if ((failure as { code?: string }).code === "auth/requires-recent-login") {
        setNeedsPassword(true);
      } else {
        setError(accountDeletionMessage(failure));
      }
    } finally { lock.current = false; setBusy(false); }
  };
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <View style={styles.backdrop}>
      <KeyboardAvoidingView style={styles.keyboardArea} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={styles.overlay} onLayout={({ nativeEvent }) => setAvailableHeight(nativeEvent.layout.height)}>
        <View style={[styles.box, availableHeight !== null && { maxHeight: Math.max(0, (availableHeight - 48) * 0.9) }]}>
          <ScrollView
            ref={scrollRef}
            style={styles.scroll}
            keyboardShouldPersistTaps="always"
            keyboardDismissMode="none"
            onLayout={() => {
              if (passwordFocused) scrollRef.current?.scrollToEnd({ animated: true });
            }}
          >
            <View style={[styles.icon, { backgroundColor: iconBackgroundColor }]}>
              <FontAwesome name="user" size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.title}>{success ? "Conta excluída" : needsPassword ? "Confirme sua senha" : "Deseja excluir sua conta?"}</Text>
            <Text style={styles.body}>{success ? "Sua conta foi excluída com sucesso." : "Sua conta e os dados associados serão excluídos permanentemente. Essa ação não poderá ser desfeita."}</Text>
            {!success && needsPassword && <>
              <Text style={styles.body}>Por segurança, confirme a senha da sua conta para continuar.</Text>
              <TextInput
                accessibilityLabel="Senha da sua conta" placeholder="Senha"
                secureTextEntry autoCapitalize="none" autoCorrect={false}
                value={password} onChangeText={setPassword} editable={!busy}
                onFocus={() => {
                  setPasswordFocused(true);
                  scrollRef.current?.scrollToEnd({ animated: true });
                }}
                onBlur={() => setPasswordFocused(false)}
                returnKeyType="done"
                style={styles.input} onSubmitEditing={() => void remove()}
              />
            </>}
            {!success && !!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
            {success ? (
              <Pressable accessibilityRole="button" style={[styles.button, styles.primary]} onPress={onContinue}>
                <Text style={styles.buttonText}>OK</Text>
              </Pressable>
            ) : busy ? <View accessibilityLiveRegion="polite" style={styles.loading}><ActivityIndicator color="#3498DB" size="large" /><Text style={styles.body}>Excluindo sua conta…</Text></View> : <>
              <Pressable accessibilityRole="button" style={[styles.button, styles.danger]} onPress={() => void remove()}>
                <Text style={styles.buttonText}>Sim, excluir</Text>
              </Pressable>
              <Pressable accessibilityRole="button" style={[styles.button, styles.cancel]} onPress={close}><Text style={styles.cancelText}>Não, cancelar</Text></Pressable>
            </>}
          </ScrollView>
        </View>
        </View>
      </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(5, 47, 121, 0.65)" },
  keyboardArea: { flex: 1 },
  overlay: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  box: {
    width: "94%", maxWidth: 360, maxHeight: "90%",
    flexShrink: 1,
    backgroundColor: "#FFF", borderRadius: 22, padding: 18,
    borderWidth: 3, borderColor: "#BAD4EA",
    shadowColor: "#173A6A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16, shadowRadius: 12, elevation: 6,
  },
  scroll: { flexGrow: 0, flexShrink: 1, minHeight: 0 },
  icon: { width: s(40), height: s(40), borderRadius: s(20), alignSelf: "center", alignItems: "center", justifyContent: "center", marginBottom: 8 },
  title: { color: "#173A6A", fontSize: ms(21), fontWeight: "bold", textAlign: "center", marginBottom: 10 },
  body: { color: "#173A6A", fontSize: ms(15), lineHeight: ms(23), textAlign: "center", marginBottom: 10 },
  error: { color: "#B42318", fontSize: ms(15), textAlign: "center", marginBottom: 10 },
  input: { borderWidth: 1, borderColor: "#D6EAF8", borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10, fontSize: ms(16), marginBottom: 10, color: "#173A6A" },
  button: { borderRadius: 24, minHeight: 48, padding: 10, alignItems: "center", justifyContent: "center", marginTop: 6 },
  danger: { backgroundColor: "#C0392B" },
  primary: { backgroundColor: "#2F80ED" },
  cancel: { backgroundColor: "#EDF6FF", borderWidth: 1, borderColor: "#D6EAF8" },
  buttonText: { color: "#FFF", fontSize: ms(16), fontWeight: "bold", textAlign: "center" },
  cancelText: { color: "#173A6A", fontSize: ms(16), fontWeight: "bold" },
  loading: { padding: 8, gap: 10, alignItems: "center" },
});
