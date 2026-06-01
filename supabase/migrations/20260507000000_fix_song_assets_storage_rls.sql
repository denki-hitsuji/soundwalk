-- song-assets ストレージ RLS ポリシーを修正
-- 問題1: is_act_member が SECURITY DEFINER でないため、ネストした RLS チェーンが不安定
-- 問題2: アクトオーナー（act_members 未登録）がアップロードできない
-- 修正: is_active_act_member（SECURITY DEFINER）に変更 + オーナーチェック追加

DROP POLICY IF EXISTS "song_assets_insert_member" ON storage.objects;
DROP POLICY IF EXISTS "song_assets_read_member" ON storage.objects;
DROP POLICY IF EXISTS "song_assets_delete_member" ON storage.objects;

-- SELECT (ダウンロード/表示)
CREATE POLICY "song_assets_read_member"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'song-assets'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.act_songs s
    JOIN public.acts a ON a.id = s.act_id
    WHERE s.id = extract_act_song_id_from_object_name(name)
    AND (
      is_active_act_member(a.id, auth.uid())
      OR a.owner_profile_id = auth.uid()
    )
  )
);

-- INSERT (アップロード)
CREATE POLICY "song_assets_insert_member"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'song-assets'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.act_songs s
    JOIN public.acts a ON a.id = s.act_id
    WHERE s.id = extract_act_song_id_from_object_name(name)
    AND (
      is_active_act_member(a.id, auth.uid())
      OR a.owner_profile_id = auth.uid()
    )
  )
);

-- DELETE (削除)
CREATE POLICY "song_assets_delete_member"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'song-assets'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.act_songs s
    JOIN public.acts a ON a.id = s.act_id
    WHERE s.id = extract_act_song_id_from_object_name(name)
    AND (
      is_active_act_member(a.id, auth.uid())
      OR a.owner_profile_id = auth.uid()
    )
  )
);
