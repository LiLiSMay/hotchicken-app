import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserCheck, UserX, Clock, CheckCircle, XCircle } from 'lucide-react';
import { api } from '../api.service';

interface Solicitud {
    id: number;
    nombreCompleto: string;
    username: string;
    rol: string;
    estadoSolicitud: 'pendiente' | 'aprobado' | 'rechazado';
    creadoEn: string;
}

const Solicitudes = () => {
    const navigate = useNavigate();
    const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
    const [loading, setLoading] = useState(true);
    const [procesando, setProcesando] = useState<number | null>(null);

    const cargar = async () => {
        setLoading(true);
        try {
            const data = await api.getSolicitudesPendientes();
            setSolicitudes(data);
        } catch (e) {
            console.error('Error al cargar solicitudes:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { cargar(); }, []);

    const aprobar = async (id: number) => {
        setProcesando(id);
        try {
            await api.gestionarSolicitud(id, { estadoSolicitud: 'aprobado' });
            await cargar();
        } catch (e: any) {
            alert(e.message || 'Error al aprobar');
        } finally {
            setProcesando(null);
        }
    };

    const rechazar = async (id: number) => {
        const motivo = prompt('Motivo del rechazo (opcional):') ?? 'Solicitud rechazada';
        setProcesando(id);
        try {
            await api.gestionarSolicitud(id, { estadoSolicitud: 'rechazado', motivoRechazo: motivo });
            await cargar();
        } catch (e: any) {
            alert(e.message || 'Error al rechazar');
        } finally {
            setProcesando(null);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8">
            <header className="max-w-3xl mx-auto flex items-center gap-4 mb-8">
                <button onClick={() => navigate('/admin')} className="p-2 bg-white rounded-full shadow-sm text-[#E11D48] hover:scale-110 transition-all">
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h1 className="text-2xl font-black text-slate-800 uppercase italic leading-none">Solicitudes de Registro</h1>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Aprobar o rechazar nuevos empleados</p>
                </div>
            </header>

            <div className="max-w-3xl mx-auto">
                {loading ? (
                    <p className="text-center py-20 text-slate-400 font-bold">Cargando solicitudes...</p>
                ) : solicitudes.length === 0 ? (
                    <div className="bg-white rounded-[2rem] border-2 border-dashed border-slate-200 p-16 text-center">
                        <CheckCircle size={48} className="mx-auto text-green-300 mb-4" />
                        <p className="text-slate-500 font-black text-lg">¡Todo al día!</p>
                        <p className="text-slate-400 text-sm mt-1">No hay solicitudes pendientes de aprobación.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {solicitudes.map((s) => (
                            <div key={s.id} className="bg-white rounded-[1.5rem] border-2 border-slate-100 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                                    <UserCheck size={24} className="text-blue-500" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-black text-slate-800 text-lg leading-none">{s.nombreCompleto}</h4>
                                    <p className="text-slate-500 text-sm font-bold mt-1">@{s.username} · {s.rol}</p>
                                    <p className="text-slate-400 text-[10px] font-bold uppercase mt-1 flex items-center gap-1">
                                        <Clock size={10} /> Solicitó: {new Date(s.creadoEn).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                                <div className="flex gap-2 w-full sm:w-auto">
                                    <button
                                        onClick={() => aprobar(s.id)}
                                        disabled={procesando === s.id}
                                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-green-500 text-white px-5 py-3 rounded-xl font-black text-sm active:scale-95 transition-all disabled:opacity-50"
                                    >
                                        <CheckCircle size={16} /> {procesando === s.id ? '...' : 'APROBAR'}
                                    </button>
                                    <button
                                        onClick={() => rechazar(s.id)}
                                        disabled={procesando === s.id}
                                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-red-100 text-red-600 px-5 py-3 rounded-xl font-black text-sm active:scale-95 transition-all disabled:opacity-50"
                                    >
                                        <XCircle size={16} /> {procesando === s.id ? '...' : 'RECHAZAR'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Solicitudes;
