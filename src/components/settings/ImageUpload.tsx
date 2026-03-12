import { useState, useRef, useEffect } from 'react';
import { uploadTenantAsset, resolveStorageUrl } from '@/lib/storageUtils';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, X, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { sanitizeErrorMessage } from '@/lib/errorUtils';

interface ImageUploadProps {
  label: string;
  description?: string;
  currentUrl?: string | null;
  tenantId: string;
  folder: string;
  onUploadComplete: (path: string) => void;
  aspectRatio?: 'square' | 'wide' | 'video';
}

export function ImageUpload({ 
  label, 
  description, 
  currentUrl, 
  tenantId, 
  folder, 
  onUploadComplete,
  aspectRatio = 'square'
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Resolve the currentUrl (which might be a path or expired signed URL) to a fresh signed URL
  useEffect(() => {
    let cancelled = false;
    if (currentUrl) {
      resolveStorageUrl(currentUrl).then((url) => {
        if (!cancelled) setPreviewUrl(url || currentUrl);
      });
    } else {
      setPreviewUrl(null);
    }
    return () => { cancelled = true; };
  }, [currentUrl]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${tenantId}/${folder}/${Date.now()}.${fileExt}`;

      const { url, path } = await uploadTenantAsset(fileName, file, { upsert: true });

      setPreviewUrl(url);
      // Save the RAW PATH to the database, not the signed URL
      onUploadComplete(path);
      toast.success('Imagem enviada com sucesso!');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(sanitizeErrorMessage(error));
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    onUploadComplete('');
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      
      <div className="flex items-start gap-4">
        <div 
          className={`relative border-2 border-dashed border-muted-foreground/25 rounded-lg overflow-hidden bg-muted/50 flex items-center justify-center ${
            aspectRatio === 'square' ? 'w-32 h-32' : 'w-48 h-28'
          }`}
        >
          {previewUrl ? (
            <>
              <img 
                src={previewUrl} 
                alt={label}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={handleRemove}
                className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </>
          ) : (
            <div className="text-center text-muted-foreground">
              <ImageIcon className="h-8 w-8 mx-auto mb-1" />
              <span className="text-xs">Sem imagem</span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            {uploading ? 'Enviando...' : 'Selecionar'}
          </Button>
          <span className="text-xs text-muted-foreground">
            PNG, JPG até 5MB
          </span>
        </div>
      </div>
    </div>
  );
}
