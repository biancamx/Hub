import Navbar from "@/components/Navbar";
import Carousel from "@/components/Carousel";
import InteractiveTutorial from "@/components/InteractiveTutorial";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await auth();

  const currentUser = {
    name: session?.user?.name || "Usuário",
    email: session?.user?.email || "",
    image: session?.user?.image || null,
    role: (session?.user as any)?.role || "user",
  };

  return (
    <main className="min-h-screen relative overflow-hidden flex flex-col justify-between selection:bg-blue-600 selection:text-white bg-gradient-to-b from-[#f0f4f8] via-[#e2e8f0] to-[#cbd5e1]" style={{ WebkitFontSmoothing: "antialiased" }}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-gradient-to-tr from-blue-400/20 via-sky-300/20 to-indigo-400/15 blur-[140px]" />
        <div className="absolute -bottom-20 -left-20 w-[600px] h-[600px] rounded-full bg-blue-300/15 blur-[160px]" />
        <div className="absolute -top-20 -right-20 w-[600px] h-[600px] rounded-full bg-sky-300/15 blur-[160px]" />
      </div>

      <div id="tour-header" className="relative z-30">
        <Navbar user={currentUser} />
      </div>

      <section className="relative z-10 flex-1 flex flex-col justify-center items-center px-2 sm:px-4 py-2 w-full">
        <div className="w-full max-w-[1700px] text-center">

          <div id="tour-hero-text" className="inline-block">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-semibold text-slate-900 tracking-tight font-sans mb-1 leading-tight" style={{ textRendering: "optimizeLegibility" }}>
              Tudo o que você precisa,
            </h1>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-black via-blue-900 to-blue-800 bg-clip-text text-transparent tracking-tight font-sans mb-3 leading-tight" style={{ textRendering: "optimizeLegibility" }}>
              em um só lugar.
            </h1>
          </div>

          <div id="tour-carousel-stage">
            <Carousel />
          </div>
        </div>
      </section>
      <InteractiveTutorial />
    </main>
  );
}
