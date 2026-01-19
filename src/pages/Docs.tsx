import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import DocsSidebar from "@/components/docs/DocsSidebar";
import DocsSearch from "@/components/docs/DocsSearch";
import DocsContent from "@/components/docs/DocsContent";
import { docSections, DocItem } from "@/data/documentation";

const Docs = () => {
  const { section: urlSection, article: urlArticle } = useParams();
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState(urlSection || "getting-started");
  const [activeItem, setActiveItem] = useState(urlArticle || "introduction");
  const [currentItem, setCurrentItem] = useState<DocItem | null>(null);

  useEffect(() => {
    const section = docSections.find((s) => s.id === activeSection);
    const item = section?.items.find((i) => i.id === activeItem);
    setCurrentItem(item || null);
  }, [activeSection, activeItem]);

  useEffect(() => {
    if (urlSection && urlArticle) {
      setActiveSection(urlSection);
      setActiveItem(urlArticle);
    }
  }, [urlSection, urlArticle]);

  const handleNavigate = (sectionId: string, itemId: string) => {
    setActiveSection(sectionId);
    setActiveItem(itemId);
    navigate(`/docs/${sectionId}/${itemId}`);
  };

  const handleSearchSelect = (item: DocItem) => {
    // Find which section this item belongs to
    const section = docSections.find((s) => s.items.some((i) => i.id === item.id));
    if (section) {
      handleNavigate(section.id, item.id);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Volver</span>
              </Link>
              <div className="h-6 w-px bg-border" />
              <Link to="/" className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">D</span>
                </div>
                <span className="font-bold hidden sm:inline">
                  Daro<span className="text-primary">Code</span>
                </span>
              </Link>
              <span className="text-muted-foreground text-sm hidden sm:inline">/ Docs</span>
            </div>

            <DocsSearch onSelect={handleSearchSelect} />
          </div>
        </div>
      </motion.header>

      {/* Main content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          <DocsSidebar
            activeSection={activeSection}
            activeItem={activeItem}
            onNavigate={handleNavigate}
          />

          <main className="flex-1 min-w-0">
            {currentItem ? (
              <DocsContent item={currentItem} />
            ) : (
              <div className="text-center py-20 text-muted-foreground">
                Selecciona un artículo de la barra lateral
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Docs;
