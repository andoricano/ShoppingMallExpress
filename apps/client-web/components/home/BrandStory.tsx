export default function BrandStory() {
  return (
    <section className="bg-neutral-50 border-t border-neutral-200 py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-xs font-bold tracking-widest text-neutral-400 uppercase">
              Brand Story
            </span>
            <h2 className="text-3xl font-bold text-neutral-900 mt-2 mb-6">
              본질에 집중한 디자인,
              <br />
              오래도록 함께하는 제품.
            </h2>
            <p className="text-neutral-600 leading-relaxed mb-4">
              우리는 불필요한 장식을 배제하고 기능과 미학의 균형을 고민합니다.
              일상에 자연스럽게 스며드는 제품을 만드는 것이 우리의 목표입니다.
            </p>
          </div>
          <div className="aspect-video bg-neutral-200 overflow-hidden">
            <img
              src="https://via.placeholder.com/800x450?text=Brand+Story"
              alt="Brand Story"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}