
# Plan: Portfolio Publico en Landing Page

## Resumen

Transformare la pagina principal en un portfolio que muestre los proyectos marcados como publicos por los usuarios, presentados en un carrusel interactivo con animaciones fluidas.

---

## Parte 1: Actualizar Esquema de Base de Datos

### Nueva Migracion SQL

Agregare campos a la tabla `projects` para soportar proyectos publicos:

```sql
ALTER TABLE projects ADD COLUMN is_public BOOLEAN DEFAULT false;
ALTER TABLE projects ADD COLUMN preview_url TEXT;
ALTER TABLE projects ADD COLUMN thumbnail_url TEXT;
ALTER TABLE projects ADD COLUMN technologies TEXT[] DEFAULT '{}';

-- Politica RLS para permitir lectura de proyectos publicos
CREATE POLICY "Public projects are viewable by everyone"
  ON projects FOR SELECT
  USING (is_public = true);
```

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `is_public` | boolean | Si el proyecto es visible en el portfolio |
| `preview_url` | text | URL del sitio desplegado |
| `thumbnail_url` | text | Captura de pantalla del proyecto |
| `technologies` | text[] | Array de tecnologias usadas (React, Tailwind, etc.) |

---

## Parte 2: Nuevo Componente - Carrusel de Portfolio

### Archivo: `src/components/landing/Portfolio.tsx`

Carrusel horizontal interactivo usando Embla Carousel (ya instalado como `embla-carousel-react`):

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           PORTFOLIO                                       │
│                                                                          │
│  Proyectos destacados                                                    │
│  Trabajos realizados por nuestra comunidad                               │
│                                                                          │
│  ◄  ┌─────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐  ►      │
│     │ Card    │ │   Card      │ │    Card     │ │   Card      │          │
│     │ Activa  │ │   Normal    │ │   Normal    │ │   Normal    │          │
│     │ (hover) │ │             │ │             │ │             │          │
│     │         │ │  Proyecto   │ │  Proyecto   │ │  Proyecto   │          │
│     │ [IMG]   │ │    [IMG]    │ │   [IMG]     │ │   [IMG]     │          │
│     │         │ │             │ │             │ │             │          │
│     │ Nombre  │ │   Nombre    │ │  Nombre     │ │   Nombre    │          │
│     │ Desc... │ │   React     │ │  Tailwind   │ │   React     │          │
│     │ [Ver]   │ │             │ │             │ │             │          │
│     └─────────┘ └─────────────┘ └─────────────┘ └─────────────┘          │
│                                                                          │
│                    ○ ○ ● ○ ○  (indicadores)                              │
└──────────────────────────────────────────────────────────────────────────┘
```

### Caracteristicas del Carrusel

- Autoplay suave con pausa al hover
- Navegacion con flechas y drag
- Cards con efecto glassmorphism
- Hover effect: escala + brillo + mostrar boton "Ver proyecto"
- Tecnologias mostradas como badges
- Animaciones con Framer Motion
- Responsive: 1 card en movil, 3-4 en desktop

---

## Parte 3: Hook para Proyectos Publicos

### Archivo: `src/hooks/usePublicProjects.ts`

```typescript
export function usePublicProjects() {
  // Consulta proyectos donde is_public = true
  // Retorna: { projects, loading, error }
}
```

---

## Parte 4: Actualizar Pagina Principal

### Modificar: `src/pages/Index.tsx`

```tsx
import Portfolio from "@/components/landing/Portfolio";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <Portfolio />  {/* Nueva seccion */}
        <Features />
        <Integrations />
        <Workflow />
        <CTA />
      </main>
      <Footer />
    </div>
  );
};
```

---

## Parte 5: Agregar Toggle de Publicacion en Dashboard

### Modificar: Dialogo de Edicion de Proyecto

Agregare campos en `EditProjectDialog.tsx` para que los usuarios puedan:

1. Marcar proyecto como publico (switch)
2. Agregar URL de preview
3. Subir thumbnail (imagen de captura)
4. Seleccionar tecnologias usadas

```
┌─────────────────────────────────────────────────────────────┐
│  Editar proyecto                                      [X]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Nombre *                                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Mi Landing Page                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Descripcion                                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Landing page para startup de fintech               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ─────────────── Visibilidad publica ───────────────        │
│                                                             │
│  Mostrar en portfolio                     [  ●──────]       │
│                                                             │
│  URL del sitio                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ https://mi-landing.lovable.app                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Captura de pantalla                                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  [Subir imagen]  o  [Generar automaticamente]        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Tecnologias                                                │
│  [React] [Tailwind] [TypeScript] [+]                        │
│                                                             │
│              [Cancelar]  [Guardar cambios]                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Parte 6: Estado Vacio Elegante

Cuando no hay proyectos publicos, mostrar un placeholder atractivo:

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           PORTFOLIO                                       │
│                                                                          │
│            ┌─────────────────────────────────────────┐                   │
│            │                                         │                   │
│            │       🚀                                │                   │
│            │                                         │                   │
│            │   Pronto habra proyectos increibles    │                   │
│            │   mostrados aqui                        │                   │
│            │                                         │                   │
│            │   Se el primero en compartir tu trabajo │                   │
│            │                                         │                   │
│            │        [Empezar ahora]                  │                   │
│            │                                         │                   │
│            └─────────────────────────────────────────┘                   │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Resumen de Archivos

### Nuevos Archivos (2)

| Archivo | Descripcion |
|---------|-------------|
| `src/components/landing/Portfolio.tsx` | Carrusel interactivo de proyectos publicos |
| `src/hooks/usePublicProjects.ts` | Hook para obtener proyectos publicos |

### Archivos a Modificar (3)

| Archivo | Cambios |
|---------|---------|
| `src/pages/Index.tsx` | Agregar componente Portfolio |
| `src/components/dashboard/EditProjectDialog.tsx` | Campos para publicar proyecto |
| `src/hooks/useProjects.ts` | Actualizar tipo Project e incluir nuevos campos |

### Migracion SQL (1)

Agregar columnas `is_public`, `preview_url`, `thumbnail_url`, `technologies` y politica RLS.

---

## Flujo de Usuario

```text
Usuario en Dashboard
        │
        ▼
┌───────────────────┐
│ Editar Proyecto   │
│                   │
│ [x] Hacer publico │
│ URL: https://...  │
│ [Subir captura]   │
└───────────────────┘
        │
        ▼
Proyecto aparece en
Landing Page Portfolio
        │
        ▼
┌───────────────────┐
│   Visitante       │
│                   │
│  Ve carrusel con  │
│  proyectos de la  │
│  comunidad        │
└───────────────────┘
```

---

## Seccion Tecnica

### Estructura del Carrusel

El carrusel usa `embla-carousel-react` con estas configuraciones:

```typescript
const [emblaRef, emblaApi] = useEmblaCarousel({
  loop: true,
  align: "start",
  slidesToScroll: 1,
}, [Autoplay({ delay: 4000, stopOnInteraction: false })])
```

### Query de Proyectos Publicos

```typescript
const { data } = await supabase
  .from("projects")
  .select("id, name, description, preview_url, thumbnail_url, technologies, user_id")
  .eq("is_public", true)
  .order("updated_at", { ascending: false })
  .limit(12);
```

### Politica RLS Actualizada

La politica actual solo permite ver proyectos propios. Agregare una politica adicional que permita ver proyectos donde `is_public = true` sin requerir autenticacion.
