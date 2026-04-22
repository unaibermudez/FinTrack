# FinTrack

Aplicación fullstack para el seguimiento de portfolios de inversión personal. Permite registrar compras y ventas de activos (acciones, crypto, fondos), consultar precios en tiempo real y visualizar el rendimiento (P&L) de cada portfolio.

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + Vite + TypeScript |
| Backend | Node.js + Express + TypeScript |
| Base de datos | MongoDB + Mongoose |
| Auth | JWT (access token 15min + refresh token 7d httpOnly cookie) |
| Gráficas | Recharts |
| Estado global | Zustand |
| Precios | Alpha Vantage API |
| Deploy | Frontend → Vercel / Backend → Railway / DB → MongoDB Atlas |

---

## Requisitos previos

- Node.js 20+
- MongoDB Atlas (o instancia local)
- API key de [Alpha Vantage](https://www.alphavantage.co/support/#api-key) (gratuita)

---

## Configuración

1. Copia el archivo de ejemplo y rellena las variables:

```bash
cp .env.example server/.env
```

```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/fintrack
JWT_ACCESS_SECRET=<secreto_largo_aleatorio>
JWT_REFRESH_SECRET=<otro_secreto_largo_aleatorio>
ALPHA_VANTAGE_API_KEY=<tu_api_key>
NODE_ENV=development
```

Para el cliente crea `client/.env`:

```env
VITE_API_URL=http://localhost:5000
```

Genera secretos seguros con:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Arrancar en local

### Backend

```bash
cd server
npm install
npm run dev      # tsx watch — recarga automática
```

El servidor arranca en `http://localhost:5000`.

### Frontend

> Pendiente — Fase 3

```bash
cd client
npm install
npm run dev
```

---

## Compilar para producción

```bash
cd server
npm run build    # tsc → dist/
npm start        # node dist/server.js
```

---

## Documentación interactiva (Swagger)

Con el servidor en marcha, abre en el navegador:

```
http://localhost:5000/api/docs
```

La especificación OpenAPI en formato JSON está disponible en `/api/docs.json`.

---

## API REST

### Autenticación

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/register` | Registro de usuario |
| POST | `/api/auth/login` | Login — devuelve `accessToken` + cookie `refreshToken` |
| POST | `/api/auth/refresh` | Renueva el access token usando la cookie |
| POST | `/api/auth/logout` | Invalida el refresh token |

> Las rutas de registro y login tienen rate limiting: máx. 10 intentos / 15 min por IP.

### Portfolios

Todas las rutas requieren `Authorization: Bearer <accessToken>`.

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/portfolios` | Lista los portfolios del usuario |
| POST | `/api/portfolios` | Crea un portfolio |
| GET | `/api/portfolios/:id` | Detalle de un portfolio |
| PUT | `/api/portfolios/:id` | Edita nombre/descripción |
| DELETE | `/api/portfolios/:id` | Elimina el portfolio |

### Transacciones

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/portfolios/:id/transactions` | Lista transacciones del portfolio |
| POST | `/api/portfolios/:id/transactions` | Registra una compra o venta |
| DELETE | `/api/portfolios/:id/transactions/:txId` | Elimina una transacción |

Cuerpo para crear transacción:

```json
{
  "assetSymbol": "AAPL",
  "type": "buy",
  "quantity": 10,
  "priceAtTransaction": 182.50,
  "date": "2024-01-15",
  "notes": "Opcional"
}
```

### Métricas

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/portfolios/:id/performance` | P&L total y por activo |
| GET | `/api/assets/price/:symbol` | Precio actual de un activo |

Respuesta de performance:

```json
{
  "portfolioId": "...",
  "totalValue": 12500.00,
  "totalPl": 1250.00,
  "totalPlPercent": 11.11,
  "holdings": [
    {
      "symbol": "AAPL",
      "quantity": 10,
      "avgCost": 182.5000,
      "currentPrice": 207.50,
      "currentValue": 2075.00,
      "plAbsolute": 250.00,
      "plPercent": 13.70
    }
  ]
}
```

---

## Funcionalidades

- [x] Registro y login con JWT (access + refresh token con rotación)
- [x] Gestión de portfolios (crear, editar, eliminar)
- [x] Registro de transacciones de compra/venta
- [x] Consulta de precios en tiempo real via Alpha Vantage (caché 60s)
- [x] Cálculo de P&L por activo y total del portfolio (coste medio ponderado)
- [ ] Dashboard con gráficas de evolución y distribución (Fase 3)
- [ ] Interfaz web React (Fase 3)
- [ ] Deploy en Vercel + Railway (Fase 4)

---

## Estructura del proyecto

```
fintrack/
├── client/              # Frontend React + Vite (Fase 3)
├── server/              # Backend Node.js + Express
│   ├── src/
│   │   ├── config/      # env.ts, db.ts
│   │   ├── controllers/ # Orquestación HTTP
│   │   ├── middlewares/ # Auth, error handler
│   │   ├── models/      # Esquemas Mongoose
│   │   ├── routes/      # Definición de rutas
│   │   ├── services/    # Lógica de negocio
│   │   ├── types/       # Extensiones de tipos Express
│   │   └── utils/       # ApiError, logger
│   ├── app.ts
│   ├── server.ts
│   └── tsconfig.json
├── .env.example
└── README.md
```
