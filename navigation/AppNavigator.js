import React, { useContext } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from "@react-navigation/drawer";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";
import { useAppTheme } from "../hooks/useAppTheme";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import DashboardScreen from "../screens/DashboardScreen";
import AddTradeScreen from "../screens/AddTradeScreen";
import CalendarScreen from "../screens/CalendarScreen";
import ChartsScreen from "../screens/ChartsScreen";
import UserBalanceScreen from "../screens/UserBalanceScreen";
import ExportScreen from "../screens/ExportScreen";
import TeamManageScreen from "../screens/TeamManageScreen";
import ProfileScreen from "../screens/ProfileScreen";
import AdminScreen from "../screens/AdminScreen";
import AllTradesScreen from "../screens/AllTradesScreen";

const AuthStack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

function CustomDrawerContent(props) {
  const { logout } = useContext(AuthContext);
  const { theme } = useAppTheme();

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ flex: 1, justifyContent: "space-between" }}>
      <View>
        <DrawerItemList {...props} />
      </View>
      <View style={{ padding: 12 }}>
        <Pressable style={[styles.logoutBtn, { backgroundColor: theme.colors.loss }]} onPress={logout}>
          <Text style={[styles.logoutText, { fontFamily: theme.fonts.bold }]}>Logout</Text>
        </Pressable>
      </View>
    </DrawerContentScrollView>
  );
}

function AppDrawer() {
  const { user } = useContext(AuthContext);
  const { theme } = useAppTheme();
  const restricted = !user?.isTeamApproved;

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.cardSolid },
        headerTintColor: theme.colors.text,
        headerTitleStyle: { fontFamily: theme.fonts.bold, fontSize: 19 },
        sceneStyle: { backgroundColor: theme.colors.bg },
        drawerStyle: { backgroundColor: theme.colors.cardSolid },
        drawerActiveTintColor: theme.colors.primary,
        drawerInactiveTintColor: theme.colors.muted,
        drawerLabelStyle: { fontFamily: theme.fonts.medium }
      }}
    >
      <Drawer.Screen
        name="Home"
        component={DashboardScreen}
        options={{
          drawerIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={size} />
        }}
      />
      {!restricted && (
        <>
          <Drawer.Screen
            name="AddTrade"
            component={AddTradeScreen}
            options={{
              title: "Add Trade",
              drawerLabel: "Add Trade",
              drawerIcon: ({ color, size }) => <Ionicons name="add-circle-outline" color={color} size={size} />
            }}
          />
          <Drawer.Screen
            name="Calendar"
            component={CalendarScreen}
            options={{
              drawerIcon: ({ color, size }) => <Ionicons name="calendar-outline" color={color} size={size} />
            }}
          />
          <Drawer.Screen
            name="Charts"
            component={ChartsScreen}
            options={{
              drawerIcon: ({ color, size }) => <Ionicons name="analytics-outline" color={color} size={size} />
            }}
          />
          <Drawer.Screen
            name="Users"
            component={UserBalanceScreen}
            options={{
              title: "Team Balances",
              drawerLabel: "Team Balances",
              drawerIcon: ({ color, size }) => <Ionicons name="wallet-outline" color={color} size={size} />
            }}
          />
          <Drawer.Screen
            name="AllTrades"
            component={AllTradesScreen}
            options={{
              title: "All Trades",
              drawerLabel: "All Trades",
              drawerIcon: ({ color, size }) => <Ionicons name="list-outline" color={color} size={size} />
            }}
          />
          <Drawer.Screen
            name="Export"
            component={ExportScreen}
            options={{
              drawerIcon: ({ color, size }) => <Ionicons name="share-social-outline" color={color} size={size} />
            }}
          />
          <Drawer.Screen
            name="TeamManage"
            component={TeamManageScreen}
            options={{
              title: "Team Manage",
              drawerLabel: "Team Manage",
              drawerIcon: ({ color, size }) => <Ionicons name="settings-outline" color={color} size={size} />
            }}
          />
          <Drawer.Screen
            name="Profile"
            component={ProfileScreen}
            options={{
              drawerIcon: ({ color, size }) => <Ionicons name="person-circle-outline" color={color} size={size} />
            }}
          />
          {user?.isAdmin ? (
            <Drawer.Screen
              name="Admin"
              component={AdminScreen}
              options={{
                drawerIcon: ({ color, size }) => <Ionicons name="shield-checkmark-outline" color={color} size={size} />
              }}
            />
          ) : null}
        </>
      )}
    </Drawer.Navigator>
  );
}

export default function AppNavigator() {
  const { token, booting } = useContext(AuthContext);
  const { theme } = useAppTheme();

  if (booting) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.bg }}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
        <Text style={{ marginTop: 12, color: theme.colors.muted, fontFamily: theme.fonts.regular }}>
          Loading account...
        </Text>
      </View>
    );
  }

  if (!token) {
    return (
      <AuthStack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.cardSolid },
          headerTintColor: theme.colors.text,
          contentStyle: { backgroundColor: theme.colors.bg },
          animation: "slide_from_right"
        }}
      >
        <AuthStack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <AuthStack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
      </AuthStack.Navigator>
    );
  }

  return <AppDrawer />;
}

const styles = StyleSheet.create({
  logoutBtn: {
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 10
  },
  logoutText: {
    color: "#fff"
  }
});
