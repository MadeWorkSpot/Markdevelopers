export default function ComingSoon() {
  return (
    <div
      className="relative flex min-h-dvh flex-col items-center justify-center bg-stone-950 bg-cover bg-center px-6 text-center font-sans"
      style={{ backgroundImage: "url(/bg.jpeg)" }}
    >
      <div className="pointer-events-none absolute inset-0 bg-stone-950/60" />

      <div className="relative z-10">
        <div className="mx-auto mb-6 w-fit">
          <img
            src="/markDevelopersLogo.png"
            alt=""
            draggable={false}
            className="no-drag h-20 w-auto select-none"
          />
        </div>

        <div className="mx-auto my-5 h-px w-12 bg-amber-400" />

        <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl">
          Coming Soon
        </h1>

        <p className="mt-8 space-y-1.5 text-base text-stone-200 leading-relaxed">
          <span className="block">2nd Floor, Alhind Tower, Kovoor</span>
          <span className="block">Calicut, Kerala 673008</span>
          <span className="block">markgroupkerala@gmail.com</span>
          <span className="block">9447479274</span>
        </p>
      </div>
    </div>
  );
}
