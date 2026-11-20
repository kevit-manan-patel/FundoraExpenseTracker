import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import { Spinner } from './components/UI.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Overview from './pages/Overview.jsx';
import Transactions from './pages/Transactions.jsx';
import Analytics from './pages/Analytics.jsx';
import Budgets from './pages/Budgets.jsx';
import Goals from './pages/Goals.jsx';
import Recurring from './pages/Recurring.jsx';
import Insights from './pages/Insights.jsx';
import Reports from './pages/Reports.jsx';
import Settings from './pages/Settings.jsx';
import Calendar from './pages/Calendar.jsx';
import Heatmap from './pages/Heatmap.jsx';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="grid h-full place-items-center"><Spinner /></div>;
  return user ? children : <Navigate to="/login" replace />;
}
function Guest({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="grid h-full place-items-center"><Spinner /></div>;
  return user ? <Navigate to="/" replace /> : children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Guest><Login /></Guest>} />
      <Route path="/register" element={<Guest><Register /></Guest>} />
      <Route element={<Protected><Layout /></Protected>}>
        <Route index element={<Overview />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="heatmap" element={<Heatmap />} />
        <Route path="budgets" element={<Budgets />} />
        <Route path="goals" element={<Goals />} />
        <Route path="recurring" element={<Recurring mode="recurring" />} />
        <Route path="subscriptions" element={<Recurring mode="subscriptions" />} />
        <Route path="insights" element={<Insights />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
