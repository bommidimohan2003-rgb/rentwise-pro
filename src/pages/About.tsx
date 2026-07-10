import { MainLayout } from "@/layouts/MainLayout";
import { stats } from "@/utils/mockData";

export default function About() {
  return (
    <MainLayout>
      <section className="mx-auto max-w-5xl px-4 md:px-6 py-16">
        <span className="text-xs uppercase tracking-wider text-primary font-semibold">About us</span>
        <h1 className="mt-3 text-4xl md:text-6xl font-bold">Access, not ownership.</h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl">
          We started TechRent in 2022 with a simple idea: most premium tech sits idle 95% of the time.
          By connecting owners with people who need gear for a few days, we're building a more sustainable
          way to create.
        </p>

        <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s) => (
            <div key={s.label} className="card-premium p-6 text-center">
              <div className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{s.value}</div>
              <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="mt-16 grid md:grid-cols-2 gap-10">
          <div>
            <h2 className="text-2xl font-bold">Our mission</h2>
            <p className="mt-3 text-muted-foreground">
              Democratize access to professional-grade tech. Reduce e-waste. Empower every creator, everywhere.
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
