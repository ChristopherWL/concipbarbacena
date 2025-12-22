import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Trash2, Calendar, MapPin, User, Clock, Loader2, FileText, Upload, X, ChevronRight, Image, ArrowLeft, ListChecks } from "lucide-react";
import { useObras, useDiarioObras, Obra, DiarioObra } from "@/hooks/useObras";
import { ObraEtapasPanel } from "@/components/obras/ObraEtapasPanel";
import { ObraFormDialog } from "@/components/obras/ObraFormDialog";
import { useObraEtapas } from "@/hooks/useObraEtapas";
import { useEmployees } from "@/hooks/useEmployees";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { SignatureCanvas } from "@/components/stock/SignatureCanvas";
import { SignatureModal } from "@/components/ui/signature-modal";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { useDirectorBranch } from "@/contexts/DirectorBranchContext";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileFormWizard, WizardStep } from "@/components/ui/mobile-form-wizard";

const Obras = () => {
  const { tenant, user } = useAuthContext();
  const { isReadOnly } = useDirectorBranch();
  const tenantId = tenant?.id;
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isUpdatesListDialogOpen, setIsUpdatesListDialogOpen] = useState(false);
  const [isDiarioDetailDialogOpen, setIsDiarioDetailDialogOpen] = useState(false);
  const [selectedObra, setSelectedObra] = useState<Obra | null>(null);
  const [selectedDiario, setSelectedDiario] = useState<DiarioObra | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSelectingFile, setIsSelectingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastFilePickerAtRef = useRef<number>(0);
  const allowCloseUpdateDialogRef = useRef<boolean>(false);

  const markFilePickerActivity = () => {
    lastFilePickerAtRef.current = Date.now();
  };

  // Mark activity when the user leaves the page (switches tabs, opens camera, etc.)
  // This prevents the dialog from closing when the user returns.
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden" && isUpdateDialogOpen) {
        // User left while the update dialog was open; mark activity to protect it
        markFilePickerActivity();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [isUpdateDialogOpen]);

  // If the user opens the camera/gallery and comes back without selecting,
  // some browsers won't fire onChange. Reset on window focus.
  useEffect(() => {
    const onFocus = () => {
      if (isSelectingFile) window.setTimeout(() => setIsSelectingFile(false), 250);
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [isSelectingFile]);
  
  // Update form state
  const [updateForm, setUpdateForm] = useState({
    etapa: "",
    data: new Date().toISOString().split('T')[0],
    responsavel: "",
    descricao: "",
    assinatura: null as string | null,
  });

  // Image state: upload immediately so camera photos persist even if the browser reloads
  const [uploadedPhotos, setUploadedPhotos] = useState<
    { url: string; path: string; description: string }[]
  >([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [imageDescriptions, setImageDescriptions] = useState<string[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  // Mobile wizard step (persisted with draft so it doesn't jump back after camera)
  const [updateWizardStep, setUpdateWizardStep] = useState(0);
  const [showSignatureModal, setShowSignatureModal] = useState(false);

  // Legacy: keep for type compatibility, but we no longer depend on it for uploads
  const [selectedImages, setSelectedImages] = useState<File[]>([]);

  const queryClient = useQueryClient();
  const { obras, isLoading, createObra, updateObra, deleteObra } = useObras();
  const { diarios, isLoading: isDiariosLoading } = useDiarioObras(selectedObra?.id);
  const { employees } = useEmployees();
  const isMobile = useIsMobile();

  const UPDATE_DRAFT_KEY = "obras:updateDraft";

  const clearUpdateDraft = () => {
    try {
      sessionStorage.removeItem(UPDATE_DRAFT_KEY);
    } catch {
      // ignore
    }
  };

  const saveUpdateDraft = (payload: {
    obraId: string;
    updateForm: typeof updateForm;
    photos: { url: string; path: string; description: string }[];
    wizardStep: number;
  }) => {
    try {
      sessionStorage.setItem(
        UPDATE_DRAFT_KEY,
        JSON.stringify({ ...payload, savedAt: Date.now() }),
      );
    } catch {
      // ignore
    }
  };

  // Persist the update dialog so if the browser reloads when switching tabs/camera,
  // the user doesn't lose what was already filled (including uploaded photo URLs).
  useEffect(() => {
    if (!isUpdateDialogOpen || !selectedObra) return;
    saveUpdateDraft({
      obraId: selectedObra.id,
      updateForm,
      photos: uploadedPhotos,
      wizardStep: updateWizardStep,
    });
  }, [
    isUpdateDialogOpen,
    selectedObra?.id,
    updateForm.etapa,
    updateForm.data,
    updateForm.responsavel,
    updateForm.descricao,
    updateForm.assinatura,
    uploadedPhotos,
    updateWizardStep,
  ]);

  const [pendingDraftObraId, setPendingDraftObraId] = useState<string | null>(null);

  // Restore draft (up to 10 minutes). Important: on mobile, returning from camera
  // can reload the tab. We re-open the dialog immediately, then bind selectedObra
  // once obras are available.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(UPDATE_DRAFT_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        obraId: string;
        updateForm: typeof updateForm;
        photos?: { url: string; path: string; description: string }[];
        wizardStep?: number;
        savedAt: number;
      };

      if (!parsed?.obraId || !parsed?.savedAt) return;
      if (Date.now() - parsed.savedAt > 600000) {
        clearUpdateDraft();
        return;
      }

      const photos = Array.isArray(parsed.photos) ? parsed.photos : [];
      const wizardStep = typeof parsed.wizardStep === "number" ? parsed.wizardStep : 0;

      setPendingDraftObraId(parsed.obraId);
      setUpdateForm(parsed.updateForm);
      setUploadedPhotos(photos);
      setImagePreviewUrls(photos.map((p) => p.url));
      setImageDescriptions(photos.map((p) => p.description || ""));
      setUpdateWizardStep(wizardStep);

      // Open immediately; selectedObra will be resolved in the effect below
      setIsUpdateDialogOpen(true);
    } catch {
      // ignore
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!pendingDraftObraId) return;
    if (!obras?.length) return;

    const obra = obras.find((o) => o.id === pendingDraftObraId);
    if (!obra) return;

    setSelectedObra(obra);
    setPendingDraftObraId(null);
  }, [pendingDraftObraId, obras]);

  const getStatusBadge = (status: Obra['status']) => {
    const statusConfig = {
      planejada: { label: 'Planejada', className: 'bg-gray-500' },
      em_andamento: { label: 'Em Andamento', className: 'bg-blue-500' },
      pausada: { label: 'Pausada', className: 'bg-yellow-500' },
      concluida: { label: 'Concluída', className: 'bg-green-500' },
      cancelada: { label: 'Cancelada', className: 'bg-red-500' }
    };
    const config = statusConfig[status];
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const handleCreateObraWithEtapas = async (
    obraData: Partial<Obra>, 
    etapas: { nome: string; descricao: string; percentual_peso: number; data_inicio_prevista: string; data_fim_prevista: string }[]
  ) => {
    try {
      const novaObra = await createObra.mutateAsync(obraData);
      
      // Create etapas for the new obra
      if (etapas.length > 0 && novaObra?.id && tenantId) {
        for (let i = 0; i < etapas.length; i++) {
          const etapa = etapas[i];
          await supabase.from("obra_etapas").insert({
            tenant_id: tenantId,
            obra_id: novaObra.id,
            nome: etapa.nome,
            descricao: etapa.descricao || null,
            percentual_peso: etapa.percentual_peso || 0,
            data_inicio_prevista: etapa.data_inicio_prevista || null,
            data_fim_prevista: etapa.data_fim_prevista || null,
            ordem: i,
            status: 'pendente',
          });
        }
      }
      
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error creating obra with etapas:', error);
    }
  };

  const handleDeleteObra = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Tem certeza que deseja excluir esta obra?")) {
      await deleteObra.mutateAsync(id);
    }
  };

  const handleOpenUpdatesList = (obra: Obra) => {
    setSelectedObra(obra);
    setIsUpdatesListDialogOpen(true);
  };

  const handleOpenUpdateDialog = (obra: Obra, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedObra(obra);
    const freshForm = {
      etapa: "",
      data: new Date().toISOString().split('T')[0],
      responsavel: "",
      descricao: "",
      assinatura: null as string | null,
    };
    setUpdateForm(freshForm);
    setSelectedImages([]);
    setUploadedPhotos([]);
    setImagePreviewUrls([]);
    setImageDescriptions([]);
    setUpdateWizardStep(0);
    // Save draft immediately so a quick tab/app switch doesn't lose state
    saveUpdateDraft({ obraId: obra.id, updateForm: freshForm, photos: [], wizardStep: 0 });
    setIsUpdateDialogOpen(true);
  };

  const navigate = useNavigate();

  const handleOpenDiarioDetail = (diario: DiarioObra) => {
    navigate(`/obras/relatorio/${diario.id}`);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    markFilePickerActivity();

    const files = Array.from(e.target.files || []);
    // Reset the input value to allow selecting the same file again
    e.target.value = "";
    setIsSelectingFile(false);

    if (!files.length) return;
    if (!tenantId || !selectedObra) {
      toast({
        title: "Erro",
        description: "Selecione uma obra antes de adicionar imagens.",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingImages(true);

    (async () => {
      try {
        for (const file of files) {
          const fileExt = (file.name.split(".").pop() || "jpg").toLowerCase();
          const safeExt = fileExt.length <= 5 ? fileExt : "jpg";
          const fileName = `${tenantId}/${selectedObra.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${safeExt}`;

          const { error: uploadError } = await supabase.storage
            .from("obras-fotos")
            .upload(fileName, file, {
              contentType: file.type || "image/jpeg",
              upsert: true,
            });

          if (uploadError) {
            console.error("Upload error:", uploadError);
            toast({
              title: "Erro",
              description: "Não foi possível salvar a imagem.",
              variant: "destructive",
            });
            continue;
          }

          const {
            data: { publicUrl },
          } = supabase.storage.from("obras-fotos").getPublicUrl(fileName);

          setUploadedPhotos((prev) => [...prev, { url: publicUrl, path: fileName, description: "" }]);
          setImagePreviewUrls((prev) => [...prev, publicUrl]);
          setImageDescriptions((prev) => [...prev, ""]);
        }
      } finally {
        setIsUploadingImages(false);
      }
    })();
  };

  const handleFileInputClick = () => {
    markFilePickerActivity();
    setIsSelectingFile(true);
    fileInputRef.current?.click();
  };

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    setUploadedPhotos((prev) => prev.filter((_, i) => i !== index));
    setImagePreviewUrls((prev) => prev.filter((_, i) => i !== index));
    setImageDescriptions((prev) => prev.filter((_, i) => i !== index));
  };

  const updateImageDescription = (index: number, description: string) => {
    setImageDescriptions((prev) => {
      const updated = [...prev];
      updated[index] = description;
      return updated;
    });

    setUploadedPhotos((prev) => {
      const updated = [...prev];
      if (updated[index]) updated[index] = { ...updated[index], description };
      return updated;
    });
  };

  const uploadImages = async (): Promise<{ url: string; description: string }[]> => {
    // Images are uploaded immediately on selection
    return uploadedPhotos.map((p) => ({ url: p.url, description: p.description }));
  };

  const handleSubmitUpdate = async () => {
    if (isSubmitting) return;

    // Prevent closing while saving
    allowCloseUpdateDialogRef.current = false;

    if (!tenantId) {
      toast({
        title: "Erro",
        description: "Sessão expirada. Faça login novamente.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedObra || !updateForm.etapa) {
      toast({
        title: "Erro",
        description: "Preencha a etapa da obra",
        variant: "destructive",
      });
      return;
    }

    if (!updateForm.assinatura) {
      toast({
        title: "Erro",
        description: "Assinatura obrigatória",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload images with descriptions
      const uploadedPhotos = await uploadImages();

      // Upload signature (store as URL instead of a huge dataURL)
      let signatureUrl: string | null = null;
      if (updateForm.assinatura) {
        const fileName = `${tenantId}/${selectedObra.id}/assinatura-${Date.now()}.png`;

        const dataUrlToBlob = (dataUrl: string) => {
          const [header, base64] = dataUrl.split(',');
          const mimeMatch = header.match(/data:(.*?);base64/);
          const mime = mimeMatch?.[1] || 'image/png';
          const binary = atob(base64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
          return new Blob([bytes], { type: mime });
        };

        const blob = updateForm.assinatura.startsWith('data:')
          ? dataUrlToBlob(updateForm.assinatura)
          : await (await fetch(updateForm.assinatura)).blob();

        const { error: signUploadError } = await supabase.storage
          .from('obras-fotos')
          .upload(fileName, blob, {
            contentType: blob.type || 'image/png',
            upsert: true,
          });

        if (signUploadError) {
          console.error('Signature upload error:', signUploadError);
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('obras-fotos')
            .getPublicUrl(fileName);
          signatureUrl = publicUrl;
        }
      }

      // Create fotos array with descriptions
      const fotos = [
        ...uploadedPhotos.map(photo => ({ url: photo.url, description: photo.description })),
        ...(signatureUrl ? [{ url: signatureUrl, description: 'Assinatura' }] : []),
      ];

      const { error } = await supabase.from("diario_obras").insert({
        tenant_id: tenantId,
        obra_id: selectedObra.id,
        branch_id: selectedObra.branch_id || null,
        data: updateForm.data,
        atividades_realizadas: updateForm.descricao || null,
        clima_manha: updateForm.etapa || null, // Using clima_manha to store etapa (no constraint)
        registrado_por: user?.id || null,
        fotos: fotos.length ? fotos : null,
        ocorrencias: updateForm.responsavel ? `Responsável: ${updateForm.responsavel}` : null,
      });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      // Invalidate queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ["diario_obras"] });

      toast({
        title: "Sucesso",
        description: "Atualização registrada com sucesso",
      });

      // Allow explicit close only after success
      allowCloseUpdateDialogRef.current = true;
      setIsUpdateDialogOpen(false);
      setSelectedObra(null);
    } catch (error: any) {
      console.error('Error submitting update:', error);
      toast({
        title: "Erro",
        description: error?.message || error?.details || "Erro ao registrar atualização",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredObras = obras.filter(obra =>
    obra.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    obra.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    obra.endereco?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <DashboardLayout>
        <TableSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6" data-tour="obras-content">
        <PageHeader 
          title="Obras" 
          description="Cadastro e acompanhamento de obras"
        />
        
        {!isReadOnly && (
          <div className="flex justify-center">
            <ObraFormDialog
              isOpen={isDialogOpen}
              onOpenChange={setIsDialogOpen}
              onSave={handleCreateObraWithEtapas}
              isPending={createObra.isPending}
            />
          </div>
        )}

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <Input
                placeholder="Buscar por nome, cliente ou endereço..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:max-w-sm"
              />
            </div>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            {filteredObras.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma obra cadastrada.
              </p>
            ) : (
              <div className="grid gap-3 sm:gap-4">
                {filteredObras.map((obra) => (
                  <Card 
                    key={obra.id} 
                    className="border cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleOpenUpdatesList(obra)}
                  >
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex flex-col gap-3">
                        {/* Header with name and status */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="flex items-start sm:items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-base sm:text-lg">{obra.nome}</h3>
                            {getStatusBadge(obra.status)}
                          </div>
                          
                          {/* Desktop actions - hidden for read-only */}
                          {!isReadOnly && (
                            <div className="hidden sm:flex items-center gap-2">
                              {obra.notas && (
                                <div className="flex items-center gap-1 text-muted-foreground" title={obra.notas}>
                                  <FileText className="h-4 w-4" />
                                </div>
                              )}
                              <Button className="px-4 sm:px-6" onClick={(e) => handleOpenUpdateDialog(obra, e)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Atualizar
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={(e) => handleDeleteObra(obra.id, e)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          )}
                        </div>
                        
                        {/* Info grid */}
                        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-muted-foreground">
                          {obra.customer?.name && (
                            <div className="flex items-center gap-1.5 min-w-0">
                              <User className="h-3.5 w-3.5 flex-shrink-0" />
                              <span className="truncate">{obra.customer.name}</span>
                            </div>
                          )}
                          {obra.endereco && (
                            <div className="flex items-center gap-1.5 min-w-0">
                              <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                              <span className="truncate">{obra.endereco}</span>
                            </div>
                          )}
                          {obra.data_inicio && (
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                              <span>{new Date(obra.data_inicio).toLocaleDateString('pt-BR')}</span>
                            </div>
                          )}
                          {obra.previsao_termino && (
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                              <span>Prev: {new Date(obra.previsao_termino).toLocaleDateString('pt-BR')}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Mobile actions - hidden for read-only */}
                        {!isReadOnly && (
                          <div className="flex sm:hidden items-center gap-2 pt-2 border-t border-border/20">
                            {obra.notas && (
                              <div className="flex items-center gap-1 text-muted-foreground" title={obra.notas}>
                                <FileText className="h-4 w-4" />
                              </div>
                            )}
                            <Button className="flex-1" size="sm" onClick={(e) => handleOpenUpdateDialog(obra, e)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Atualizar
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={(e) => handleDeleteObra(obra.id, e)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog de Lista de Atualizações */}
        <Dialog open={isUpdatesListDialogOpen} onOpenChange={(open) => {
          setIsUpdatesListDialogOpen(open);
          if (!open) setSelectedObra(null);
        }}>
          <DialogContent className="w-full max-w-3xl max-h-[90vh] p-0 sm:p-0 bg-transparent shadow-none border-0">
            <div className="bg-background rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
              <DialogHeader className="bg-primary px-6 pt-6 pb-4 rounded-t-xl flex-shrink-0">
                <DialogTitle className="text-primary-foreground">
                  {selectedObra?.nome}
                </DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto px-6 pt-4 pb-6 min-h-0 space-y-6">
                {/* Etapas e Progresso */}
                {selectedObra && (
                  <ObraEtapasPanel 
                    obraId={selectedObra.id} 
                    obraProgresso={selectedObra.progresso}
                    isReadOnly={isReadOnly}
                  />
                )}

                {/* Histórico de Atualizações */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Histórico de Atualizações
                      </h3>
                      {!isReadOnly && (
                        <Button 
                          size="sm"
                          onClick={() => {
                            setIsUpdatesListDialogOpen(false);
                            if (selectedObra) handleOpenUpdateDialog(selectedObra);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Nova
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isDiariosLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : diarios.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        <FileText className="h-10 w-10 mx-auto opacity-50 mb-2" />
                        <p className="text-sm">Nenhuma atualização registrada.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {diarios.map((diario) => (
                          <div 
                            key={diario.id} 
                            className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => handleOpenDiarioDetail(diario)}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs">{diario.clima_manha || 'Sem etapa'}</Badge>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(diario.data).toLocaleDateString('pt-BR')}
                                </span>
                              </div>
                              {diario.atividades_realizadas && (
                                <p className="text-sm text-muted-foreground truncate">
                                  {diario.atividades_realizadas}
                                </p>
                              )}
                              {diario.fotos && Array.isArray(diario.fotos) && diario.fotos.length > 0 && (
                                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                  <Image className="h-3 w-3" />
                                  <span>{diario.fotos.length} {diario.fotos.length === 1 ? 'imagem' : 'imagens'}</span>
                                </div>
                              )}
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog de Detalhes do Diário */}
        <Dialog open={isDiarioDetailDialogOpen} onOpenChange={(open) => {
          setIsDiarioDetailDialogOpen(open);
          if (!open) setSelectedDiario(null);
        }}>
          <DialogContent className="w-full max-w-2xl max-h-[90vh] p-0 sm:p-0 bg-transparent shadow-none border-0">
            <div className="bg-background rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
              <DialogHeader className="bg-primary px-6 pt-6 pb-4 rounded-t-xl flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-primary-foreground hover:bg-primary-foreground/10 -ml-2"
                    onClick={() => {
                      setIsDiarioDetailDialogOpen(false);
                      setIsUpdatesListDialogOpen(true);
                    }}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <DialogTitle className="text-primary-foreground">
                    Relatório de Atualização
                  </DialogTitle>
                </div>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto px-6 pt-4 pb-6 space-y-4 min-h-0">
              {selectedDiario && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground text-xs">Etapa</Label>
                      <p className="font-medium">{selectedDiario.clima_manha || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Data</Label>
                      <p className="font-medium">
                        {new Date(selectedDiario.data).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>

                  {selectedDiario.ocorrencias && (
                    <div>
                      <Label className="text-muted-foreground text-xs">Responsável</Label>
                      <p className="font-medium">{selectedDiario.ocorrencias.replace('Responsável: ', '')}</p>
                    </div>
                  )}

                  {selectedDiario.atividades_realizadas && (
                    <div>
                      <Label className="text-muted-foreground text-xs">Descrição</Label>
                      <p className="text-sm whitespace-pre-wrap">{selectedDiario.atividades_realizadas}</p>
                    </div>
                  )}

                  {selectedDiario.materiais_utilizados && (
                    <div>
                      <Label className="text-muted-foreground text-xs">Materiais Utilizados</Label>
                      <p className="text-sm whitespace-pre-wrap">{selectedDiario.materiais_utilizados}</p>
                    </div>
                  )}

                  {selectedDiario.fotos && Array.isArray(selectedDiario.fotos) && selectedDiario.fotos.length > 0 && (
                    <div>
                      <Label className="text-muted-foreground text-xs mb-2 block">Imagens</Label>
                      <div className="space-y-3">
                        {selectedDiario.fotos.map((foto, index) => {
                          const fotoUrl = typeof foto === 'string' ? foto : (foto as any)?.url;
                          const fotoDesc = typeof foto === 'object' ? (foto as any)?.description : null;
                          return (
                            <div key={index} className="border rounded-lg p-2 space-y-2">
                              <a 
                                href={fotoUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="block"
                              >
                                <img 
                                  src={fotoUrl} 
                                  alt={fotoDesc || `Imagem ${index + 1}`}
                                  className="w-full h-32 sm:h-40 object-contain rounded-lg hover:opacity-80 transition-opacity bg-muted/30 border"
                                  onError={(e) => {
                                    console.error('Image load error:', fotoUrl);
                                    (e.target as HTMLImageElement).src = '/placeholder.svg';
                                  }}
                                />
                              </a>
                              {fotoDesc && (
                                <p className="text-sm text-muted-foreground px-1">{fotoDesc}</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground pt-4 border-t border-border/20">
                    Registrado em: {new Date(selectedDiario.created_at).toLocaleString('pt-BR')}
                  </div>
                </>
              )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog de Atualização */}
        <Dialog open={isUpdateDialogOpen} onOpenChange={(open) => {
          // Only allow closing via explicit actions (Cancelar / Salvar).
          // Mobile camera/gallery can trigger a spurious dismiss when returning.
          if (!open) {
            if (isSubmitting || isUploadingImages) return;
            if (!allowCloseUpdateDialogRef.current) return;
          }

          allowCloseUpdateDialogRef.current = false;
          setIsUpdateDialogOpen(open);
          if (!open) {
            setSelectedObra(null);
            clearUpdateDraft();
          }
        }}>
          <DialogContent
            className={isMobile ? "max-w-full h-[100dvh] p-0 m-0 rounded-none gap-0 bg-transparent shadow-none border-0 overflow-hidden max-h-none [&>button]:hidden" : "max-w-2xl max-h-[90vh] p-0 bg-transparent shadow-none border-0 overflow-hidden [&>button]:hidden"}
            onFocusOutside={(e) => {
              const recentlyUsedPicker = Date.now() - lastFilePickerAtRef.current < 600000;
              if (isSelectingFile || recentlyUsedPicker) e.preventDefault();
            }}
            onInteractOutside={(e) => {
              const recentlyUsedPicker = Date.now() - lastFilePickerAtRef.current < 600000;
              if (isSelectingFile || recentlyUsedPicker) e.preventDefault();
            }}
            onPointerDownOutside={(e) => {
              const recentlyUsedPicker = Date.now() - lastFilePickerAtRef.current < 600000;
              if (isSelectingFile || recentlyUsedPicker) e.preventDefault();
            }}
            onEscapeKeyDown={(e) => {
              const recentlyUsedPicker = Date.now() - lastFilePickerAtRef.current < 600000;
              if (isSelectingFile || recentlyUsedPicker) e.preventDefault();
            }}
          >
            <div className={isMobile ? "bg-background h-full flex flex-col" : "bg-background rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"}>
              {isMobile ? (
                <>
                  <MobileFormWizard
                    steps={[
                      {
                      id: "etapa",
                      title: "Etapa e Data",
                      content: (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="etapa">Etapa da Obra *</Label>
                            <Input 
                              id="etapa" 
                              placeholder="Ex: Fundação, Alvenaria, Acabamento" 
                              value={updateForm.etapa}
                              onChange={(e) => setUpdateForm((prev) => ({ ...prev, etapa: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="dataUpdate">Data</Label>
                            <Input 
                              id="dataUpdate" 
                              type="date" 
                              value={updateForm.data}
                              onChange={(e) => setUpdateForm((prev) => ({ ...prev, data: e.target.value }))}
                            />
                          </div>
                        </div>
                      ),
                    },
                    {
                      id: "descricao",
                      title: "Responsável e Descrição",
                      content: (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="responsavel">Responsável pelo Atendimento</Label>
                            <Select 
                              value={updateForm.responsavel}
                              onValueChange={(v) => setUpdateForm((prev) => ({ ...prev, responsavel: v }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o colaborador" />
                              </SelectTrigger>
                              <SelectContent>
                                {employees.filter(e => e.status === 'ativo').map((employee) => (
                                  <SelectItem key={employee.id} value={employee.name}>
                                    {employee.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="descricaoUpdate">Descrição</Label>
                            <Textarea 
                              id="descricaoUpdate" 
                              placeholder="Descreva as atividades realizadas, observações e ocorrências..." 
                              rows={6}
                              value={updateForm.descricao}
                              onChange={(e) => setUpdateForm((prev) => ({ ...prev, descricao: e.target.value }))}
                            />
                          </div>
                        </div>
                      ),
                    },
                    {
                      id: "imagens",
                      title: "Imagens",
                      content: (
                        <div className="space-y-4">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            multiple
                            className="hidden"
                            onChange={handleImageSelect}
                          />
                          <Button 
                            type="button" 
                            variant="outline" 
                            className="w-full h-24 border-dashed"
                            onClick={handleFileInputClick}
                            disabled={isUploadingImages || isSubmitting}
                          >
                            <Upload className="h-6 w-6 mr-2" />
                            {isUploadingImages ? "Salvando imagem..." : "Adicionar Imagens"}
                          </Button>
                          
                          {imagePreviewUrls.length > 0 && (
                            <div className="space-y-4">
                              {imagePreviewUrls.map((url, index) => (
                                <div key={index} className="border rounded-lg p-3 space-y-2">
                                  <div className="relative">
                                    <img 
                                      src={url} 
                                      alt={`Preview ${index + 1}`}
                                      className="w-full h-32 object-cover rounded-lg"
                                      loading="lazy"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => removeImage(index)}
                                      className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1.5"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  </div>
                                  <Input
                                    placeholder="Descrição da imagem..."
                                    value={imageDescriptions[index] || ''}
                                    onChange={(e) => updateImageDescription(index, e.target.value)}
                                    className="text-sm"
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ),
                    },
                    {
                      id: "assinatura",
                      title: "Assinatura *",
                      landscape: true,
                      content: (
                        <SignatureCanvas 
                          inline
                          onSignatureChange={(signature) => setUpdateForm((prev) => ({ ...prev, assinatura: signature }))}
                        />
                      ),
                    },
                  ] as WizardStep[]}
                  initialStep={updateWizardStep}
                  onStepChange={setUpdateWizardStep}
                  onComplete={handleSubmitUpdate}
                  onCancel={() => {
                    allowCloseUpdateDialogRef.current = true;
                    setIsUpdateDialogOpen(false);
                  }}
                  isSubmitting={isSubmitting}
                  submitLabel="Salvar Atualização"
                />
              </>
            ) : (
              <>
                <DialogHeader className="bg-primary px-6 pt-6 pb-4 rounded-t-xl flex-shrink-0">
                  <DialogTitle className="text-primary-foreground">Atualizar Obra - {selectedObra?.nome}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 flex-1 overflow-y-auto px-6 pt-4 pb-6 min-h-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="etapa">Etapa da Obra *</Label>
                      <Input 
                        id="etapa" 
                        placeholder="Ex: Fundação, Alvenaria, Acabamento" 
                        value={updateForm.etapa}
                        onChange={(e) => setUpdateForm((prev) => ({ ...prev, etapa: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dataUpdate">Data</Label>
                      <Input 
                        id="dataUpdate" 
                        type="date" 
                        value={updateForm.data}
                        onChange={(e) => setUpdateForm((prev) => ({ ...prev, data: e.target.value }))}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="responsavel">Responsável pelo Atendimento</Label>
                    <Select 
                      value={updateForm.responsavel}
                      onValueChange={(v) => setUpdateForm((prev) => ({ ...prev, responsavel: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o colaborador" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.filter(e => e.status === 'ativo').map((employee) => (
                          <SelectItem key={employee.id} value={employee.name}>
                            {employee.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="descricaoUpdate">Descrição</Label>
                    <Textarea 
                      id="descricaoUpdate" 
                      placeholder="Descreva as atividades realizadas, observações e ocorrências..." 
                      rows={4}
                      value={updateForm.descricao}
                      onChange={(e) => setUpdateForm((prev) => ({ ...prev, descricao: e.target.value }))}
                    />
                  </div>
                  
                  {/* Image Upload Section */}
                  <div className="space-y-2">
                    <Label>Imagens</Label>
                    <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-4">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        multiple
                        className="hidden"
                        onChange={handleImageSelect}
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="w-full"
                        onClick={handleFileInputClick}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Adicionar Imagens
                      </Button>
                      
                      {imagePreviewUrls.length > 0 && (
                        <div className="space-y-3 mt-4">
                          {imagePreviewUrls.map((url, index) => (
                            <div key={index} className="flex gap-3 p-2 border rounded-lg items-start">
                              <div className="relative shrink-0">
                                <img 
                                  src={url} 
                                  alt={`Preview ${index + 1}`}
                                  className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeImage(index)}
                                  className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                              <div className="flex-1 min-w-0">
                                <Input
                                  placeholder="Descrição da imagem..."
                                  value={imageDescriptions[index] || ''}
                                  onChange={(e) => updateImageDescription(index, e.target.value)}
                                  className="text-sm"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Signature Section */}
                  <div className="space-y-2">
                    <Label>Assinatura <span className="text-destructive">*</span></Label>
                    {updateForm.assinatura ? (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-16 border rounded bg-background flex items-center justify-center">
                          <img src={updateForm.assinatura} alt="Assinatura" className="max-h-14" />
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setShowSignatureModal(true)}>
                          Alterar
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        variant="outline" 
                        className="w-full h-16 border-dashed"
                        onClick={() => setShowSignatureModal(true)}
                      >
                        Capturar Assinatura
                      </Button>
                    )}
                    <SignatureModal
                      open={showSignatureModal}
                      onClose={() => setShowSignatureModal(false)}
                      onSave={(sig) => setUpdateForm((prev) => ({ ...prev, assinatura: sig }))}
                      title="Assinatura - Atualização de Obra"
                    />
                  </div>
                  
                  <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        allowCloseUpdateDialogRef.current = true;
                        setIsUpdateDialogOpen(false);
                      }}
                      className="w-full sm:w-auto"
                    >
                      Cancelar
                    </Button>
                    <Button onClick={handleSubmitUpdate} disabled={isSubmitting || !updateForm.etapa || !updateForm.assinatura} className="w-full sm:w-auto">
                      {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Salvar Atualização
                    </Button>
                  </div>
                </div>
              </>
            )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Obras;
