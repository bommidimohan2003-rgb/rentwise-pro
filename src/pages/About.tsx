import { MainLayout } from "@/layouts/MainLayout";
import { stats } from "@/utils/mockData";

export default function About() {
  return (
    <MainLayout>
      <section className="mx-auto max-w-5xl px-4 md:px-6 py-16">
        <span className="text-xs uppercase tracking-wider text-primary font-semibold">
          About us
        </span>
        <h1 className="mt-3 text-4xl md:text-6xl font-bold">Access, not ownership.</h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl">
          We started Payent in 2026 with a simple idea: most premium tech sits idle 95% of the time.
          By connecting owners with people who need gear for a few days, we're building a more
          sustainable way to create.
        </p>

        <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s) => (
            <div
              key={s.label}
              className="relative overflow-hidden h-[135px] rounded-2xl group flex flex-col justify-end p-5 border border-border/40 shadow-sm text-left"
            >
              {/* Background Image */}
              {s.image && (
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                  style={{ backgroundImage: `url(${s.image})` }}
                />
              )}

              {/* High contrast gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent" />

              {/* Content */}
              <div className="relative z-10">
                <div className="text-3xl font-extrabold text-white tracking-tight">{s.value}</div>
                <div className="text-xs font-semibold text-white/85 mt-1 uppercase tracking-wider">
                  {s.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 grid md:grid-cols-2 gap-10">
          <div>
            <h2 className="text-2xl font-bold">Our mission</h2>
            <p className="mt-3 text-muted-foreground">
              Democratize access to professional-grade tech. Reduce e-waste. Empower every creator,
              everywhere.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-bold">Our values</h2>
            <ul className="mt-3 space-y-2 text-muted-foreground text-sm">
              <li>• Trust before scale.</li>
              <li>• Design for both sides of the marketplace.</li>
              <li>• Move fast — but never at users' expense.</li>
            </ul>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
