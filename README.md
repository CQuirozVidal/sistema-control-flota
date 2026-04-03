# Sistema de Control de Flota

Frontend web para la gestion operativa de flota, con autenticacion por rol, vistas separadas para administradores y conductores, y persistencia mediante Supabase.

[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18-149ECA?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-2.x-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)

## Tabla de contenidos

1. [Descripcion general](#descripcion-general)
2. [Stack tecnologico](#stack-tecnologico)
3. [Estructura de carpetas](#estructura-de-carpetas)
4. [Instalacion paso a paso](#instalacion-paso-a-paso)
5. [Variables de entorno](#variables-de-entorno)
6. [Scripts disponibles](#scripts-disponibles)
7. [Rutas principales](#rutas-principales)
8. [Guia rapida para contribuir](#guia-rapida-para-contribuir)

## Descripcion general

Este proyecto implementa una interfaz para controlar procesos clave de una flota:

- Autenticacion y control de acceso por rol.
- Dashboard y modulos para `admin`.
- Gestion de usuarios y roles para `super_admin`.
- Dashboard y modulos para `conductor`.
- Integracion con Supabase para autenticacion y datos.
- UI moderna basada en componentes reutilizables.

## Stack tecnologico

| Capa | Tecnologia |
|---|---|
| Build tool | Vite |
| Frontend | React 18 + TypeScript |
| Routing | React Router DOM |
| Estado servidor | TanStack Query |
| UI | Tailwind CSS + shadcn/ui + Radix UI |
| Backend as a Service | Supabase |
| Testing | Vitest + Testing Library + Playwright |

## Estructura de carpetas

```text
drivebuddy-hq/
|-- public/                      # Archivos estaticos
|-- src/
|   |-- components/              # Componentes de layout y UI
|   |   |-- ui/                  # Libreria de componentes base (shadcn/ui)
|   |-- contexts/                # Contextos globales (ej: autenticacion)
|   |-- hooks/                   # Custom hooks reutilizables
|   |-- integrations/
|   |   |-- supabase/            # Cliente y tipos de Supabase
|   |-- lib/                     # Utilidades compartidas
|   |-- pages/
|   |   |-- admin/               # Vistas del rol administrador
|   |   |-- conductor/           # Vistas del rol conductor
|   |-- test/                    # Config y tests unitarios
|   |-- App.tsx                  # Definicion principal de rutas
|   |-- main.tsx                 # Punto de entrada
|-- supabase/
|   |-- migrations/              # Migraciones SQL
|-- vite.config.ts               # Configuracion de Vite (puerto 8080)
|-- tailwind.config.ts           # Configuracion de Tailwind
|-- package.json                 # Scripts y dependencias
```

## Instalacion paso a paso

### 1) Clonar repositorio

```bash
git clone https://github.com/CQuirozVidal/sistema-control-flota.git
cd sistema-control-flota
```

### 2) Instalar Node.js

- Recomendado: `Node.js 20 LTS` o superior.
- Verifica instalacion:

```bash
node -v
npm -v
```

### 3) Instalar dependencias

```bash
npm install
```

### 4) Configurar variables de entorno

Crea un archivo `.env` en la raiz del proyecto con:

```env
VITE_SUPABASE_URL=tu_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=tu_supabase_anon_key
```

### 5) Ejecutar el proyecto en desarrollo

```bash
npm run dev
```

El proyecto corre por defecto en:

```text
http://localhost:8080
```

### 6) Ejecutar tests (opcional)

```bash
npm run test
```

## Variables de entorno

| Variable | Descripcion | Requerida |
|---|---|---|
| `VITE_SUPABASE_URL` | URL del proyecto Supabase | Si |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Clave publica (anon) de Supabase | Si |

## Scripts disponibles

| Script | Comando | Descripcion |
|---|---|---|
| Desarrollo | `npm run dev` | Levanta app local en Vite |
| Build prod | `npm run build` | Genera build de produccion |
| Build dev | `npm run build:dev` | Build en modo desarrollo |
| Preview | `npm run preview` | Sirve build local para validacion |
| Lint | `npm run lint` | Analisis estatico de codigo |
| Test | `npm run test` | Ejecuta pruebas unitarias |
| Test watch | `npm run test:watch` | Modo observador de pruebas |

## Rutas principales

| Ruta | Acceso | Descripcion |
|---|---|---|
| `/auth` | Publico | Login/autenticacion |
| `/admin` | Rol `admin` o `super_admin` | Dashboard administrador |
| `/admin/vehicles` | Rol `admin` o `super_admin` | Gestion de vehiculos |
| `/admin/requests` | Rol `admin` o `super_admin` | Gestion de solicitudes |
| `/admin/messages` | Rol `admin` o `super_admin` | Mensajeria |
| `/admin/users` | Rol `super_admin` | Gestion de usuarios y permisos |
| `/conductor` | Rol `conductor` | Dashboard conductor |
| `/conductor/vehicles` | Rol `conductor` | Mis vehiculos |
| `/conductor/documents` | Rol `conductor` | Documentos |
| `/conductor/requests` | Rol `conductor` | Solicitudes |
| `/conductor/mileage` | Rol `conductor` | Kilometraje |
| `/conductor/messages` | Rol `conductor` | Mensajeria |

## Crear primer super admin

1. Registra el usuario normalmente desde `/auth`.
2. En el SQL Editor de Supabase, ejecuta:

```sql
select public.set_user_role_by_email('tu-correo@dominio.com', 'super_admin');
```

3. Cierra sesion e inicia de nuevo para refrescar permisos.

## Guia rapida para contribuir

1. Crea una rama nueva:

```bash
git checkout -b feature/nombre-cambio
```

2. Realiza cambios y valida:

```bash
npm run lint
npm run test
```

3. Commit y push:

```bash
git add .
git commit -m "docs: mejora README"
git push origin feature/nombre-cambio
```
