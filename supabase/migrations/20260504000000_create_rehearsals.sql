CREATE TABLE public.rehearsals (
  id                    uuid NOT NULL DEFAULT gen_random_uuid(),
  act_id                uuid NOT NULL,
  rehearsal_date        date NOT NULL,
  start_time            time without time zone,
  end_time              time without time zone,
  studio_name           text,
  memo                  text,
  performance_id        uuid,
  created_by_profile_id uuid NOT NULL,
  created_at            timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT rehearsals_pkey PRIMARY KEY (id),
  CONSTRAINT rehearsals_act_id_fkey
    FOREIGN KEY (act_id) REFERENCES public.acts(id) ON DELETE CASCADE,
  CONSTRAINT rehearsals_performance_id_fkey
    FOREIGN KEY (performance_id) REFERENCES public.musician_performances(id) ON DELETE SET NULL,
  CONSTRAINT rehearsals_created_by_profile_id_fkey
    FOREIGN KEY (created_by_profile_id) REFERENCES public.profiles(id)
);

ALTER TABLE public.rehearsals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rehearsals_select" ON public.rehearsals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.act_members
      WHERE act_members.act_id = rehearsals.act_id
        AND act_members.profile_id = auth.uid()
        AND act_members.status = 'active'
    )
  );

CREATE POLICY "rehearsals_insert" ON public.rehearsals
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.act_members
      WHERE act_members.act_id = rehearsals.act_id
        AND act_members.profile_id = auth.uid()
        AND act_members.status = 'active'
    )
    AND created_by_profile_id = auth.uid()
  );

CREATE POLICY "rehearsals_update" ON public.rehearsals
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.act_members
      WHERE act_members.act_id = rehearsals.act_id
        AND act_members.profile_id = auth.uid()
        AND act_members.status = 'active'
    )
  );

CREATE POLICY "rehearsals_delete" ON public.rehearsals
  FOR DELETE USING (
    created_by_profile_id = auth.uid()
  );
