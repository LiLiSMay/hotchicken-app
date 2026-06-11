import { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  LayoutDashboard, FileText, Users, LogOut,
  TrendingUp, Package, Utensils, Menu, X,
  ChefHat, UserCheck, ClipboardList, RefreshCw, Calendar,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.service';
import type { Mesa, DashboardKpis, GraficoItem } from '../api.service';

// ─── Utilidades de fecha ──────────────────────────────────────────────────────
const isoHoy = () => new Date().toISOString().slice(0, 10);
const isoHaceDias = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

// ─── Config visual de mesas ───────────────────────────────────────────────────
const mesaEstilo: Record<Mesa['estado'], { fondo: string; borde: string; texto: string }> = {
  libre:     { fondo: 'bg-white',     borde: 'border-slate-200', texto: 'text-slate-300' },
  ocupada:   { fondo: 'bg-[#E11D48]', borde: 'border-[#E11D48]', texto: 'text-white'    },
  reservada: { fondo: 'bg-amber-400', borde: 'border-amber-400', texto: 'text-white'    },
};

const TarjetaMesa = ({ mesa }: { mesa: Mesa }) => {
  const e = mesaEstilo[mesa.estado];
  return (
    <div className={`${e.fondo} border-2 ${e.borde} rounded-2xl flex flex-col items-center justify-center aspect-square shadow-sm transition-all duration-300 select-none`}>
      <span className={`text-[8px] font-black uppercase tracking-widest ${e.texto} opacity-60`}>MESA</span>
      <span className={`text-3xl font-black ${e.texto} leading-none mt-0.5`}>{mesa.numero}</span>
    </div>
  );
};

const COLORES = ['#E11D48', '#fb923c', '#f87171', '#60a5fa', '#a78bfa', '#34d399', '#f59e0b'];

// ─── Componente principal ─────────────────────────────────────────────────────
const AdminDashboard = () => {
  const navigate = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [cargando, setCargando]       = useState(true);
  const [cargandoGraf, setCargandoGraf] = useState(false);

  const [kpis, setKpis] = useState<DashboardKpis>({
    ventasTotalesHoy: 0, platosVendidosHoy: 0,
    comandasActivasAhora: 0, comandasCerradasHoy: 0,
  });
  const [grafico, setGrafico]         = useState<GraficoItem[]>([]);
  const [solicitudes, setSolicitudes] = useState(0);
  const [mesas, setMesas]             = useState<Mesa[]>([]);

  // Selector de fechas
  const [desde, setDesde]     = useState(isoHoy());
  const [hasta, setHasta]     = useState(isoHoy());
  const [periodo, setPeriodo] = useState<'hoy' | '7d' | '30d' | 'custom'>('hoy');

  // ─── Cargadores ──────────────────────────────────────────────────────────
  const cargarKpis = useCallback(async () => {
    try {
      const data = (desde !== isoHoy() || hasta !== isoHoy())
        ? await api.getKpisRango(desde, hasta)
        : await api.getDashboardKpis();
      setKpis(data);
    } catch {
      try {
        const [v, a] = await Promise.all([api.getVentasHoy(), api.getComandasAbiertas()]);
        setKpis(prev => ({
          ...prev,
          ventasTotalesHoy: v.total,
          comandasCerradasHoy: v.cantidadComandas,
          comandasActivasAhora: a.length,
        }));
      } catch (e) { console.error('KPIs fallback error:', e); }
    }
  }, [desde, hasta]);

  const cargarGrafico = useCallback(async () => {
    setCargandoGraf(true);
    try {
      const { data } = await api.getProductosPorRango(desde, hasta);
      setGrafico(data || []);
    } catch {
      try {
        const { data } = await api.getVentasPorCategoria('diario');
        setGrafico(data || []);
      } catch (e) { console.error('Gráfico error:', e); }
    } finally { setCargandoGraf(false); }
  }, [desde, hasta]);

  const cargarMesas = useCallback(async () => {
    try { setMesas(await api.getMesas()); } catch {}
  }, []);

  const cargarSolicitudes = useCallback(async () => {
    try { setSolicitudes((await api.getSolicitudesPendientes()).length); } catch {}
  }, []);

  const cargarTodo = useCallback(async () => {
    setCargando(true);
    await Promise.allSettled([cargarKpis(), cargarGrafico(), cargarMesas(), cargarSolicitudes()]);
    setCargando(false);
  }, [cargarKpis, cargarGrafico, cargarMesas, cargarSolicitudes]);

  useEffect(() => { cargarTodo(); }, []);
  useEffect(() => { cargarKpis(); cargarGrafico(); }, [desde, hasta]);

  const aplicarPeriodo = (p: typeof periodo) => {
    setPeriodo(p);
    const h = isoHoy();
    if (p === 'hoy') { setDesde(h); setHasta(h); }
    if (p === '7d')  { setDesde(isoHaceDias(6));  setHasta(h); }
    if (p === '30d') { setDesde(isoHaceDias(29)); setHasta(h); }
  };

  // ─── Generar PDF con datos del período seleccionado ───────────────────────
  const generarPDF = async () => {
    try {
      const esHoy = desde === isoHoy() && hasta === isoHoy();

      let kpisData = kpis;
      try {
        kpisData = esHoy
          ? await api.getDashboardKpis()
          : await api.getKpisRango(desde, hasta);
      } catch {}

      // Usar el mismo endpoint que el gráfico → mismos datos que se ven en pantalla
      let detalleProductos: any[] = [];
      let totalGeneral = 0;
      try {
        const res = await api.getProductosPorRango(desde, hasta);
        detalleProductos = (res.data || []).map((p: any) => ({
          producto: p.name,
          categoria: p.categoria ?? '—',
          unidadesVendidas: p.ventas,
          ingresoTotal: Number(p.ingresos),
        }));
        totalGeneral = detalleProductos.reduce((s, p) => s + p.ingresoTotal, 0);
      } catch {}

      const fechaLabel = esHoy
        ? new Date().toLocaleDateString('es-BO', { year: 'numeric', month: 'long', day: 'numeric' })
        : `${desde} al ${hasta}`;

      const mesasActuales = mesas.length > 0 ? mesas : await api.getMesas().catch(() => []);
      const libre = mesasActuales.filter(m => m.estado === 'libre').length;
      const ocup  = mesasActuales.filter(m => m.estado === 'ocupada').length;

      const filas = detalleProductos.length > 0
        ? detalleProductos.map(p => `
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9">${p.producto}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;text-align:center">${p.categoria}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;text-align:center">${p.unidadesVendidas}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;text-align:right">${p.ingresoTotal.toFixed(2)} Bs.</td>
          </tr>`).join('')
        : `<tr><td colspan="4" style="padding:20px;text-align:center;color:#94a3b8">Sin ventas en este período</td></tr>`;

      const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/>
<title>Reporte HotChicken — ${fechaLabel}</title>
<style>
  *{box-sizing:border-box}body{font-family:Arial,sans-serif;margin:0;padding:40px;color:#1e293b}
  h1{color:#E11D48;font-size:28px;margin:0}.sub{color:#475569;font-size:14px;margin:4px 0 0}
  .rango{display:inline-block;margin-top:8px;background:#f1f5f9;border-radius:8px;padding:4px 14px;font-size:12px;font-weight:700;color:#475569}
  .kpis{display:flex;gap:16px;margin:32px 0;flex-wrap:wrap}
  .kpi{flex:1;min-width:120px;background:#f8fafc;border-radius:12px;padding:20px;border-left:4px solid #FACC15}
  .kpi .val{font-size:26px;font-weight:900;color:#1e293b}
  .kpi .lbl{font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-top:4px}
  h3{color:#1e293b;margin:24px 0 0}
  table{width:100%;border-collapse:collapse;margin-top:12px}
  thead tr{background:#1e293b;color:white}
  thead th{padding:12px;text-align:left;font-size:11px;text-transform:uppercase}
  tbody tr:nth-child(even){background:#f8fafc}td{padding:8px 12px}
  tfoot td{font-weight:900;border-top:2px solid #e2e8f0;padding:12px}
  .total-val{text-align:right;color:#E11D48;font-size:15px}
  .footer{margin-top:40px;color:#94a3b8;font-size:10px;text-align:center;border-top:1px solid #f1f5f9;padding-top:16px}
</style></head><body>
<h1>🍗 HOTCHICKEN</h1>
<p class="sub">Reporte de Ventas</p>
<span class="rango">📅 Período: ${fechaLabel}</span>
<div class="kpis">
  <div class="kpi"><div class="val">${Number(kpisData.ventasTotalesHoy).toFixed(2)} Bs.</div><div class="lbl">Ventas del período</div></div>
  <div class="kpi"><div class="val">${kpisData.platosVendidosHoy}</div><div class="lbl">Platos Vendidos</div></div>
  <div class="kpi"><div class="val">${kpisData.comandasCerradasHoy}</div><div class="lbl">Comandas Cerradas</div></div>
  <div class="kpi"><div class="val">${ocup} / ${mesasActuales.length}</div><div class="lbl">Mesas Ocupadas</div></div>
  <div class="kpi"><div class="val">${libre}</div><div class="lbl">Mesas Libres</div></div>
</div>
<h3>Detalle de Platos Vendidos</h3>
<table>
  <thead><tr><th>Producto</th><th>Categoría</th><th style="text-align:center">Unidades</th><th style="text-align:right">Total</th></tr></thead>
  <tbody>${filas}</tbody>
  <tfoot><tr>
    <td colspan="2">Total General</td>
    <td style="text-align:center">${detalleProductos.reduce((s, p) => s + p.unidadesVendidas, 0)}</td>
    <td class="total-val">${totalGeneral.toFixed(2)} Bs.</td>
  </tr></tfoot>
</table>
<div class="footer">Generado por HotChicken · ${new Date().toLocaleString('es-BO')}</div>
</body></html>`;

      const w = window.open('', '_blank');
      if (w) { w.document.write(html); w.document.close(); w.focus(); setTimeout(() => w.print(), 600); }
      else alert('El navegador bloqueó la ventana emergente. Habilita popups para este sitio.');
    } catch (err) {
      console.error('PDF error:', err);
      alert('Error al generar el reporte.');
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const NavBtn = ({ icon: Icon, label, path, badge }: { icon: any; label: string; path: string; badge?: number }) => {
    const activo = window.location.pathname === path;
    return (
      <button onClick={() => { navigate(path); setMenuAbierto(false); }}
        className={`flex items-center gap-3 w-full p-3 rounded-xl font-bold transition-all relative
          ${activo ? 'bg-[#E11D48] text-white shadow-lg shadow-red-900/20' : 'hover:bg-slate-800 text-slate-400'}`}>
        <Icon size={20} /> {label}
        {badge && badge > 0
          ? <span className="absolute right-3 bg-[#FACC15] text-slate-900 text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center">{badge}</span>
          : null}
      </button>
    );
  };

  const libres   = mesas.filter(m => m.estado === 'libre').length;
  const ocupadas = mesas.filter(m => m.estado === 'ocupada').length;
  const reserv   = mesas.filter(m => m.estado === 'reservada').length;
  const totalIngresos = grafico.reduce((s, p) => s + Number(p.ingresos), 0);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">

      {/* CABECERA MÓVIL */}
      <div className="md:hidden bg-white p-4 flex justify-between items-center border-b-2 border-slate-100 sticky top-0 z-50">
        <h2 className="text-xl font-black text-[#E11D48]">HOT<span className="text-[#FACC15]">CHICKEN</span></h2>
        <button onClick={() => setMenuAbierto(!menuAbierto)} className="p-2 bg-slate-50 rounded-xl text-[#E11D48]">
          {menuAbierto ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white p-6 flex flex-col
        transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        ${menuAbierto ? 'translate-x-0' : '-translate-x-full'}`}>
        <h2 className="text-2xl font-black mb-10 text-[#E11D48] hidden md:block">
          HOT<span className="text-[#FACC15]">CHICKEN</span>
        </h2>
        <nav className="space-y-2 flex-1">
          <NavBtn icon={LayoutDashboard} label="Dashboard"        path="/admin" />
          <NavBtn icon={ChefHat}         label="Cocina / Pedidos" path="/admin/cocina"      badge={kpis.comandasActivasAhora} />
          <NavBtn icon={UserCheck}        label="Solicitudes"      path="/admin/solicitudes" badge={solicitudes} />
          <NavBtn icon={Users}            label="Empleados"        path="/empleados" />
          <NavBtn icon={Package}          label="Inventario"       path="/admin/inventario" />
        </nav>
        <button onClick={cerrarSesion} className="flex items-center gap-3 w-full p-3 text-red-400 font-bold hover:bg-red-900/20 rounded-xl transition-all">
          <LogOut size={20} /> Cerrar Sesión
        </button>
      </aside>
      {menuAbierto && <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setMenuAbierto(false)} />}

      {/* CONTENIDO */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">

        {/* Encabezado */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-800 uppercase italic leading-none">Panel de Control</h1>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-2">Métricas en tiempo real · HotChicken</p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <button onClick={cargarTodo}
              className="flex items-center justify-center gap-2 bg-white border-2 border-slate-200 text-slate-600 px-4 py-3 rounded-2xl font-black hover:border-[#FACC15] transition-all shadow-sm active:scale-95 text-sm">
              <RefreshCw size={16} className={cargando ? 'animate-spin' : ''} /> Actualizar
            </button>
            <button onClick={generarPDF}
              className="flex items-center justify-center gap-2 bg-white border-2 border-[#E11D48] text-[#E11D48] px-6 py-3 rounded-2xl font-black hover:bg-[#E11D48] hover:text-white transition-all shadow-sm active:scale-95">
              <FileText size={20} /> REPORTE PDF
            </button>
          </div>
        </header>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border-b-4 border-[#FACC15]">
            <div className="text-[#FACC15] mb-3"><TrendingUp size={28} /></div>
            <p className="text-slate-400 text-[10px] font-black uppercase">Ventas Hoy</p>
            <h3 className="text-2xl font-black text-slate-800">
              {cargando ? '...' : `${Number(kpis.ventasTotalesHoy).toFixed(2)} Bs.`}
            </h3>
          </div>
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border-b-4 border-[#E11D48]">
            <div className="text-[#E11D48] mb-3"><Utensils size={28} /></div>
            <p className="text-slate-400 text-[10px] font-black uppercase">Platos Vendidos</p>
            <h3 className="text-2xl font-black text-slate-800">
              {cargando ? '...' : `${kpis.platosVendidosHoy} Unid.`}
            </h3>
          </div>
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border-b-4 border-orange-500">
            <div className="text-orange-500 mb-3"><ClipboardList size={28} /></div>
            <p className="text-slate-400 text-[10px] font-black uppercase">Comandas Activas</p>
            <h3 className="text-2xl font-black text-slate-800">
              {cargando ? '...' : kpis.comandasActivasAhora}
            </h3>
          </div>
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border-b-4 border-blue-500 cursor-pointer hover:shadow-md transition-all"
            onClick={() => navigate('/admin/solicitudes')}>
            <div className="text-blue-500 mb-3"><UserCheck size={28} /></div>
            <p className="text-slate-400 text-[10px] font-black uppercase">Solicitudes Pend.</p>
            <h3 className="text-2xl font-black text-slate-800">{cargando ? '...' : solicitudes}</h3>
          </div>
        </div>

        {/* ══════════════ ESTADO DE MESAS ══════════════ */}
        <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border-2 border-slate-100 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <h3 className="text-xl font-black text-slate-800 uppercase flex items-center gap-2">
              <span className="w-2 h-6 rounded-full bg-[#E11D48]" />
              Estado de Mesas
            </h3>
            <div className="flex items-center gap-4 text-xs font-bold flex-wrap">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded border-2 border-slate-200 bg-white" />
                <span className="text-slate-500">Libre ({libres})</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-[#E11D48]" />
                <span className="text-slate-500">Ocupada ({ocupadas})</span>
              </span>
              {reserv > 0 && (
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-amber-400" />
                  <span className="text-slate-500">Reservada ({reserv})</span>
                </span>
              )}
            </div>
          </div>

          {cargando && mesas.length === 0 ? (
            <div className="py-12 text-center text-slate-400 font-bold">Cargando mesas...</div>
          ) : mesas.length === 0 ? (
            <div className="py-12 text-center text-slate-400 font-bold">
              No hay mesas registradas.
              <span className="text-xs mt-1 block opacity-70">El backend las creará automáticamente al reiniciar.</span>
            </div>
          ) : (
            <div className="grid grid-cols-5 md:grid-cols-10 gap-2 md:gap-3">
              {mesas.map(m => <TarjetaMesa key={m.id} mesa={m} />)}
            </div>
          )}
          {mesas.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100 flex gap-6 text-sm font-bold flex-wrap">
              <span className="text-slate-400">Total: <span className="text-slate-700">{mesas.length}</span></span>
              <span className="text-slate-400">Libres: <span className="text-emerald-600">{libres}</span></span>
              <span className="text-slate-400">Ocupadas: <span className="text-[#E11D48]">{ocupadas}</span></span>
            </div>
          )}
        </div>

        {/* ══════════════ GRÁFICO + TABLA CON SELECTOR DE FECHAS ══════════════ */}
        <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border-2 border-slate-100 overflow-hidden">

          {/* Encabezado con selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-xl font-black text-slate-800 uppercase flex items-center gap-2">
                <span className="w-2 h-6 rounded-full bg-[#FACC15]" />
                Ventas por Producto
              </h3>
              {/* Totales rápidos del período */}
              {!cargandoGraf && grafico.length > 0 && (
                <p className="text-xs font-bold text-slate-400 mt-1">
                  {grafico.reduce((s, p) => s + p.ventas, 0)} unidades ·{' '}
                  <span className="text-[#E11D48]">{totalIngresos.toFixed(2)} Bs.</span> en el período
                </p>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
              {/* Botones rápidos */}
              <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
                {([['hoy', 'Hoy'], ['7d', '7 días'], ['30d', '30 días']] as const).map(([k, l]) => (
                  <button key={k} onClick={() => aplicarPeriodo(k)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all
                      ${periodo === k ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    {l}
                  </button>
                ))}
              </div>
              {/* Selector de fechas personalizado */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
                <Calendar size={14} className="text-slate-400 shrink-0" />
                <input type="date" value={desde} max={hasta}
                  onChange={e => { setDesde(e.target.value); setPeriodo('custom'); }}
                  className="text-xs font-bold text-slate-600 bg-transparent outline-none w-32" />
                <span className="text-slate-300 text-xs">→</span>
                <input type="date" value={hasta} min={desde} max={isoHoy()}
                  onChange={e => { setHasta(e.target.value); setPeriodo('custom'); }}
                  className="text-xs font-bold text-slate-600 bg-transparent outline-none w-32" />
              </div>
            </div>
          </div>

          {cargandoGraf ? (
            <div className="h-72 flex items-center justify-center">
              <div className="flex gap-2 text-slate-400 font-bold items-center">
                <RefreshCw size={18} className="animate-spin" /> Cargando datos...
              </div>
            </div>
          ) : grafico.length === 0 ? (
            <div className="h-56 flex flex-col items-center justify-center text-slate-400 font-bold text-center px-8 gap-2">
              <span className="text-5xl">📊</span>
              Sin ventas en el período seleccionado.
              <span className="text-xs opacity-70 font-bold">Cierra algunas comandas para ver datos aquí.</span>
            </div>
          ) : (
            <>
              {/* ── Gráfico de barras doble (unidades izq. + ingresos der.) ── */}
              <div className="h-72 md:h-80 w-full mb-3">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={grafico} barCategoryGap="35%" barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="name" axisLine={false} tickLine={false}
                      tick={{ fill: '#94a3b8', fontWeight: 'bold', fontSize: 10 }}
                      interval={0}
                      angle={grafico.length > 5 ? -30 : 0}
                      textAnchor={grafico.length > 5 ? 'end' : 'middle'}
                      height={grafico.length > 5 ? 52 : 24}
                    />
                    {/* Eje izquierdo: unidades */}
                    <YAxis
                      yAxisId="uds" orientation="left" axisLine={false} tickLine={false}
                      tick={{ fill: '#94a3b8', fontWeight: 'bold', fontSize: 10 }}
                      allowDecimals={false}
                    />
                    {/* Eje derecho: ingresos Bs. */}
                    <YAxis
                      yAxisId="bs" orientation="right" axisLine={false} tickLine={false}
                      tick={{ fill: '#FACC15', fontWeight: 'bold', fontSize: 10 }}
                    />
                    <Tooltip
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '1.2rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.12)', fontSize: 12 }}
                      formatter={(value: number | string, name: string) =>
                        name === 'ventas'
                          ? [`${value} uds.`, 'Unidades vendidas']
                          : [`${Number(value).toFixed(2)} Bs.`, 'Ingresos']
                      }
                    />
                    {/* Barras de unidades — color por producto */}
                    <Bar yAxisId="uds" dataKey="ventas" name="ventas" radius={[8, 8, 0, 0]} maxBarSize={36}>
                      {grafico.map((_, i) => <Cell key={`v-${i}`} fill={COLORES[i % COLORES.length]} />)}
                    </Bar>
                    {/* Barras de ingresos — amarillo semitransparente */}
                    <Bar yAxisId="bs" dataKey="ingresos" name="ingresos" radius={[8, 8, 0, 0]} maxBarSize={36} fill="#FACC15" opacity={0.65} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Leyenda del gráfico */}
              <div className="flex items-center gap-6 justify-center mb-6 text-[11px] font-bold text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-[#E11D48]" /> Unidades (eje izq.)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-[#FACC15]" /> Ingresos Bs. (eje der.)
                </span>
              </div>

              {/* ── Tabla detalle del período ── */}
              <div className="border-t border-slate-100 pt-5">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                  Detalle del período
                </h4>
                <div className="overflow-x-auto rounded-2xl border border-slate-100">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-900 text-white">
                        <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-wider rounded-tl-2xl">Producto</th>
                        <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-wider">Categoría</th>
                        <th className="text-center px-4 py-3 text-[10px] font-black uppercase tracking-wider">Unidades</th>
                        <th className="text-right px-4 py-3 text-[10px] font-black uppercase tracking-wider rounded-tr-2xl">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {grafico.map((p, i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                          <td className="px-4 py-3 font-bold text-slate-800">{p.name}</td>
                          <td className="px-4 py-3 text-slate-400 font-bold text-xs capitalize">{p.categoria ?? '—'}</td>
                          <td className="px-4 py-3 text-center font-black text-slate-700">{p.ventas}</td>
                          <td className="px-4 py-3 text-right font-black text-[#E11D48]">
                            {Number(p.ingresos).toFixed(2)} Bs.
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-slate-200 bg-white">
                        <td colSpan={2} className="px-4 py-3 font-black text-slate-500 text-xs uppercase tracking-wider">
                          Total General
                        </td>
                        <td className="px-4 py-3 text-center font-black text-slate-800 text-base">
                          {grafico.reduce((s, p) => s + p.ventas, 0)}
                        </td>
                        <td className="px-4 py-3 text-right font-black text-[#E11D48] text-base">
                          {totalIngresos.toFixed(2)} Bs.
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Acceso rápido a Cocina */}
        <div className="mt-6 bg-slate-900 text-white p-6 rounded-[2rem] flex items-center justify-between cursor-pointer hover:bg-slate-800 transition-all"
          onClick={() => navigate('/admin/cocina')}>
          <div className="flex items-center gap-4">
            <div className="bg-[#E11D48] p-3 rounded-2xl"><ChefHat size={28} /></div>
            <div>
              <h4 className="font-black text-lg">Dashboard de Cocina</h4>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Ver pedidos pendientes y entregados</p>
            </div>
          </div>
          {kpis.comandasActivasAhora > 0 && (
            <span className="bg-[#FACC15] text-slate-900 font-black text-lg px-5 py-2 rounded-2xl">
              {kpis.comandasActivasAhora} activos
            </span>
          )}
        </div>

      </main>
    </div>
  );
};

export default AdminDashboard;
