import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/transactions" element={<div className="p-4">Transactions Page</div>} />
          <Route path="/analytics" element={<div className="p-4">Analytics Page</div>} />
          <Route path="/budgets" element={<div className="p-4">Budgets Page</div>} />
          <Route path="/settings" element={<div className="p-4">Settings Page</div>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
