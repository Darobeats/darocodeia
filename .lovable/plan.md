
# Plan de Implementación: Chatbot Inteligente + Sistema de Internacionalización

## Resumen Ejecutivo

Este plan implementa dos funcionalidades clave:
1. **Chatbot Inteligente "Daro Assistant"**: Un asistente conversacional que entiende el contexto de la aplicación y los proyectos públicos
2. **Sistema de Idiomas (i18n)**: Soporte multilingüe con detección automática y cambio manual entre Español e Inglés

---

## Parte 1: Chatbot Inteligente "Daro Assistant"

### Visión del Producto
Un chatbot flotante disponible en toda la aplicación que:
- Responde dudas sobre la plataforma DaroCode
- Explica características y flujos de trabajo
- Proporciona información sobre proyectos públicos del portfolio
- Guía a usuarios nuevos en el onboarding
- Tiene personalidad cercana y profesional

### Arquitectura del Chatbot

```text
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                        │
├─────────────────────────────────────────────────────────────┤
│  ChatWidget (Floating)                                      │
│    ├── ChatButton (trigger)                                 │
│    ├── ChatWindow                                           │
│    │     ├── ChatHeader                                     │
│    │     ├── MessageList                                    │
│    │     │     ├── UserMessage                              │
│    │     │     └── AssistantMessage (con Markdown)          │
│    │     ├── SuggestionChips                                │
│    │     └── ChatInput                                      │
│    └── Context Provider (idioma, proyectos, docs)           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   EDGE FUNCTION: chat-assistant             │
├─────────────────────────────────────────────────────────────┤
│  1. Recibe mensaje + contexto (idioma, página actual)       │
│  2. Construye system prompt con:                            │
│     ├── Documentación de DaroCode                           │
│     ├── Proyectos públicos actuales (de DB)                 │
│     ├── Contexto de navegación                              │
│     └── Idioma del usuario                                  │
│  3. Llama a Lovable AI (streaming)                          │
│  4. Retorna respuesta en tiempo real                        │
└─────────────────────────────────────────────────────────────┘
```

### Componentes a Crear

| Archivo | Descripción |
|---------|-------------|
| `src/components/chat/ChatWidget.tsx` | Widget flotante principal |
| `src/components/chat/ChatWindow.tsx` | Ventana de conversación |
| `src/components/chat/ChatMessage.tsx` | Renderizado de mensajes con Markdown |
| `src/components/chat/ChatInput.tsx` | Input con sugerencias rápidas |
| `src/components/chat/SuggestionChips.tsx` | Chips de preguntas frecuentes |
| `src/hooks/useChatAssistant.ts` | Hook para lógica del chat + streaming |
| `supabase/functions/chat-assistant/index.ts` | Edge function con contexto |

### Flujo de Conversación

1. **Usuario abre el chat** → Saludo personalizado según contexto
2. **Sugerencias iniciales** basadas en la página actual:
   - Landing: "¿Qué es DaroCode?", "Ver proyectos destacados"
   - Docs: "Buscar en documentación", "¿Cómo empezar?"
   - Dashboard: "¿Cómo crear un proyecto?", "Ayuda con GitHub"
3. **Respuestas contextuales** que conocen:
   - Toda la documentación
   - Proyectos públicos con sus tecnologías
   - Flujos de la aplicación

### System Prompt del Chatbot

```text
Eres "Daro", el asistente virtual de DaroCode. Eres amigable, 
profesional y cercano. Tu objetivo es ayudar a los usuarios a:

1. Entender qué es DaroCode y sus características
2. Resolver dudas sobre el uso de la plataforma
3. Proporcionar información sobre proyectos destacados
4. Guiar en el proceso de registro y primeros pasos

CONTEXTO DE LA PLATAFORMA:
{documentación resumida}

PROYECTOS PÚBLICOS ACTUALES:
{lista de proyectos con descripciones}

REGLAS:
- Responde siempre en {idioma del usuario}
- Sé conciso pero completo
- Usa emojis con moderación
- Si no sabes algo, admítelo honestamente
- Sugiere acciones concretas cuando sea apropiado
```

---

## Parte 2: Sistema de Internacionalización (i18n)

### Arquitectura de Idiomas

