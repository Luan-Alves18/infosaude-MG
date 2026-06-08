ALTER TABLE public.account_requests ADD CONSTRAINT account_requests_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$') NOT VALID;
ALTER TABLE public.account_requests ADD CONSTRAINT account_requests_nome_completo_length CHECK (length(nome_completo) >= 1 AND length(nome_completo) <= 200);
ALTER TABLE public.account_requests ADD CONSTRAINT account_requests_instituicao_length CHECK (length(instituicao) >= 1 AND length(instituicao) <= 200);
ALTER TABLE public.account_requests ADD CONSTRAINT account_requests_chefia_imediata_length CHECK (length(chefia_imediata) >= 1 AND length(chefia_imediata) <= 200);
ALTER TABLE public.account_requests ADD CONSTRAINT account_requests_motivo_length CHECK (length(motivo) >= 1 AND length(motivo) <= 2000);

ALTER TABLE public.portal_visits ADD CONSTRAINT portal_visits_path_length CHECK (length(path) <= 500) NOT VALID;
ALTER TABLE public.portal_visits ADD CONSTRAINT portal_visits_session_id_length CHECK (session_id IS NULL OR length(session_id) <= 100) NOT VALID;
ALTER TABLE public.portal_visits ADD CONSTRAINT portal_visits_user_agent_length CHECK (user_agent IS NULL OR length(user_agent) <= 2000) NOT VALID;

CREATE OR REPLACE FUNCTION public.validate_account_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF (SELECT count(*) FROM public.account_requests 
      WHERE lower(email) = lower(NEW.email)
      AND created_at > now() - interval '24 hours') >= 5 THEN
    RAISE EXCEPTION 'Muitas solicitações deste e-mail. Tente novamente amanhã.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_account_request_trigger ON public.account_requests;
CREATE TRIGGER validate_account_request_trigger
  BEFORE INSERT ON public.account_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_account_request();

CREATE OR REPLACE FUNCTION public.validate_portal_visit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.session_id IS NOT NULL AND 
     (SELECT count(*) FROM public.portal_visits 
      WHERE session_id = NEW.session_id 
      AND visited_at > now() - interval '1 hour') >= 200 THEN
    RAISE EXCEPTION 'Limite de registros excedido para esta sessão.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_portal_visit_trigger ON public.portal_visits;
CREATE TRIGGER validate_portal_visit_trigger
  BEFORE INSERT ON public.portal_visits
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_portal_visit();