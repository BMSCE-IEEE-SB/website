-- Migration: Add Dr. Namratha M to proctors queue and import squads roster (Oct 24, 2026)

-- 1. Ensure Dr. Namratha M exists in xtreme_proctors table with sort_order = 40 (last in queue)
INSERT INTO public.xtreme_proctors (name, ieee_id, capacity, sort_order)
VALUES ('Dr. Namratha M', '92759354', 15, 40)
ON CONFLICT (ieee_id) DO UPDATE SET
  name = excluded.name,
  capacity = excluded.capacity,
  sort_order = excluded.sort_order;

-- 2. Idempotently register imported squads and squad members
DO $$
DECLARE
  v_proc_namratha uuid;
  v_proc_swaroop uuid;
  v_proc_nethravathi uuid;
  v_team_id uuid;
BEGIN
  SELECT id INTO v_proc_namratha FROM public.xtreme_proctors WHERE ieee_id = '92759354' LIMIT 1;
  SELECT id INTO v_proc_swaroop FROM public.xtreme_proctors WHERE ieee_id = '102196859' LIMIT 1;
  SELECT id INTO v_proc_nethravathi FROM public.xtreme_proctors WHERE ieee_id = '90893108' LIMIT 1;

  -- 1. Shashwat
  IF NOT EXISTS (SELECT 1 FROM public.xtreme_teams WHERE lower(team_name) = 'shashwat') THEN
    INSERT INTO public.xtreme_teams (team_name, leader_email, lead_user_id, proctor_id, proctor_name, proctor_ieee_id, vtools_verified)
    VALUES (
      'Shashwat',
      'shashwatgoyal.cs24@bmsce.ac.in',
      (SELECT id FROM auth.users WHERE lower(email) = 'shashwatgoyal.cs24@bmsce.ac.in' LIMIT 1),
      v_proc_namratha, 'Dr. Namratha M', '92759354', true
    )
    RETURNING id INTO v_team_id;

    INSERT INTO public.xtreme_members (team_id, is_lead, first_name, last_name, email, phone, ieee_member_id)
    VALUES (v_team_id, true, 'Shashwat', 'Goyal', 'shashwatgoyal.cs24@bmsce.ac.in', '6395024768', '100775368');
  END IF;

  -- 2. NoNameYet
  IF NOT EXISTS (SELECT 1 FROM public.xtreme_teams WHERE lower(team_name) = 'nonameyet') THEN
    INSERT INTO public.xtreme_teams (team_name, leader_email, lead_user_id, proctor_id, proctor_name, proctor_ieee_id, vtools_verified)
    VALUES (
      'NoNameYet',
      'sahanadesai.bs25@bmsce.ac.in',
      (SELECT id FROM auth.users WHERE lower(email) = 'sahanadesai.bs25@bmsce.ac.in' LIMIT 1),
      v_proc_namratha, 'Dr. Namratha M', '92759354', true
    )
    RETURNING id INTO v_team_id;

    INSERT INTO public.xtreme_members (team_id, is_lead, first_name, last_name, email, phone, ieee_member_id)
    VALUES (v_team_id, true, 'Sahana', 'Desai', 'sahanadesai.bs25@bmsce.ac.in', '9986557125', '101917400');
  END IF;

  -- 3. anything
  IF NOT EXISTS (SELECT 1 FROM public.xtreme_teams WHERE lower(team_name) = 'anything') THEN
    INSERT INTO public.xtreme_teams (team_name, leader_email, lead_user_id, proctor_id, proctor_name, proctor_ieee_id, vtools_verified)
    VALUES (
      'anything',
      'ratikagrawal.ec24@bmsce.ac.in',
      (SELECT id FROM auth.users WHERE lower(email) = 'ratikagrawal.ec24@bmsce.ac.in' LIMIT 1),
      v_proc_namratha, 'Dr. Namratha M', '92759354', true
    )
    RETURNING id INTO v_team_id;

    INSERT INTO public.xtreme_members (team_id, is_lead, first_name, last_name, email, phone, ieee_member_id)
    VALUES (v_team_id, true, 'Ratik', 'Agrawal', 'ratikagrawal.ec24@bmsce.ac.in', '7999180075', '100650078');
  END IF;

  -- 4. PixelPioneers101
  IF NOT EXISTS (SELECT 1 FROM public.xtreme_teams WHERE lower(team_name) = 'pixelpioneers101') THEN
    INSERT INTO public.xtreme_teams (team_name, leader_email, lead_user_id, proctor_id, proctor_name, proctor_ieee_id, vtools_verified)
    VALUES (
      'PixelPioneers101',
      'thanishashree.cs25@bmsce.ac.in',
      (SELECT id FROM auth.users WHERE lower(email) = 'thanishashree.cs25@bmsce.ac.in' LIMIT 1),
      v_proc_namratha, 'Dr. Namratha M', '92759354', true
    )
    RETURNING id INTO v_team_id;

    INSERT INTO public.xtreme_members (team_id, is_lead, first_name, last_name, email, phone, ieee_member_id)
    VALUES (v_team_id, true, 'S S Thanisha', 'Shree', 'thanishashree.cs25@bmsce.ac.in', '9148782973', '102426854');
  END IF;

  -- 5. Vega
  IF NOT EXISTS (SELECT 1 FROM public.xtreme_teams WHERE lower(team_name) = 'vega') THEN
    INSERT INTO public.xtreme_teams (team_name, leader_email, lead_user_id, proctor_id, proctor_name, proctor_ieee_id, vtools_verified)
    VALUES (
      'Vega',
      'soumyashah.ai25@bmsce.ac.in',
      (SELECT id FROM auth.users WHERE lower(email) = 'soumyashah.ai25@bmsce.ac.in' LIMIT 1),
      v_proc_namratha, 'Dr. Namratha M', '92759354', true
    )
    RETURNING id INTO v_team_id;

    INSERT INTO public.xtreme_members (team_id, is_lead, first_name, last_name, email, phone, ieee_member_id)
    VALUES (v_team_id, true, 'Soumya', 'Shah', 'soumyashah.ai25@bmsce.ac.in', '8197790898', '102880964');
  END IF;

  -- 6. WonderOfU
  IF NOT EXISTS (SELECT 1 FROM public.xtreme_teams WHERE lower(team_name) = 'wonderofu') THEN
    INSERT INTO public.xtreme_teams (team_name, leader_email, lead_user_id, proctor_id, proctor_name, proctor_ieee_id, vtools_verified)
    VALUES (
      'WonderOfU',
      'harikrishnakd.bs25@bmsce.ac.in',
      (SELECT id FROM auth.users WHERE lower(email) = 'harikrishnakd.bs25@bmsce.ac.in' LIMIT 1),
      v_proc_namratha, 'Dr. Namratha M', '92759354', true
    )
    RETURNING id INTO v_team_id;

    INSERT INTO public.xtreme_members (team_id, is_lead, first_name, last_name, email, phone, ieee_member_id)
    VALUES (v_team_id, true, 'Harikrishna', 'K D', 'harikrishnakd.bs25@bmsce.ac.in', '8431531434', '101917416');
  END IF;

  -- 7. TF141
  IF NOT EXISTS (SELECT 1 FROM public.xtreme_teams WHERE lower(team_name) = 'tf141') THEN
    INSERT INTO public.xtreme_teams (team_name, leader_email, lead_user_id, proctor_id, proctor_name, proctor_ieee_id, vtools_verified)
    VALUES (
      'TF141',
      'shivamkumar.cs25@bmsce.ac.in',
      (SELECT id FROM auth.users WHERE lower(email) = 'shivamkumar.cs25@bmsce.ac.in' LIMIT 1),
      v_proc_namratha, 'Dr. Namratha M', '92759354', true
    )
    RETURNING id INTO v_team_id;

    INSERT INTO public.xtreme_members (team_id, is_lead, first_name, last_name, email, phone, ieee_member_id)
    VALUES (v_team_id, true, 'Shivam', 'Kumar', 'shivamkumar.cs25@bmsce.ac.in', '7209903953', '102880769');
  END IF;

  -- 8. VoltaJ
  IF NOT EXISTS (SELECT 1 FROM public.xtreme_teams WHERE lower(team_name) = 'voltaj') THEN
    INSERT INTO public.xtreme_teams (team_name, leader_email, lead_user_id, proctor_id, proctor_name, proctor_ieee_id, vtools_verified)
    VALUES (
      'VoltaJ',
      'janyakumar.ee26@bmsce.ac.in',
      (SELECT id FROM auth.users WHERE lower(email) = 'janyakumar.ee26@bmsce.ac.in' LIMIT 1),
      v_proc_namratha, 'Dr. Namratha M', '92759354', true
    )
    RETURNING id INTO v_team_id;

    INSERT INTO public.xtreme_members (team_id, is_lead, first_name, last_name, email, phone, ieee_member_id)
    VALUES (v_team_id, true, 'Janya', 'Kumar', 'janyakumar.ee26@bmsce.ac.in', '9620888258', '102886015');
  END IF;

  -- 9. Undecided
  IF NOT EXISTS (SELECT 1 FROM public.xtreme_teams WHERE lower(team_name) = 'undecided') THEN
    INSERT INTO public.xtreme_teams (team_name, leader_email, lead_user_id, proctor_id, proctor_name, proctor_ieee_id, vtools_verified)
    VALUES (
      'Undecided',
      'nithyaneshwar.ci24@bmsce.ac.in',
      (SELECT id FROM auth.users WHERE lower(email) = 'nithyaneshwar.ci24@bmsce.ac.in' LIMIT 1),
      v_proc_namratha, 'Dr. Namratha M', '92759354', true
    )
    RETURNING id INTO v_team_id;

    INSERT INTO public.xtreme_members (team_id, is_lead, first_name, last_name, email, phone, ieee_member_id)
    VALUES (v_team_id, true, 'Nithyaneshwar', 'A', 'nithyaneshwar.ci24@bmsce.ac.in', '9943556666', '102228243');
  END IF;

  -- 10. BurningGold
  IF NOT EXISTS (SELECT 1 FROM public.xtreme_teams WHERE lower(team_name) = 'burninggold') THEN
    INSERT INTO public.xtreme_teams (team_name, leader_email, lead_user_id, proctor_id, proctor_name, proctor_ieee_id, vtools_verified)
    VALUES (
      'BurningGold',
      'sinchanabm.cd24@bmsce.ac.in',
      (SELECT id FROM auth.users WHERE lower(email) = 'sinchanabm.cd24@bmsce.ac.in' LIMIT 1),
      v_proc_swaroop, 'Swaroop BM', '102196859', true
    )
    RETURNING id INTO v_team_id;

    INSERT INTO public.xtreme_members (team_id, is_lead, first_name, last_name, email, phone, ieee_member_id)
    VALUES (v_team_id, true, 'Sinchana', 'B M', 'sinchanabm.cd24@bmsce.ac.in', '9449176135', '101812390');
  END IF;

  -- 11. Buggers (3 Members)
  IF NOT EXISTS (SELECT 1 FROM public.xtreme_teams WHERE lower(team_name) = 'buggers') THEN
    INSERT INTO public.xtreme_teams (team_name, leader_email, lead_user_id, proctor_id, proctor_name, proctor_ieee_id, vtools_verified)
    VALUES (
      'Buggers',
      'sohakhan.bs25@bmsce.ac.in',
      (SELECT id FROM auth.users WHERE lower(email) = 'sohakhan.bs25@bmsce.ac.in' LIMIT 1),
      v_proc_swaroop, 'Swaroop BM', '102196859', true
    )
    RETURNING id INTO v_team_id;

    INSERT INTO public.xtreme_members (team_id, is_lead, first_name, last_name, email, phone, ieee_member_id)
    VALUES 
      (v_team_id, true, 'Soha', 'Khan', 'sohakhan.bs25@bmsce.ac.in', '9653189877', '101939005'),
      (v_team_id, false, 'Vibha', 'S', 'vibhas.bs25@bmsce.ac.in', '9036648664', '101920438'),
      (v_team_id, false, 'Punith Kumar', 'B S', 'punithkumarbs.ai25@bmsce.ac.in', '6361846450', '102796108');
  END IF;

  -- 12. InfiniteReturn
  IF NOT EXISTS (SELECT 1 FROM public.xtreme_teams WHERE lower(team_name) = 'infinitereturn') THEN
    INSERT INTO public.xtreme_teams (team_name, leader_email, lead_user_id, proctor_id, proctor_name, proctor_ieee_id, vtools_verified)
    VALUES (
      'InfiniteReturn',
      'sanjanasingh.cs26@bmsce.ac.in',
      (SELECT id FROM auth.users WHERE lower(email) = 'sanjanasingh.cs26@bmsce.ac.in' LIMIT 1),
      v_proc_swaroop, 'Swaroop BM', '102196859', true
    )
    RETURNING id INTO v_team_id;

    INSERT INTO public.xtreme_members (team_id, is_lead, first_name, last_name, email, phone, ieee_member_id)
    VALUES (v_team_id, true, 'Sanjana', 'Singh', 'sanjanasingh.cs26@bmsce.ac.in', '8296842778', '102875251');
  END IF;

  -- 13. SyntaxTerrors
  IF NOT EXISTS (SELECT 1 FROM public.xtreme_teams WHERE lower(team_name) = 'syntaxterrors') THEN
    INSERT INTO public.xtreme_teams (team_name, leader_email, lead_user_id, proctor_id, proctor_name, proctor_ieee_id, vtools_verified)
    VALUES (
      'SyntaxTerrors',
      'adithyasivakumar.ec26@bmsce.ac.in',
      (SELECT id FROM auth.users WHERE lower(email) = 'adithyasivakumar.ec26@bmsce.ac.in' LIMIT 1),
      v_proc_swaroop, 'Swaroop BM', '102196859', false
    )
    RETURNING id INTO v_team_id;

    INSERT INTO public.xtreme_members (team_id, is_lead, first_name, last_name, email, phone, ieee_member_id)
    VALUES (v_team_id, true, 'Adithya', 'Sivakumar', 'adithyasivakumar.ec26@bmsce.ac.in', '9916222769', '102873409');
  END IF;

  -- 14. AlgoRogue
  IF NOT EXISTS (SELECT 1 FROM public.xtreme_teams WHERE lower(team_name) = 'algorogue') THEN
    INSERT INTO public.xtreme_teams (team_name, leader_email, lead_user_id, proctor_id, proctor_name, proctor_ieee_id, vtools_verified)
    VALUES (
      'AlgoRogue',
      'apekshaashok.cs25@bmsce.ac.in',
      (SELECT id FROM auth.users WHERE lower(email) = 'apekshaashok.cs25@bmsce.ac.in' LIMIT 1),
      v_proc_swaroop, 'Swaroop BM', '102196859', false
    )
    RETURNING id INTO v_team_id;

    INSERT INTO public.xtreme_members (team_id, is_lead, first_name, last_name, email, phone, ieee_member_id)
    VALUES (v_team_id, true, 'Apeksha ashok', 'gaonkar', 'apekshaashok.cs25@bmsce.ac.in', '6360182368', '102880881');
  END IF;

  -- 15. TheUltimateLifeform
  IF NOT EXISTS (SELECT 1 FROM public.xtreme_teams WHERE lower(team_name) = 'theultimatelifeform') THEN
    INSERT INTO public.xtreme_teams (team_name, leader_email, lead_user_id, proctor_id, proctor_name, proctor_ieee_id, vtools_verified)
    VALUES (
      'TheUltimateLifeform',
      'shreyasv.ec26@bmsce.ac.in',
      (SELECT id FROM auth.users WHERE lower(email) = 'shreyasv.ec26@bmsce.ac.in' LIMIT 1),
      v_proc_nethravathi, 'Nethravathi S', '90893108', false
    )
    RETURNING id INTO v_team_id;

    INSERT INTO public.xtreme_members (team_id, is_lead, first_name, last_name, email, phone, ieee_member_id)
    VALUES (v_team_id, true, 'Shreyas V', 'Poojary', 'shreyasv.ec26@bmsce.ac.in', '9886639547', '102879367');
  END IF;

END $$;
