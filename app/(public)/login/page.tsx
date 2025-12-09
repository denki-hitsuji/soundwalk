// app/login/page.tsx
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { getCurrentUserRole } from '@/lib/authRole';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      // ログイン成功 → role を見てリダイレクト先を決める
      const role = await getCurrentUserRole();

      if (role === 'musician') {
        router.push('/musician');
      } else if (role === 'venue') {
        router.push('/venue');
      } else {
        // role 未設定などの場合はトップへ
        router.push('/');
      }
    } catch (e: any) {
      console.error(e);
      setError('ログインに失敗しました。時間をおいて再度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold mb-6">ログイン</h1>

      {error && (
        <div className="mb-4 rounded border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <form className="space-y-4" onSubmit={handleLogin}>
        <div>
          <label className="block text-sm font-medium mb-1">メールアドレス</label>
          <input
            type="email"
            className="w-full rounded border px-3 py-2 text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">パスワード</label>
          <input
            type="password"
            className="w-full rounded border px-3 py-2 text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {loading ? 'ログイン中...' : 'ログイン'}
        </button>
      </form>
    </div>
  );
}
