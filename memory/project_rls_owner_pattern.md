---
name: RLS ポリシーのオーナー考慮パターン
description: Supabase RLS でアクトオーナーを考慮しないと INSERT/SELECT が弾かれる問題の教訓
type: project
---

RLS ポリシーは `act_members` の `status = 'active'` だけで判定するとアクトオーナーが操作できない。また、**Supabase Storage バケットも RLS ポリシーが必要**で、未設定だと全操作が拒否される。

**Why:** (1) `acts.owner_profile_id` のユーザーが `act_members` に登録されていない場合、メンバーチェックだけの RLS は弾く。(2) Storage バケットも `storage.objects` に INSERT/SELECT/DELETE ポリシーが未設定だと「new row violates row-level security policy」が発生する。本番で `rehearsals` テーブルと `performance-attachments` バケットで実例あり（2026-05-05）。

**How to apply:**

テーブルの RLS には必ず以下の OR 条件をセットで書く：
```sql
EXISTS (SELECT 1 FROM public.act_members WHERE act_id = ... AND profile_id = auth.uid() AND status = 'active')
OR
EXISTS (SELECT 1 FROM public.acts WHERE id = ... AND owner_profile_id = auth.uid())
```

Storage バケットには `storage.objects` に SELECT/INSERT/UPDATE/DELETE ポリシーをセットで定義する：
```sql
CREATE POLICY "authenticated_can_insert_<bucket>"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = '<bucket-name>'
  AND auth.role() = 'authenticated'
);
-- SELECT / UPDATE / DELETE も同様に追加
```
