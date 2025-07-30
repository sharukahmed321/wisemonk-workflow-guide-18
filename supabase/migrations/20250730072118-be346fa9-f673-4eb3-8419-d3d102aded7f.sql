-- Clean up test data in organizations table
DELETE FROM public.organizations WHERE country = 'Japan' AND name = 'Wisemonk';