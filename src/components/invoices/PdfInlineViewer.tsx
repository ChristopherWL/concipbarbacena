import { Loader2 } from "lucide-react";

type Props = {
  fileUrl: string;
  className?: string;
};

export function PdfInlineViewer({ fileUrl, className }: Props) {
  if (!fileUrl) {
    return (
      <div className={"flex flex-col gap-3 " + (className ?? "")}>
        <div className="flex-1 overflow-auto rounded-lg border bg-muted/30">
          <div className="min-h-[55vh] w-full flex items-center justify-center p-3">
            <div className="text-sm text-muted-foreground">Nenhum PDF selecionado.</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={"flex flex-col gap-3 " + (className ?? "")}>
      <div className="flex-1 overflow-auto rounded-lg border bg-muted/30">
        <div className="min-h-[55vh] w-full flex flex-col p-1">
          <iframe
            src={fileUrl}
            className="w-full h-full min-h-[55vh] rounded-lg bg-white"
            title="Visualização de PDF"
            style={{ border: 'none' }}
          />
        </div>
      </div>
    </div>
  );
}
