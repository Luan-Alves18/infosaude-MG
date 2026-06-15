import { Accessibility, Contrast, Link2, Minus, MousePointer2, Plus, RotateCcw, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { useAccessibility } from "@/hooks/useAccessibility";

type Variant = "topbar" | "ghost";

export const AccessibilityMenu = ({ variant = "topbar" }: { variant?: Variant }) => {
  const a11y = useAccessibility();

  const trigger =
    variant === "topbar" ? (
      <button
        className="hover:underline flex items-center gap-1"
        aria-label="Abrir menu de acessibilidade"
      >
        <Accessibility className="h-3 w-3" /> Acessibilidade
      </button>
    ) : (
      <Button variant="ghost" size="sm" className="gap-1.5">
        <Accessibility className="h-4 w-4" /> Acessibilidade
      </Button>
    );

  const fontLabel =
    a11y.fontSize === "base" ? "Normal" : a11y.fontSize === "lg" ? "Grande" : "Maior";

  return (
    <Popover>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-0 text-foreground">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Accessibility className="h-4 w-4 text-primary" /> Acessibilidade
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Ajustes salvos no seu navegador.
          </p>
        </div>
        <div className="p-3 space-y-3">
          {/* Fonte */}
          <div className="rounded-md border border-border p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium flex items-center gap-1.5">
                <Type className="h-3.5 w-3.5 text-primary" /> Tamanho da fonte
              </span>
              <span className="text-[11px] text-muted-foreground uppercase">{fontLabel}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1"
                onClick={() =>
                  a11y.setFontSize(a11y.fontSize === "xl" ? "lg" : a11y.fontSize === "lg" ? "base" : "base")
                }
                disabled={a11y.fontSize === "base"}
                aria-label="Diminuir tamanho da fonte"
              >
                <Minus className="h-3 w-3" /> A
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1"
                onClick={() =>
                  a11y.setFontSize(a11y.fontSize === "base" ? "lg" : a11y.fontSize === "lg" ? "xl" : "xl")
                }
                disabled={a11y.fontSize === "xl"}
                aria-label="Aumentar tamanho da fonte"
              >
                <Plus className="h-3 w-3" /> A
              </Button>
            </div>
          </div>

          <Toggle
            icon={<Contrast className="h-3.5 w-3.5 text-primary" />}
            label="Alto contraste"
            description="Texto amarelo sobre fundo preto"
            checked={a11y.highContrast}
            onCheckedChange={a11y.toggleContrast}
          />
          <Toggle
            icon={<Link2 className="h-3.5 w-3.5 text-primary" />}
            label="Sublinhar links"
            description="Destaca todos os links da página"
            checked={a11y.underlineLinks}
            onCheckedChange={a11y.toggleUnderlineLinks}
          />
          <Toggle
            icon={<MousePointer2 className="h-3.5 w-3.5 text-primary" />}
            label="Reduzir animações"
            description="Desativa transições e movimentos"
            checked={a11y.reduceMotion}
            onCheckedChange={a11y.toggleReduceMotion}
          />

          <Button
            variant="ghost"
            size="sm"
            onClick={a11y.reset}
            className="w-full gap-1.5 text-muted-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Restaurar padrões
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

const Toggle = ({
  icon,
  label,
  description,
  checked,
  onCheckedChange,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: () => void;
}) => (
  <div className="flex items-start justify-between gap-3 rounded-md border border-border p-3">
    <div className="min-w-0">
      <div className="text-xs font-medium flex items-center gap-1.5">
        {icon} {label}
      </div>
      <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{description}</p>
    </div>
    <Switch checked={checked} onCheckedChange={onCheckedChange} aria-label={label} />
  </div>
);
