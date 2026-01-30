"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // ナビゲーション完了時にリセット
    setIsNavigating(false);
    setProgress(0);
  }, [pathname, searchParams]);

  useEffect(() => {
    let progressInterval: NodeJS.Timeout;
    let hideTimeout: NodeJS.Timeout;

    const handleStart = () => {
      setIsNavigating(true);
      setProgress(10);

      // プログレスをゆっくり進める（90%まで）
      progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 200);
    };

    const handleComplete = () => {
      clearInterval(progressInterval);
      setProgress(100);
      hideTimeout = setTimeout(() => {
        setIsNavigating(false);
        setProgress(0);
      }, 200);
    };

    // リンククリックを監視
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");
      if (
        anchor &&
        anchor.href &&
        !anchor.target &&
        !anchor.download &&
        anchor.origin === window.location.origin &&
        anchor.pathname !== window.location.pathname
      ) {
        handleStart();
      }
    };

    // フォーム送信を監視
    const handleSubmit = () => {
      handleStart();
    };

    document.addEventListener("click", handleClick, true);
    document.addEventListener("submit", handleSubmit, true);

    return () => {
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("submit", handleSubmit, true);
      clearInterval(progressInterval);
      clearTimeout(hideTimeout);
    };
  }, []);

  if (!isNavigating) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-blue-100">
      <div
        className="h-full bg-blue-600 transition-all duration-200 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
