-- Update chapter pricing and structure:
-- 1. IEEE Computer Society (CS) is FREE (price = 0)
UPDATE public.chapters SET price = 0 WHERE code = 'CS';

-- 2. Power & Energy Society (PES): remove Sensors Council (SC) from PES
UPDATE public.chapters SET name = 'IEEE Power & Energy Society' WHERE code = 'PES';

-- 3. Women in Engineering & Sensors Council (WIE): both WIE and SC are free (price = 0)
UPDATE public.chapters SET name = 'IEEE Women in Engineering & Sensors Council', price = 0 WHERE code = 'WIE';

-- 4. Power & Industrial Electronics (PELS/IES) is 370
UPDATE public.chapters SET price = 370 WHERE code = 'PELS/IES';

-- 5. Update payee UPI ID and phone number in membership_config
UPDATE public.membership_config
SET payee_vpa = 'neharamiah2006-1@oksbi',
    treasurer_phone = '6385525264'
WHERE id = 1;

