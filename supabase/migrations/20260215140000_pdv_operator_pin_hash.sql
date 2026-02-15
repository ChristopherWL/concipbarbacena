-- Habilitar pgcrypto para crypt/gen_salt (Supabase já costuma ter)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Coluna para armazenar o hash do PIN (mantemos pin temporariamente para migração)
ALTER TABLE public.pdv_operators
ADD COLUMN IF NOT EXISTS pin_hash text;

-- Backfill: hashear PINs existentes
UPDATE public.pdv_operators
SET pin_hash = crypt(pin, gen_salt('bf'))
WHERE pin IS NOT NULL AND pin != '' AND pin_hash IS NULL;

-- Função para verificar PIN (compatível com pin em texto durante transição)
CREATE OR REPLACE FUNCTION public.verify_pdv_operator_pin(
  _operator_id uuid,
  _plain_pin text
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _pin_hash text;
  _pin_plain text;
BEGIN
  SELECT po.pin_hash, po.pin INTO _pin_hash, _pin_plain
  FROM public.pdv_operators po
  WHERE po.id = _operator_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Preferir verificação por hash
  IF _pin_hash IS NOT NULL AND _pin_hash != '' THEN
    RETURN (crypt(_plain_pin, _pin_hash) = _pin_hash);
  END IF;

  -- Fallback para PIN em texto (durante migração)
  IF _pin_plain IS NOT NULL AND _pin_plain != '' THEN
    RETURN (_pin_plain = _plain_pin);
  END IF;

  RETURN false;
END;
$$;

-- Trigger: ao inserir/atualizar, se pin for informado, gravar em pin_hash e limpar pin
CREATE OR REPLACE FUNCTION public.pdv_operators_hash_pin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.pin IS NOT NULL AND NEW.pin != '' THEN
    NEW.pin_hash := crypt(NEW.pin, gen_salt('bf'));
    NEW.pin := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS pdv_operators_hash_pin_trigger ON public.pdv_operators;
CREATE TRIGGER pdv_operators_hash_pin_trigger
  BEFORE INSERT OR UPDATE OF pin ON public.pdv_operators
  FOR EACH ROW
  EXECUTE FUNCTION public.pdv_operators_hash_pin();

COMMENT ON COLUMN public.pdv_operators.pin_hash IS 'Hash bcrypt do PIN do operador (pin em texto é zerado pelo trigger).';
