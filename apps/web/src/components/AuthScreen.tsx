import { useState, type FormEvent } from "react";
import { loginSchema, registerSchema } from "@milestone/shared";
import { useLogin, useRegister } from "../lib/queries";

type Mode = "login" | "register";

const FIELD =
  "min-h-11 w-full rounded-[10px] border-[1.5px] border-line bg-bg px-3 text-ink";

// One form, two modes. Validates in the browser with the SAME Zod schemas the
// API uses (instant feedback), but the API still validates again: a browser
// can be bypassed, so the server never trusts it.
export function AuthScreen() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const login = useLogin();
  const register = useRegister();
  const pending = login.isPending || register.isPending;

  const submit = (e: FormEvent) => {
    e.preventDefault(); // stop the browser's old-school full-page form submit
    setFormError(null);

    const schema = mode === "login" ? loginSchema : registerSchema;
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "Check your details");
      return;
    }

    const action = mode === "login" ? login : register;
    action.mutate(parsed.data, {
      onError: (err) => setFormError(err.message),
    });
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setFormError(null);
  };

  return (
    <main className="grid min-h-svh place-items-center px-4">
      <form
        onSubmit={submit}
        noValidate
        className="w-full max-w-sm rounded-2xl border border-line bg-card p-6"
      >
        <h1 className="text-3xl leading-tight font-extrabold">
          Milestone Tracker
        </h1>
        <p className="mt-1 mb-5 text-mute">
          {mode === "login"
            ? "Log in to see your plan."
            : "Create an account. You'll start with the 60-day sample plan."}
        </p>

        <label className="mb-3 grid gap-1 text-sm text-mute">
          Email
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={FIELD}
            required
          />
        </label>
        <label className="mb-4 grid gap-1 text-sm text-mute">
          Password
          <input
            type="password"
            // Tells password managers whether to fill a saved password or suggest a new one
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={FIELD}
            required
          />
        </label>

        <p role="alert" className="mb-3 min-h-5 text-sm text-l0">
          {formError}
        </p>

        <button
          type="submit"
          disabled={pending}
          className="min-h-11 w-full cursor-pointer rounded-full border-2 border-ink bg-ink font-semibold text-bg disabled:opacity-60"
        >
          {pending
            ? "Please wait…"
            : mode === "login"
              ? "Log in"
              : "Create account"}
        </button>

        <p className="mt-4 text-center text-sm text-mute">
          {mode === "login" ? "New here? " : "Already have an account? "}
          <button
            type="button"
            onClick={() => switchMode(mode === "login" ? "register" : "login")}
            className="cursor-pointer font-semibold text-accent underline"
          >
            {mode === "login" ? "Create an account" : "Log in"}
          </button>
        </p>
      </form>
    </main>
  );
}
