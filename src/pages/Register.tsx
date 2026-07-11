import { Link } from "@tanstack/react-router";
import { MainLayout } from "@/layouts/MainLayout";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default function Register() {
  return (
    <MainLayout>
      <section className="mx-auto max-w-md px-4 md:px-6 py-16">
        <div className="card-premium p-8">
          <h1 className="text-3xl font-bold">Create your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">Join 50k+ creators renting smarter.</p>
          <div className="mt-8">
            <RegisterForm />
          </div>
          <p className="mt-6 text-sm text-center text-muted-foreground">
            Have an account?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Login
            </Link>
          </p>
        </div>
      </section>
    </MainLayout>
  );
}
