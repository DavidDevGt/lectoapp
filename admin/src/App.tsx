import { Suspense, lazy } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { AppLayout } from './components/layout/AppLayout';
import { AdminOnlyRoute } from './components/ProtectedRoute';
import { RouteFallback } from './components/RouteFallback';

/*
 * Solo LoginPage se carga de entrada: es la única pantalla que ve alguien sin
 * sesión. El resto se parte por ruta.
 *
 * El caso que más pesa es el dashboard, que arrastra Recharts entero. Antes
 * viajaba en el chunk inicial de todas las rutas, incluida la de login.
 */
const DashboardPage = lazy(() =>
  import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })),
);
const ReadingsPage = lazy(() =>
  import('./pages/ReadingsPage').then((m) => ({ default: m.ReadingsPage })),
);
const QuestionsPage = lazy(() =>
  import('./pages/QuestionsPage').then((m) => ({ default: m.QuestionsPage })),
);
const ReadingPreviewPage = lazy(() =>
  import('./pages/ReadingPreviewPage').then((m) => ({ default: m.ReadingPreviewPage })),
);

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<AdminOnlyRoute />}>
          <Route element={<AppLayout />}>
            <Route
              path="/"
              element={
                <Suspense fallback={<RouteFallback />}>
                  <DashboardPage />
                </Suspense>
              }
            />
            <Route
              path="/readings"
              element={
                <Suspense fallback={<RouteFallback />}>
                  <ReadingsPage />
                </Suspense>
              }
            />
            <Route
              path="/readings/:readingId/questions"
              element={
                <Suspense fallback={<RouteFallback />}>
                  <QuestionsPage />
                </Suspense>
              }
            />
            <Route
              path="/readings/:readingId/preview"
              element={
                <Suspense fallback={<RouteFallback />}>
                  <ReadingPreviewPage />
                </Suspense>
              }
            />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
