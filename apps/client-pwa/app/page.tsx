"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import type { CartItem, Order, ProductPost } from "@mall/types";
import { ProductCard } from "@mall/mall-page-viewer";
import { ProductPostCard } from "@mall/tiptap";
import { ShoppingCart, UserRound } from "lucide-react";
import { authProfile, getAuth } from "../lib/auth";
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
      const applySession = (next: Session | null) => {
        if (owner.current !== next?.user.id) {
          owner.current = next?.user.id;
          authEpoch.current += 1;
          setCart([]); setOrder(null); setOrderId(""); setSubmitted(false);
          setAddressVersion((value) => value + 1); setNotice(""); setError("");
        }
        setSession(next); setAuthReady(true);
      };
      const { data } = auth.auth.onAuthStateChange((_event, next) => {
        applySession(next);
      });
      unsubscribe = () => data.subscription.unsubscribe();
      void authProfile.getSession().then(applySession).catch((cause) => {
        setError(cause instanceof Error ? cause.message : "로그인 설정을 확인해 주세요.");
        setAuthReady(true);
      });
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

  return <main className="min-h-screen bg-neutral-50 text-neutral-900">
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
        <Link href="/" onClick={() => { setTab("shop"); setDetail(null); setError(""); }} className="shrink-0 text-xl font-bold tracking-wider text-neutral-900">MALL</Link>
        <div className="ml-auto flex items-center gap-1 text-sm font-medium text-neutral-700">
          <InstallControl />
          {session ? <>
            <button type="button" aria-label="장바구니" className="inline-flex h-11 w-11 items-center justify-center transition-colors hover:text-black" disabled={busy || !online} onClick={() => void run(openCart)}><ShoppingCart className="h-5 w-5" strokeWidth={1.8} /></button>
            <button type="button" aria-label="주문 조회" className="inline-flex h-11 w-11 items-center justify-center transition-colors hover:text-black" disabled={busy} onClick={() => { setTab("order"); setDetail(null); setError(""); }}><UserRound className="h-5 w-5" strokeWidth={1.8} /></button>
            <span className="mx-2 hidden h-4 w-px bg-neutral-200 sm:block" />
            <button type="button" className="min-h-11 px-2 text-xs text-neutral-500 transition-colors hover:text-black" disabled={busy || !online} onClick={() => void run(async () => { await authProfile.signOut(); })}>로그아웃</button>
          </> : <button type="button" className="min-h-11 rounded-md bg-neutral-900 px-3.5 text-xs font-semibold text-white transition-colors hover:bg-neutral-800" disabled={busy || !authReady || !online} onClick={() => void run(async () => { await authProfile.signInWithGoogle(); })}>{!authReady ? "확인 중…" : "Google 로그인"}</button>}
        </div>
      </div>
    </header>
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 sm:pt-8 lg:px-8">
    {!online && <p role="status" className="mb-4 rounded-xl bg-amber-100 p-4">로그인을 해주세요. 주문은 로그인·장바구니·주문은 연결 후 이용할 수 있습니다.</p>}
    {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-red-800">{error}</p>}
    {notice && <p role="status" className="mb-4 rounded-xl bg-emerald-50 p-4">{notice}</p>}
    {busy && <p role="status" className="mb-4 text-sm">처리 중입니다…</p>}

    {tab === "shop" && !detail && <>
      <section className="my-2 grid gap-8 border border-neutral-200 bg-white p-6 sm:my-4 sm:grid-cols-2 sm:p-10 lg:p-12">
        <div><p className="mb-4 text-xs font-medium tracking-[.2em] text-neutral-500">EVERYDAY, A LITTLE BETTER</p><h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">일상에 더하는<br />작은 즐거움.</h1><p className="mt-5 max-w-md text-sm leading-6 text-neutral-600 sm:text-base">마음에 드는 상품을 발견하고, 가볍게 담아보세요.</p></div>
        <div className="flex min-h-28 items-end justify-start border-t border-neutral-200 pt-5 text-5xl font-light tracking-tight text-neutral-300 sm:min-h-0 sm:justify-end sm:border-l sm:border-t-0 sm:pl-8 sm:pt-0 sm:text-7xl" aria-hidden="true">MALL.</div>
      </section>
      <div className="mb-6 mt-10 flex flex-col gap-4 sm:mt-14 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-medium tracking-[.18em] text-neutral-500">CURATED FOR YOU</p><h2 className="mt-2 text-2xl font-semibold tracking-tight">지금 만나보세요</h2></div><label className="w-full sm:w-72"><span className="sr-only">상품 검색</span><input className="field" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="상품 이름으로 검색" /></label></div>
      {loadingPosts ? <p role="status">상품을 불러오는 중입니다…</p> : <>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
          {posts.filter((post) => post.title.toLowerCase().includes(search.toLowerCase())).map((post) => <button key={post.id} type="button" aria-label={`${post.thumbnail.title} 상세 보기`} className="block min-w-0 text-left transition-transform hover:-translate-y-0.5 focus-visible:rounded-xl disabled:hover:translate-y-0" disabled={busy || !online} onClick={() => void run(async () => setDetail(await shopApi.post(post.id)))}>
            <ProductPostCard
              imageUrl={post.thumbnail.imageUrl}
              title={post.thumbnail.title}
              summary={post.thumbnail.summary}
              discount={post.thumbnail.discount}
              price={post.thumbnail.price}
              tags={post.thumbnail.tags}
            />
          </button>)}
        </div>
        {!posts.length && <p className="py-8">아직 표시할 상품이 없습니다.</p>}
        {posts.length > 0 && !posts.some((post) => post.title.toLowerCase().includes(search.toLowerCase())) && <p>검색 결과가 없습니다.</p>}
        <button className="mt-6 underline" disabled={busy || !online} onClick={() => void loadPosts()}>상품 새로고침</button>
      </>}
    </>}

    {tab === "shop" && detail && <section className="mx-auto max-w-5xl">
      <button className="mb-6 min-h-11 text-sm font-medium underline underline-offset-4" onClick={() => setDetail(null)}>← 상품 목록</button>
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-14">
        <div className="lg:sticky lg:top-24 lg:self-start"><ProductCard product={{ id: detail.id, ...detail.thumbnail }} cardType="DISCOUNT" /></div>
        <div><p className="text-xs font-medium tracking-[.18em] text-neutral-500">PRODUCT DETAIL</p><h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{detail.title}</h1>
      <h2 className="mt-8 border-t border-neutral-200 pt-6 text-lg font-semibold">옵션 선택</h2>
      <div className="mt-4 space-y-3">{[...(detail.productPostProducts ?? [])].sort((a, b) => a.displayOrder - b.displayOrder).map(({ products: product }) => product && <form key={product.id} className="flex flex-col gap-4 border border-neutral-200 bg-white p-4 sm:flex-row sm:items-end sm:p-5" onSubmit={(event) => {
        event.preventDefault();
        const quantity = Number(new FormData(event.currentTarget).get("quantity"));
        void run(async (epoch) => {
          await shopApi.add(await token(), product.id, quantity);
          if (epoch === authEpoch.current) setNotice("장바구니에 담았습니다.");
        });
      }}><div className="mr-auto"><h3 className="font-semibold">{product.name}</h3><p className="mt-1 text-sm text-neutral-600">{money(product.price)}</p></div>
        <label className="w-full text-sm sm:w-20">수량<input className="field mt-1" name="quantity" type="number" min="1" max="99" step="1" defaultValue="1" required /></label>
        <button className="action min-h-11 shrink-0" disabled={busy || !online || !session}>담기</button>
      </form>)}</div>
      {!detail.productPostProducts?.length && <p className="mt-4">구매 가능한 옵션이 없습니다.</p>}
      {!session && <p className="mt-4 text-sm text-neutral-600">상품을 담으려면 먼저 Google로 로그인해 주세요.</p>}
        </div>
      </div>
    </section>}

    {tab === "cart" && <section className="mx-auto max-w-5xl">
      <header className="mb-8 border-b border-neutral-200 pb-6"><p className="text-xs font-medium tracking-[.18em] text-neutral-500">SHOPPING BAG</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">장바구니</h1><p className="mt-2 text-sm text-neutral-600">담아둔 상품을 확인하고 테스트 주문을 만들 수 있습니다.</p></header>
      {!session ? <div className="border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-600">로그인이 필요합니다.</div> : <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div className="space-y-3">
        {cart.map((item) => <article key={item.product.id} className="flex flex-col gap-4 border border-neutral-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="min-w-0"><h2 className="truncate font-semibold">{item.product.name}</h2><p className="mt-1 text-sm text-neutral-600">{item.quantity}개 · {money(item.product.price * item.quantity)}</p></div>
          <button className="min-h-11 self-start text-sm underline underline-offset-4 sm:self-auto" disabled={busy || !online} onClick={() => void run(async (epoch) => { await shopApi.remove(await token(), item.product.id); await openCart(epoch); })}>삭제</button>
        </article>)}
        {!cart.length && <div className="border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-500">장바구니가 비어 있습니다.</div>}
        </div>
        {cart.length > 0 && <aside className="space-y-5 border border-neutral-200 bg-white p-5 sm:p-6 lg:sticky lg:top-24">
          <p className="flex items-baseline justify-between gap-4 text-lg font-semibold"><span>상품 합계</span><span>{money(cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0))}</span></p>
          <form key={addressVersion} className="space-y-4 border-t border-neutral-200 pt-5" onSubmit={(event) => {
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
            <h2 className="text-lg font-semibold">배송지 · 테스트 주문</h2>
            <p className="text-sm leading-6 text-neutral-600">실결제는 진행하지 않습니다. 테스트 주문도 서버의 재고와 주문 데이터에 반영될 수 있습니다.</p>
            {([["recipient", "받는 분", "name"], ["phone", "연락처", "tel"], ["postalCode", "우편번호", "postal-code"], ["address", "주소", "street-address"], ["detailAddress", "상세 주소", "address-line2"]] as const).map(([name, label, autoComplete]) => <label key={name} className="block text-sm">{label}<input className="field mt-1" name={name} autoComplete={autoComplete} type={name === "phone" ? "tel" : "text"} required={name !== "detailAddress"} maxLength={200} /></label>)}
            {submitted && <p role="status">주문 요청이 전송되었습니다. 중복 방지를 위해 추가 전송을 막았습니다. 주문 조회 또는 관리자 확인 후 새로 방문해 주세요.</p>}
            <button className="action min-h-11 w-full" disabled={busy || !online || submitted}>테스트 주문 생성</button>
          </form>
        </aside>}
      </div>}
    </section>}

    {tab === "order" && <section className="mx-auto max-w-3xl">
      <header className="border-b border-neutral-200 pb-6"><p className="text-xs font-medium tracking-[.18em] text-neutral-500">ORDER HISTORY</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">내 주문 조회</h1><p className="mt-2 text-sm leading-6 text-neutral-600">주문 번호로 로그인한 계정의 주문을 확인합니다. 테스트 주문은 실결제 완료를 의미하지 않습니다.</p></header>
      <form className="mt-6 flex flex-col gap-3 sm:flex-row" onSubmit={(event) => { event.preventDefault(); void run(async (epoch) => {
        setOrder(null); const result = await shopApi.order(await token(), orderId.trim());
        if (epoch === authEpoch.current) setOrder(result);
      }); }}>
        <label className="grow"><span className="sr-only">주문 번호</span><input className="field" placeholder="주문 번호" value={orderId} onChange={(event) => setOrderId(event.target.value)} required /></label>
        <button className="action min-h-11 shrink-0" disabled={busy || !online || !session}>조회</button>
      </form>
      {!session && <p className="mt-5 border border-dashed border-neutral-300 bg-white p-5 text-sm text-neutral-600">로그인 후 주문을 조회할 수 있습니다.</p>}
      {order && <article className="mt-6 space-y-4 border border-neutral-200 bg-white p-5 sm:p-6">
        <h2 className="break-all font-semibold">주문 {order.id}</h2><p>상태: {order.status} · {money(order.totalPrice)}</p>
        {order.items?.map((item) => <p key={item.id}>{item.productName} · {item.quantity}개 · {money(item.price * item.quantity)}</p>)}
        <p>{order.shippingAddress.recipient} · {order.shippingAddress.address} {order.shippingAddress.detailAddress}</p>
      </article>}
    </section>}
    <footer className="mt-16 border-t border-neutral-200 pt-6 text-xs text-neutral-500">MALL POCKET · 나만의 작은 쇼핑 공간</footer>
    </div>
  </main>;
}
