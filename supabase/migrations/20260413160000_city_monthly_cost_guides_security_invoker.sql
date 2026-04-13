-- Security Advisor: avoid SECURITY DEFINER views in exposed schema.
-- Force this view to execute with caller privileges (RLS enforced).
alter view if exists public.city_monthly_cost_guides
  set (security_invoker = true);
