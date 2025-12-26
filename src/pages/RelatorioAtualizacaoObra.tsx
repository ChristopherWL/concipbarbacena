import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, User, FileText, Image, Clock, Building2, Printer, MapPin, Phone } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DiarioData {
  id: string;
  data: string;
  clima_manha: string | null;
  atividades_realizadas: string | null;
  materiais_utilizados: string | null;
  ocorrencias: string | null;
  fotos: Array<{ url?: string; path?: string; bucket?: string; description?: string }> | null;
  created_at: string;
  obra: {
    id: string;
    nome: string;
    endereco: string | null;
    cidade: string | null;
    estado: string | null;
    branch_id: string | null;
  } | null;
}

interface BranchData {
  id: string;
  name: string;
  cnpj: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
}

export default function RelatorioAtualizacaoObra() {
  const { diarioId } = useParams<{ diarioId: string }>();
  const navigate = useNavigate();
  const { tenant } = useAuthContext();
  const [diario, setDiario] = useState<DiarioData | null>(null);
  const [branch, setBranch] = useState<BranchData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [signedUrlByPath, setSignedUrlByPath] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchDiario = async () => {
      if (!diarioId || !tenant?.id) return;

      const { data, error } = await supabase
        .from("diario_obras")
        .select(`
          id,
          data,
          clima_manha,
          atividades_realizadas,
          materiais_utilizados,
          ocorrencias,
          fotos,
          created_at,
          branch_id,
          obra:obras(id, nome, endereco, cidade, estado, branch_id)
        `)
        .eq("id", diarioId)
        .eq("tenant_id", tenant.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching diario:", error);
      } else {
        setDiario(data as unknown as DiarioData);

        // Pre-resolve signed URLs for any stored paths (private bucket)
        const fotos = ((data as any)?.fotos || []) as Array<any>;
        const paths = fotos
          .map((f) => (typeof f === "object" ? f?.path : null))
          .filter(Boolean) as string[];

        if (paths.length) {
          const unique = Array.from(new Set(paths));
          const entries = await Promise.all(
            unique.map(async (path) => {
              const { data: signed } = await supabase.storage
                .from("obras-fotos")
                .createSignedUrl(path, 60 * 60 * 24 * 7);
              return [path, signed?.signedUrl] as const;
            })
          );

          setSignedUrlByPath((prev) => {
            const next = { ...prev };
            for (const [path, url] of entries) {
              if (url) next[path] = url;
            }
            return next;
          });
        }
        
        // Fetch branch data
        const branchId = (data as any)?.branch_id || (data as any)?.obra?.branch_id;
        if (branchId) {
          const { data: branchData } = await supabase
            .from("branches")
            .select("id, name, cnpj, address, city, state, phone")
            .eq("id", branchId)
            .maybeSingle();
          
          if (branchData) {
            setBranch(branchData);
          }
        }
      }
      setIsLoading(false);
    };

    fetchDiario();
  }, [diarioId, tenant]);


  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!diario) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto p-6">
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Relatório não encontrado.</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate("/obras")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Obras
            </Button>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const fotos = diario.fotos || [];
  const responsavel = diario.ocorrencias?.replace("Responsável: ", "") || null;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 pt-0 pb-2 sm:px-6 sm:pb-3 space-y-3 print:p-0 print:max-w-none print:bg-white">
        {/* Header com ações */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 print:hidden">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="w-fit">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
        </div>

        {/* Cabeçalho do Relatório - Aparece APENAS na impressão */}
        <div className="hidden print:block mb-4">
          <div className="border border-foreground">
            <div className="flex">
              {/* Logo */}
              <div className="w-32 border-r border-foreground flex items-center justify-center p-3">
                {tenant?.logo_dark_url || tenant?.logo_url ? (
                  <img 
                    src={tenant?.logo_dark_url || tenant?.logo_url} 
                    alt={tenant?.name || "Logo"} 
                    className="max-h-20 object-contain"
                  />
                ) : (
                  <div className="text-xs text-muted-foreground text-center font-medium">
                    LOGO
                  </div>
                )}
              </div>

              {/* Dados da Empresa/Filial */}
              <div className="flex-1 p-3 border-r border-foreground">
                <h2 className="font-bold text-base uppercase">
                  {branch?.name || tenant?.name || "Empresa"}
                </h2>
                {branch?.cnpj && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    CNPJ: {branch.cnpj}
                  </p>
                )}
                {(branch?.address || branch?.city) && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3" />
                    {[branch.address, branch.city, branch.state].filter(Boolean).join(", ")}
                  </p>
                )}
                {branch?.phone && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Phone className="h-3 w-3" />
                    {branch.phone}
                  </p>
                )}
              </div>

              {/* Título e Data */}
              <div className="w-56 p-3 flex flex-col justify-center items-center text-center">
                <h1 className="font-bold text-lg uppercase">Relatório</h1>
                <p className="text-sm text-muted-foreground">Diário de Obra</p>
                <Badge variant="outline" className="mt-2 text-xs">
                  {format(new Date(diario.data), "dd/MM/yyyy", { locale: ptBR })}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Conteúdo do Relatório */}
        <Card className="overflow-hidden print:shadow-none print:border print:border-foreground">
          {/* Título simples - apenas na tela */}
          <div className="border-b bg-primary p-4 print:hidden">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-bold text-lg text-primary-foreground">Relatório - Diário de Obra</h1>
                <p className="text-sm text-primary-foreground/80">
                  {format(new Date(diario.data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
              <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30">
                {format(new Date(diario.data), "dd/MM/yyyy", { locale: ptBR })}
              </Badge>
            </div>
          </div>
          <div className="p-6 space-y-6">
            {/* Informações da Obra */}
            {diario.obra && (
              <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  Obra
                </div>
                <p className="text-lg font-semibold">{diario.obra.nome}</p>
                {(diario.obra.endereco || diario.obra.cidade) && (
                  <p className="text-sm text-muted-foreground">
                    {[diario.obra.endereco, diario.obra.cidade, diario.obra.estado]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                )}
              </div>
            )}

            {/* Grid de Informações */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Etapa */}
              {diario.clima_manha && (
                <div className="bg-card border rounded-lg p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                    <FileText className="h-4 w-4" />
                    Etapa
                  </div>
                  <p className="font-semibold">{diario.clima_manha}</p>
                </div>
              )}

              {/* Responsável */}
              {responsavel && (
                <div className="bg-card border rounded-lg p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                    <User className="h-4 w-4" />
                    Responsável
                  </div>
                  <p className="font-semibold">{responsavel}</p>
                </div>
              )}

              {/* Data/Hora do Registro */}
              <div className="bg-card border rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                  <Clock className="h-4 w-4" />
                  Registrado em
                </div>
                <p className="font-semibold">
                  {format(new Date(diario.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            </div>

            {/* Descrição */}
            {diario.atividades_realizadas && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  Descrição das Atividades
                </div>
                <div className="bg-muted/20 rounded-lg p-4 border">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {diario.atividades_realizadas}
                  </p>
                </div>
              </div>
            )}

            {/* Materiais */}
            {diario.materiais_utilizados && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  Materiais Utilizados
                </div>
                <div className="bg-muted/20 rounded-lg p-4 border">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {diario.materiais_utilizados}
                  </p>
                </div>
              </div>
            )}

            {/* Imagens */}
            {fotos.length > 0 && (
              <div className="space-y-4">
                {/* Fotos normais - grid lado a lado */}
                {fotos.filter(foto => {
                  const fotoUrl = typeof foto === "string" ? foto : (foto?.url || (foto?.path ? signedUrlByPath[foto.path] : undefined));
                  const fotoDesc = typeof foto === "object" ? foto?.description : null;
                  return !(fotoDesc?.toLowerCase().includes("assinatura") || fotoUrl?.includes("assinatura"));
                }).length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Image className="h-4 w-4" />
                      Fotos
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {fotos.filter(foto => {
                        const fotoUrl = typeof foto === "string" ? foto : (foto?.url || (foto?.path ? signedUrlByPath[foto.path] : undefined));
                        const fotoDesc = typeof foto === "object" ? foto?.description : null;
                        return !(fotoDesc?.toLowerCase().includes("assinatura") || fotoUrl?.includes("assinatura"));
                      }).map((foto, index) => {
                        const fotoUrl = typeof foto === "string" ? foto : (foto?.url || (foto?.path ? signedUrlByPath[foto.path] : undefined));
                        const fotoDesc = typeof foto === "object" ? foto?.description : null;
                        return (
                          <div
                            key={index}
                            className="border rounded-lg overflow-hidden bg-card print:break-inside-avoid"
                          >
                            <a
                              href={fotoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block"
                            >
                              <img
                                src={fotoUrl}
                                alt={fotoDesc || `Foto ${index + 1}`}
                                className="w-full h-32 sm:h-40 object-cover bg-muted/30 hover:opacity-90 transition-opacity"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "/placeholder.svg";
                                }}
                              />
                            </a>
                            {fotoDesc && (
                              <div className="p-2 border-t bg-muted/10">
                                <p className="text-xs text-muted-foreground truncate">{fotoDesc}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Assinaturas - largura completa */}
                {fotos.filter(foto => {
                  const fotoUrl = typeof foto === "string" ? foto : (foto?.url || (foto?.path ? signedUrlByPath[foto.path] : undefined));
                  const fotoDesc = typeof foto === "object" ? foto?.description : null;
                  return fotoDesc?.toLowerCase().includes("assinatura") || fotoUrl?.includes("assinatura");
                }).map((foto, index) => {
                  const fotoUrl = typeof foto === "string" ? foto : (foto?.url || (foto?.path ? signedUrlByPath[foto.path] : undefined));
                  return (
                    <div key={`sig-${index}`} className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        Assinatura
                      </div>
                      <div className="border rounded-lg overflow-hidden bg-card p-4 print:break-inside-avoid">
                        <img
                          src={fotoUrl}
                          alt="Assinatura"
                          className="w-full h-auto max-h-48 object-contain bg-muted/20 rounded"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/placeholder.svg";
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

        {/* Footer para impressão */}
        <div className="hidden print:block text-center text-xs text-muted-foreground pt-4 border-t">
          <p>
            Relatório gerado em{" "}
            {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
