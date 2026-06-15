import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, ArrowLeft, Plus, PencilLine, PowerOff } from 'lucide-react';
import { api } from '../api.service';

interface Producto {
    id: number;
    nombre: string;
    categoria: 'plato_principal' | 'guarnicion' | 'bebida' | 'extra';
    precio: number;
    descripcion?: string;
    activo: boolean;
}

const categoriaLabel: Record<string, string> = {
    plato_principal: 'Plato Principal',
    guarnicion: 'Guarnición',
    bebida: 'Bebida',
    extra: 'Extra',
};

const categoriaBadge: Record<string, string> = {
    plato_principal: 'bg-red-100 text-red-700',
    guarnicion: 'bg-yellow-100 text-yellow-700',
    bebida: 'bg-blue-100 text-blue-700',
    extra: 'bg-slate-100 text-slate-600',
};

const Inventario = () => {
    const navigate = useNavigate();
    const [productos, setProductos] = useState<Producto[]>([]);
    const [loading, setLoading] = useState(true);
    const [cargandoSeed, setCargandoSeed] = useState(false);

    const cargar = async () => {
        setLoading(true);
        try {
            const data = await api.getProductos();
            setProductos(data);
        } catch (e) {
            console.error('Error al cargar productos:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { cargar(); }, []);

    const inicializarMenu = async () => {
        setCargandoSeed(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('https://hotchicken-backend.onrender.com/api/v1/productos/seed', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            });
            if (res.ok) {
                alert('¡Menú inicial cargado!');
                cargar();
            }
        } catch (e) {
            alert('Error al inicializar el menú.');
        } finally {
            setCargandoSeed(false);
        }
    };

    const grupos = productos.reduce((acc, p) => {
        if (!acc[p.categoria]) acc[p.categoria] = [];
        acc[p.categoria].push(p);
        return acc;
    }, {} as Record<string, Producto[]>);

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8">
            <header className="max-w-5xl mx-auto flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/admin')} className="p-2 bg-white rounded-full shadow-sm text-[#E11D48] hover:scale-110 transition-all">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 uppercase italic leading-none flex items-center gap-2">
                            <Package className="text-[#E11D48]" size={28} /> Catálogo de Productos
                        </h1>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Menú de HotChicken · {productos.length} productos</p>
                    </div>
                </div>
                {productos.length === 0 && !loading && (
                    <button onClick={inicializarMenu} disabled={cargandoSeed}
                        className="flex items-center gap-2 bg-[#FACC15] text-slate-900 px-5 py-3 rounded-2xl font-black text-sm active:scale-95 transition-all disabled:opacity-60">
                        <Plus size={18} /> {cargandoSeed ? 'Cargando...' : 'INICIALIZAR MENÚ'}
                    </button>
                )}
            </header>

            <div className="max-w-5xl mx-auto space-y-8">
                {loading ? (
                    <p className="text-center py-20 text-slate-400 font-bold">Cargando productos...</p>
                ) : productos.length === 0 ? (
                    <div className="bg-white rounded-[2rem] border-2 border-dashed border-slate-200 p-16 text-center">
                        <Package size={48} className="mx-auto text-slate-200 mb-4" />
                        <p className="text-slate-500 font-black text-lg">Catálogo vacío</p>
                        <p className="text-slate-400 text-sm mt-2">Presiona "INICIALIZAR MENÚ" para cargar los productos de HotChicken.</p>
                    </div>
                ) : (
                    Object.entries(grupos).map(([cat, prods]) => (
                        <section key={cat}>
                            <h2 className="font-black text-slate-800 uppercase text-lg mb-4 flex items-center gap-2">
                                <span className={`px-3 py-1 rounded-full text-sm ${categoriaBadge[cat]}`}>{categoriaLabel[cat]}</span>
                                <span className="text-slate-300 text-sm">({prods.length})</span>
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {prods.map((p) => (
                                    <div key={p.id} className={`bg-white rounded-[1.5rem] border-2 p-5 transition-all ${p.activo ? 'border-slate-100 hover:border-yellow-200' : 'border-slate-100 opacity-50'}`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-black text-slate-800">{p.nombre}</h3>
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${p.activo ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                                                {p.activo ? 'ACTIVO' : 'INACTIVO'}
                                            </span>
                                        </div>
                                        {p.descripcion && <p className="text-slate-400 text-xs mb-2">{p.descripcion}</p>}
                                        <p className="text-2xl font-black text-[#E11D48]">
                                            {Number(p.precio) === 0 ? 'Incluido' : `${Number(p.precio).toFixed(2)} Bs.`}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    ))
                )}
            </div>
        </div>
    );
};

export default Inventario;
