-- アクトオーナーもリハーサルを操作できるよう RLS ポリシーを修正
DROP POLICY IF EXISTS "rehearsals_select" ON public.rehearsals;
DROP POLICY IF EXISTS "rehearsals_insert" ON public.rehearsals;
DROP POLICY IF EXISTS "rehearsals_update" ON public.rehearsals;

-- SELECT: メンバー OR オーナー
CREATE POLICY "rehearsals_select" ON public.rehearsals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.act_members
      WHERE act_members.act_id = rehearsals.act_id
        AND act_members.profile_id = auth.uid()
        AND act_members.status = 'active'
    )
    OR
    EXISTS (
      SELECT 1 FROM public.acts
      WHERE acts.id = rehearsals.act_id
        AND acts.owner_profile_id = auth.uid()
    )
  );

-- INSERT: (メンバー OR オーナー) AND 自分が作成者
CREATE POLICY "rehearsals_insert" ON public.rehearsals
  FOR INSERT WITH CHECK (
    (
      EXISTS (
        SELECT 1 FROM public.act_members
        WHERE act_members.act_id = rehearsals.act_id
          AND act_members.profile_id = auth.uid()
          AND act_members.status = 'active'
      )
      OR
      EXISTS (
        SELECT 1 FROM public.acts
        WHERE acts.id = rehearsals.act_id
          AND acts.owner_profile_id = auth.uid()
      )
    )
    AND created_by_profile_id = auth.uid()
  );

-- UPDATE: メンバー OR オーナー
CREATE POLICY "rehearsals_update" ON public.rehearsals
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.act_members
      WHERE act_members.act_id = rehearsals.act_id
        AND act_members.profile_id = auth.uid()
        AND act_members.status = 'active'
    )
    OR
    EXISTS (
      SELECT 1 FROM public.acts
      WHERE acts.id = rehearsals.act_id
        AND acts.owner_profile_id = auth.uid()
    )
  );
