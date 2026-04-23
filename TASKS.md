# FinTrack — Task Tracker

## GRUPO 1 — Completitud mínima

| # | Feature | Complejidad | Estado |
|---|---------|-------------|--------|
| 1 | Portfolio Edit UI | S | ✅ Hecho |
| 2 | Mobile Navigation (hamburger) | S | ✅ Hecho |
| 3 | Search / Filter / Sort en Transacciones | M | ✅ Hecho |
| 4 | Dashboard Summary Bar (valor total, P&L agregado) | M | ✅ Hecho |
| 5 | Activar portfolioStore + eliminar fetches duplicados | S | ✅ Hecho |

## GRUPO 2 — Features que diferencian

| # | Feature | Complejidad | Estado |
|---|---------|-------------|--------|
| 6 | Realized P&L + Tax Report | L | ⬜ Pendiente |
| 7 | Watchlist | M | ⬜ Pendiente |
| 8 | Benchmarking vs. Índice (SPY / QQQ) | M | ⬜ Pendiente |
| 9 | Dividend Tracking | M | ✅ Hecho |
| 10 | Price Alerts | L | ⬜ Pendiente |

## GRUPO 3 — Polish

| # | Feature | Complejidad | Estado |
|---|---------|-------------|--------|
| 11 | Holdings table sort (client-side) | S | ⬜ Pendiente |
| 12 | Multi-currency support | M | ⬜ Pendiente |
| 13 | Transaction notes expand + tags | S | ⬜ Pendiente |
| 14 | Export to PDF | S/M | ⬜ Pendiente |
| 15 | Onboarding / Empty states mejorados | S | ⬜ Pendiente |

---

## Notas de implementación

- **#5** wiring en Portfolio.tsx + Transactions.tsx
- **#4** requiere nuevo endpoint `GET /portfolios/summary` en backend
- **#6** lógica FIFO en performanceService.ts es el punto más complejo
- **#7** activa el modelo Asset que existe en DB sin usar
- **#8** usa `yahooFinance.historical()` + normalización a 100 desde la primera transacción
