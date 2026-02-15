import React, { useContext, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";
import { useAppTheme } from "../hooks/useAppTheme";
import { useDialog } from "../hooks/useDialog";
import { parseApiError } from "../utils/errors";

function InputRow({ icon, children, theme }) {
  return (
    <View style={[styles.inputShell, { borderColor: theme.colors.border, backgroundColor: theme.colors.cardSolid }]}>
      <Ionicons name={icon} size={16} color={theme.colors.muted} />
      {children}
    </View>
  );
}

export default function LoginScreen({ navigation }) {
  const { login } = useContext(AuthContext);
  const { theme } = useAppTheme();
  const dialog = useDialog();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [teamCode, setTeamCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const onLogin = async () => {
    try {
      setLoading(true);
      await login({ email, password, teamCode });
    } catch (err) {
      dialog.show("Login failed", parseApiError(err, "Please verify credentials"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={theme.isDark ? ["#152620", "#0e1814"] : ["#3f826d", "#7eb8a6"]} style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollWrap}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <BlurView
            intensity={38}
            tint={theme.isDark ? "dark" : "light"}
            style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
          >
            <Image source={require("../assets/images/app_icon_512x512.png")} style={styles.logo} />
            <Text style={[styles.title, { color: theme.colors.text, fontFamily: theme.fonts.bold }]}>Market Money Tracking</Text>
            <Text style={[styles.subtitle, { color: theme.colors.muted, fontFamily: theme.fonts.regular }]}>
              Smooth team P/L journaling with monthly insights.
            </Text>
            <Text style={[styles.approvalHint, { color: theme.colors.primaryDark, fontFamily: theme.fonts.medium }]}>
              New registrations need admin approval before login.
            </Text>

            <InputRow icon="people-outline" theme={theme}>
              <TextInput
                style={[styles.input, { color: theme.colors.text, fontFamily: theme.fonts.medium }]}
                placeholder="Team Code (e.g. ALPHA01)"
                placeholderTextColor={theme.colors.muted}
                autoCapitalize="characters"
                value={teamCode}
                onChangeText={setTeamCode}
              />
            </InputRow>

            <InputRow icon="mail-outline" theme={theme}>
              <TextInput
                style={[styles.input, { color: theme.colors.text, fontFamily: theme.fonts.medium }]}
                placeholder="Email"
                placeholderTextColor={theme.colors.muted}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </InputRow>

            <InputRow icon="lock-closed-outline" theme={theme}>
              <TextInput
                style={[styles.input, { color: theme.colors.text, fontFamily: theme.fonts.medium }]}
                placeholder="Password"
                placeholderTextColor={theme.colors.muted}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <Pressable onPress={() => setShowPassword((prev) => !prev)} hitSlop={8}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={18} color={theme.colors.muted} />
              </Pressable>
            </InputRow>

            <Pressable style={[styles.btn, { backgroundColor: theme.colors.primary }]} onPress={onLogin} disabled={loading}>
              <Text style={[styles.btnText, { fontFamily: theme.fonts.bold }]}>{loading ? "Signing in..." : "Login"}</Text>
            </Pressable>

            <Pressable onPress={() => navigation.navigate("Register")}>
              <Text style={[styles.link, { color: theme.colors.primaryDark, fontFamily: theme.fonts.medium }]}>
                New user? Register
              </Text>
            </Pressable>
          </BlurView>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  keyboardContainer: {
    flex: 1
  },
  scrollWrap: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20
  },
  card: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    overflow: "hidden"
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 12,
    marginBottom: 8,
    alignSelf: "center"
  },
  title: {
    fontSize: 30
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13
  },
  approvalHint: {
    marginTop: 8,
    marginBottom: 16,
    fontSize: 12
  },
  inputShell: {
    borderWidth: 1,
    borderRadius: 14,
    marginBottom: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  input: {
    flex: 1,
    paddingVertical: 12
  },
  btn: {
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 4
  },
  btnText: {
    color: "#fff",
    fontSize: 15
  },
  link: {
    marginTop: 14,
    textAlign: "center",
    fontSize: 13
  }
});
