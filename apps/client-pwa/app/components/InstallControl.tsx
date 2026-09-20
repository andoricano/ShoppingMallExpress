"use client";
import { useEffect, useState } from "react";
import { Download } from "lucide-react";

interface InstallEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}
export default function InstallControl() {
  const [prompt, setPrompt] = useState<InstallEvent | null>(null);
  const [message, setMessage] = useState("");
  useEffect(() => {
    const onPrompt = (event: Event) => { event.preventDefault(); setPrompt(event as InstallEvent); };
    const onInstalled = () => { setPrompt(null); setMessage("설치되었습니다."); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => setMessage("오프라인 기능을 준비하지 못했습니다. 연결 후 다시 방문해 주세요."));
    }
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);
  return <div className="text-xs text-neutral-600">
    <button type="button" aria-label="홈 화면에 추가" className="inline-flex h-11 w-11 items-center justify-center text-neutral-700 transition-colors hover:text-black" onClick={async () => {
      if (!prompt) { setMessage("브라우저 메뉴에서 ‘앱 설치’ 또는 ‘홈 화면에 추가’를 선택하세요. iOS에서는 Safari의 공유 메뉴를 이용하세요."); return; }
      try { await prompt.prompt(); await prompt.userChoice; setPrompt(null); }
      catch { setMessage("브라우저 메뉴에서 홈 화면에 추가해 주세요."); }
    }}><Download className="h-5 w-5" strokeWidth={1.8} /><span className="sr-only">홈 화면에 추가</span></button>
    {message && <p role="status" className="mt-2 max-w-sm">{message}</p>}
  </div>;
}
