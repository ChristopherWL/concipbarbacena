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
import { Plus, Search, Edit, Trash2, Calendar, MapPin, User, Clock, Loader2, FileText, Upload, X, ChevronRight, Image, ArrowLeft, ListChecks, Eye, Settings } from "lucide-react";
import { useObras, useDiarioObras, Obra, DiarioObra } from "@/hooks/useObras";
import { ObraEtapasPanel } from "@/components/obras/ObraEtapasPanel";
import { ObraCard } from "@/components/obras/ObraCard";
import { ObraFormDialog } from "@/components/obras/ObraFormDialog";
import { ObraEditDialog } from "@/components/obras/ObraEditDialog";
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
  const [isEditObraDialogOpen, setIsEditObraDialogOpen] = useState(false);
  const [obraToEdit, setObraToEdit] = useState<Obra | null>(null);
  const [selectedObra, setSelectedObra] = useState<Obra | null>(null);
  const [selectedDiario, setSelectedDiario] = useState<DiarioObra | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSelectingFile, setIsSelectingFile] = useState(false);
  const [isEditingDiario, setIsEditingDiario] = useState(false);
  const [editDiarioForm, setEditDiarioForm] = useState({ etapa: '', data: '', responsavel: '', descricao: '' });
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
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
  
  // Selected etapa for adding diário
  const [selectedEtapaId, setSelectedEtapaId] = useState<string | null>(null);
  
  // Update form state
  const [updateForm, setUpdateForm] = useState({
    etapa: "",
    etapaId: null as string | null,
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
  const { diarios, isLoading: isDiariosLoading, updateDiario, deleteDiario } = useDiarioObras(selectedObra?.id);
  const { etapas: obraEtapas } = useObraEtapas(selectedObra?.id);
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
    if (!tenantId) {
      toast({
        title: "Erro",
        description: "Sessão não encontrada. Por favor, faça login novamente.",
        variant: "destructive",
      });
      return;
    }

    try {
      const novaObra = await createObra.mutateAsync(obraData);
      
      // Create etapas for the new obra
      if (etapas.length > 0 && novaObra?.id) {
        for (let i = 0; i < etapas.length; i++) {
          const etapa = etapas[i];
          const { error } = await supabase.from("obra_etapas").insert({
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
          if (error) {
            console.error('Error creating etapa:', error);
          }
        }
      }
      
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error creating obra with etapas:', error);
      throw error;
    }
  };

  const handleDeleteObra = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Tem certeza que deseja excluir esta obra?")) {
      await deleteObra.mutateAsync(id);
    }
  };

  const handleOpenEditObraDialog = (obra: Obra, e: React.MouseEvent) => {
    e.stopPropagation();
    setObraToEdit(obra);
    setIsEditObraDialogOpen(true);
  };

  const handleSaveEditObra = async (obraData: Partial<Obra> & { id: string }) => {
    await updateObra.mutateAsync(obraData);
    setIsEditObraDialogOpen(false);
    setObraToEdit(null);
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
      etapaId: null as string | null,
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

  const handleGalleryInputClick = () => {
    markFilePickerActivity();
    setIsSelectingFile(true);
    galleryInputRef.current?.click();
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

    if (!selectedObra || !updateForm.etapaId) {
      toast({
        title: "Erro",
        description: "Selecione a etapa da obra",
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
        etapa_id: updateForm.etapaId,
        branch_id: selectedObra.branch_id || null,
        data: updateForm.data,
        atividades_realizadas: updateForm.descricao || null,
        clima_manha: updateForm.etapa || null, // Keep etapa name for display
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

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, cliente ou endereço..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {!isReadOnly && (
                <div className="shrink-0">
                  <ObraFormDialog
                    isOpen={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                    onSave={handleCreateObraWithEtapas}
                    isPending={createObra.isPending}
                  />
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            {filteredObras.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma obra cadastrada.
              </p>
            ) : (
              <div className="grid gap-4 sm:gap-5">
                {filteredObras.map((obra) => (
                  <ObraCard
                    key={obra.id}
                    obra={obra}
                    tenantId={tenantId}
                    isReadOnly={isReadOnly}
                    onCardClick={handleOpenUpdatesList}
                    onEdit={handleOpenEditObraDialog}
                    onUpdate={handleOpenUpdateDialog}
                    onDelete={handleDeleteObra}
                    getStatusBadge={getStatusBadge}
                  />
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
          <DialogContent className={isMobile ? "w-screen h-screen max-w-none max-h-none p-0 m-0 rounded-none gap-0 bg-background shadow-none border-0 overflow-hidden inset-0 translate-x-0 translate-y-0 [&>button]:hidden" : "w-full max-w-3xl max-h-[90vh] p-0 bg-transparent shadow-none border-0 overflow-hidden [&>button]:hidden"}>
            <div className={isMobile ? "h-full flex flex-col" : "bg-background rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"}>
              <DialogHeader className={isMobile ? "bg-primary px-4 py-4 flex-shrink-0" : "bg-primary px-6 pt-6 pb-4 rounded-t-xl flex-shrink-0"}>
                <DialogTitle className="text-primary-foreground">
                  {selectedObra?.nome}
                </DialogTitle>
              </DialogHeader>
              <div className={isMobile ? "flex-1 overflow-y-auto px-3 py-4 min-h-0 space-y-4" : "flex-1 overflow-y-auto px-6 pt-4 pb-6 min-h-0 space-y-6"}>
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
                                <Badge variant="outline" className="text-xs">
                                  {diario.etapa?.nome || diario.clima_manha || 'Sem etapa'}
                                </Badge>
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
          if (!open) {
            setSelectedDiario(null);
            setIsEditingDiario(false);
            setEditDiarioForm({ etapa: '', data: '', responsavel: '', descricao: '' });
          }
        }}>
          <DialogContent className={isMobile ? "w-screen h-screen max-w-none max-h-none p-0 m-0 rounded-none gap-0 bg-background shadow-none border-0 overflow-hidden inset-0 translate-x-0 translate-y-0 [&>button]:hidden" : "w-full max-w-2xl max-h-[90vh] p-0 bg-transparent shadow-none border-0 overflow-hidden [&>button]:hidden"}>
            <div className={isMobile ? "h-full flex flex-col" : "bg-background rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"}>
              <DialogHeader className={isMobile ? "bg-primary px-4 py-4 flex-shrink-0" : "bg-primary px-6 pt-6 pb-4 flex-shrink-0"}>
                <div className="flex items-center justify-between">
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
                      {isEditingDiario ? 'Editar Atualização' : 'Relatório de Atualização'}
                    </DialogTitle>
                  </div>
                  {!isReadOnly && selectedDiario && !isEditingDiario && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-primary-foreground hover:bg-primary-foreground/10"
                        onClick={() => {
                          setIsEditingDiario(true);
                          setEditDiarioForm({
                            etapa: selectedDiario.clima_manha || '',
                            data: selectedDiario.data,
                            responsavel: selectedDiario.ocorrencias?.replace('Responsável: ', '') || '',
                            descricao: selectedDiario.atividades_realizadas || '',
                          });
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-primary-foreground hover:bg-destructive/80"
                        onClick={async () => {
                          if (confirm('Tem certeza que deseja excluir esta atualização?')) {
                            try {
                              await deleteDiario.mutateAsync(selectedDiario.id);
                              setIsDiarioDetailDialogOpen(false);
                              setSelectedDiario(null);
                            } catch (error) {
                              console.error('Error deleting diario:', error);
                            }
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </DialogHeader>
              <div className={isMobile ? "flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0" : "flex-1 overflow-y-auto px-6 pt-4 pb-6 space-y-4 min-h-0"}>
              {selectedDiario && (
                <>
                  {isEditingDiario ? (
                    // Edit mode
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="editEtapa">Etapa</Label>
                          <Input
                            id="editEtapa"
                            value={editDiarioForm.etapa}
                            onChange={(e) => setEditDiarioForm(prev => ({ ...prev, etapa: e.target.value }))}
                            placeholder="Ex: Fundação"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="editData">Data</Label>
                          <Input
                            id="editData"
                            type="date"
                            value={editDiarioForm.data}
                            onChange={(e) => setEditDiarioForm(prev => ({ ...prev, data: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="editResponsavel">Responsável</Label>
                        <Select
                          value={editDiarioForm.responsavel}
                          onValueChange={(v) => setEditDiarioForm(prev => ({ ...prev, responsavel: v }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o responsável" />
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
                        <Label htmlFor="editDescricao">Descrição</Label>
                        <Textarea
                          id="editDescricao"
                          value={editDiarioForm.descricao}
                          onChange={(e) => setEditDiarioForm(prev => ({ ...prev, descricao: e.target.value }))}
                          rows={4}
                          placeholder="Descreva as atividades realizadas..."
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button variant="outline" onClick={() => setIsEditingDiario(false)}>
                          Cancelar
                        </Button>
                        <Button
                          onClick={async () => {
                            try {
                              await updateDiario.mutateAsync({
                                id: selectedDiario.id,
                                clima_manha: editDiarioForm.etapa || null,
                                data: editDiarioForm.data,
                                ocorrencias: editDiarioForm.responsavel ? `Responsável: ${editDiarioForm.responsavel}` : null,
                                atividades_realizadas: editDiarioForm.descricao || null,
                              });
                              setIsEditingDiario(false);
                              // Refresh diario data
                              queryClient.invalidateQueries({ queryKey: ['diario_obras'] });
                            } catch (error) {
                              console.error('Error updating diario:', error);
                            }
                          }}
                          disabled={updateDiario.isPending}
                        >
                          {updateDiario.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          Salvar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // View mode
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                                  <div className="relative group">
                                    <img 
                                      src={fotoUrl} 
                                      alt={fotoDesc || `Imagem ${index + 1}`}
                                      className="w-full h-32 sm:h-40 object-contain rounded-lg bg-muted/30 border cursor-pointer"
                                      onClick={() => setFullscreenImage(fotoUrl)}
                                      onError={(e) => {
                                        console.error('Image load error:', fotoUrl);
                                        (e.target as HTMLImageElement).src = '/placeholder.svg';
                                      }}
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                                      <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => setFullscreenImage(fotoUrl)}
                                      >
                                        <Eye className="h-4 w-4 mr-1" />
                                        Ver
                                      </Button>
                                      <a 
                                        href={fotoUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <Button variant="secondary" size="sm">
                                          <Upload className="h-4 w-4 mr-1 rotate-180" />
                                          Baixar
                                        </Button>
                                      </a>
                                    </div>
                                  </div>
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
                </>
              )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog de Imagem em Tela Cheia */}
        <Dialog open={!!fullscreenImage} onOpenChange={(open) => !open && setFullscreenImage(null)}>
          <DialogContent className="w-screen h-screen max-w-none max-h-none p-0 m-0 bg-black/95 border-0 rounded-none inset-0 translate-x-0 translate-y-0">
            <div className="relative w-full h-full flex items-center justify-center">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 text-white hover:bg-white/20 z-10"
                onClick={() => setFullscreenImage(null)}
              >
                <X className="h-6 w-6" />
              </Button>
              {fullscreenImage && (
                <img
                  src={fullscreenImage}
                  alt="Imagem em tela cheia"
                  className="max-w-full max-h-[90vh] object-contain"
                />
              )}
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
            className={isMobile ? "w-screen h-screen max-w-none max-h-none p-0 m-0 rounded-none gap-0 bg-background shadow-none border-0 overflow-hidden inset-0 translate-x-0 translate-y-0 [&>button]:hidden" : "max-w-2xl max-h-[90vh] p-0 bg-transparent shadow-none border-0 overflow-hidden [&>button]:hidden"}
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
            <div className={isMobile ? "h-full flex flex-col" : "bg-background rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"}>
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
                            <Select 
                              value={updateForm.etapaId || ""}
                              onValueChange={(v) => {
                                const etapa = obraEtapas.find(e => e.id === v);
                                setUpdateForm((prev) => ({ 
                                  ...prev, 
                                  etapaId: v,
                                  etapa: etapa?.nome || "" 
                                }));
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione a etapa" />
                              </SelectTrigger>
                              <SelectContent>
                                {obraEtapas.filter(e => e.status === 'em_andamento' || e.status === 'pendente').map((etapa) => (
                                  <SelectItem key={etapa.id} value={etapa.id}>
                                    {etapa.nome} {etapa.status === 'em_andamento' && '(Atual)'}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {obraEtapas.length === 0 && (
                              <p className="text-xs text-muted-foreground">Nenhuma etapa cadastrada. Cadastre etapas primeiro.</p>
                            )}
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
                          {/* Camera input */}
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            multiple
                            className="hidden"
                            onChange={handleImageSelect}
                          />
                          {/* Gallery input */}
                          <input
                            ref={galleryInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={handleImageSelect}
                          />
                          <div className="flex gap-2">
                            <Button 
                              type="button" 
                              variant="outline" 
                              className="flex-1 h-20 border-dashed flex-col gap-1"
                              onClick={handleFileInputClick}
                              disabled={isUploadingImages || isSubmitting}
                            >
                              <Image className="h-6 w-6" />
                              <span className="text-xs">{isUploadingImages ? "Salvando..." : "Câmera"}</span>
                            </Button>
                            <Button 
                              type="button" 
                              variant="outline" 
                              className="flex-1 h-20 border-dashed flex-col gap-1"
                              onClick={handleGalleryInputClick}
                              disabled={isUploadingImages || isSubmitting}
                            >
                              <Upload className="h-6 w-6" />
                              <span className="text-xs">{isUploadingImages ? "Salvando..." : "Galeria"}</span>
                            </Button>
                          </div>
                          
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
                  headerTitle={`Atualização - ${selectedObra?.nome || 'Obra'}`}
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
                      <Select 
                        value={updateForm.etapaId || ""}
                        onValueChange={(v) => {
                          const etapa = obraEtapas.find(e => e.id === v);
                          setUpdateForm((prev) => ({ 
                            ...prev, 
                            etapaId: v,
                            etapa: etapa?.nome || "" 
                          }));
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a etapa" />
                        </SelectTrigger>
                        <SelectContent>
                          {obraEtapas.filter(e => e.status === 'em_andamento' || e.status === 'pendente').map((etapa) => (
                            <SelectItem key={etapa.id} value={etapa.id}>
                              {etapa.nome} {etapa.status === 'em_andamento' && '(Atual)'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {obraEtapas.length === 0 && (
                        <p className="text-xs text-muted-foreground">Nenhuma etapa cadastrada.</p>
                      )}
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
                      {/* Camera input */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        multiple
                        className="hidden"
                        onChange={handleImageSelect}
                      />
                      {/* Gallery input */}
                      <input
                        ref={galleryInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleImageSelect}
                      />
                      <div className="flex gap-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          className="flex-1"
                          onClick={handleFileInputClick}
                        >
                          <Image className="h-4 w-4 mr-2" />
                          Câmera
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          className="flex-1"
                          onClick={handleGalleryInputClick}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Galeria
                        </Button>
                      </div>
                      
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

        {/* Dialog de Edição da Obra */}
        <ObraEditDialog
          obra={obraToEdit}
          isOpen={isEditObraDialogOpen}
          onOpenChange={(open) => {
            setIsEditObraDialogOpen(open);
            if (!open) setObraToEdit(null);
          }}
          onSave={handleSaveEditObra}
          isPending={updateObra.isPending}
        />
      </div>
    </DashboardLayout>
  );
};

export default Obras;
