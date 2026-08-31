// import { notFound } from "next/navigation";

// export default async function ProductDetailPage({
//   params,
// }: {
//   params: Promise<{ id: string }>;
// }) {
//   const { id } = await params;
//   const product = FEATURED_PRODUCTS.find((p) => p.productId === id);

//   if (!product) {
//     notFound();
//   }

//   return (
//     <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
//         {/* Left: 상품 이미지 */}
//         <div className="aspect-square bg-neutral-100 overflow-hidden relative">
//           <img
//             src={product.mainImageUrl}
//             alt={product.productName}
//             className="w-full h-full object-cover object-center"
//           />
//         </div>

//         {/* Right: 구매 폼 */}
//         <ProductPurchaseForm product={product} />
//       </div>

//       {/* Bottom: 상품 상세 및 정보 */}
//       <section className="border-t border-neutral-200 pt-12">
//         <h2 className="text-xl font-bold mb-6">상세 정보</h2>
//         <div className="prose max-w-none text-neutral-700 leading-relaxed">
//           <p>{product.description}</p>
//           <div className="mt-8 p-6 bg-neutral-50 rounded">
//             <h3 className="text-sm font-bold mb-2">배송 / 교환 / 반품 안내</h3>
//             <ul className="text-xs text-neutral-500 space-y-1">
//               <li>• 배송비: 기본 3,000원 (50,000원 이상 구매 시 무료배송)</li>
//               <li>• 출고 일정: 평일 오후 2시 이전 주문 시 당일 출고</li>
//               <li>• 반품/교환: 상품 수령 후 7일 이내 가능 (단순 변심 시 왕복 택배비 발생)</li>
//             </ul>
//           </div>
//         </div>
//       </section>
//     </main>
//   );
// }