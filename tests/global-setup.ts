import * as fs from "fs";
import * as path from "path";

export default async function globalSetup() {
  const response = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: "nagah123" }),
  });

  if (!response.ok) {
    throw new Error(`Auth failed: ${response.status}`);
  }

  const setCookie = response.headers.get("set-cookie");
  if (!setCookie) {
    throw new Error("No set-cookie header");
  }

  const authDir = path.join(__dirname, "tests", ".auth");
  fs.mkdirSync(authDir, { recursive: true });

  const token = setCookie.split(";")[0];
  const [name, value] = token.split("=");
  const storageState = {
    cookies: [
      {
        name,
        value,
        domain: "localhost",
        path: "/",
        httpOnly: true,
        sameSite: "Lax" as const,
        expires: -1,
      },
    ],
    origins: [],
  };
  fs.writeFileSync(
    path.join(authDir, "storage-state.json"),
    JSON.stringify(storageState)
  );
}
