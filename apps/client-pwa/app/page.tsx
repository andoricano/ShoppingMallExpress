"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import type { CartItem, Order, ProductPostDetail, ProductPostSummary } from "@mall/types";
import { HeroBanner, mainPageMock } from "@mall/mall-page-viewer";
import { ChevronLeft, ChevronRight, ShoppingCart, UserRound } from "lucide-react";
import { authProfile, getAuth } from "../lib/auth";
import { shopApi } from "../lib/api";
import InstallControl from "./components/InstallControl";

type Tab = "shop" | "cart" | "order";
const money = (value: number) => `${value.toLocaleString("ko-KR")}원`;

export default function Home() {
  const [tab, setTab] = useState<Tab>("shop");
  const [posts, setPosts] = useState<ProductPostSummary[]>([]);
  const [detail, setDetail] = useState<ProductPostDetail | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [selectedQuantity, setSelectedQuantity] = useState(1);
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
      const data = await shopApi.posts();
      if (signal?.aborted) return;
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

  // The Supabase client sends the session itself; this only guards against offline use and account switches.
  async function requireSession() {
    if (!navigator.onLine) throw new Error("네트워크 연결 후 이용해 주세요.");
    const expectedOwner = owner.current;
    const { data, error } = await getAuth().auth.getSession();
    if (error || !data.session) throw new Error("로그인이 필요합니다.");
    if (owner.current !== expectedOwner || data.session.user.id !== expectedOwner) throw new Error("계정이 변경되었습니다. 다시 시도해 주세요.");
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
    await requireSession();
    const { items } = await shopApi.cart();
    if (epoch !== authEpoch.current) return;
    setCart(items); setTab("cart"); setOrder(null);
  }

  async function openProductDetail(postId: string) {
    const nextDetail = await shopApi.post(postId);
    if (!nextDetail) throw new Error("판매 중인 상품 게시물이 아닙니다.");
    const firstVariant = nextDetail.products.flatMap((product) => product.variants).find((variant) => variant.isAvailable);
    setDetail(nextDetail);
    setSelectedImageIndex(0);
    setSelectedVariantId(firstVariant?.id ?? "");
    setSelectedQuantity(1);
  }

  const detailImages = detail
    ? [detail.thumbnailUrl, ...detail.products.flatMap((product) => product.imageUrls)].filter((image): image is string => Boolean(image))
    : [];
  // ProductVariant is the sellable unit; only consumer-safe availability is shown.
  const detailVariants = detail
    ? detail.products.flatMap((product) => product.variants.map((variant) => ({ product, variant })))
    : [];
  const selected = detailVariants.find(({ variant }) => variant.id === selectedVariantId);

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
    {tab === "shop" && !detail && mainPageMock.hero.map((hero) => <HeroBanner key={hero.id} section={hero} onNavigate={() => { setTab("shop"); setDetail(null); setError(""); }} />)}
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 sm:pt-8 lg:px-8">
    {!online && <p role="status" className="mb-4 rounded-xl bg-amber-100 p-4">로그인을 해주세요. 주문은 로그인·장바구니·주문은 연결 후 이용할 수 있습니다.</p>}
    {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-red-800">{error}</p>}
    {notice && <p role="status" className="mb-4 rounded-xl bg-emerald-50 p-4">{notice}</p>}
    {busy && <p role="status" className="mb-4 text-sm">처리 중입니다…</p>}

    {tab === "shop" && !detail && <>
      <div className="mb-10 mt-8"><h2 className="text-2xl font-bold tracking-tight text-neutral-900">추천 상품</h2></div>
      {loadingPosts ? <p role="status">상품을 불러오는 중입니다…</p> : <>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
          {posts.map((post) => <button key={post.id} type="button" aria-label={`${post.title} 상세 보기`} className="block min-w-0 text-left transition-transform hover:-translate-y-0.5 focus-visible:rounded-xl disabled:hover:translate-y-0" disabled={busy || !online} onClick={() => void run(async () => { await openProductDetail(post.id); })}>
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="aspect-square overflow-hidden bg-neutral-100">{post.thumbnailUrl ? <img src={post.thumbnailUrl} alt={post.title} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-sm text-neutral-400">대표 이미지 없음</div>}</div>
              <div className="p-4"><h3 className="truncate text-sm font-semibold text-neutral-900">{post.title}</h3>{post.summary && <p className="mt-1 line-clamp-2 text-xs text-neutral-500">{post.summary}</p>}</div>
            </div>
          </button>)}
        </div>
        {!posts.length && <p className="py-8">아직 표시할 상품이 없습니다.</p>}
      </>}
    </>}

    {tab === "shop" && detail && <section className="mx-auto max-w-5xl">
      <button className="mb-6 min-h-11 text-sm font-medium underline underline-offset-4" onClick={() => setDetail(null)}>← 상품 목록</button>
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-14">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="aspect-square overflow-hidden rounded-xl bg-neutral-100">
            {detailImages[selectedImageIndex] ? <img src={detailImages[selectedImageIndex]} alt={detail.title} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-sm text-neutral-400">대표 이미지 없음</div>}
          </div>
          {detailImages.length > 0 && <div className="mt-4 flex items-center gap-2">
            <button type="button" aria-label="이전 상품 이미지" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-30" disabled={detailImages.length <= 1} onClick={() => setSelectedImageIndex((index) => (index - 1 + detailImages.length) % detailImages.length)}><ChevronLeft size={16} /></button>
            <div className="flex min-w-0 gap-2 overflow-hidden">{detailImages.map((image, index) => <button key={`${image}-${index}`} type="button" aria-label={`상품 이미지 ${index + 1}`} className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 ${selectedImageIndex === index ? "border-blue-500" : "border-transparent"}`} onClick={() => setSelectedImageIndex(index)}><img src={image} alt="" className="h-full w-full object-cover" /></button>)}</div>
            <button type="button" aria-label="다음 상품 이미지" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-30" disabled={detailImages.length <= 1} onClick={() => setSelectedImageIndex((index) => (index + 1) % detailImages.length)}><ChevronRight size={16} /></button>
          </div>}
          <div className="mt-6"><h1 className="text-2xl font-bold text-slate-900">{detail.title}</h1>{detail.summary && <p className="mt-2 text-sm text-slate-500">{detail.summary}</p>}</div>
        </div>
        <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="space-y-6">
            <div><h2 className="text-lg font-semibold text-slate-900">상품 선택</h2><div className="mt-3 space-y-2">{detailVariants.map(({ product, variant }) => <button key={variant.id} type="button" disabled={!variant.isAvailable} className={`w-full rounded-lg border p-4 text-left transition-colors disabled:opacity-50 ${selectedVariantId === variant.id ? "border-slate-900 bg-slate-50" : "border-slate-200 hover:bg-slate-50"}`} onClick={() => { setSelectedVariantId(variant.id); setSelectedQuantity(1); }}><span className="flex items-center justify-between gap-4"><span className="font-medium text-slate-900">{[product.name, variant.label].filter(Boolean).join(" / ")}</span><span className="font-semibold text-slate-900">{variant.isAvailable ? money(variant.price) : variant.stockStatus === "OUT_OF_STOCK" ? "품절" : "판매 중지"}</span></span></button>)}</div></div>
            <div className="h-px bg-slate-200" />
            {selected && <div><label className="text-sm font-semibold text-slate-700">수량</label><div className="mt-2 flex items-center"><button type="button" aria-label="수량 감소" className="flex h-11 w-11 items-center justify-center rounded-l-lg border border-slate-200 bg-white text-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40" disabled={selectedQuantity <= 1} onClick={() => setSelectedQuantity((quantity) => Math.max(1, quantity - 1))}>−</button><span className="flex h-11 min-w-14 items-center justify-center border-y border-slate-200 text-sm font-semibold">{selectedQuantity}</span><button type="button" aria-label="수량 증가" className="flex h-11 w-11 items-center justify-center rounded-r-lg border border-slate-200 bg-white text-lg text-slate-600 hover:bg-slate-50" onClick={() => setSelectedQuantity((quantity) => Math.min(99, quantity + 1))}>+</button></div></div>}
            <div className="flex items-center justify-between"><span className="text-sm text-slate-500">총 상품 금액</span><span className="text-xl font-bold text-slate-900">{selected ? money(selected.variant.price * selectedQuantity) : money(0)}</span></div>
            <button type="button" className="action min-h-11 w-full" disabled={busy || !online || !session || !selected?.variant.isAvailable} onClick={() => void run(async (epoch) => { if (!selected) return; await requireSession(); await shopApi.add(selected.product.id, selected.variant.id, selectedQuantity); if (epoch === authEpoch.current) setNotice("장바구니에 담았습니다."); })}>장바구니에 담기</button>
            {!detailVariants.length && <p className="text-sm text-neutral-600">구매 가능한 옵션이 없습니다.</p>}
            {!session && <p className="text-sm text-neutral-600">상품을 담으려면 먼저 Google로 로그인해 주세요.</p>}
          </div>
        </section>
      </div>
    </section>}

    {tab === "cart" && <section className="mx-auto max-w-5xl">
      <header className="mb-8 border-b border-neutral-200 pb-6"><p className="text-xs font-medium tracking-[.18em] text-neutral-500">SHOPPING BAG</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">장바구니</h1><p className="mt-2 text-sm text-neutral-600">담아둔 상품을 확인하고 테스트 주문을 만들 수 있습니다.</p></header>
      {!session ? <div className="border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-600">로그인이 필요합니다.</div> : <>
        <div className="space-y-4">
          {cart.map((item) => <article key={item.id} className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:gap-5 sm:p-5">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100 sm:h-24 sm:w-24">{item.imageUrl ? <img src={item.imageUrl} alt={item.productName} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-xs text-slate-400">이미지 없음</div>}</div>
            <div className="min-w-0 flex-1"><h2 className="truncate text-sm font-semibold text-slate-900">{[item.productName, item.variantLabel].filter(Boolean).join(" / ")}</h2><p className="mt-1 text-sm text-slate-500">{item.isAvailable ? money(item.price) : item.stockStatus === "OUT_OF_STOCK" ? "품절" : "판매 중지"}</p><p className="mt-1 text-xs text-slate-500">수량 {item.quantity}개</p></div>
            <p className="hidden w-28 text-right text-sm font-bold text-slate-900 sm:block">{money(item.price * item.quantity)}</p>
            <button type="button" className="min-h-11 text-xs text-slate-400 transition-colors hover:text-slate-900" disabled={busy || !online} onClick={() => void run(async (epoch) => { await requireSession(); await shopApi.remove(item.id); await openCart(epoch); })}>삭제</button>
          </article>)}
          {!cart.length && <div className="flex min-h-60 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50"><p className="text-sm text-slate-400">장바구니가 비어 있습니다.</p></div>}
        </div>
        {cart.length > 0 && <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <p className="flex items-center justify-between"><span className="text-sm text-slate-500">총 상품 금액</span><span className="text-2xl font-bold text-slate-900">{money(cart.reduce((sum, item) => sum + item.price * item.quantity, 0))}</span></p>
          <form key={addressVersion} className="space-y-4 border-t border-neutral-200 pt-5" onSubmit={(event) => {
            event.preventDefault();
            if (submitted) return;
            const form = new FormData(event.currentTarget);
            void run(async (epoch) => {
              await requireSession();
              if (epoch !== authEpoch.current) return;
              setSubmitted(true);
              try {
                const createdOrderId = await shopApi.createOrder({
                  recipientName: String(form.get("recipientName")), phone: String(form.get("phone")), zonecode: String(form.get("zonecode")), address: String(form.get("address")), addressDetail: String(form.get("addressDetail") || ""),
                });
                if (epoch !== authEpoch.current) return;
                if (!createdOrderId) throw new Error("주문 결과에 주문 번호가 없습니다.");
                setCart([]); setOrderId(createdOrderId); setTab("order"); setNotice(`주문이 생성되었습니다. 주문 번호: ${createdOrderId}`);
                const confirmed = await shopApi.order(createdOrderId);
                if (epoch === authEpoch.current) setOrder(confirmed);
              } catch (cause) {
                throw new Error(`${cause instanceof Error ? cause.message : "주문 요청 실패"} 주문이 접수되었을 수 있으므로 재시도 전 관리자에게 확인해 주세요.`);
              }
            });
          }}>
            <h2 className="text-lg font-semibold">배송지 · 주문</h2>
            <p className="text-sm leading-6 text-neutral-600">장바구니 전체가 주문되며, 주문은 결제 대기(PENDING) 상태로 생성됩니다. 결제는 이 앱에서 진행하지 않습니다.</p>
            {([["recipientName", "받는 분", "name"], ["phone", "연락처", "tel"], ["zonecode", "우편번호", "postal-code"], ["address", "주소", "street-address"], ["addressDetail", "상세 주소", "address-line2"]] as const).map(([name, label, autoComplete]) => <label key={name} className="block text-sm">{label}<input className="field mt-1" name={name} autoComplete={autoComplete} type={name === "phone" ? "tel" : "text"} required={name !== "addressDetail"} maxLength={200} /></label>)}
            {submitted && <p role="status">주문 요청이 전송되었습니다. 중복 방지를 위해 추가 전송을 막았습니다. 주문 조회 또는 관리자 확인 후 새로 방문해 주세요.</p>}
            <button className="action min-h-11 w-full" disabled={busy || !online || submitted}>주문 생성</button>
          </form>
        </section>}
      </>}
    </section>}

    {tab === "order" && <section className="mx-auto max-w-3xl">
      <header className="border-b border-neutral-200 pb-6"><p className="text-xs font-medium tracking-[.18em] text-neutral-500">ORDER HISTORY</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">내 주문 조회</h1><p className="mt-2 text-sm leading-6 text-neutral-600">주문 번호로 로그인한 계정의 주문을 확인합니다. 결제 대기(PENDING) 주문은 결제 완료를 의미하지 않습니다.</p></header>
      <form className="mt-6 flex flex-col gap-3 sm:flex-row" onSubmit={(event) => { event.preventDefault(); void run(async (epoch) => {
        setOrder(null); await requireSession(); const result = await shopApi.order(orderId.trim());
        if (!result) throw new Error("주문을 찾을 수 없습니다.");
        if (epoch === authEpoch.current) setOrder(result);
      }); }}>
        <label className="grow"><span className="sr-only">주문 번호</span><input className="field" placeholder="주문 번호" value={orderId} onChange={(event) => setOrderId(event.target.value)} required /></label>
        <button className="action min-h-11 shrink-0" disabled={busy || !online || !session}>조회</button>
      </form>
      {!session && <p className="mt-5 border border-dashed border-neutral-300 bg-white p-5 text-sm text-neutral-600">로그인 후 주문을 조회할 수 있습니다.</p>}
      {order && <article className="mt-6 space-y-4 border border-neutral-200 bg-white p-5 sm:p-6">
        <h2 className="break-all font-semibold">주문 {order.id}</h2><p>상태: {order.status} · {money(order.totalAmount)}</p>
        {order.items?.map((item) => <p key={item.id}>{[item.productNameSnapshot, item.variantLabelSnapshot].filter(Boolean).join(" / ")} · {item.quantity}개 · {money(item.lineTotal)}</p>)}
        {order.shippingAddress && <p>{String(order.shippingAddress.recipientName ?? "")} · {String(order.shippingAddress.address ?? "")} {String(order.shippingAddress.addressDetail ?? "")}</p>}
      </article>}
    </section>}
    <footer className="mt-16 border-t border-neutral-200 pt-6 text-xs text-neutral-500">MALL POCKET · 나만의 작은 쇼핑 공간</footer>
    </div>
  </main>;
}