```text
┌─────────────────────────────────────────────────────────────┐
│                    LanguageContext                          │
├─────────────────────────────────────────────────────────────┤
│  - locale: 'es' | 'en'                                      │
│  - setLocale: (locale) => void                              │
│  - t: (key) => string  // función de traducción             │
│  - detectedFromBrowser: boolean                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│               Archivos de Traducción                        │
├─────────────────────────────────────────────────────────────┤
│  src/i18n/                                                  │
│    ├── locales/                                             │
│    │     ├── es.json   (Español - idioma base)              │
│    │     └── en.json   (English)                            │
│    ├── index.ts        (configuración)                      │
│    └── useTranslation.ts (hook)                             │
└─────────────────────────────────────────────────────────────┘
```

### Detección Automática de Idioma

1. **Al cargar la app**:
   - Verificar `localStorage` para preferencia guardada
   - Si no existe, detectar `navigator.language`
   - Si es `en`, `en-US`, `en-GB` → Inglés
   - Por defecto → Español

2. **Selector de idioma**:
   - Botón en Navbar (bandera + código)
   - Dropdown con opciones: 🇪🇸 Español, 🇬🇧 English
   - Guarda preferencia en localStorage

### Componentes a Modificar para i18n

| Componente | Textos a traducir |
|------------|-------------------|
| `Navbar.tsx` | Menú, botones CTA |
| `Hero.tsx` | Título, subtítulo, estadísticas |
| `Features.tsx` | Títulos y descripciones |
| `Portfolio.tsx` | Encabezados, estados vacíos |
| `Footer.tsx` | Enlaces, copyright |
| `Login.tsx` | Formulario, mensajes |
| `Register.tsx` | Formulario, mensajes |
| Todos los `toast` | Mensajes de éxito/error |

### Estructura de Traducciones

```json
// es.json (ejemplo parcial)
{
  "common": {
    "login": "Iniciar sesión",
    "register": "Empezar gratis",
    "back": "Volver"
  },
  "hero": {
    "badge": "El futuro del desarrollo full-stack",
    "title1": "Tu ecosistema",
    "title2": "completo de desarrollo",
    "subtitle": "Desde la ideación hasta el despliegue..."
  },
  "chat": {
    "title": "Daro Assistant",
    "placeholder": "Escribe tu pregunta...",
    "greeting": "¡Hola! Soy Daro, tu asistente..."
  }
}
```

---

## Orden de Implementación

### Fase 1: Sistema de Idiomas (Base)
1. Crear contexto `LanguageContext`
2. Crear archivos de traducción base (es.json, en.json)
3. Crear hook `useTranslation`
4. Agregar selector de idioma a Navbar
5. Migrar textos de landing page

### Fase 2: Chatbot Backend
1. Crear edge function `chat-assistant`
2. Implementar sistema de prompts con contexto
3. Agregar streaming de respuestas
4. Integrar proyectos públicos como contexto

### Fase 3: Chatbot Frontend
1. Crear componentes del chat widget
2. Implementar hook `useChatAssistant`
3. Agregar soporte de Markdown en respuestas
4. Chips de sugerencias contextuales

### Fase 4: Integración Final
1. Conectar chatbot con sistema de idiomas
2. Migrar resto de textos a i18n
3. Pruebas de flujo completo
4. Ajustes de UX/UI

---

## Dependencias Adicionales

```json
{
  "react-markdown": "^9.0.0"  // Ya instalado como react-syntax-highlighter
}
```

No se requieren dependencias adicionales. Usaremos la implementación nativa de i18n sin librerías externas para mantener el bundle ligero.

---

## Consideraciones Técnicas

### Chatbot
- **Rate limiting**: El chatbot usará Lovable AI con los límites existentes
- **Historial**: Se mantiene en memoria del componente (no persiste entre sesiones)
- **Contexto dinámico**: Los proyectos públicos se cargan de la DB en cada conversación

### i18n
- **Fallback**: Si una clave no existe en inglés, usa español
- **Lazy loading**: Los archivos de traducción se cargan según el idioma seleccionado
- **SEO**: Se mantiene el español como idioma principal (sin cambios en rutas)

---

## Resultado Esperado

1. **Chatbot flotante** visible en todas las páginas con botón en esquina inferior derecha
2. **Selector de idioma** en la navbar que detecta automáticamente el idioma del navegador
3. **Experiencia fluida** donde el chatbot responde en el idioma seleccionado
4. **Contexto inteligente** que conoce la documentación y proyectos publicados
