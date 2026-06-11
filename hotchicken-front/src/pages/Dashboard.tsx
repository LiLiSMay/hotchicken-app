import { useState, useEffect } from 'react';
import { Utensils, ShoppingBag, Bike, ClipboardList, X, Plus, Minus, LogOut, ChefHat } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.service';

interface Mesa {
    id: number;
    numero: number;
    estado: 'libre' | 'ocupada' | 'reservada';
}

interface Producto {
    id: number;
    nombre: string;
    categoria: string;
    precio: number;
}

interface ItemPedido {
    producto: Producto;
    cantidad: number;
    guarnicion: string;
    presa: string;
    notas: string;
}

const GUARNICIONES = ['Arroz', 'Fideo', 'Papa frita', 'Mixto'];
const PRESAS = ['Cualquiera', 'Pecho', 'Ala', 'Pierna'];

const Dashboard = () => {
    const navigate = useNavigate();
    const [mesas, setMesas] = useState<Mesa[]>([]);
    const [productos, setProductos] = useState<Producto[]>([]);
    const [mesaSeleccionada, setMesaSeleccionada] = useState<Mesa | null>(null);
    const [esParagLlevar, setEsParagLlevar] = useState(false);
    const [items, setItems] = useState<ItemPedido[]>([]);
    const [observaciones, setObservaciones] = useState('');
    const [ventasHoy, setVentasHoy] = useState(0);
    const [enviando, setEnviando] = useState(false);
    const [mesasOcupadas, setMesasOcupadas] = useState(0);
    const [empleadosActivos, setEmpleadosActivos] = useState(0);

    const usuario = JSON.parse(localStorage.getItem('user') || '{}');

    const cargarDatos = async () => {
        try {
            const [mesasData, productosData, ventasData, empleadosData] = await Promise.all([
                api.getMesas(),
                api.getProductos(),
                api.getVentasHoy(),
                api.getEmpleados().catch(() => []),
            ]);
            setEmpleadosActivos((empleadosData as any[]).filter((e: any) => e.estado === 'activo').length);
            setMesas(mesasData);
            setProductos(productosData);
            setVentasHoy(ventasData.total || 0);
            setMesasOcupadas(mesasData.filter((m: any) => m.estado === 'ocupada').length);
        } catch (e) {
            console.error('Error al cargar datos:', e);
        }
    };

    useEffect(() => { cargarDatos(); }, []);

    const platoPrincipales = productos.filter(p => p.categoria === 'plato_principal');
    const bebidas = productos.filter(p => p.categoria === 'bebida');

    const abrirModal = (mesa: Mesa | null, paraLlevar = false) => {
        setMesaSeleccionada(mesa);
        setEsParagLlevar(paraLlevar);
        setItems([]);
        setObservaciones('');
    };

    const agregarItem = (producto: Producto) => {
        setItems(prev => {
            const existe = prev.find(i => i.producto.id === producto.id);
            if (existe) return prev.map(i => i.producto.id === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i);
            return [...prev, { producto, cantidad: 1, guarnicion: GUARNICIONES[0], presa: PRESAS[0], notas: '' }];
        });
    };

    const quitarItem = (productoId: number) => {
        setItems(prev => {
            const item = prev.find(i => i.producto.id === productoId);
            if (!item) return prev;
            if (item.cantidad <= 1) return prev.filter(i => i.producto.id !== productoId);
            return prev.map(i => i.producto.id === productoId ? { ...i, cantidad: i.cantidad - 1 } : i);
        });
    };

    const actualizarItem = (productoId: number, campo: 'guarnicion' | 'presa', valor: string) => {
        setItems(prev => prev.map(i => i.producto.id === productoId ? { ...i, [campo]: valor } : i));
    };

    const totalPedido = items.reduce((sum, i) => sum + (Number(i.producto.precio) * i.cantidad), 0);

    const confirmarComanda = async () => {
        if (items.length === 0) return alert('Agrega al menos un producto.');
        setEnviando(true);
        try {
            await api.crearComanda({
                tipoPedido: esParagLlevar ? 'para_llevar' : 'mesa',
                mesaId: mesaSeleccionada?.id,
                items: items.map(i => ({
                    productoId: i.producto.id,
                    cantidad: i.cantidad,
                    guarnicion: i.guarnicion !== GUARNICIONES[0] ? i.guarnicion : undefined,
                    presa: i.presa !== PRESAS[0] ? i.presa : undefined,
                    notas: i.notas || undefined,
                })),
                observaciones: observaciones || undefined,
            });
            alert(`Comanda confirmada! ${mesaSeleccionada ? `Mesa ${mesaSeleccionada.numero}` : 'Para llevar'}`);
            setMesaSeleccionada(null);
            setEsParagLlevar(false);
            await cargarDatos();
        } catch (e: any) {
            alert(e.message || 'Error al crear la comanda.');
        } finally {
            setEnviando(false);
        }
    };

    return (
        <div className="min-h-screen bg-white">
            {/* HEADER */}
            <header className="bg-white border-b-8 p-4 shadow-sm sticky top-0 z-10" style={{ borderBottomColor: '#FACC15' }}>
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-[#E11D48]">
                            <Utensils className="text-white" size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tighter text-[#E11D48]">
                                HOT<span className="text-[#FACC15]">CHICKEN</span>
                            </h1>
                            <p className="text-slate-400 text-[10px] font-bold uppercase">{usuario.nombreCompleto || 'Mesero'}</p>
                        </div>
                    </div>
                    <button onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/'); }}
                        className="flex items-center gap-2 text-red-400 font-black text-sm p-2 rounded-xl hover:bg-red-50 transition-all">
                        <LogOut size={20} />
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-4 md:p-6">
                {/* KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Empleados</p>
                        <p className="text-4xl font-black">{empleadosActivos}</p>
                        <p className="text-xs text-slate-400 mt-1">Con acceso activo al sistema</p>
                    </div>
                    <div className="bg-[#fffbeb] border-2 border-yellow-200 rounded-2xl p-6 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-widest text-yellow-600 mb-1">Mesas Ocupadas</p>
                        <p className="text-4xl font-black text-slate-800">{mesasOcupadas}</p>
                        <p className="text-xs text-slate-400 mt-1">Mesas actualmente en servicio</p>
                    </div>
                    <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-6 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Ventas Estimadas</p>
                        <p className="text-4xl font-black text-slate-800">{ventasHoy.toFixed(2)} Bs.</p>
                        <p className="text-xs text-slate-400 mt-1">Panel de control preliminar</p>
                    </div>
                </div>

                {/* Acciones Rápidas */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                    <button onClick={() => abrirModal(null, true)}
                        className="flex items-center justify-center gap-2 p-4 rounded-2xl font-bold text-slate-800 shadow-md active:scale-95 transition-all bg-[#FACC15] text-sm">
                        <ShoppingBag size={20} /> NUEVO PEDIDO PARA LLEVAR
                    </button>

                    <div className="flex items-center justify-center gap-2 bg-slate-100 p-4 rounded-2xl font-bold text-slate-500 border border-slate-200 text-sm">
                        <ClipboardList size={20} /> TOTAL VENTAS: {ventasHoy.toFixed(2)} Bs.
                    </div>

                </div>

                {/* Mapa de Mesas */}
                <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <span className="w-2 h-8 rounded-full bg-[#E11D48]"></span> Estado de Mesas
                </h2>

                {mesas.length === 0 ? (
                    <div className="bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 p-16 text-center">
                        <p className="text-slate-400 font-bold mb-2">No hay mesas configuradas</p>
                        <p className="text-slate-300 text-sm">El administrador debe inicializar las mesas desde el panel.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                        {mesas.map((mesa) => (
                            <div key={mesa.id}
                                onClick={() => mesa.estado === 'libre' ? abrirModal(mesa) : alert(`Mesa ${mesa.numero} está ocupada.`)}
                                className={`relative h-36 rounded-3xl border-4 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center shadow-sm active:scale-95
                                    ${mesa.estado === 'ocupada' ? 'text-white' : mesa.estado === 'reservada' ? 'bg-yellow-50 border-yellow-300 text-yellow-700' : 'border-slate-100 bg-white text-slate-300 hover:border-yellow-400'}
                                `}
                                style={mesa.estado === 'ocupada' ? { backgroundColor: '#E11D48', borderColor: '#E11D48' } : {}}
                            >
                                <span className="text-xs font-black uppercase mb-1 tracking-widest">Mesa</span>
                                <span className="text-5xl font-black">{mesa.numero}</span>
                                <span className="text-[10px] font-black uppercase mt-1 opacity-70">
                                    {mesa.estado === 'ocupada' ? 'OCUPADA' : mesa.estado === 'reservada' ? 'RESERVADA' : 'LIBRE'}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* MODAL DE PEDIDO */}
            {(mesaSeleccionada !== null || esParagLlevar) && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
                    <div className="bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
                        {/* Cabecera modal */}
                        <div className="p-5 flex justify-between items-center bg-[#E11D48] flex-shrink-0">
                            <div>
                                <h3 className="text-xl font-black italic uppercase text-white">Nueva Comanda</h3>
                                <p className="text-[10px] font-bold uppercase tracking-widest mt-0.5 text-[#FACC15]">
                                    {esParagLlevar ? 'Para Llevar' : `Mesa ${mesaSeleccionada?.numero}`}
                                </p>
                            </div>
                            <button onClick={() => { setMesaSeleccionada(null); setEsParagLlevar(false); }}
                                className="bg-white/20 p-2 rounded-full hover:bg-white/40 transition-colors text-white">
                                <X size={24} strokeWidth={3} />
                            </button>
                        </div>

                        {/* Scroll body */}
                        <div className="overflow-y-auto flex-1 p-5 space-y-5">
                            {/* Platos */}
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Platos Principales</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {platoPrincipales.map(p => (
                                        <button key={p.id} onClick={() => agregarItem(p)}
                                            className="p-3 rounded-xl border-2 border-slate-100 text-left hover:border-[#FACC15] transition-all active:scale-95">
                                            <p className="font-black text-slate-800 text-sm">{p.nombre}</p>
                                            <p className="text-[#E11D48] font-bold text-xs">{Number(p.precio).toFixed(2)} Bs.</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Bebidas */}
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Bebidas</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {bebidas.map(p => (
                                        <button key={p.id} onClick={() => agregarItem(p)}
                                            className="p-3 rounded-xl border-2 border-slate-100 text-left hover:border-blue-200 transition-all active:scale-95">
                                            <p className="font-black text-slate-800 text-sm">{p.nombre}</p>
                                            <p className="text-blue-500 font-bold text-xs">{Number(p.precio).toFixed(2)} Bs.</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Items seleccionados */}
                            {items.length > 0 && (
                                <div className="bg-slate-50 rounded-2xl p-4 space-y-4">
                                    <p className="text-[10px] font-black text-slate-400 uppercase">Tu pedido</p>
                                    {items.map(item => (
                                        <div key={item.producto.id} className="bg-white rounded-xl p-3 border border-slate-100">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-black text-slate-800">{item.producto.nombre}</span>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => quitarItem(item.producto.id)} className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-red-100 hover:text-red-600 transition-all">
                                                        <Minus size={14} strokeWidth={3} />
                                                    </button>
                                                    <span className="font-black text-slate-800 w-5 text-center">{item.cantidad}</span>
                                                    <button onClick={() => agregarItem(item.producto)} className="w-7 h-7 rounded-full bg-[#FACC15] flex items-center justify-center text-slate-800 transition-all">
                                                        <Plus size={14} strokeWidth={3} />
                                                    </button>
                                                </div>
                                            </div>
                                            {item.producto.categoria === 'plato_principal' && (
                                                <div className="grid grid-cols-2 gap-2">
                                                    <select value={item.guarnicion} onChange={e => actualizarItem(item.producto.id, 'guarnicion', e.target.value)}
                                                        className="p-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-700 outline-none">
                                                        {GUARNICIONES.map(g => <option key={g}>{g}</option>)}
                                                    </select>
                                                    <select value={item.presa} onChange={e => actualizarItem(item.producto.id, 'presa', e.target.value)}
                                                        className="p-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-700 outline-none">
                                                        {PRESAS.map(p => <option key={p}>{p}</option>)}
                                                    </select>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Observaciones */}
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Observaciones (opcional)</label>
                                <textarea value={observaciones} onChange={e => setObservaciones(e.target.value)}
                                    rows={2} placeholder="Ej: Sin sal, extra picante..."
                                    className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-slate-700 outline-none resize-none text-sm" />
                            </div>
                        </div>

                        {/* Footer con total y confirmar */}
                        <div className="p-4 border-t-2 border-slate-100 bg-white flex-shrink-0">
                            <div className="flex justify-between items-center mb-3">
                                <span className="font-black text-slate-500 uppercase text-sm">Total:</span>
                                <span className="font-black text-2xl text-[#E11D48]">{totalPedido.toFixed(2)} Bs.</span>
                            </div>
                            <button onClick={confirmarComanda} disabled={items.length === 0 || enviando}
                                className="w-full py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 disabled:opacity-50 bg-[#FACC15] text-slate-900">
                                <ChefHat size={22} /> {enviando ? 'ENVIANDO...' : 'CONFIRMAR COMANDA'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <footer className="mt-12 p-8 text-center text-gray-400 text-sm">
                &copy; 2026 HotChicken · Sistema de Gestión de Pedidos
            </footer>
        </div>
    );
};

export default Dashboard;
