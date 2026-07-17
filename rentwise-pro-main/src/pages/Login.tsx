import { Link } from "@tanstack/react-router";
import { MainLayout } from "@/layouts/MainLayout";
import { LoginForm } from "@/components/auth/LoginForm";

export default function Login() {
  return (
    <MainLayout>
      <section className="mx-auto max-w-md px-4 md:px-6 py-16">
        <div className="card-premium p-8">
          <h1 className="text-3xl font-bold">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">Login to continue renting.</p>
          <div className="mt-8">
            <LoginForm />
          </div>
          <p className="mt-6 text-sm text-center text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/register" className="text-primary font-medium hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </section>
    </MainLayout>
  );
}
