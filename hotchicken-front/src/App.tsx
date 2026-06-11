import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import Empleados from './pages/Empleados';
import Inventario from './pages/Inventario';
import Cocina from './pages/Cocina';
import Solicitudes from './pages/Solicitudes';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {/* Panel del mesero */}
        <Route path="/dashboard" element={<Dashboard />} />
        {/* Panel del administrador */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/inventario" element={<Inventario />} />
        <Route path="/admin/cocina" element={<Cocina />} />
        <Route path="/admin/solicitudes" element={<Solicitudes />} />
        <Route path="/empleados" element={<Empleados />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
