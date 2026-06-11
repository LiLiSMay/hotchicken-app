# 🍗 HotChicken Backend — NestJS REST API

Sistema de Gestión de Comandas y Control de Ventas para Restaurante HotChicken.

---

## 🏗️ Arquitectura del Proyecto

```
hotchicken-backend/
├── src/
│   ├── main.ts                    # Bootstrap, Swagger, CORS, ValidationPipe
│   ├── app.module.ts              # Módulo raíz, TypeORM, ConfigModule
│   │
│   ├── common/                    # Utilidades compartidas
│   │   ├── enums/index.ts         # Todos los enums del sistema
│   │   ├── interfaces/            # JwtPayload, AuthenticatedRequest
│   │   ├── decorators/            # @CurrentUser, @Roles, @Public
│   │   └── guards/                # JwtAuthGuard, RolesGuard
│   │
│   ├── auth/                      # Autenticación JWT
│   │   ├── auth.controller.ts     # POST /auth/login, POST /auth/registro
│   │   ├── auth.service.ts
│   │   ├── auth.module.ts
│   │   ├── dto/auth.dto.ts
│   │   └── strategies/jwt.strategy.ts
│   │
│   ├── users/                     # Gestión de empleados
│   │   ├── usuario.entity.ts      # Entidad con estadoSolicitud
│   │   ├── users.controller.ts    # CRUD + aprobar/rechazar solicitudes
│   │   ├── users.service.ts       # Lógica de negocio + eliminación lógica
│   │   ├── users.module.ts
│   │   └── dto/usuario.dto.ts
│   │
│   ├── mesas/                     # Control de estado de mesas
│   │   ├── mesa.entity.ts
│   │   ├── mesas.controller.ts
│   │   ├── mesas.service.ts
│   │   └── mesas.module.ts
│   │
│   ├── productos/                 # Catálogo del menú
│   │   ├── producto.entity.ts
│   │   ├── productos.controller.ts
│   │   ├── productos.service.ts   # Incluye seed del menú HotChicken
│   │   ├── productos.module.ts
│   │   └── dto/producto.dto.ts
│   │
│   ├── comandas/                  # Pedidos y comandas
│   │   ├── comanda.entity.ts
│   │   ├── item-comanda.entity.ts
│   │   ├── comandas.controller.ts
│   │   ├── comandas.service.ts    # Lógica: crear pedido, flujo de estados
│   │   ├── comandas.module.ts
│   │   └── dto/comanda.dto.ts
│   │
│   └── reportes/                  # Estadísticas y reportes
│       ├── reportes.controller.ts # Dashboard KPIs, ventas, categorías
│       ├── reportes.service.ts    # Queries analíticas con TypeORM
│       └── reportes.module.ts
│
├── .env.example                   # Variables de entorno (copiar a .env)
├── nest-cli.json
├── tsconfig.json
└── package.json
```

---

## 🚀 Instalación y Arranque

### 1. Prerrequisitos
- Node.js >= 18
- PostgreSQL >= 14
- npm o yarn

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
```bash
cp .env.example .env
# Editar .env con tus datos de PostgreSQL
```

### 4. Crear la base de datos en PostgreSQL
```sql
CREATE DATABASE hotchicken_db;
```

### 5. Arrancar en modo desarrollo
```bash
npm run start:dev
```

> Las tablas se crean automáticamente con `DB_SYNCHRONIZE=true`.
> En producción cambiar a `false` y usar migraciones.

---

## 📚 Documentación de la API

Una vez corriendo, accede a Swagger en:
```
http://localhost:3000/api/docs
```

---

## 🔐 Flujo de Autenticación y Registro

### Flujo del mesero nuevo:
```
1. POST /api/v1/auth/registro     → El mesero llena el formulario
                                     Queda con estadoSolicitud: "pendiente"

2. PATCH /api/v1/users/:id/gestionar-solicitud
   Body: { estadoSolicitud: "aprobado",
           usernameAsignado: "jperez_01",  // opcional
           passwordAsignada: "Pass1234" }  // opcional
                                     El admin aprueba desde su panel

3. POST /api/v1/auth/login         → El mesero ya puede iniciar sesión
   Body: { username, password }
   Response: { accessToken: "eyJ...", usuario: {...} }
```

