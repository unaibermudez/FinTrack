# CLAUDE.md — FinTrack

Contexto del proyecto para Claude Code. Lee este archivo antes de cualquier acción.

---

## Descripción del proyecto

**FinTrack** es una app fullstack de seguimiento de portfolio de inversiones personal.
Los usuarios pueden registrarse, crear portfolios, registrar transacciones de activos (acciones, crypto, fondos) y visualizar su rendimiento con gráficas.

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + Vite |
| Backend | Node.js + Express |
| Base de datos | MongoDB + Mongoose |
| Auth | JWT (access token + refresh token) + bcrypt |
| Gráficas | Recharts |
| Estado global | Zustand |
| API externa | Alpha Vantage (precios de activos en tiempo real) |
| Deploy | Frontend → Vercel / Backend → Railway / DB → MongoDB Atlas |
| CI/CD | GitHub Actions |

---

## Estructura de carpetas

```
fintrack/
├── client/                         # Frontend React
│   ├── public/
│   └── src/
│       ├── api/                    # Llamadas axios al backend
│       ├── components/             # Componentes reutilizables
│       │   ├── ui/                 # Componentes base (Button, Input, Card...)
│       │   └── charts/             # Componentes de gráficas
│       ├── pages/                  # Vistas principales
│       │   ├── Login.jsx
│       │   ├── Register.jsx
│       │   ├── Dashboard.jsx
│       │   ├── Portfolio.jsx
│       │   └── Transactions.jsx
│       ├── store/                  # Zustand stores
│       ├── hooks/                  # Custom hooks
│       ├── utils/                  # Helpers (formatCurrency, formatDate...)
│       └── App.jsx
│
├── server/                         # Backend Node.js
│   ├── src/
│   │   ├── config/                 # Configuración (db, env, constants)
│   │   ├── controllers/            # Lógica de cada endpoint
│   │   ├── middlewares/            # Auth, error handling, rate limiting
│   │   ├── models/                 # Esquemas Mongoose
│   │   ├── routes/                 # Definición de rutas
│   │   ├── services/               # Lógica de negocio (cálculos P&L, llamadas Alpha Vantage)
│   │   └── utils/                  # Helpers del servidor
│   ├── app.js                      # Setup Express
│   └── server.js                   # Entry point
│
├── .env.example
├── .gitignore
└── CLAUDE.md
```

---

## Modelos de datos (Mongoose)

### User
```js
{
  email: String (unique, required),
  password: String (hashed, required),
  name: String,
  refreshToken: String,
  createdAt: Date
}
```

### Portfolio
```js
{
  userId: ObjectId (ref: User),
  name: String,
  description: String,
  createdAt: Date
}
```

### Asset
```js
{
  symbol: String (e.g. "AAPL", "BTC"),
  name: String,
  type: enum ['stock', 'crypto', 'fund']
}
```

### Transaction
```js
{
  portfolioId: ObjectId (ref: Portfolio),
  assetSymbol: String,
  type: enum ['buy', 'sell'],
  quantity: Number,
  priceAtTransaction: Number,
  date: Date,
  notes: String
}
```

---

## Endpoints REST

### Auth
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | /api/auth/register | Registro |
| POST | /api/auth/login | Login, devuelve access + refresh token |
| POST | /api/auth/refresh | Renueva access token |
| POST | /api/auth/logout | Invalida refresh token |

### Portfolios
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /api/portfolios | Lista portfolios del usuario |
| POST | /api/portfolios | Crea portfolio |
| GET | /api/portfolios/:id | Detalle de un portfolio |
| PUT | /api/portfolios/:id | Edita portfolio |
| DELETE | /api/portfolios/:id | Elimina portfolio |

### Transacciones
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /api/portfolios/:id/transactions | Lista transacciones |
| POST | /api/portfolios/:id/transactions | Registra transacción |
| DELETE | /api/portfolios/:id/transactions/:txId | Elimina transacción |

### Métricas
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /api/portfolios/:id/performance | P&L, rentabilidad % por activo |
| GET | /api/assets/price/:symbol | Precio actual de un activo |

---

## Convenciones de código

### General
- Nombrado en **camelCase** para variables y funciones
- Nombrado en **PascalCase** para componentes React y clases
- Archivos de componentes en `.jsx`, resto en `.js`
- Sin `console.log` en producción; usar un logger (winston o pino) en el servidor

### Backend
- Toda la lógica de negocio va en `/services`, los controllers solo orquestan
- Errores siempre lanzados con clases de error personalizadas (ApiError) y capturados por el middleware global de errores
- Variables de entorno accedidas solo desde `/config/env.js`, nunca directamente con `process.env` disperso
- Rutas agrupadas por recurso en archivos separados

### Frontend
- Un componente por archivo
- Custom hooks para lógica reutilizable (usePortfolio, useAuth...)
- Las llamadas a la API centralizadas en `/api`, nunca fetch/axios directo desde componentes
- Zustand solo para estado global (usuario autenticado, portfolio activo); estado local con useState

### Seguridad
- Access token: expiración 15 minutos
- Refresh token: expiración 7 días, guardado en httpOnly cookie
- Contraseñas hasheadas con bcrypt (saltRounds: 12)
- Rate limiting en rutas de auth (máx. 10 intentos/15min por IP)
- Variables sensibles nunca en el repositorio; usar `.env`

---

## Variables de entorno necesarias

```
# Server
PORT=5000
MONGODB_URI=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
ALPHA_VANTAGE_API_KEY=

# Client
VITE_API_URL=http://localhost:5000
```

---

## Fases del proyecto

- **Fase 1** — Setup monorepo, conexión MongoDB, modelos, auth completa (registro/login/JWT/refresh)
- **Fase 2** — CRUD portfolios y transacciones, integración Alpha Vantage, cálculo P&L
- **Fase 3** — Frontend: dashboard, gráficas Recharts, formularios, rutas protegidas
- **Fase 4** — Deploy (Vercel + Railway + Atlas), GitHub Actions, README

---

## Lo que NO hacer

- No usar `var`, solo `const` y `let`
- No mutar el estado de Zustand directamente, siempre mediante actions
- No guardar el access token en localStorage; usar memoria (variable en Zustand) y el refresh token en cookie httpOnly
- No mezclar lógica de negocio en los modelos Mongoose; los modelos son solo esquemas
- No hacer llamadas a Alpha Vantage desde el frontend; siempre a través del backend para proteger la API key