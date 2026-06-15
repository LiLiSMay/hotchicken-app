import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChefHat, CheckCircle, Clock, RefreshCw, Utensils, Tag } from 'lucide-react';
import { api } from '../api.service';

interface ItemComanda {
    id: number;
    cantidad: number;
    guarnicion?: string;
    presa?: string;
    notas?: string;
    producto: { nombre: string; categoria: string };
    precioUnitario: number;
}

interface Comanda {
    id: number;
    estado: 'abierta' | 'en_cocina' | 'entregada' | 'cerrada' | 'cancelada';
    tipoPedido: 'mesa' | 'para_llevar' | 'delivery';
    total: number;
    observaciones?: string;
    creadoEn: string;
    actualizadoEn: string;
    items: ItemComanda[];
    mesa?: { numero: number };
    mesero?: { nombreCompleto: string };
}

const tiempoTranscurrido = (fecha: string) => {
    const diff = Math.floor((Date.now() - new Date(fecha).getTime()) / 1000);
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}min`;
    return `${Math.floor(diff / 3600)}h`;
};

const EstadoBadge = ({ estado }: { estado: string }) => {
    const map: Record<string, string> = {
        abierta: 'bg-blue-100 text-blue-700',
        en_cocina: 'bg-orange-100 text-orange-700',
        entregada: 'bg-green-100 text-green-700',
        cerrada: 'bg-slate-100 text-slate-500',
    };
    const labels: Record<string, string> = {
        abierta: 'ABIERTA',
        en_cocina: 'EN COCINA',
        entregada: 'ENTREGADA',
        cerrada: 'CERRADA',
    };
    return (
        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${map[estado] || 'bg-slate-100 text-slate-500'}`}>
            {labels[estado] || estado}
        </span>
    );
};

