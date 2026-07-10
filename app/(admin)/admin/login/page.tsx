import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950">
      <div className="w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-900 p-8 shadow-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
            <span className="text-lg font-bold text-white">M</span>
          </div>
          <h1 className="text-lg font-medium text-white sm:text-xl">Admin Login</h1>
          <p className="mt-1 text-sm text-zinc-500">Mark Developers</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
