-- Create project_templates table
CREATE TABLE public.project_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  category TEXT NOT NULL,
  is_premium BOOLEAN DEFAULT false,
  files JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Templates are public for everyone to read
ALTER TABLE public.project_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Templates are publicly readable"
  ON public.project_templates FOR SELECT
  USING (true);

-- Create storage bucket for project assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-assets', 'project-assets', true);

-- Storage policies for project assets
CREATE POLICY "Users can upload project assets"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'project-assets' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can view project assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'project-assets');

CREATE POLICY "Users can delete their project assets"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'project-assets' AND auth.uid() IS NOT NULL);

-- Seed predefined templates
INSERT INTO public.project_templates (name, description, category, thumbnail_url, files) VALUES
(
  'Landing Moderna',
  'Una landing page moderna con hero, features y CTA con diseño glassmorphism',
  'landing',
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop',
  '[
    {"file_path": "src/App.tsx", "language": "typescript", "content": "import { Hero } from \"./components/Hero\";\nimport { Features } from \"./components/Features\";\nimport { CTA } from \"./components/CTA\";\nimport \"./App.css\";\n\nfunction App() {\n  return (\n    <div className=\"min-h-screen bg-gradient-to-br from-background to-secondary\">\n      <Hero />\n      <Features />\n      <CTA />\n    </div>\n  );\n}\n\nexport default App;"},
    {"file_path": "src/components/Hero.tsx", "language": "typescript", "content": "export function Hero() {\n  return (\n    <section className=\"container mx-auto px-4 py-20 text-center\">\n      <h1 className=\"text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent\">\n        Bienvenido a tu proyecto\n      </h1>\n      <p className=\"text-xl text-muted-foreground mb-8 max-w-2xl mx-auto\">\n        Una landing page moderna lista para personalizar\n      </p>\n      <button className=\"px-8 py-3 bg-primary text-primary-foreground rounded-full font-medium hover:opacity-90 transition\">\n        Comenzar ahora\n      </button>\n    </section>\n  );\n}"},
    {"file_path": "src/components/Features.tsx", "language": "typescript", "content": "const features = [\n  { title: \"Rápido\", description: \"Optimizado para velocidad\" },\n  { title: \"Moderno\", description: \"Diseño actualizado\" },\n  { title: \"Responsive\", description: \"Funciona en todos los dispositivos\" }\n];\n\nexport function Features() {\n  return (\n    <section className=\"container mx-auto px-4 py-16\">\n      <div className=\"grid md:grid-cols-3 gap-8\">\n        {features.map((f, i) => (\n          <div key={i} className=\"p-6 rounded-2xl bg-card/50 backdrop-blur border border-border\">\n            <h3 className=\"text-xl font-semibold mb-2\">{f.title}</h3>\n            <p className=\"text-muted-foreground\">{f.description}</p>\n          </div>\n        ))}\n      </div>\n    </section>\n  );\n}"},
    {"file_path": "src/components/CTA.tsx", "language": "typescript", "content": "export function CTA() {\n  return (\n    <section className=\"container mx-auto px-4 py-20 text-center\">\n      <div className=\"p-12 rounded-3xl bg-gradient-to-r from-primary/20 to-purple-500/20 backdrop-blur border border-primary/30\">\n        <h2 className=\"text-3xl font-bold mb-4\">¿Listo para comenzar?</h2>\n        <p className=\"text-muted-foreground mb-6\">Únete a miles de usuarios satisfechos</p>\n        <button className=\"px-8 py-3 bg-primary text-primary-foreground rounded-full font-medium\">\n          Registrarse gratis\n        </button>\n      </div>\n    </section>\n  );\n}"}
  ]'::jsonb
),
(
  'Dashboard Básico',
  'Un dashboard con sidebar, métricas y tabla de datos',
  'dashboard',
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop',
  '[
    {"file_path": "src/App.tsx", "language": "typescript", "content": "import { Sidebar } from \"./components/Sidebar\";\nimport { MetricsGrid } from \"./components/MetricsGrid\";\nimport { DataTable } from \"./components/DataTable\";\nimport \"./App.css\";\n\nfunction App() {\n  return (\n    <div className=\"flex min-h-screen bg-background\">\n      <Sidebar />\n      <main className=\"flex-1 p-8\">\n        <h1 className=\"text-2xl font-bold mb-6\">Dashboard</h1>\n        <MetricsGrid />\n        <DataTable />\n      </main>\n    </div>\n  );\n}\n\nexport default App;"},
    {"file_path": "src/components/Sidebar.tsx", "language": "typescript", "content": "const menuItems = [\"Dashboard\", \"Proyectos\", \"Usuarios\", \"Configuración\"];\n\nexport function Sidebar() {\n  return (\n    <aside className=\"w-64 bg-card border-r border-border p-4\">\n      <h2 className=\"text-xl font-bold mb-6 text-primary\">Mi App</h2>\n      <nav className=\"space-y-2\">\n        {menuItems.map((item, i) => (\n          <a key={i} href=\"#\" className=\"block px-4 py-2 rounded-lg hover:bg-secondary transition\">\n            {item}\n          </a>\n        ))}\n      </nav>\n    </aside>\n  );\n}"},
    {"file_path": "src/components/MetricsGrid.tsx", "language": "typescript", "content": "const metrics = [\n  { label: \"Usuarios\", value: \"1,234\" },\n  { label: \"Ingresos\", value: \"$12,345\" },\n  { label: \"Proyectos\", value: \"56\" },\n  { label: \"Tareas\", value: \"89\" }\n];\n\nexport function MetricsGrid() {\n  return (\n    <div className=\"grid grid-cols-4 gap-4 mb-8\">\n      {metrics.map((m, i) => (\n        <div key={i} className=\"p-4 bg-card rounded-xl border border-border\">\n          <p className=\"text-sm text-muted-foreground\">{m.label}</p>\n          <p className=\"text-2xl font-bold\">{m.value}</p>\n        </div>\n      ))}\n    </div>\n  );\n}"},
    {"file_path": "src/components/DataTable.tsx", "language": "typescript", "content": "const data = [\n  { id: 1, name: \"Proyecto A\", status: \"Activo\", date: \"2024-01-15\" },\n  { id: 2, name: \"Proyecto B\", status: \"Pendiente\", date: \"2024-01-14\" },\n  { id: 3, name: \"Proyecto C\", status: \"Completado\", date: \"2024-01-13\" }\n];\n\nexport function DataTable() {\n  return (\n    <div className=\"bg-card rounded-xl border border-border overflow-hidden\">\n      <table className=\"w-full\">\n        <thead className=\"bg-secondary\">\n          <tr>\n            <th className=\"px-4 py-3 text-left\">Nombre</th>\n            <th className=\"px-4 py-3 text-left\">Estado</th>\n            <th className=\"px-4 py-3 text-left\">Fecha</th>\n          </tr>\n        </thead>\n        <tbody>\n          {data.map((row) => (\n            <tr key={row.id} className=\"border-t border-border\">\n              <td className=\"px-4 py-3\">{row.name}</td>\n              <td className=\"px-4 py-3\">{row.status}</td>\n              <td className=\"px-4 py-3\">{row.date}</td>\n            </tr>\n          ))}\n        </tbody>\n      </table>\n    </div>\n  );\n}"}
  ]'::jsonb
),
(
  'Portfolio Minimalista',
  'Portfolio personal con secciones about, proyectos y contacto',
  'portfolio',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop',
  '[
    {"file_path": "src/App.tsx", "language": "typescript", "content": "import { Header } from \"./components/Header\";\nimport { About } from \"./components/About\";\nimport { Projects } from \"./components/Projects\";\nimport { Contact } from \"./components/Contact\";\nimport \"./App.css\";\n\nfunction App() {\n  return (\n    <div className=\"min-h-screen bg-background\">\n      <Header />\n      <About />\n      <Projects />\n      <Contact />\n    </div>\n  );\n}\n\nexport default App;"},
    {"file_path": "src/components/Header.tsx", "language": "typescript", "content": "export function Header() {\n  return (\n    <header className=\"container mx-auto px-4 py-6 flex justify-between items-center\">\n      <span className=\"text-xl font-bold\">Tu Nombre</span>\n      <nav className=\"space-x-6\">\n        <a href=\"#about\" className=\"hover:text-primary transition\">About</a>\n        <a href=\"#projects\" className=\"hover:text-primary transition\">Proyectos</a>\n        <a href=\"#contact\" className=\"hover:text-primary transition\">Contacto</a>\n      </nav>\n    </header>\n  );\n}"},
    {"file_path": "src/components/About.tsx", "language": "typescript", "content": "export function About() {\n  return (\n    <section id=\"about\" className=\"container mx-auto px-4 py-20\">\n      <h1 className=\"text-5xl font-bold mb-4\">Hola, soy Tu Nombre</h1>\n      <p className=\"text-xl text-muted-foreground max-w-2xl\">\n        Desarrollador apasionado por crear experiencias digitales increíbles.\n      </p>\n    </section>\n  );\n}"},
    {"file_path": "src/components/Projects.tsx", "language": "typescript", "content": "const projects = [\n  { title: \"Proyecto 1\", description: \"Descripción del proyecto\" },\n  { title: \"Proyecto 2\", description: \"Descripción del proyecto\" },\n  { title: \"Proyecto 3\", description: \"Descripción del proyecto\" }\n];\n\nexport function Projects() {\n  return (\n    <section id=\"projects\" className=\"container mx-auto px-4 py-20\">\n      <h2 className=\"text-3xl font-bold mb-8\">Proyectos</h2>\n      <div className=\"grid md:grid-cols-3 gap-6\">\n        {projects.map((p, i) => (\n          <div key={i} className=\"p-6 bg-card rounded-xl border border-border hover:border-primary transition\">\n            <h3 className=\"text-xl font-semibold mb-2\">{p.title}</h3>\n            <p className=\"text-muted-foreground\">{p.description}</p>\n          </div>\n        ))}\n      </div>\n    </section>\n  );\n}"},
    {"file_path": "src/components/Contact.tsx", "language": "typescript", "content": "export function Contact() {\n  return (\n    <section id=\"contact\" className=\"container mx-auto px-4 py-20\">\n      <h2 className=\"text-3xl font-bold mb-8\">Contacto</h2>\n      <p className=\"text-muted-foreground mb-4\">¿Tienes un proyecto en mente?</p>\n      <a href=\"mailto:tu@email.com\" className=\"text-primary hover:underline\">tu@email.com</a>\n    </section>\n  );\n}"}
  ]'::jsonb
),
(
  'Proyecto Vacío',
  'Empieza desde cero con un proyecto limpio',
  'blank',
  NULL,
  '[]'::jsonb
);