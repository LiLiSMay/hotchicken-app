// ─── Roles de usuario ───
export enum RolUsuario {
  ADMIN = 'admin',
  MESERO = 'mesero',
  COCINERO = 'cocinero',
  CAJERO = 'cajero',
}

// ─── Estado de solicitud de registro ───
export enum EstadoSolicitud {
  PENDIENTE = 'pendiente',
  APROBADO = 'aprobado',
  RECHAZADO = 'rechazado',
}

// ─── Estado del usuario/empleado ───
export enum EstadoEmpleado {
  ACTIVO = 'activo',
  INACTIVO = 'inactivo',
}

// ─── Estado de mesa ───
export enum EstadoMesa {
  LIBRE = 'libre',
  OCUPADA = 'ocupada',
  RESERVADA = 'reservada',
}

// ─── Estado de comanda/pedido ───
export enum EstadoComanda {
  ABIERTA = 'abierta',       // Pedido tomado, pendiente de cocina
  EN_COCINA = 'en_cocina',   // Enviado a cocina
  ENTREGADA = 'entregada',   // Platos entregados al cliente
  CERRADA = 'cerrada',       // Cobrada / finalizada
  CANCELADA = 'cancelada',   // Anulada
}

// ─── Tipo de pedido ───
export enum TipoPedido {
  MESA = 'mesa',
  PARA_LLEVAR = 'para_llevar',
  DELIVERY = 'delivery',
}

// ─── Categorías de producto ───
export enum CategoriaProducto {
  PLATO_PRINCIPAL = 'plato_principal',
  GUARNICION = 'guarnicion',
  BEBIDA = 'bebida',
  EXTRA = 'extra',
}

// ─── Tipo de reporte ───
export enum TipoReporte {
  DIARIO = 'diario',
  SEMANAL = 'semanal',
  MENSUAL = 'mensual',
}
