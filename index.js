import { AppRegistry } from 'react-native';
import React from 'react';
import { name as appName } from './app.json';
import { AuthInternetConnectionProvider } from './hooks/useAuthInternetConnection';
import App from './App';
import ConnectionStatus from './components/errors/ConnectionStatus';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import RulesScreen from './screens/RuleScreen';
import RuleDetailsScreen from './screens/RuleDetailsScreen';
import SettingsScreen from './screens/SettingsScreen';
import TicketsScreen from './screens/TicketsScreen';
import TicketScreen from './screens/TicketScreen';
import { ThemeProvider, useTheme } from './hooks/ThemeContext';
import { themes } from './theme/Styles';
import ProfileScreen from './screens/ProfileScreen';
import ScheduleScreen from './screens/ScheduleScreen';
import CourseScreen from './screens/CourseScreen';
import StatisticsScreen from './screens/StatisticsScreen';
import { enableScreens } from 'react-native-screens';

const Stack = createStackNavigator();



const AppNavigator = () => {
  const { currentTheme } = useTheme();
  const colors = themes[currentTheme];

  return (
    <NavigationContainer>
      <AuthInternetConnectionProvider>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            ...TransitionPresets.SlideFromRightIOS,
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            headerTitleStyle: { fontSize: 18, fontWeight: 'bold' },
          }}
        >
          <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: "Профиль" }} initialParams={{ theme: colors }} />
          <Stack.Screen name="Home" component={App} options={{ headerShown: false }} />
          <Stack.Screen name="Rules" component={RulesScreen} options={{ title: "Правила" }} />
          <Stack.Screen name="RuleDetails" component={RuleDetailsScreen} options={{ title: "Детали правила" }} />
          <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: "Настройки" }} />
          <Stack.Screen name="Tickets" component={TicketsScreen} options={{ title: "Билеты" }} /> 
          <Stack.Screen name="Ticket" component={TicketScreen} options={{ title: "Билет" }} />
          <Stack.Screen name="Schedule" component={ScheduleScreen} options={{ title: "Расписание" }} />
          <Stack.Screen name="Course" component={CourseScreen} options={{ title: "Курс" }} />
          <Stack.Screen name="Statistics" component={StatisticsScreen} options={{ title: "Статистика" }} />
        </Stack.Navigator>
        <ConnectionStatus />
      </AuthInternetConnectionProvider>
    </NavigationContainer>
  );
};

const Root = () => (
  <ThemeProvider>
    <AppNavigator />
  </ThemeProvider>
);

AppRegistry.registerComponent(appName, () => Root);
