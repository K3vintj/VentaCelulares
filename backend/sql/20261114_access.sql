-- Express owns all reads/writes. Browser Supabase roles have no table access.
-- postgres/service_role continue to use their existing privileged access.
DO $access$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['AdminUser','AdminSession','Product','ProductPhoto','Order','Sale','Delivery','BusinessConfig','AuditLog'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE public.%I FROM anon, authenticated, PUBLIC', table_name);
  END LOOP;
END $access$;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
