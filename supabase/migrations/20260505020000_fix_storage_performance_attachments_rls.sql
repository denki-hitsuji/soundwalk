-- performance-attachments ストレージバケットのポリシー追加
-- アプリ側でオーナーチェック済みのため、認証済みユーザーに操作を許可する

-- SELECT (ダウンロード/表示)
CREATE POLICY "authenticated_can_select_performance_attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'performance-attachments'
  AND auth.role() = 'authenticated'
);

-- INSERT (アップロード)
CREATE POLICY "authenticated_can_insert_performance_attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'performance-attachments'
  AND auth.role() = 'authenticated'
);

-- UPDATE (上書き)
CREATE POLICY "authenticated_can_update_performance_attachments"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'performance-attachments'
  AND auth.role() = 'authenticated'
);

-- DELETE (削除)
CREATE POLICY "authenticated_can_delete_performance_attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'performance-attachments'
  AND auth.role() = 'authenticated'
);
