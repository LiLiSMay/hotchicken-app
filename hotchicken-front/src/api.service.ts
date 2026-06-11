/**
 * api.service.ts — Servicio centralizado para el frontend HotChicken
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Error de red' }));
    throw new Error(error.message || `Error ${response.status}`);
  }
  return response.json();
}

// ─── Tipos ────────────────────────────────────────────────────────────────────
export interface LoginResponse {
  accessToken: string;
  usuario: {
    id: number;
    nombreCompleto: string;
    username: string;
    rol: 'admin' | 'mesero' | 'cocinero' | 'cajero';
  };
}

export interface Mesa {
  id: number;
  numero: number;
  estado: 'libre' | 'ocupada' | 'reservada';
}

export interface Producto {
  id: number;
  nombre: string;
  categoria: 'plato_principal' | 'guarnicion' | 'bebida' | 'extra';
  precio: number;
}

export interface ItemComandaInput {
  productoId: number;
  cantidad: number;
  guarnicion?: string;
  presa?: string;
  notas?: string;
}

export interface CreateComandaInput {
  tipoPedido: 'mesa' | 'para_llevar' | 'delivery';
  mesaId?: number;
  items: ItemComandaInput[];
  observaciones?: string;
}

export interface DashboardKpis {
  ventasTotalesHoy: number;
  comandasCerradasHoy: number;
  platosVendidosHoy: number;
  comandasActivasAhora: number;
}

export interface GraficoItem {
  name: string;
  ventas: number;
  ingresos: number;
  categoria?: string;
}

// ─── API ──────────────────────────────────────────────────────────────────────
export const api = {
  // AUTH
  login: (body: { username: string; password: string }) =>
    request<LoginResponse>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),

  registrarSolicitud: (body: { nombreCompleto: string; username: string; password: string }) =>
    request<{ mensaje: string; id: number }>('/auth/registro', { method: 'POST', body: JSON.stringify(body) }),

  // MESAS
  getMesas: () => request<Mesa[]>('/mesas'),

  actualizarEstadoMesa: (id: number, estado: Mesa['estado']) =>
    request<Mesa>(`/mesas/${id}/estado`, { method: 'PATCH', body: JSON.stringify({ estado }) }),

  // PRODUCTOS
  getProductos: () => request<Producto[]>('/productos'),

  // COMANDAS
  crearComanda: (body: CreateComandaInput) =>
    request<{ id: number }>('/comandas', { method: 'POST', body: JSON.stringify(body) }),

  getComandasAbiertas: () => request<any[]>('/comandas/abiertas'),

  getEntregadasHoy: () => request<any[]>('/comandas/entregadas-hoy'),

  /** Fallback seguro — sin restricción de rol */
  getVentasHoy: () =>
    request<{ total: number; cantidadComandas: number }>('/comandas/ventas-hoy'),

  actualizarEstadoComanda: (
    id: number,
    estado: 'abierta' | 'en_cocina' | 'entregada' | 'cerrada' | 'cancelada',
  ) =>
    request<any>(`/comandas/${id}/estado`, { method: 'PATCH', body: JSON.stringify({ estado }) }),

  // USUARIOS / EMPLEADOS
  getEmpleados: () => request<any[]>('/users'),
  getSolicitudesPendientes: () => request<any[]>('/users/solicitudes/pendientes'),
  crearEmpleado: (body: any) =>
    request<any>('/users', { method: 'POST', body: JSON.stringify(body) }),
  actualizarEmpleado: (id: number, body: any) =>
    request<any>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  desactivarEmpleado: (id: number) =>
    request<any>(`/users/${id}/desactivar`, { method: 'PATCH' }),
  gestionarSolicitud: (
    id: number,
    body: {
      estadoSolicitud: 'aprobado' | 'rechazado';
      motivoRechazo?: string;
      usernameAsignado?: string;
      passwordAsignada?: string;
    },
  ) =>
    request<any>(`/users/${id}/gestionar-solicitud`, { method: 'PATCH', body: JSON.stringify(body) }),

  // REPORTES
  /** KPIs del día (endpoint sin restricción de rol) */
  getDashboardKpis: () => request<DashboardKpis>('/reportes/dashboard'),

  /**
   * KPIs para rango de fechas personalizado.
   * @param desde  'YYYY-MM-DD'
   * @param hasta  'YYYY-MM-DD'
   */
  getKpisRango: (desde: string, hasta: string) =>
    request<DashboardKpis>(`/reportes/kpis-rango?desde=${desde}&hasta=${hasta}`),

  /**
   * Ventas por producto en rango — para el gráfico con selector de fechas.
   */
  getProductosPorRango: (desde: string, hasta: string) =>
    request<{ data: GraficoItem[] }>(`/reportes/productos-rango?desde=${desde}&hasta=${hasta}`),

  getVentasPorCategoria: (tipo: 'diario' | 'semanal' | 'mensual' = 'diario') =>
    request<{ data: GraficoItem[] }>(`/reportes/categorias?tipo=${tipo}`),

  getInventarioPlatos: (tipo: 'diario' | 'semanal' | 'mensual' = 'diario') =>
    request<any>(`/reportes/inventario-platos?tipo=${tipo}`),
};