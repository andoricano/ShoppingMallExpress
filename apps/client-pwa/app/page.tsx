"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import type { CartItem, Order, ProductPost } from "@mall/types";
import { ProductCard } from "@mall/mall-page-viewer";
import { getAuth } from "../lib/auth";
import { shopApi, type ProductDetail } from "../lib/api";
import InstallControl from "./components/InstallControl";

type Tab = "shop" | "cart" | "order";
const money = (value: number) => `${value.toLocaleString("ko-KR")}원`;

export default function Home() {
  const [tab, setTab] = useState<Tab>("shop");
  const [posts, setPosts] = useState<ProductPost[]>([]);
  const [detail, setDetail] = useState<ProductDetail | null>(null);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [order, setOrder] = useState<Order | null>(null);
  const [orderId, setOrderId] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [online, setOnline] = useState(true);
  const [busy, setBusy] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [addressVersion, setAddressVersion] = useState(0);
  const lock = useRef(false);
  const authEpoch = useRef(0);
  const owner = useRef<string | undefined>(undefined);

  const loadPosts = useCallback(async (signal?: AbortSignal) => {
    setLoadingPosts(true);
    try {
      const data = await shopApi.posts(signal);
      if (!Array.isArray(data)) throw new Error("상품 응답 형식이 올바르지 않습니다.");
      setPosts(data);
    } catch (cause) {
      if (!signal?.aborted) setError(cause instanceof Error ? cause.message : "상품을 불러오지 못했습니다.");
    } finally { if (!signal?.aborted) setLoadingPosts(false); }
  }, []);

  // This client-only bootstrap synchronizes network, auth and initial catalog state.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const controller = new AbortController();
    void loadPosts(controller.signal);
    const updateOnline = () => setOnline(navigator.onLine);
    updateOnline();
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);
    let unsubscribe = () => {};
    try {
      const auth = getAuth();
      const { data } = auth.auth.onAuthStateChange((_event, next) => {
        if (owner.current !== next?.user.id) {
          owner.current = next?.user.id;
          authEpoch.current += 1;
          setCart([]); setOrder(null); setOrderId(""); setSubmitted(false);
          setAddressVersion((value) => value + 1); setNotice(""); setError("");
        }
        setSession(next); setAuthReady(true);
      });
      unsubscribe = () => data.subscription.unsubscribe();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "로그인 설정을 확인해 주세요."); setAuthReady(true);
    }
    if (new URLSearchParams(window.location.search).has("error")) setError("로그인에 실패했습니다. 다시 시도해 주세요.");
    return () => {
      controller.abort(); unsubscribe(); authEpoch.current += 1;
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
    };
  }, [loadPosts]);
  /* eslint-enable react-hooks/set-state-in-effect */

  async function token() {
    if (!navigator.onLine) throw new Error("네트워크 연결 후 이용해 주세요.");
    const expectedOwner = owner.current;
    const { data, error } = await getAuth().auth.getSession();
    if (error || !data.session) throw new Error("로그인이 필요합니다.");
    if (owner.current !== expectedOwner || data.session.user.id !== expectedOwner) throw new Error("계정이 변경되었습니다. 다시 시도해 주세요.");
    return data.session.access_token;
  }

  async function run(action: (epoch: number) => Promise<void>) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(""); setNotice("");
    const epoch = authEpoch.current;
    try { await action(epoch); }
    catch (cause) {
      if (epoch === authEpoch.current) setError(cause instanceof Error ? cause.message : "요청을 처리하지 못했습니다.");
    } finally { lock.current = false; setBusy(false); }
  }

  async function openCart(epoch: number) {
    const items = await shopApi.cart(await token());
    if (epoch !== authEpoch.current) return;
    setCart(items); setTab("cart"); setOrder(null);
  }

  return <main className="mx-auto max-w-6xl px-5 pb-16 sm:px-10">
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-300 py-6">
      <Link href="/" className="text-xl font-bold tracking-tight">mall<span className="ml-1 font-normal italic">pocket</span><span className="ml-3 text-xs font-normal tracking-widest">SHOP & GO</span></Link>
      <div className="flex items-center gap-4">
        <InstallControl />
        <button className="action" disabled={busy || !authReady || !online} onClick={() => void run(async () => {
          const auth = getAuth();
          if (session) {
            const { error } = await auth.auth.signOut(); if (error) throw error;
          } else {
            const { error } = await auth.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth/callback` } });
            if (error) throw error;
          }
        })}>{!authReady ? "확인 중…" : session ? "로그아웃" : "Google 로그인"}</button>
      </div>
    </header>

    <nav aria-label="주요 메뉴" className="my-6 flex gap-2">
      {([["shop", "상품"], ["cart", "장바구니"], ["order", "주문 조회"]] as const).map(([value, title]) =>
        <button key={value} aria-current={tab === value ? "page" : undefined} disabled={busy} className={tab === value ? "action" : "rounded-xl px-4 py-3"} onClick={() => {
          if (value === "cart") void run(openCart);
          else { setTab(value); setDetail(null); setError(""); }
        }}>{title}</button>)}
    </nav>
    {!online && <p role="status" className="mb-4 rounded-xl bg-amber-100 p-4">오프라인입니다. 현재 화면은 참고용이며 로그인·장바구니·주문은 연결 후 이용할 수 있습니다.</p>}
    {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-red-800">{error}</p>}
    {notice && <p role="status" className="mb-4 rounded-xl bg-emerald-50 p-4">{notice}</p>}
    {busy && <p role="status" className="mb-4 text-sm">처리 중입니다…</p>}

    {tab === "shop" && !detail && <>
      <section className="my-8 grid gap-5 rounded-3xl bg-[#e7ebe1] p-8 sm:grid-cols-2 sm:p-12">
        <div><p className="mb-4 text-xs tracking-[.25em]">EVERYDAY, A LITTLE BETTER</p><h1 className="text-4xl font-semibold leading-tight sm:text-5xl">일상에 더하는<br />작은 즐거움.</h1><p className="mt-5 text-stone-600">마음에 드는 상품을 발견하고, 가볍게 담아보세요.</p></div>
        <div className="flex items-end justify-end text-7xl font-light text-[#7f9980]" aria-hidden="true">m.</div>
      </section>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4"><h2 className="text-xl font-semibold">지금 만나보세요</h2><label className="w-full sm:w-72"><span className="sr-only">상품 검색</span><input className="field" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="상품 이름으로 검색" /></label></div>
      {loadingPosts ? <p role="status">상품을 불러오는 중입니다…</p> : <>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {posts.filter((post) => post.title.toLowerCase().includes(search.toLowerCase())).map((post) => <div key={post.id}>
            <ProductCard product={{ id: post.id, ...post.thumbnail }} cardType="DISCOUNT" />
            <button className="mt-2 w-full rounded-xl border border-stone-300 p-3" disabled={busy || !online} onClick={() => void run(async () => setDetail(await shopApi.post(post.id)))}>{post.thumbnail.title} 자세히 보기</button>
          </div>)}
        </div>
        {!posts.length && <p className="py-8">아직 표시할 상품이 없습니다.</p>}
        {posts.length > 0 && !posts.some((post) => post.title.toLowerCase().includes(search.toLowerCase())) && <p>검색 결과가 없습니다.</p>}
        <button className="mt-6 underline" disabled={busy || !online} onClick={() => void loadPosts()}>상품 새로고침</button>
      </>}
    </>}

    {tab === "shop" && detail && <section className="max-w-2xl space-y-5">
      <button className="underline" onClick={() => setDetail(null)}>← 상품 목록</button>
      <h1 className="text-3xl font-semibold">{detail.title}</h1>
      <ProductCard product={{ id: detail.id, ...detail.thumbnail }} cardType="DISCOUNT" />
      <h2 className="text-xl font-semibold">옵션 선택</h2>
      {[...(detail.productPostProducts ?? [])].sort((a, b) => a.displayOrder - b.displayOrder).map(({ products: product }) => product && <form key={product.id} className="flex flex-wrap items-end gap-4 rounded-xl bg-white p-5" onSubmit={(event) => {
        event.preventDefault();
        const quantity = Number(new FormData(event.currentTarget).get("quantity"));
        void run(async (epoch) => {
          await shopApi.add(await token(), product.id, quantity);
          if (epoch === authEpoch.current) setNotice("장바구니에 담았습니다.");
        });
      }}><div className="mr-auto"><h3 className="font-semibold">{product.name}</h3><p>{money(product.price)}</p></div>
        <label className="w-20 text-sm">수량<input className="field" name="quantity" type="number" min="1" max="99" step="1" defaultValue="1" required /></label>
        <button className="action" disabled={busy || !online || !session}>담기</button>
      </form>)}
      {!detail.productPostProducts?.length && <p>구매 가능한 옵션이 없습니다.</p>}
      {!session && <p>상품을 담으려면 먼저 Google로 로그인해 주세요.</p>}
    </section>}

    {tab === "cart" && <section className="max-w-2xl space-y-5">
      <h1 className="text-3xl font-semibold">장바구니</h1>
      {!session ? <p>로그인이 필요합니다.</p> : <>
        {cart.map((item) => <article key={item.product.id} className="flex items-center justify-between gap-4 rounded-xl bg-white p-5">
          <div><h2 className="font-semibold">{item.product.name}</h2><p>{item.quantity}개 · {money(item.product.price * item.quantity)}</p></div>
          <button className="underline" disabled={busy || !online} onClick={() => void run(async (epoch) => { await shopApi.remove(await token(), item.product.id); await openCart(epoch); })}>삭제</button>
        </article>)}
        {!cart.length ? <p>장바구니가 비어 있습니다.</p> : <>
          <p className="text-xl font-semibold">상품 합계 {money(cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0))}</p>
          <form key={addressVersion} className="space-y-4 rounded-2xl border border-stone-300 p-6" onSubmit={(event) => {
            event.preventDefault();
            if (submitted) return;
            const form = new FormData(event.currentTarget);
            void run(async (epoch) => {
              const accessToken = await token();
              if (epoch !== authEpoch.current) return;
              setSubmitted(true);
              try {
                const result = await shopApi.createOrder(accessToken, {
                  clientId: session.user.id,
                  paymentId: `test-${crypto.randomUUID()}`,
                  items: cart.map((item) => ({ productId: item.product.id, quantity: item.quantity })),
                  shippingAddress: { name: "기본 배송지", recipient: String(form.get("recipient")), phone: String(form.get("phone")), postalCode: String(form.get("postalCode")), address: String(form.get("address")), detailAddress: String(form.get("detailAddress") || "") },
                });
                if (epoch !== authEpoch.current) return;
                if (!result?.id) throw new Error("주문 결과에 주문 번호가 없습니다.");
                setOrderId(result.id); setTab("order"); setNotice(`테스트 주문이 생성되었습니다. 주문 번호: ${result.id}`);
                const confirmed = await shopApi.order(accessToken, result.id);
                if (epoch === authEpoch.current) setOrder(confirmed);
              } catch (cause) {
                throw new Error(`${cause instanceof Error ? cause.message : "주문 요청 실패"} 주문이 접수되었을 수 있으므로 재시도 전 관리자에게 확인해 주세요.`);
              }
            });
          }}>
            <h2 className="text-xl font-semibold">배송지 · 테스트 주문</h2>
            <p className="text-sm text-stone-600">실결제는 진행하지 않습니다. 테스트 주문도 서버의 재고와 주문 데이터에 반영될 수 있습니다.</p>
            {([["recipient", "받는 분", "name"], ["phone", "연락처", "tel"], ["postalCode", "우편번호", "postal-code"], ["address", "주소", "street-address"], ["detailAddress", "상세 주소", "address-line2"]] as const).map(([name, label, autoComplete]) => <label key={name} className="block text-sm">{label}<input className="field mt-1" name={name} autoComplete={autoComplete} type={name === "phone" ? "tel" : "text"} required={name !== "detailAddress"} maxLength={200} /></label>)}
            {submitted && <p role="status">주문 요청이 전송되었습니다. 중복 방지를 위해 추가 전송을 막았습니다. 주문 조회 또는 관리자 확인 후 새로 방문해 주세요.</p>}
            <button className="action w-full" disabled={busy || !online || submitted}>테스트 주문 생성</button>
          </form>
        </>}
      </>}
    </section>}

    {tab === "order" && <section className="max-w-2xl space-y-5">
      <h1 className="text-3xl font-semibold">내 주문 조회</h1>
      <p className="text-sm text-stone-600">주문 번호로 로그인한 계정의 주문을 확인합니다. 테스트 주문은 실결제 완료를 의미하지 않습니다.</p>
      <form className="flex gap-3" onSubmit={(event) => { event.preventDefault(); void run(async (epoch) => {
        setOrder(null); const result = await shopApi.order(await token(), orderId.trim());
        if (epoch === authEpoch.current) setOrder(result);
      }); }}>
        <label className="grow"><span className="sr-only">주문 번호</span><input className="field" placeholder="주문 번호" value={orderId} onChange={(event) => setOrderId(event.target.value)} required /></label>
        <button className="action" disabled={busy || !online || !session}>조회</button>
      </form>
      {!session && <p>로그인 후 주문을 조회할 수 있습니다.</p>}
      {order && <article className="space-y-4 rounded-2xl bg-white p-6">
        <h2 className="break-all font-semibold">주문 {order.id}</h2><p>상태: {order.status} · {money(order.totalPrice)}</p>
        {order.items?.map((item) => <p key={item.id}>{item.productName} · {item.quantity}개 · {money(item.price * item.quantity)}</p>)}
        <p>{order.shippingAddress.recipient} · {order.shippingAddress.address} {order.shippingAddress.detailAddress}</p>
      </article>}
    </section>}
    <footer className="mt-16 border-t border-stone-300 pt-6 text-xs text-stone-500">MALL POCKET · 나만의 작은 쇼핑 공간</footer>
  </main>;
}
