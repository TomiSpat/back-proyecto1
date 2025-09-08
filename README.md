# Calculadora de IMC - API

API REST para el cálculo del Índice de Masa Corporal (IMC) desarrollada con NestJS.

## Despliegue

La API está desplegada en Render (versión gratuita):

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/tu-usuario/back-proyecto1)

**URL Base de la API:** `https://calculadora-imc.onrender.com`

> **Nota:** En la versión gratuita de Render, la aplicación entra en modo inactivo después de 15 minutos de inactividad. La primera solicitud después de este período puede tardar unos segundos adicionales mientras se reactiva el servicio.

## Características

- Cálculo de IMC (Índice de Masa Corporal)
- Clasificación automática en categorías de peso
- Validación de datos de entrada

## Requisitos

- Node.js (v16 o superior)
- npm o yarn
- TypeScript

## Instalación

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/tu-usuario/back-proyecto1.git
   cd back-proyecto1
   ```

2. Instalar dependencias:
   ```bash
   npm install
   # o
   yarn install
   ```

## Iniciar la aplicación

```bash
# Modo desarrollo
$ npm run start:dev

# Modo producción
$ npm run build
$ npm run start:prod
```

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

