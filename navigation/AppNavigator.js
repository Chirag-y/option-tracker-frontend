import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import DashboardScreen from "../screens/DashboardScreen";
import AddTradeScreen from "../screens/AddTradeScreen";
import CalendarScreen from "../screens/CalendarScreen";
import ChartsScreen from "../screens/ChartsScreen";
import UserBalanceScreen from "../screens/UserBalanceScreen";
import ExportScreen from "../screens/ExportScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="AddTrade" component={AddTradeScreen} />
      <Stack.Screen name="Calendar" component={CalendarScreen} />
      <Stack.Screen name="Charts" component={ChartsScreen} />
      <Stack.Screen name="Users" component={UserBalanceScreen} />
      <Stack.Screen name="Export" component={ExportScreen} />
    </Stack.Navigator>
  );
}