const TarjetaComanda = ({ comanda, onCambiarEstado }: { comanda: Comanda; onCambiarEstado: (id: number, estado: string) => void }) => {
    const [cargando, setCargando] = useState(false);

    const cambiar = async (nuevoEstado: string) => {
        setCargando(true);
        await onCambiarEstado(comanda.id, nuevoEstado);
        setCargando(false);
    };

    const esUrgente = (Date.now() - new Date(comanda.creadoEn).getTime()) > 15 * 60 * 1000;

    return (
        <div className={`bg-white rounded-[1.5rem] border-2 shadow-sm overflow-hidden transition-all ${esUrgente && comanda.estado !== 'entregada' ? 'border-red-300' : 'border-slate-100'}`}>
            {/* Cabecera */}
            <div className={`p-4 flex items-center justify-between ${comanda.estado === 'en_cocina' ? 'bg-orange-50' : comanda.estado === 'entregada' ? 'bg-green-50' : 'bg-slate-50'}`}>
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-lg ${comanda.estado === 'en_cocina' ? 'bg-orange-500 text-white' : comanda.estado === 'entregada' ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                        #{comanda.id}
                    </div>
                    <div>
                        <p className="font-black text-slate-800 text-sm leading-none">
                            {comanda.tipoPedido === 'mesa' && comanda.mesa ? `Mesa ${comanda.mesa.numero}` : comanda.tipoPedido === 'para_llevar' ? 'Para Llevar' : 'Delivery'}
                        </p>
                        <p className="text-slate-400 text-[10px] font-bold mt-0.5">
                            {comanda.mesero?.nombreCompleto || 'Sin mesero'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <EstadoBadge estado={comanda.estado} />
                    <span className={`flex items-center gap-1 text-[10px] font-black ${esUrgente && comanda.estado !== 'entregada' ? 'text-red-500' : 'text-slate-400'}`}>
                        <Clock size={12} /> {tiempoTranscurrido(comanda.creadoEn)}
                    </span>
                </div>
            </div>

            {/* Items */}
            <div className="p-4 space-y-2">
                {comanda.items.map((item) => (
                    <div key={item.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                        <span className="bg-[#E11D48] text-white text-[10px] font-black rounded-lg px-2 py-1 min-w-[2rem] text-center">
                            x{item.cantidad}
                        </span>
                        <div className="flex-1">
                            <p className="font-black text-slate-800 text-sm">{item.producto?.nombre}</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                                {item.guarnicion && <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-bold">{item.guarnicion}</span>}
                                {item.presa && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">{item.presa}</span>}
                                {item.notas && <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-bold italic">{item.notas}</span>}
                            </div>
                        </div>
                    </div>
                ))}

                {comanda.observaciones && (
                    <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-xl border border-yellow-200">
                        <Tag size={14} className="text-yellow-600 flex-shrink-0" />
                        <p className="text-yellow-800 text-xs font-bold italic">{comanda.observaciones}</p>
                    </div>
                )}
            </div>

            {/* Acciones */}
            <div className="px-4 pb-4 flex gap-2">
                {comanda.estado === 'abierta' && (
                    <button onClick={() => cambiar('en_cocina')} disabled={cargando}
                        className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-black text-sm active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                        <ChefHat size={16} /> {cargando ? 'Procesando...' : 'ENVIAR A COCINA'}
                    </button>
                )}
                {comanda.estado === 'en_cocina' && (
                    <button onClick={() => cambiar('entregada')} disabled={cargando}
                        className="flex-1 py-3 bg-green-500 text-white rounded-xl font-black text-sm active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                        <CheckCircle size={16} /> {cargando ? 'Procesando...' : '✓ LISTO / ENTREGAR'}
                    </button>
                )}
                {comanda.estado === 'entregada' && (
                    <button onClick={() => cambiar('cerrada')} disabled={cargando}
                        className="flex-1 py-3 bg-slate-700 text-white rounded-xl font-black text-sm active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                        {cargando ? 'Procesando...' : '💰 COBRAR / CERRAR'}
                    </button>
                )}
                <div className="ml-auto text-right">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Total</p>
                    <p className="font-black text-slate-800">{Number(comanda.total).toFixed(2)} Bs.</p>
                </div>
            </div>
        </div>
    );
};

const Cocina = () => {
    const navigate = useNavigate();
    const [abiertas, setAbiertas] = useState<Comanda[]>([]);
    const [entregadas, setEntregadas] = useState<Comanda[]>([]);
    const [loading, setLoading] = useState(true);
    const [autoRefresh, setAutoRefresh] = useState(true);

    const cargarComandas = useCallback(async () => {
        try {
            const [ab, ent] = await Promise.all([
                api.getComandasAbiertas(),
                api.getEntregadasHoy(),
            ]);
            setAbiertas(ab);
            // Solo las cerradas (cobradas) van al historial
            setEntregadas(ent.filter((c: any) => c.estado === 'cerrada'));
        } catch (e) {
            console.error('Error al cargar comandas:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        cargarComandas();
    }, [cargarComandas]);

    useEffect(() => {
        if (!autoRefresh) return;
        const interval = setInterval(cargarComandas, 15000);
        return () => clearInterval(interval);
    }, [autoRefresh, cargarComandas]);

    const cambiarEstado = async (id: number, estado: string) => {
        try {
            await api.actualizarEstadoComanda(id, estado as any);
            await cargarComandas();
        } catch (e) {
            alert('Error al cambiar el estado. Intenta de nuevo.');
        }
    };

    const pendientes = abiertas.filter(c => c.estado === 'abierta');
    const enCocina = abiertas.filter(c => c.estado === 'en_cocina');
    const entregadasPendienteCobro = abiertas.filter(c => c.estado === 'entregada');

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b-4 border-[#E11D48] p-4 sticky top-0 z-10 shadow-sm">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/admin')} className="p-2 bg-slate-50 rounded-full text-[#E11D48] hover:scale-110 transition-all">
                            <ArrowLeft size={22} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-black text-slate-800 uppercase italic leading-none flex items-center gap-2">
                                <ChefHat className="text-[#E11D48]" /> Dashboard de Cocina
                            </h1>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">
                                Cola de pedidos en tiempo real
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => setAutoRefresh(!autoRefresh)}
                            className={`text-[10px] font-black uppercase px-3 py-2 rounded-xl border-2 transition-all ${autoRefresh ? 'border-green-400 text-green-600 bg-green-50' : 'border-slate-200 text-slate-400'}`}>
                            {autoRefresh ? '● AUTO' : '○ AUTO'}
                        </button>
                        <button onClick={cargarComandas} className="p-2 bg-slate-100 rounded-xl text-slate-600 hover:bg-[#FACC15] transition-all">
                            <RefreshCw size={20} />
                        </button>
                    </div>
                </div>
            </header>

            {/* Contadores */}
            <div className="max-w-7xl mx-auto px-4 py-4 grid grid-cols-4 gap-4">
                <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 text-center">
                    <p className="text-3xl font-black text-blue-700">{pendientes.length}</p>
                    <p className="text-[10px] font-black text-blue-500 uppercase">Abiertas</p>
                </div>
                <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-4 text-center">
                    <p className="text-3xl font-black text-orange-700">{enCocina.length}</p>
                    <p className="text-[10px] font-black text-orange-500 uppercase">En Cocina</p>
                </div>
                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-4 text-center">
                    <p className="text-3xl font-black text-yellow-700">{entregadasPendienteCobro.length}</p>
                    <p className="text-[10px] font-black text-yellow-600 uppercase">Por Cobrar</p>
                </div>
                <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-4 text-center">
                    <p className="text-3xl font-black text-green-700">{entregadas.length}</p>
                    <p className="text-[10px] font-black text-green-500 uppercase">Entregadas Hoy</p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 pb-8">
                {loading ? (
                    <div className="text-center py-20 text-slate-400 font-bold">Cargando comandas...</div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* SECCIÓN PENDIENTES + EN COCINA */}
                        <section className="space-y-6">
                            <div>
                                <h2 className="text-lg font-black text-slate-800 uppercase mb-4 flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-orange-400 animate-pulse"></span>
                                    Pendientes ({pendientes.length + enCocina.length})
                                </h2>
                                {pendientes.length === 0 && enCocina.length === 0 ? (
                                    <div className="bg-white rounded-[1.5rem] border-2 border-dashed border-slate-200 p-12 text-center">
                                        <Utensils size={40} className="mx-auto text-slate-200 mb-3" />
                                        <p className="text-slate-400 font-bold">Sin pedidos activos</p>
                                        <p className="text-slate-300 text-xs mt-1">Los nuevos pedidos aparecerán aquí</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {[...pendientes, ...enCocina].map(c => (
                                            <TarjetaComanda key={c.id} comanda={c} onCambiarEstado={cambiarEstado} />
                                        ))}
                                    </div>
                                )}
                            </div>
                            {entregadasPendienteCobro.length > 0 && (
                                <div>
                                    <h2 className="text-lg font-black text-slate-800 uppercase mb-4 flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full bg-yellow-400 animate-pulse"></span>
                                        Listos — Por Cobrar ({entregadasPendienteCobro.length})
                                    </h2>
                                    <div className="space-y-4">
                                        {entregadasPendienteCobro.map(c => (
                                            <TarjetaComanda key={c.id} comanda={c} onCambiarEstado={cambiarEstado} />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </section>

                        {/* SECCIÓN ENTREGADOS HOY */}
                        <section>
                            <h2 className="text-lg font-black text-slate-800 uppercase mb-4 flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-green-400"></span>
                                Entregados Hoy ({entregadas.length})
                            </h2>
                            {entregadas.length === 0 ? (
                                <div className="bg-white rounded-[1.5rem] border-2 border-dashed border-slate-200 p-12 text-center">
                                    <CheckCircle size={40} className="mx-auto text-slate-200 mb-3" />
                                    <p className="text-slate-400 font-bold">Sin entregas aún</p>
                                    <p className="text-slate-300 text-xs mt-1">Los pedidos entregados aparecerán aquí</p>
                                </div>
                            ) : (
                                <div className="space-y-4 max-h-[700px] overflow-y-auto pr-1">
                                    {entregadas.map(c => (
                                        <TarjetaComanda key={c.id} comanda={c} onCambiarEstado={cambiarEstado} />
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Cocina;
