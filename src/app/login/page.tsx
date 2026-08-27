import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { LoginClient } from "./login-client";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const authed = await isAuthenticated();
  if (authed) redirect("/dashboard");

  const params = await searchParams;

  return <LoginClient from={params.from} />;
}
