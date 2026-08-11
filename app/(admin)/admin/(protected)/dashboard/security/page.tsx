import { ChangePasswordForm } from "@/components/admin/ChangePasswordForm";

export default function SecurityPage() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-xl font-medium text-white sm:text-2xl">Security</h1>
        <p className="mt-1 text-sm text-zinc-400">Manage your account security</p>
      </div>

      <div className="max-w-md rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="text-sm font-medium text-zinc-400">Change password</h2>
        <p className="mt-1 text-sm text-zinc-500">
          You&apos;ll be signed out after changing your password.
        </p>
        <div className="mt-4">
          <ChangePasswordForm />
        </div>
      </div>
    </>
  );
}