### Usar el token en el frontend:
```javascript
// Guardar en localStorage
localStorage.setItem('token', response.accessToken);

// Enviar en cada request protegido
headers: { Authorization: `Bearer ${token}` }
```

---

## 📋 Endpoints Principales

### Auth (públicos, sin token)
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/v1/auth/login` | Iniciar sesión |
| POST | `/api/v1/auth/registro` | Solicitar registro (mesero nuevo) |

### Users (requieren rol ADMIN)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/users` | Listar empleados aprobados |
| GET | `/api/v1/users/solicitudes/pendientes` | Ver solicitudes pendientes |
| POST | `/api/v1/users` | Crear empleado directo |
| PATCH | `/api/v1/users/:id/gestionar-solicitud` | Aprobar o rechazar |
| PATCH | `/api/v1/users/:id/desactivar` | Eliminación lógica |

### Mesas (requieren token)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/mesas` | Estado de todas las mesas |
| PATCH | `/api/v1/mesas/:id/estado` | Cambiar estado (libre/ocupada) |
| POST | `/api/v1/mesas/inicializar` | Crear mesas del 1 al N |

### Comandas (requieren token)
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/v1/comandas` | Nueva comanda (mesa/para llevar/delivery) |
| GET | `/api/v1/comandas/abiertas` | Comandas activas |
| GET | `/api/v1/comandas/entregadas-hoy` | Historial del turno |
| GET | `/api/v1/comandas/ventas-hoy` | Total del día |
| PATCH | `/api/v1/comandas/:id/estado` | Avanzar estado de comanda |

### Productos (requieren token)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/productos` | Menú completo |
| GET | `/api/v1/productos/categoria/:cat` | Filtrar por categoría |
| POST | `/api/v1/productos/seed` | Cargar menú inicial HotChicken |

### Reportes (requieren rol ADMIN)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/reportes/dashboard` | KPIs en tiempo real |
| GET | `/api/v1/reportes/ventas?tipo=diario` | Ventas por período |
| GET | `/api/v1/reportes/categorias?tipo=semanal` | Data para gráfico recharts |
| GET | `/api/v1/reportes/inventario-platos?tipo=mensual` | Reporte exportable |

---

## 🗄️ Modelo de Datos

### Estados de Comanda (flujo)
```
ABIERTA → EN_COCINA → ENTREGADA → CERRADA
                                ↘ CANCELADA
```

### Roles de Usuario
- `admin` — Acceso total
- `mesero` — Dashboard de mesas + crear comandas
- `cocinero` — Vista de cocina
- `cajero` — Cobro y cierre de comandas

### EstadoSolicitud (flujo de registro)
```
PENDIENTE → APROBADO   (admin aprueba, mesero puede hacer login)
          → RECHAZADO  (admin rechaza, con motivo)
```

---

## 🔌 Conexión desde el Frontend React

### Reemplazar las llamadas mock en Login.tsx:
```typescript
// Antes (mock):
if (usuario.toLowerCase() === 'admin') navigate('/admin');

// Después (conectado al backend):
const response = await fetch('http://localhost:3000/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password }),
});
const data = await response.json();
if (data.accessToken) {
  localStorage.setItem('token', data.accessToken);
  localStorage.setItem('user', JSON.stringify(data.usuario));
  data.usuario.rol === 'admin' ? navigate('/admin') : navigate('/dashboard');
}
```

### Reemplazar el alert en Register.tsx:
```typescript
// Antes (mock):
alert("¡Solicitud enviada! El administrador revisará tu cuenta.");

// Después (conectado al backend):
await fetch('http://localhost:3000/api/v1/auth/registro', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ nombreCompleto, username, password }),
});
navigate('/');
```

---

## ⚙️ Próximos pasos sugeridos

1. **Conectar el frontend**: Reemplazar los `alert()` y datos mock con llamadas `fetch` al backend
2. **Crear un servicio axios** en React con el token JWT en el header
3. **Panel de solicitudes pendientes** en AdminDashboard consumiendo `GET /users/solicitudes/pendientes`
4. **Vista de cocina** consumiendo `GET /comandas/abiertas` con polling o WebSockets
5. **Exportar PDF** del reporte consumiendo `GET /reportes/inventario-platos`
6. **Migraciones** para producción (`DB_SYNCHRONIZE=false`)
