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

function LabeledField({ theme, label, icon, rightNode, ...props }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: theme.colors.text, fontFamily: theme.fonts.medium }]}>{label}</Text>
      <View style={[styles.inputShell, { borderColor: theme.colors.border, backgroundColor: theme.colors.cardSolid }]}>
        <Ionicons name={icon} size={16} color={theme.colors.muted} />
        <TextInput
          style={[styles.input, { color: theme.colors.text, fontFamily: theme.fonts.medium }]}
          placeholderTextColor={theme.colors.muted}
          {...props}
        />
        {rightNode}
      </View>
    </View>
  );
}

export default function RegisterScreen({ navigation }) {
  const { register } = useContext(AuthContext);
  const { theme } = useAppTheme();
  const dialog = useDialog();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    teamCode: "",
    investedAmount: "0",
    sharePercentage: "0"
  });
  const [loading, setLoading] = useState(false);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const onRegister = async () => {
    try {
      setLoading(true);
      await register({
        ...form,
        investedAmount: Number(form.investedAmount || 0),
        sharePercentage: Number(form.sharePercentage || 0)
      });
      dialog.show("Registration submitted", "Account is created and waiting for admin approval.");
      navigation.navigate("Login");
    } catch (err) {
      dialog.show("Registration failed", parseApiError(err, "Please check your inputs"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={theme.isDark ? ["#11201a", "#0b1512"] : ["#dbf0e9", "#afcebf"]} style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollWrap}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <BlurView
            intensity={34}
            tint={theme.isDark ? "dark" : "light"}
            style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
          >
          <Image source={require("../assets/images/app_icon_512x512.png")} style={styles.logo} />
          <Text style={[styles.title, { color: theme.colors.text, fontFamily: theme.fonts.bold }]}>Create Account</Text>
          <Text style={[styles.subtitle, { color: theme.colors.muted, fontFamily: theme.fonts.regular }]}>
            Use the same Team Code as your group.
          </Text>

          <LabeledField
            theme={theme}
            label="Full Name"
            icon="person-outline"
            placeholder="Enter full name"
            value={form.name}
            onChangeText={(v) => setField("name", v)}
          />
          <LabeledField
            theme={theme}
            label="Email Address"
            icon="mail-outline"
            placeholder="name@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={form.email}
            onChangeText={(v) => setField("email", v)}
          />
          <LabeledField
            theme={theme}
            label="Password"
            icon="lock-closed-outline"
            placeholder="Minimum 6 characters"
            secureTextEntry={!showPassword}
            value={form.password}
            onChangeText={(v) => setField("password", v)}
            rightNode={(
              <Pressable onPress={() => setShowPassword((prev) => !prev)} hitSlop={8}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={18} color={theme.colors.muted} />
              </Pressable>
            )}
          />
          <LabeledField
            theme={theme}
            label="Team Code"
            icon="people-outline"
            placeholder="E.g. ALPHA01"
            autoCapitalize="characters"
            value={form.teamCode}
            onChangeText={(v) => setField("teamCode", v)}
          />
          <LabeledField
            theme={theme}
            label="Invested Amount"
            icon="wallet-outline"
            placeholder="0"
            keyboardType="numeric"
            value={form.investedAmount}
            onChangeText={(v) => setField("investedAmount", v)}
          />
          <LabeledField
            theme={theme}
            label="Share Percentage"
            icon="pie-chart-outline"
            placeholder="E.g. 33.33"
            keyboardType="numeric"
            value={form.sharePercentage}
            onChangeText={(v) => setField("sharePercentage", v)}
          />

          <Pressable style={[styles.btn, { backgroundColor: theme.colors.primary }]} onPress={onRegister} disabled={loading}>
            <Text style={[styles.btnText, { fontFamily: theme.fonts.bold }]}>{loading ? "Creating..." : "Register"}</Text>
          </Pressable>
          <Pressable onPress={() => navigation.goBack()}>
            <Text style={[styles.link, { color: theme.colors.primaryDark, fontFamily: theme.fonts.medium }]}>
              Back to Login
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
    padding: 20,
    paddingTop: 36,
    paddingBottom: 36
  },
  card: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    overflow: "hidden"
  },
  logo: {
    width: 58,
    height: 58,
    borderRadius: 12,
    marginBottom: 8,
    alignSelf: "center"
  },
  title: {
    fontSize: 30
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 18,
    fontSize: 13
  },
  fieldWrap: {
    marginBottom: 12
  },
  fieldLabel: {
    fontSize: 13,
    marginBottom: 6
  },
  inputShell: {
    borderWidth: 1,
    borderRadius: 14,
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
    marginTop: 8
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
