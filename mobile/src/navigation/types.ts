import type { NavigatorScreenParams } from '@react-navigation/native';

export type TabParamList = {
  Ruta: undefined;
  Perfil: undefined;
};

/**
 * Los params son solo datos serializables (ids, títulos) para que el deep linking y
 * la restauración de estado funcionen. Las pantallas cargan su propio detalle.
 */
export type RootStackParamList = {
  Login: undefined;
  Tabs: NavigatorScreenParams<TabParamList>;
  Reader: { readingId: string };
  Quiz: { readingId: string; title: string };
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
