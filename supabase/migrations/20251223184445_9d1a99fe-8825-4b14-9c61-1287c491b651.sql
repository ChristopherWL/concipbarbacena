-- Function to calculate and update obra progress based on completed etapas
CREATE OR REPLACE FUNCTION public.update_obra_progress_from_etapas()
RETURNS TRIGGER AS $$
DECLARE
    total_peso DECIMAL;
    peso_concluido DECIMAL;
    novo_progresso INTEGER;
BEGIN
    -- Calculate total peso for the obra
    SELECT COALESCE(SUM(percentual_peso), 0) INTO total_peso
    FROM public.obra_etapas
    WHERE obra_id = COALESCE(NEW.obra_id, OLD.obra_id);

    -- Calculate peso of completed etapas
    SELECT COALESCE(SUM(percentual_peso), 0) INTO peso_concluido
    FROM public.obra_etapas
    WHERE obra_id = COALESCE(NEW.obra_id, OLD.obra_id)
    AND status = 'concluida';

    -- Calculate progress percentage
    IF total_peso > 0 THEN
        novo_progresso := ROUND((peso_concluido / total_peso) * 100);
    ELSE
        novo_progresso := 0;
    END IF;

    -- Update the obra progress
    UPDATE public.obras
    SET progresso = novo_progresso,
        updated_at = now()
    WHERE id = COALESCE(NEW.obra_id, OLD.obra_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger to update obra progress when etapa status changes
DROP TRIGGER IF EXISTS trigger_update_obra_progress ON public.obra_etapas;
CREATE TRIGGER trigger_update_obra_progress
AFTER INSERT OR UPDATE OF status ON public.obra_etapas
FOR EACH ROW
EXECUTE FUNCTION public.update_obra_progress_from_etapas();

-- Also create trigger for delete to recalculate when etapa is removed
DROP TRIGGER IF EXISTS trigger_update_obra_progress_delete ON public.obra_etapas;
CREATE TRIGGER trigger_update_obra_progress_delete
AFTER DELETE ON public.obra_etapas
FOR EACH ROW
EXECUTE FUNCTION public.update_obra_progress_from_etapas();

-- Update existing obras progress based on current etapas
UPDATE public.obras o
SET progresso = COALESCE(
    (SELECT ROUND(
        (SUM(CASE WHEN e.status = 'concluida' THEN e.percentual_peso ELSE 0 END) / 
         NULLIF(SUM(e.percentual_peso), 0)) * 100
    )
    FROM public.obra_etapas e
    WHERE e.obra_id = o.id),
    0
),
updated_at = now()
WHERE EXISTS (SELECT 1 FROM public.obra_etapas WHERE obra_id = o.id);