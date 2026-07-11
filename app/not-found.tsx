import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="flex min-h-[calc(100dvh-64px)] flex-col items-center justify-center bg-white px-4">
        <div className="text-center">
          <h1 className="mt-2 text-8xl font-bold leading-none text-black sm:text-9xl">
            404
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-black/60 sm:text-xl">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-full border border-black px-8 py-3 text-sm font-medium uppercase tracking-wider text-black transition-all hover:bg-black hover:text-white"
          >
            Back to Home
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
