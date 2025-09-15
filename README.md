# Calculadora de IMC - API (NestJS)

API REST para el cálculo del Índice de Masa Corporal (IMC) desarrollada con NestJS.

---

## Despliegue

La API está desplegada en Render (plan gratuito):

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/tu-usuario/back-proyecto1)

**URL Base de la API:** `https://calculadora-imc.onrender.com`

> **Nota:** En el plan gratuito de Render, el servicio “duerme” tras ~15 min sin tráfico.  
> La **primera** request luego de ese tiempo puede tardar un poco más.

---

## Características

- Cálculo de IMC (Índice de Masa Corporal)
- Clasificación automática en categorías de peso
- Validación de datos de entrada con pipes/DTOs

---

## Requisitos

- Node.js (v16 o superior)
- **Yarn** (v1.x)

> **Este proyecto usa únicamente Yarn.**  
> Si intentás instalar con npm/pnpm, la instalación fallará (ver sección *Forzar uso de Yarn*).

---

## Instalación

1. Clonar el repo:
   ```bash
   git clone https://github.com/tu-usuario/back-proyecto1.git
   cd back-proyecto1
2. Instalar dependencias:
   ```bash
   yarn install
3. Crear el archivo .env en la raíz (ver sección  Configuración .env).

---

## Iniciar la aplicación
 ```bash
# Desarrollo (hot-reload)
yarn start:dev

# Build de producción
yarn build

# Producción (requiere build previo)
yarn start:prod
```
Si desplegás en Render, las variables del .env se cargan desde el panel del servicio.

---


## Documentación de la API

### Calcular IMC

**Endpoint:** `POST /imc/calcular`

**Body (JSON):**
```json
{
  "altura": 1.75,
  "peso": 70
}
```

**Respuesta exitosa (200 OK):**
```json
{
  "imc": 22.86,
  "categoria": "Normal"
}
```

**Validaciones:**
- `altura`: Número mayor a 0.1 (en metros)
- `peso`: Número mayor o igual a 1 (en kilogramos)

---

## Documentación de la API

Crea un archivo .env en la raíz del proyecto. No lo subas al repo. Ejemplo:
 
 ```bash
# Puerto donde corre tu API Nest
PORT=3001

# Orígenes permitidos para CORS (separa por coma)
CORS_ORIGIN=https://front-proyecto1.vercel.app,http://localhost:5173,http://localhost:3000

# PostgreSQL
DB_HOST=dpg-d314a4mmcj7s7381elr0-a.ohio-postgres.render.com
DB_PORT=5432
DB_USERNAME=<tu_usuario>
DB_PASSWORD=<tu_password>
DB_DATABASE=programacionavanzada
DB_SCHEMA=public

# Flags de base de datos
DB_SSL=true      # true si tu proveedor exige SSL (Render/Railway/Supabase/Heroku)
DB_SYNC=true     # SOLO desarrollo (auto-sincroniza entidades). En producción: false
```

¿Qué hace cada variable?

PORT: puerto HTTP en el que arranca Nest (3001 por defecto).
CORS_ORIGIN: lista de orígenes permitidos para el frontend.
DB_HOST / DB_PORT: host y puerto de Postgres.
DB_USERNAME / DB_PASSWORD: credenciales de Postgres.
DB_DATABASE: nombre de la base de datos.
DB_SCHEMA: schema donde se crean las tablas (por defecto public).
DB_SSL: si es true, Nest/TypeORM se conecta con SSL (muchos providers lo exigen).
DB_SYNC: si es true, TypeORM sincroniza entidades automáticamente.
Úsalo solo en dev. En prod: false y manejá cambios con migrations.

---




















