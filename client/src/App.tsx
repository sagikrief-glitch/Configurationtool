import { Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import ConfigurationsPage from './pages/ConfigurationsPage';
import TemplatesPage from './pages/TemplatesPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AppShell />}>
        <Route index element={<Navigate to="/configurations" replace />} />
        <Route path="configurations" element={<ConfigurationsPage />} />
        <Route path="configurations/:id" element={<ConfigurationsPage />} />
        <Route path="templates" element={<TemplatesPage />} />
        <Route path="*" element={<Navigate to="/configurations" replace />} />
      </Route>
    </Routes>
  );
}
