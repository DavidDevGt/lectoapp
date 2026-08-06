import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ReadingsPage } from './pages/ReadingsPage';
import { QuestionsPage } from './pages/QuestionsPage';
import { ReadingPreviewPage } from './pages/ReadingPreviewPage';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/ProtectedRoute';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/readings" element={<ReadingsPage />} />
            <Route path="/readings/:readingId/questions" element={<QuestionsPage />} />
            <Route path="/readings/:readingId/preview" element={<ReadingPreviewPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
