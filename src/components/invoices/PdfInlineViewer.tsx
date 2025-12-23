import { useEffect, useMemo, useState, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, RotateCw } from "lucide-react";

// Keep worker version in sync with react-pdf's bundled pdf.js
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type Props = {
  fileUrl: string;
  className?: string;
};

export function PdfInlineViewer({ fileUrl, className }: Props) {
  const [numPages, setNumPages] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [rotate, setRotate] = useState<number>(0);
  const [isReady, setIsReady] = useState(false);
  const mountedRef = useRef(true);

  // Reset state when fileUrl changes
  useEffect(() => {
    mountedRef.current = true;
    setIsReady(false);
    setNumPages(0);
    setPage(1);
    setRotate(0);

    // Small delay to ensure previous document is cleaned up
    const timer = setTimeout(() => {
      if (mountedRef.current) {
        setIsReady(true);
      }
    }, 100);

    return () => {
      mountedRef.current = false;
      clearTimeout(timer);
    };
  }, [fileUrl]);

  const canPrev = page > 1;
  const canNext = numPages > 0 && page < numPages;

  const pageLabel = useMemo(() => {
    if (!numPages) return "—";
    return `${page} / ${numPages}`;
  }, [page, numPages]);

  const handleLoadSuccess = (info: { numPages: number }) => {
    if (mountedRef.current) {
      setNumPages(info.numPages);
      setPage((p) => Math.min(Math.max(1, p), info.numPages));
    }
  };

  if (!isReady) {
    return (
      <div className={"flex flex-col gap-3 " + (className ?? "")}>
        <div className="flex-1 overflow-auto rounded-lg border bg-muted/30">
          <div className="min-h-[55vh] w-full flex items-center justify-center p-3">
            <div className="text-sm text-muted-foreground">Carregando PDF...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={"flex flex-col gap-3 " + (className ?? "")}>
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm text-muted-foreground">Página {pageLabel}</div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!canPrev}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!canNext}
            onClick={() => setPage((p) => Math.min(numPages, p + 1))}
            className="gap-1"
          >
            Próxima
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setRotate((r) => (r + 90) % 360)}
            title="Girar"
          >
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto rounded-lg border bg-muted/30">
        <div className="min-h-[55vh] w-full flex items-center justify-center p-3">
          <Document
            key={fileUrl}
            file={fileUrl}
            options={{
              wasmUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/wasm/`,
            }}
            onLoadSuccess={handleLoadSuccess}
            loading={<div className="text-sm text-muted-foreground">Carregando PDF...</div>}
            error={<div className="text-sm text-destructive">Não foi possível abrir o PDF.</div>}
            noData={<div className="text-sm text-muted-foreground">Nenhum PDF selecionado.</div>}
          >
            <Page
              pageNumber={page}
              rotate={rotate}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              className="shadow-sm"
            />
          </Document>
        </div>
      </div>
    </div>
  );
}
