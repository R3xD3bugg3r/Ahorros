# FinanzasEnPareja 💑

App web progresiva (PWA) para control financiero compartido de pareja. Detecta "gastos hormiga", muestra el balance del hogar en tiempo real y funciona offline.

## Stack Tecnológico
- **Next.js 14** (App Router)
- **Supabase** (PostgreSQL + Autenticación)
- **Tailwind CSS** + componentes propios
- **Recharts** (gráficos)
- **Vercel** (deploy)

---

## Setup Local

### 1. Clonar e instalar
```bash
git clone <tu-repo>
cd finanzas-en-pareja
npm install
```

### 2. Configurar Supabase
1. Crear un proyecto en [supabase.com](https://supabase.com)
2. Ir a **SQL Editor** y ejecutar el contenido de `supabase/schema.sql`
3. Copiar la **Project URL** y la **anon/public key** desde *Project Settings → API*

### 3. Variables de entorno
Crear un archivo `.env.local` en la raíz:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxxxxxxxxxx
```

### 4. Correr localmente
```bash
npm run dev
```
Abrir [http://localhost:3000](http://localhost:3000)

---

## Deploy en Vercel (1 click)

1. Subir el proyecto a un repositorio GitHub.
2. Ir a [vercel.com/new](https://vercel.com/new) y *Import Git Repository*.
3. Agregar las variables de entorno (mismas que `.env.local`).
4. Click en **Deploy**.

---

## Instalar como APK con PWABuilder

Una vez desplegado en Vercel:
1. Ir a [pwabuilder.com](https://www.pwabuilder.com)
2. Pegar la URL del deploy (ej: `https://tu-app.vercel.app`)
3. Click en **Package for stores** → Elegir **Android**
4. Descargar el APK y firmarlo (PWABuilder lo hace automáticamente)
5. Compartir el APK con tu pareja por WhatsApp para instalarlo

---

## Vincular a tu pareja

1. El primer usuario crea la cuenta → automáticamente se crea un **Hogar**
2. Va a *Perfil* → copia el **Household ID**
3. La pareja se registra y pega ese código en el campo "Código de hogar"
4. Ambos verán exactamente los mismos datos 🎉

---

## Estructura del Proyecto

```
app/
  page.tsx              # Login
  dashboard/
    page.tsx            # Dashboard principal
    historial/page.tsx  # Historial de transacciones
    hormiga/page.tsx    # Detector de gasto hormiga
    perfil/page.tsx     # Perfil y configuración
  api/
    transactions/       # CRUD de transacciones
    summary/            # Balance mensual
    gasto-hormiga/      # Algoritmo de detección
    categories/         # Categorías
components/
  auth/                 # Formulario de login
  layout/               # BottomNav
  dashboard/            # Vista principal
  transactions/         # Modal de carga rápida
  historial/            # Lista con filtros
  hormiga/              # Vista gasto hormiga
  profile/              # Perfil de usuario
lib/
  supabase/             # Clientes SSR
  types.ts              # Tipos TypeScript
supabase/
  schema.sql            # Tablas + RLS + Seed data
public/
  manifest.json         # PWA manifest
  sw.js                 # Service Worker (offline)
```
