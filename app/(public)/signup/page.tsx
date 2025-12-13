// app/(public)/signup/page.tsx
"use client"; // or "use server" の構成に合わせて

import { supabase } from '@/lib/supabaseClient';

// これは「ただの関数（or server action）」として定義
export async function signup(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    console.error(error);
    return null;
  }

  return data.user;
}
// つづき：React コンポーネントを default export
import React, { useState } from "react";

// default は「ページコンポーネント」にする
export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const user = await signup(email, password);
    // 成功/失敗の処理など
  }

  return (
    <main>
      <h1>Sign up</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="メールアドレス"
        />
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="パスワード"
        />
        <button type="submit">アカウント作成</button>
      </form>
    </main>
  );
}
