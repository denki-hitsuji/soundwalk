-- performance_attachments の RLS ポリシー追加
-- パフォーマンスのオーナー、またはアクトのオーナー/アクティブメンバーが操作可能

ALTER TABLE public.performance_attachments ENABLE ROW LEVEL SECURITY;

-- SELECT: 自分のパフォーマンス、またはアクトメンバー/オーナーなら読める
CREATE POLICY "performance_attachments_select"
  ON public.performance_attachments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.musician_performances mp
      WHERE mp.id = performance_attachments.performance_id
        AND (
          mp.profile_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.acts a
            WHERE a.id = mp.act_id
              AND a.owner_profile_id = auth.uid()
          )
          OR EXISTS (
            SELECT 1 FROM public.act_members am
            WHERE am.act_id = mp.act_id
              AND am.profile_id = auth.uid()
              AND am.status = 'active'
          )
        )
    )
  );

-- INSERT: 自分のパフォーマンス、またはアクトのオーナー/アクティブメンバーなら追加できる
CREATE POLICY "performance_attachments_insert"
  ON public.performance_attachments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.musician_performances mp
      WHERE mp.id = performance_attachments.performance_id
        AND (
          mp.profile_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.acts a
            WHERE a.id = mp.act_id
              AND a.owner_profile_id = auth.uid()
          )
          OR EXISTS (
            SELECT 1 FROM public.act_members am
            WHERE am.act_id = mp.act_id
              AND am.profile_id = auth.uid()
              AND am.status = 'active'
          )
        )
    )
  );

-- DELETE: SELECT と同条件
CREATE POLICY "performance_attachments_delete"
  ON public.performance_attachments
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.musician_performances mp
      WHERE mp.id = performance_attachments.performance_id
        AND (
          mp.profile_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.acts a
            WHERE a.id = mp.act_id
              AND a.owner_profile_id = auth.uid()
          )
          OR EXISTS (
            SELECT 1 FROM public.act_members am
            WHERE am.act_id = mp.act_id
              AND am.profile_id = auth.uid()
              AND am.status = 'active'
          )
        )
    )
  );
