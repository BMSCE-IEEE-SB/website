-- Ensure Robotics & Automation Society (RAS) is removed from chapters
DELETE FROM public.chapters WHERE code = 'RAS';

-- Re-sequence display orders
UPDATE public.chapters SET display_order = 4 WHERE code = 'WIE';
UPDATE public.chapters SET display_order = 5 WHERE code = 'SSIT';
