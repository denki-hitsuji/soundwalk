---
name: RLS ポリシーのオーナー考慮パターン
description: Supabase RLS でアクトオーナーを考慮しないと INSERT/SELECT が弾かれる問題の教訓
type: project
---

RLS ポリシーは `act_members` の `status = 'active'` だけで判定するとアクトオーナーが操作できない。

**Why:** `acts.owner_profile_id` のユーザーが `act_members` テーブルに登録されていない場合、メンバーチェックだけの RLS は弾く。本番で `rehearsals` テーブルの INSERT が 500 エラーになった実例あり（2026-05-05）。

**How to apply:** 新しいテーブルに RLS を書くときは必ず以下の OR 条件をセットで書く：
```sql
EXISTS (SELECT 1 FROM public.act_members WHERE act_id = ... AND profile_id = auth.uid() AND status = 'active')
OR
EXISTS (SELECT 1 FROM public.acts WHERE id = ... AND owner_profile_id = auth.uid())
```
