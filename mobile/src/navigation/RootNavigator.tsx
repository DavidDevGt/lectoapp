import React from 'react';
import { NavigationContainer, DefaultTheme, LinkingOptions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, Text } from 'react-native';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/Header';
import { LoginScreen } from '../screens/LoginScreen';
import { LearningMapScreen } from '../screens/LearningMapScreen';
import { ReaderScreen } from '../screens/ReaderScreen';
import { QuizScreen } from '../screens/QuizScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { RootStackParamList, TabParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.brandPrimary,
    background: colors.bgApp,
    card: colors.bgSurface,
    text: colors.textPrimary,
    border: colors.border,
  },
};

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['lectoapp://'],
  config: {
    screens: {
      Login: 'login',
      Tabs: {
        screens: { Ruta: 'ruta', Perfil: 'perfil' },
      },
      Reader: 'lectura/:readingId',
      Quiz: 'lectura/:readingId/cuestionario',
    },
  },
};

/** Los emoji de las pestañas son decorativos: la etiqueta ya nombra el destino. */
function TabIcon({ emoji }: { emoji: string }) {
  return (
    <Text style={styles.tabIcon} importantForAccessibility="no" accessibilityElementsHidden>
      {emoji}
    </Text>
  );
}

function TabsNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        // El header gamificado vive solo aquí: durante la lectura y el cuestionario
        // el estudiante no necesita ver sus puntos.
        header: () => <Header />,
        tabBarActiveTintColor: colors.brandPrimary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.bgSurface, borderTopColor: colors.border },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '700' },
      }}
    >
      <Tab.Screen
        name="Ruta"
        component={LearningMapScreen}
        options={{
          tabBarLabel: 'Ruta',
          tabBarAccessibilityLabel: 'Ruta de lectura',
          tabBarIcon: () => <TabIcon emoji="🗺️" />,
        }}
      />
      <Tab.Screen
        name="Perfil"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Mi Perfil',
          tabBarAccessibilityLabel: 'Mi perfil y logros',
          tabBarIcon: () => <TabIcon emoji="👤" />,
        }}
      />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const { user } = useAuth();

  return (
    <NavigationContainer theme={navTheme} linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="Tabs" component={TabsNavigator} />
            <Stack.Screen
              name="Reader"
              component={ReaderScreen}
              options={{
                headerShown: true,
                title: '',
                headerBackTitle: 'Ruta',
                headerShadowVisible: false,
                headerTintColor: colors.brandPrimary,
              }}
            />
            <Stack.Screen
              name="Quiz"
              component={QuizScreen}
              options={{
                presentation: 'fullScreenModal',
                // El cuestionario se abandona por el botón "Salir", que confirma antes
                // de descartar respuestas — no por un gesto accidental.
                gestureEnabled: false,
              }}
            />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabIcon: {
    fontSize: 20,
  },
});
