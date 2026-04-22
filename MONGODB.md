# Configurar MongoDB Atlas para FinTrack

Guía paso a paso para crear una base de datos gratuita en MongoDB Atlas y conectarla al proyecto.

---

## 1. Crear cuenta en MongoDB Atlas

1. Ve a [cloud.mongodb.com](https://cloud.mongodb.com) y haz clic en **Try Free**
2. Regístrate con tu email o con Google/GitHub
3. Completa el onboarding (puedes saltar las preguntas opcionales)

---

## 2. Crear un cluster gratuito

1. En el dashboard, haz clic en **Build a Database**
2. Selecciona el plan **M0 (Free)** — 512 MB, suficiente para desarrollo
3. Elige un proveedor (AWS, Google Cloud o Azure) y la región más cercana a ti
4. Pon un nombre al cluster, por ejemplo `fintrack-cluster`
5. Haz clic en **Create Deployment**

---

## 3. Crear usuario de base de datos

Durante la creación del cluster (o en **Database Access** → **Add New Database User**):

1. Método de autenticación: **Password**
2. Username: por ejemplo `fintrack-user`
3. Password: haz clic en **Autogenerate Secure Password** y **copia el resultado**
4. Rol: **Atlas Admin** (o `readWriteAnyDatabase` para más restricción)
5. Haz clic en **Add User**

> Guarda el usuario y contraseña — los necesitarás en el paso 5.

---

## 4. Permitir conexiones desde tu IP

1. Ve a **Network Access** → **Add IP Address**
2. Para desarrollo local: haz clic en **Add Current IP Address**
3. Para producción (Railway): haz clic en **Allow Access from Anywhere** (`0.0.0.0/0`)
4. Haz clic en **Confirm**

---

## 5. Obtener la cadena de conexión

1. Ve a **Database** → haz clic en **Connect** en tu cluster
2. Selecciona **Drivers**
3. En el dropdown de driver elige **Node.js** y versión **6.x o superior**
4. Copia la cadena de conexión. Tendrá este aspecto:

```
mongodb+srv://fintrack-user:<password>@fintrack-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

5. Sustituye `<password>` por la contraseña del paso 3
6. Añade el nombre de la base de datos antes de `?`:

```
mongodb+srv://fintrack-user:TU_PASSWORD@fintrack-cluster.xxxxx.mongodb.net/fintrack?retryWrites=true&w=majority
```

> El nombre `fintrack` al final de la URL es el nombre de la base de datos. MongoDB la crea automáticamente cuando se inserta el primer documento.

---

## 6. Añadir la URI al archivo .env

Abre (o crea) el archivo `server/.env` y pega la URI en la variable `MONGODB_URI`:

```env
PORT=5000
MONGODB_URI=mongodb+srv://fintrack-user:TU_PASSWORD@fintrack-cluster.xxxxx.mongodb.net/fintrack?retryWrites=true&w=majority
JWT_ACCESS_SECRET=cambia_esto_por_un_secreto_largo
JWT_REFRESH_SECRET=cambia_esto_por_otro_secreto_largo
ALPHA_VANTAGE_API_KEY=tu_api_key
NODE_ENV=development
```

---

## 7. Verificar la conexión

Arranca el servidor:

```bash
cd server
npm run dev
```

Si la conexión es correcta verás en la consola:

```
{"level":"info","message":"MongoDB connected","timestamp":"..."}
{"level":"info","message":"Server running on port 5000","timestamp":"..."}
```

Si hay error, los motivos más comunes son:

| Error | Solución |
|-------|----------|
| `Authentication failed` | Contraseña incorrecta en la URI |
| `IP not whitelisted` | Añade tu IP en Network Access |
| `ECONNREFUSED` | Comprueba que la URI empieza por `mongodb+srv://` |
| `querySrv ENOTFOUND` | Sin conexión a internet o DNS bloqueado |

---

## 8. Explorar los datos (opcional)

Para ver los documentos creados en la base de datos:

- **Atlas UI**: en tu cluster haz clic en **Browse Collections**
- **MongoDB Compass** (app de escritorio): descárgala en [mongodb.com/products/compass](https://www.mongodb.com/products/compass) y pega la misma URI de conexión
- **mongosh** (terminal): `mongosh "TU_URI"`

---

## Notas de seguridad

- El archivo `server/.env` está en `.gitignore` — nunca lo subas al repositorio
- Usa contraseñas generadas aleatoriamente, no palabras comunes
- En producción, añade la IP de Railway en Network Access en lugar de `0.0.0.0/0`
