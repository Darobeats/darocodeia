import ReactDiffViewer, { DiffMethod } from "react-diff-viewer-continued";
import { Button } from "@/components/ui/button";
import { Check, X, ArrowLeftRight } from "lucide-react";
import { useState } from "react";

interface DiffViewerProps {
  oldCode: string;
  newCode: string;
  fileName: string;
  onAccept: () => void;
  onReject: () => void;
}

export default function DiffViewer({
  oldCode,
  newCode,
  fileName,
  onAccept,
  onReject,
}: DiffViewerProps) {
  const [splitView, setSplitView] = useState(true);

  const customStyles = {
    variables: {
      dark: {
        diffViewerBackground: "#1e1e2e",
        diffViewerColor: "#cdd6f4",
        addedBackground: "#1e3a29",
        addedColor: "#a6e3a1",
        removedBackground: "#3b1f1f",
        removedColor: "#f38ba8",
        wordAddedBackground: "#2d5a3d",
        wordRemovedBackground: "#5c2828",
        addedGutterBackground: "#1e3a29",
        removedGutterBackground: "#3b1f1f",
        gutterBackground: "#181825",
        gutterBackgroundDark: "#11111b",
        highlightBackground: "#313244",
        highlightGutterBackground: "#45475a",
        codeFoldGutterBackground: "#1e1e2e",
        codeFoldBackground: "#181825",
        emptyLineBackground: "#1e1e2e",
        codeFoldContentColor: "#6c7086",
      },
    },
    line: {
      padding: "4px 8px",
      fontSize: "13px",
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    },
    contentText: {
      fontSize: "13px",
      lineHeight: "1.5",
    },
    gutter: {
      minWidth: "40px",
      padding: "0 8px",
    },
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e2e]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <ArrowLeftRight className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">{fileName}</span>
          <span className="text-xs text-muted-foreground">
            (Cambios pendientes)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSplitView(!splitView)}
            className="text-xs"
          >
            {splitView ? "Vista unificada" : "Vista dividida"}
          </Button>
        </div>
      </div>

      {/* Diff Content */}
      <div className="flex-1 overflow-auto">
        <ReactDiffViewer
          oldValue={oldCode}
          newValue={newCode}
          splitView={splitView}
          useDarkTheme={true}
          compareMethod={DiffMethod.WORDS}
          styles={customStyles}
          leftTitle="Versión anterior"
          rightTitle="Nueva versión"
          showDiffOnly={false}
          extraLinesSurroundingDiff={3}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border bg-muted/30">
        <Button
          variant="outline"
          size="sm"
          onClick={onReject}
          className="text-destructive hover:text-destructive"
        >
          <X className="w-4 h-4 mr-2" />
          Rechazar
        </Button>
        <Button size="sm" onClick={onAccept}>
          <Check className="w-4 h-4 mr-2" />
          Aceptar cambios
        </Button>
      </div>
    </div>
  );
}
