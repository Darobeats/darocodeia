import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Book, Rocket, Code, Puzzle, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { docSections, DocSection } from "@/data/documentation";
import { Button } from "@/components/ui/button";

interface DocsSidebarProps {
  activeSection: string;
  activeItem: string;
  onNavigate: (sectionId: string, itemId: string) => void;
}

const sectionIcons: Record<string, React.ReactNode> = {
  "getting-started": <Rocket className="w-4 h-4" />,
  guides: <Book className="w-4 h-4" />,
  "api-reference": <Code className="w-4 h-4" />,
  integrations: <Puzzle className="w-4 h-4" />,
};

const DocsSidebar = ({ activeSection, activeItem, onNavigate }: DocsSidebarProps) => {
  const [expandedSections, setExpandedSections] = useState<string[]>(["getting-started"]);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleNavigate = (sectionId: string, itemId: string) => {
    onNavigate(sectionId, itemId);
    setMobileOpen(false);
    if (!expandedSections.includes(sectionId)) {
      setExpandedSections((prev) => [...prev, sectionId]);
    }
  };

  const SidebarContent = () => (
    <div className="space-y-2">
      {docSections.map((section) => (
        <div key={section.id}>
          <button
            onClick={() => toggleSection(section.id)}
            className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary/50 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-2">
              {sectionIcons[section.id]}
              {section.title}
            </div>
            <ChevronRight
              className={cn(
                "w-4 h-4 transition-transform",
                expandedSections.includes(section.id) && "rotate-90"
              )}
            />
          </button>
          <AnimatePresence>
            {expandedSections.includes(section.id) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="ml-6 mt-1 space-y-1 border-l border-border pl-3">
                  {section.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleNavigate(section.id, item.id)}
                      className={cn(
                        "w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors",
                        activeSection === section.id && activeItem === item.id
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"
                      )}
                    >
                      {item.title}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <div className="lg:hidden fixed bottom-4 right-4 z-50">
        <Button
          size="icon"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="w-12 h-12 rounded-full shadow-lg bg-primary text-primary-foreground"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, x: -300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -300 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden fixed inset-0 z-40 bg-background/95 backdrop-blur-sm"
          >
            <div className="p-6 pt-20 h-full overflow-y-auto">
              <SidebarContent />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 sticky top-24 h-[calc(100vh-6rem)] overflow-y-auto pr-4">
        <SidebarContent />
      </aside>
    </>
  );
};

export default DocsSidebar;
