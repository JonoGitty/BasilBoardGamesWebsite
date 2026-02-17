-- Enforce exactly 4 active games: elam, interrogate, almost, sidequests
-- Vault everything else.

UPDATE public.games SET vault = false
WHERE id IN ('elam', 'interrogate', 'almost', 'sidequests');

UPDATE public.games SET vault = true
WHERE id NOT IN ('elam', 'interrogate', 'almost', 'sidequests');
