UPDATE public.account_requests a
SET status = 'recusado'
WHERE a.status = 'pendente'
  AND a.id NOT IN (
    SELECT DISTINCT ON (lower(email)) id
    FROM public.account_requests
    WHERE status = 'pendente'
    ORDER BY lower(email), created_at DESC
  );

CREATE UNIQUE INDEX IF NOT EXISTS account_requests_pending_email_uniq
ON public.account_requests (lower(email))
WHERE status = 'pendente';