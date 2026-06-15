import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserPlus, Pencil, Trash2, ArrowLeft,
  UserCheck, UserX, Save, X, AlertTriangle,
} from 'lucide-react';

interface Empleado {
  id: number;
  nombreCompleto: string;
  username: string;
  rol: string;
  estado: 'activo' | 'inactivo';
  estadoSolicitud?: string;
}

const ROL_LABELS: Record<string, string> = {
  admin: 'Administrador',
  mesero: 'Mesero',
  cocinero: 'Cocinero',
  cajero: 'Cajero',
};

const BASE = 'https://hotchicken-backend.onrender.com/api/v1';
const getToken = () => localStorage.getItem('token');
const headers = () => ({
  'Authorization': `Bearer ${getToken()}`,
  'Content-Type': 'application/json',
});

const Empleados = () => {
  const navigate = useNavigate();
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mostrarForm, setMostrarForm] = useState(false);

  // Formulario crear
  const [nombre, setNombre] = useState('');
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [rol, setRol] = useState('mesero');
  const [guardando, setGuardando] = useState(false);

  // Edición inline
  const [editId, setEditId] = useState<number | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editUser, setEditUser] = useState('');
  const [editRol, setEditRol] = useState('');
  const [editPass, setEditPass] = useState('');
  const [guardandoEdit, setGuardandoEdit] = useState(false);

  // Confirmación eliminar
  const [confirmarId, setConfirmarId] = useState<number | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const cargar = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`${BASE}/users`, { headers: headers() });
      const data = await res.json();
      if (res.ok) setEmpleados(data);
      else setError(data.message || 'Error al cargar empleados.');
    } catch { setError('Error de conexión.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, []);

  // ─── Crear ───────────────────────────────────────────────
  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !user.trim() || !pass.trim()) {
      alert('Completa todos los campos.'); return;
    }
    setGuardando(true);
    try {
      const res = await fetch(`${BASE}/users`, {
        method: 'POST', headers: headers(),
        body: JSON.stringify({ nombreCompleto: nombre.trim(), username: user.trim().toLowerCase(), password: pass, rol, estado: 'activo' }),
      });
      const data = await res.json();
      if (res.ok) {
        setNombre(''); setUser(''); setPass(''); setRol('mesero');
        setMostrarForm(false);
        await cargar();
      } else { alert(data.message || 'Error al crear empleado.'); }
    } catch { alert('Error de conexión.'); }
    finally { setGuardando(false); }
  };

  // ─── Abrir edición ────────────────────────────────────────
  const abrirEdit = (emp: Empleado) => {
    setEditId(emp.id);
    setEditNombre(emp.nombreCompleto);
    setEditUser(emp.username);
    setEditRol(emp.rol);
    setEditPass('');
  };

  const cancelarEdit = () => {
    setEditId(null); setEditNombre(''); setEditUser('');
    setEditRol(''); setEditPass('');
  };

  // ─── Guardar edición ──────────────────────────────────────
  const handleGuardarEdit = async (id: number) => {
    if (!editNombre.trim() || !editUser.trim()) {
      alert('Nombre y usuario son obligatorios.'); return;
    }
    setGuardandoEdit(true);
    try {
      const body: any = {
        nombreCompleto: editNombre.trim(),
        username: editUser.trim().toLowerCase(),
        rol: editRol,
      };
      if (editPass.trim()) body.password = editPass;

      const res = await fetch(`${BASE}/users/${id}`, {
        method: 'PUT', headers: headers(),
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) { cancelarEdit(); await cargar(); }
      else alert(data.message || 'Error al actualizar.');
    } catch { alert('Error de conexión.'); }
    finally { setGuardandoEdit(false); }
  };

  // ─── Toggle activo / inactivo ─────────────────────────────
  const handleToggleEstado = async (emp: Empleado) => {
    const nuevoEstado = emp.estado === 'activo' ? 'inactivo' : 'activo';
    const msg = nuevoEstado === 'inactivo'
      ? `¿Desactivar a ${emp.nombreCompleto}?`
      : `¿Reactivar a ${emp.nombreCompleto}?`;
    if (!confirm(msg)) return;
    try {
      const res = await fetch(`${BASE}/users/${emp.id}/estado`, {
        method: 'PATCH', headers: headers(),
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      if (res.ok) await cargar();
      else { const d = await res.json(); alert(d.message || 'Error.'); }
    } catch { alert('Error de conexión.'); }
  };

  // ─── Eliminar físico (solo inactivos) ─────────────────────
  const handleEliminar = async (id: number) => {
    setEliminando(true);
    try {
      const res = await fetch(`${BASE}/users/${id}`, {
        method: 'DELETE', headers: headers(),
      });
      if (res.ok || res.status === 204) {
        setConfirmarId(null);
        await cargar();
      } else {
        const d = await res.json();
        alert(d.message || 'Error al eliminar.');
      }
    } catch { alert('Error de conexión.'); }
    finally { setEliminando(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b-4 border-[#FACC15] p-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/admin')}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-all">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-black text-[#E11D48]">
                HOT<span className="text-[#FACC15]">CHICKEN</span>
              </h1>
              <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">
                Gestión de Personal
              </p>
            </div>
          </div>
          <button
            onClick={() => { setMostrarForm(!mostrarForm); cancelarEdit(); }}
            className="flex items-center gap-2 bg-[#E11D48] text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-red-700 transition-all active:scale-95">
            <UserPlus size={18} />
            {mostrarForm ? 'Cancelar' : 'NUEVO EMPLEADO'}
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">

        {/* Formulario crear */}
        {mostrarForm && (
          <div className="bg-white rounded-[2rem] shadow-sm border-2 border-slate-100 p-6">
            <h2 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
              <UserPlus size={20} className="text-[#E11D48]" /> Crear Nuevo Empleado
            </h2>
            <form onSubmit={handleCrear} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: 'Nombre completo *', val: nombre, set: setNombre, type: 'text', ph: 'Ej: Juan Pérez' },
                { label: 'Usuario *', val: user, set: setUser, type: 'text', ph: 'Ej: juan.perez' },
                { label: 'Contraseña *', val: pass, set: setPass, type: 'password', ph: 'Mínimo 6 caracteres' },
              ].map(f => (
                <div key={f.label}>
                  <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">{f.label}</label>
                  <input type={f.type} value={f.val} onChange={e => f.set(e.target.value)}
                    placeholder={f.ph} required minLength={f.type === 'password' ? 6 : 1}
                    className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-slate-700 outline-none focus:border-[#FACC15] transition-all text-sm" />
                </div>
              ))}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Rol *</label>
                <select value={rol} onChange={e => setRol(e.target.value)}
                  className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-slate-700 outline-none focus:border-[#FACC15] transition-all text-sm">
                  <option value="mesero">Mesero</option>
                  <option value="cocinero">Cocinero</option>
                  <option value="cajero">Cajero</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <button type="submit" disabled={guardando}
                  className="w-full py-3 bg-[#FACC15] text-slate-900 font-black rounded-xl hover:bg-yellow-400 transition-all active:scale-95 disabled:opacity-50">
                  {guardando ? 'Guardando...' : 'CREAR EMPLEADO'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Modal confirmación eliminar */}
        {confirmarId !== null && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} className="text-[#E11D48]" />
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2">¿Eliminar permanentemente?</h3>
              <p className="text-slate-500 text-sm mb-6 font-bold">
                Este empleado será <span className="text-[#E11D48]">borrado de la base de datos</span>. Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmarId(null)}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 font-black rounded-xl hover:bg-slate-200 transition-all">
                  Cancelar
                </button>
                <button onClick={() => handleEliminar(confirmarId)} disabled={eliminando}
                  className="flex-1 py-3 bg-[#E11D48] text-white font-black rounded-xl hover:bg-red-700 transition-all disabled:opacity-50">
                  {eliminando ? 'Eliminando...' : 'SÍ, ELIMINAR'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Lista */}
        <div className="bg-white rounded-[2rem] shadow-sm border-2 border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-black text-slate-800">Lista de Personal</h2>
              <p className="text-xs text-slate-400 font-bold mt-1">
                {loading ? 'Cargando...' : `${empleados.length} persona(s) registrada(s)`}
              </p>
            </div>
            {/* Leyenda */}
            <div className="hidden sm:flex items-center gap-4 text-xs font-bold">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500" /> Activo
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-300" /> Inactivo
              </span>
            </div>
          </div>

          {error && (
            <div className="m-4 p-4 bg-red-50 border-2 border-red-100 rounded-2xl text-red-600 font-bold text-sm">
              ⚠️ {error}
            </div>
          )}

          {loading ? (
            <div className="p-12 text-center text-slate-400 font-bold">Cargando personal...</div>
          ) : empleados.length === 0 && !error ? (
            <div className="p-12 text-center text-slate-400 font-bold">No hay empleados registrados.</div>
          ) : (
            <div className="divide-y divide-slate-50">
              {empleados.map(emp => (
                <div key={emp.id} className={`p-4 transition-all ${emp.estado === 'inactivo' ? 'opacity-60' : ''}`}>
                  {editId === emp.id ? (
                    /* ─── Fila en modo edición ─── */
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div>
                          <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Nombre</label>
                          <input value={editNombre} onChange={e => setEditNombre(e.target.value)}
                            className="w-full p-2 bg-slate-50 border-2 border-[#FACC15] rounded-xl font-bold text-slate-700 outline-none text-sm" />
                        </div>
                        <div>
                          <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Usuario</label>
                          <input value={editUser} onChange={e => setEditUser(e.target.value)}
                            className="w-full p-2 bg-slate-50 border-2 border-[#FACC15] rounded-xl font-bold text-slate-700 outline-none text-sm" />
                        </div>
                        <div>
                          <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Nueva contraseña</label>
                          <input type="password" value={editPass} onChange={e => setEditPass(e.target.value)}
                            placeholder="Dejar vacío = sin cambiar"
                            className="w-full p-2 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-slate-700 outline-none text-sm" />
                        </div>
                        <div>
                          <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Rol</label>
                          <select value={editRol} onChange={e => setEditRol(e.target.value)}
                            className="w-full p-2 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-slate-700 outline-none text-sm">
                            <option value="mesero">Mesero</option>
                            <option value="cocinero">Cocinero</option>
                            <option value="cajero">Cajero</option>
                            <option value="admin">Administrador</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button onClick={cancelarEdit}
                          className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-200 transition-all">
                          <X size={14} /> Cancelar
                        </button>
                        <button onClick={() => handleGuardarEdit(emp.id)} disabled={guardandoEdit}
                          className="flex items-center gap-1 px-3 py-1.5 bg-[#FACC15] text-slate-900 rounded-xl font-bold text-xs hover:bg-yellow-400 transition-all disabled:opacity-50">
                          <Save size={14} /> {guardandoEdit ? 'Guardando...' : 'Guardar'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* ─── Fila normal ─── */
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-white text-sm shrink-0
                          ${emp.rol === 'admin' ? 'bg-[#E11D48]' : emp.rol === 'cocinero' ? 'bg-orange-500' : emp.rol === 'cajero' ? 'bg-blue-500' : 'bg-[#FACC15] text-slate-900'}`}>
                          {emp.nombreCompleto.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-black text-slate-800 text-sm">{emp.nombreCompleto}</p>
                          <p className="text-xs text-slate-400 font-bold">
                            @{emp.username} · {ROL_LABELS[emp.rol] || emp.rol}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Badge estado */}
                        <span className={`hidden sm:inline text-[10px] font-black uppercase px-3 py-1 rounded-full
                          ${emp.estado === 'activo' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                          {emp.estado === 'activo' ? '● Activo' : '● Inactivo'}
                        </span>

                        {emp.rol !== 'admin' && (
                          <>
                            {/* Editar */}
                            <button onClick={() => abrirEdit(emp)} title="Editar empleado"
                              className="p-2 rounded-xl hover:bg-yellow-50 text-slate-400 hover:text-yellow-600 transition-all">
                              <Pencil size={16} />
                            </button>

                            {/* Toggle activo/inactivo */}
                            <button onClick={() => handleToggleEstado(emp)}
                              title={emp.estado === 'activo' ? 'Desactivar' : 'Reactivar'}
                              className={`p-2 rounded-xl transition-all
                                ${emp.estado === 'activo'
                                  ? 'hover:bg-orange-50 text-slate-400 hover:text-orange-500'
                                  : 'hover:bg-green-50 text-slate-400 hover:text-green-600'}`}>
                              {emp.estado === 'activo' ? <UserX size={16} /> : <UserCheck size={16} />}
                            </button>

                            {/* Eliminar (solo inactivos) */}
                            {emp.estado === 'inactivo' && (
                              <button onClick={() => setConfirmarId(emp.id)} title="Eliminar permanentemente"
                                className="p-2 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all">
                                <Trash2 size={16} />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Empleados;
