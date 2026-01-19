export interface DocSection {
  id: string;
  title: string;
  icon?: string;
  items: DocItem[];
}

export interface DocItem {
  id: string;
  title: string;
  content: string;
  code?: {
    language: string;
    code: string;
  }[];
}

export const docSections: DocSection[] = [
  {
    id: "getting-started",
    title: "Inicio Rápido",
    items: [
      {
        id: "introduction",
        title: "Introducción",
        content: `
# Bienvenido a DaroCode

DaroCode es un ecosistema completo de desarrollo full-stack que integra todas las etapas del ciclo de desarrollo de software, desde la ideación hasta el despliegue y mantenimiento.

## ¿Qué puedes hacer con DaroCode?

- **Desarrollo Frontend**: Conecta con Figma, usa plantillas React/Vue/Angular
- **Backend Completo**: AWS, Google Cloud, Azure integrados
- **Bases de Datos**: PostgreSQL, MySQL, MongoDB visuales
- **DevOps**: CI/CD, monitoring, alertas automáticas

## Características principales

1. Panel de control unificado
2. Integraciones nativas con +50 herramientas
3. IA asistente para generación de código
4. Despliegue en un clic
        `,
        code: [
          {
            language: "bash",
            code: `# Instalar DaroCode CLI
npm install -g darocode-cli

# Iniciar un nuevo proyecto
darocode init my-project

# Abrir el dashboard
darocode open`,
          },
        ],
      },
      {
        id: "installation",
        title: "Instalación",
        content: `
# Instalación

## Requisitos previos

- Node.js 18 o superior
- npm o yarn
- Git

## Instalación global

Instala DaroCode CLI globalmente para acceder a todas las funcionalidades desde la terminal.
        `,
        code: [
          {
            language: "bash",
            code: `# Con npm
npm install -g darocode-cli

# Con yarn
yarn global add darocode-cli

# Verificar instalación
darocode --version`,
          },
        ],
      },
      {
        id: "first-project",
        title: "Tu Primer Proyecto",
        content: `
# Tu Primer Proyecto

Vamos a crear tu primer proyecto con DaroCode en menos de 5 minutos.

## Paso 1: Inicializar el proyecto

Usa el comando \`init\` para crear un nuevo proyecto con la estructura base.

## Paso 2: Configurar integraciones

Conecta las herramientas que necesitas desde el dashboard.

## Paso 3: Desarrollar

¡Comienza a construir con todas las herramientas integradas!
        `,
        code: [
          {
            language: "typescript",
            code: `// src/index.ts
import { DaroCode } from '@darocode/core';

const app = new DaroCode({
  name: 'my-app',
  database: 'postgresql',
  auth: ['google', 'github'],
});

app.start();`,
          },
          {
            language: "json",
            code: `{
  "name": "my-app",
  "version": "1.0.0",
  "darocode": {
    "database": "postgresql",
    "hosting": "vercel",
    "monitoring": true
  }
}`,
          },
        ],
      },
    ],
  },
  {
    id: "guides",
    title: "Guías",
    items: [
      {
        id: "frontend-integration",
        title: "Integración Frontend",
        content: `
# Integración Frontend

DaroCode se integra perfectamente con los principales frameworks de frontend.

## Frameworks soportados

- React / Next.js
- Vue / Nuxt
- Angular
- Svelte / SvelteKit

## Conexión con Figma

Importa componentes directamente desde tus diseños de Figma.
        `,
        code: [
          {
            language: "typescript",
            code: `// Importar componente desde Figma
import { Button } from '@darocode/figma/my-design';

export function App() {
  return (
    <div>
      <Button variant="primary">
        Click me
      </Button>
    </div>
  );
}`,
          },
        ],
      },
      {
        id: "backend-setup",
        title: "Configuración Backend",
        content: `
# Configuración Backend

Configura tu backend en minutos con nuestras integraciones nativas.

## Proveedores soportados

- AWS (Lambda, EC2, RDS)
- Google Cloud (Cloud Functions, Cloud SQL)
- Azure (Functions, Cosmos DB)
- DigitalOcean

## API Designer

Diseña tus APIs visualmente con nuestro editor OpenAPI integrado.
        `,
        code: [
          {
            language: "typescript",
            code: `// darocode.config.ts
export default {
  backend: {
    provider: 'aws',
    region: 'us-east-1',
    services: {
      api: {
        type: 'lambda',
        runtime: 'nodejs18.x',
      },
      database: {
        type: 'rds',
        engine: 'postgresql',
      },
    },
  },
};`,
          },
        ],
      },
      {
        id: "deployment",
        title: "Despliegue",
        content: `
# Despliegue

Despliega tu aplicación con un solo comando o desde el dashboard.

## Plataformas de despliegue

- Vercel
- Netlify
- AWS Amplify
- Railway
- Fly.io

## Despliegue automático

Configura despliegues automáticos con cada push a tu rama principal.
        `,
        code: [
          {
            language: "bash",
            code: `# Desplegar a producción
darocode deploy --production

# Desplegar a staging
darocode deploy --staging

# Ver logs de despliegue
darocode logs --follow`,
          },
          {
            language: "yaml",
            code: `# .darocode/deploy.yml
production:
  platform: vercel
  branch: main
  auto_deploy: true
  
staging:
  platform: vercel
  branch: develop
  auto_deploy: true`,
          },
        ],
      },
    ],
  },
  {
    id: "api-reference",
    title: "API Reference",
    items: [
      {
        id: "core-api",
        title: "Core API",
        content: `
# Core API

La API principal de DaroCode para interactuar con tu proyecto programáticamente.

## Inicialización

Importa y configura el cliente de DaroCode.

## Métodos principales

- \`init()\` - Inicializa el proyecto
- \`connect()\` - Conecta con servicios externos
- \`deploy()\` - Despliega la aplicación
- \`monitor()\` - Accede a métricas en tiempo real
        `,
        code: [
          {
            language: "typescript",
            code: `import { DaroCode } from '@darocode/sdk';

// Inicializar cliente
const daro = new DaroCode({
  apiKey: process.env.DAROCODE_API_KEY,
  projectId: 'my-project-id',
});

// Obtener información del proyecto
const project = await daro.project.get();

// Listar despliegues
const deployments = await daro.deployments.list({
  limit: 10,
  status: 'success',
});

// Crear nuevo despliegue
const deployment = await daro.deployments.create({
  branch: 'main',
  environment: 'production',
});`,
          },
        ],
      },
      {
        id: "database-api",
        title: "Database API",
        content: `
# Database API

Interactúa con tu base de datos de forma type-safe.

## Query Builder

Usa nuestro query builder para consultas seguras y eficientes.

## Migraciones

Gestiona el esquema de tu base de datos con migraciones versionadas.
        `,
        code: [
          {
            language: "typescript",
            code: `import { db } from '@darocode/database';

// Consulta simple
const users = await db
  .from('users')
  .select('*')
  .where('active', true)
  .limit(10);

// Insertar datos
const newUser = await db
  .from('users')
  .insert({
    name: 'John Doe',
    email: 'john@example.com',
  })
  .returning('*');

// Transacciones
await db.transaction(async (tx) => {
  const user = await tx.from('users').insert({ name: 'Jane' });
  await tx.from('profiles').insert({ user_id: user.id });
});`,
          },
        ],
      },
      {
        id: "auth-api",
        title: "Auth API",
        content: `
# Auth API

Sistema de autenticación completo con múltiples proveedores.

## Proveedores soportados

- Email/Password
- Google
- GitHub
- Twitter/X
- Apple

## Sesiones y tokens

Gestión automática de sesiones y refresh tokens.
        `,
        code: [
          {
            language: "typescript",
            code: `import { auth } from '@darocode/auth';

// Login con email
const { user, session } = await auth.signIn({
  email: 'user@example.com',
  password: 'secure-password',
});

// Login con OAuth
await auth.signInWithOAuth({
  provider: 'google',
  redirectTo: '/dashboard',
});

// Obtener usuario actual
const currentUser = await auth.getUser();

// Cerrar sesión
await auth.signOut();`,
          },
        ],
      },
    ],
  },
  {
    id: "integrations",
    title: "Integraciones",
    items: [
      {
        id: "figma",
        title: "Figma",
        content: `
# Integración con Figma

Sincroniza tus diseños de Figma directamente con tu código.

## Características

- Importación automática de componentes
- Sincronización bidireccional
- Detección de cambios en tiempo real
- Generación de código React/Vue

## Configuración

Conecta tu cuenta de Figma desde el dashboard de DaroCode.
        `,
        code: [
          {
            language: "typescript",
            code: `// darocode.config.ts
export default {
  integrations: {
    figma: {
      accessToken: process.env.FIGMA_TOKEN,
      files: ['file-id-1', 'file-id-2'],
      outputDir: 'src/components/figma',
      framework: 'react',
    },
  },
};`,
          },
        ],
      },
      {
        id: "stripe",
        title: "Stripe",
        content: `
# Integración con Stripe

Añade pagos a tu aplicación con nuestra integración de Stripe.

## Características

- Checkout pre-construido
- Suscripciones
- Webhooks automáticos
- Portal de cliente

## Implementación

La integración maneja automáticamente la configuración de webhooks y la sincronización de productos.
        `,
        code: [
          {
            language: "typescript",
            code: `import { payments } from '@darocode/stripe';

// Crear sesión de checkout
const session = await payments.checkout.create({
  priceId: 'price_xxx',
  successUrl: '/success',
  cancelUrl: '/cancel',
});

// Crear suscripción
const subscription = await payments.subscriptions.create({
  customerId: 'cus_xxx',
  priceId: 'price_xxx',
});

// Webhook handler (automático)
// DaroCode maneja los webhooks automáticamente`,
          },
        ],
      },
    ],
  },
];

export const searchDocs = (query: string): DocItem[] => {
  const lowercaseQuery = query.toLowerCase();
  const results: DocItem[] = [];

  docSections.forEach((section) => {
    section.items.forEach((item) => {
      if (
        item.title.toLowerCase().includes(lowercaseQuery) ||
        item.content.toLowerCase().includes(lowercaseQuery)
      ) {
        results.push(item);
      }
    });
  });

  return results;
};
