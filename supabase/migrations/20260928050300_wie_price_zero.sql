-- Update WIE chapter price to 0 (included with base)
UPDATE public.chapters SET price = 0 WHERE code = 'WIE';
