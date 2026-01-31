import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, ExternalLink, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { usePublicProjects, PublicProject } from "@/hooks/usePublicProjects";
import { Link } from "react-router-dom";

const ProjectCard = ({ project, isActive }: { project: PublicProject; isActive: boolean }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className="relative h-[380px] rounded-2xl overflow-hidden bg-card/50 backdrop-blur-sm border border-border/50 group cursor-pointer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -5 }}
      transition={{ duration: 0.3 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Thumbnail */}
      <div className="relative h-48 overflow-hidden bg-muted">
        {project.thumbnail_url ? (
          <img
            src={project.thumbnail_url}
            alt={project.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
            <Rocket className="w-12 h-12 text-muted-foreground/50" />
          </div>
        )}
        
        {/* Overlay on hover */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/50 to-transparent flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {project.preview_url && (
            <Button
              variant="secondary"
              size="sm"
              className="gap-2"
              asChild
            >
              <a href={project.preview_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" />
                Ver proyecto
              </a>
            </Button>
          )}
        </motion.div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-3">
        <h3 className="font-semibold text-lg text-foreground line-clamp-1">
          {project.name}
        </h3>
        
        <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
          {project.description || "Sin descripción"}
        </p>

        {/* Technologies */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {project.technologies?.slice(0, 4).map((tech) => (
            <Badge
              key={tech}
              variant="secondary"
              className="text-xs px-2 py-0.5 bg-secondary/50"
            >
              {tech}
            </Badge>
          ))}
          {project.technologies && project.technologies.length > 4 && (
            <Badge variant="outline" className="text-xs px-2 py-0.5">
              +{project.technologies.length - 4}
            </Badge>
          )}
        </div>
      </div>

      {/* Glow effect on hover */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        style={{
          boxShadow: "inset 0 0 30px rgba(var(--primary), 0.1)",
        }}
      />
    </motion.div>
  );
};

const EmptyState = () => (
  <motion.div
    className="flex flex-col items-center justify-center py-16 px-4 text-center"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
  >
    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
      <Rocket className="w-10 h-10 text-primary" />
    </div>
    <h3 className="text-xl font-semibold text-foreground mb-2">
      Pronto habrá proyectos increíbles aquí
    </h3>
    <p className="text-muted-foreground mb-6 max-w-md">
      Sé el primero en compartir tu trabajo con la comunidad
    </p>
    <Button asChild>
      <Link to="/register">Empezar ahora</Link>
    </Button>
  </motion.div>
);

const LoadingSkeleton = () => (
  <div className="flex gap-6 px-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="min-w-[320px]">
        <Skeleton className="h-48 w-full rounded-t-2xl" />
        <div className="p-5 space-y-3 bg-card/50 rounded-b-2xl border border-t-0 border-border/50">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-10 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-14" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

const Portfolio = () => {
  const { projects, loading, error } = usePublicProjects();
  const [selectedIndex, setSelectedIndex] = useState(0);

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      align: "start",
      slidesToScroll: 1,
      containScroll: "trimSnaps",
    },
    [Autoplay({ delay: 4000, stopOnInteraction: true, stopOnMouseEnter: true })]
  );

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <section className="py-20 bg-gradient-to-b from-background to-secondary/10 overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Badge variant="outline" className="mb-4">
            Portfolio
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Proyectos Destacados
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Descubre los trabajos realizados por nuestra comunidad de desarrolladores
          </p>
        </motion.div>

        {/* Content */}
        {loading ? (
          <LoadingSkeleton />
        ) : error ? (
          <div className="text-center text-destructive py-8">
            Error al cargar proyectos
          </div>
        ) : projects.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="relative">
            {/* Carousel */}
            <div className="overflow-hidden" ref={emblaRef}>
              <div className="flex gap-6 pl-4">
                {projects.map((project, index) => (
                  <div
                    key={project.id}
                    className="flex-none w-[320px] md:w-[350px]"
                  >
                    <ProjectCard
                      project={project}
                      isActive={index === selectedIndex}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Buttons */}
            {projects.length > 1 && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-background/80 backdrop-blur-sm hidden md:flex"
                  onClick={scrollPrev}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-background/80 backdrop-blur-sm hidden md:flex"
                  onClick={scrollNext}
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </>
            )}

            {/* Dots Indicator */}
            {projects.length > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                {projects.map((_, index) => (
                  <button
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === selectedIndex
                        ? "w-6 bg-primary"
                        : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                    }`}
                    onClick={() => emblaApi?.scrollTo(index)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default Portfolio;
