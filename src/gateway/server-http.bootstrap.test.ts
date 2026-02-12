import { describe, expect, it } from "vitest";
import { installGatewayTestHooks, getFreePort, startGatewayServer } from "./test-helpers.server.js";

installGatewayTestHooks({ scope: "suite" });

describe("bootstrap exchange endpoints", () => {
  it("rejects tampered bootstrap signatures", async () => {
    const port = await getFreePort();
    const server = await startGatewayServer(port, {
      bind: "loopback",
      auth: { mode: "token", token: "secret" },
    });

    const createRes = await fetch(`http://127.0.0.1:${port}/api/bootstrap/create`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer secret",
      },
      body: JSON.stringify({ ttlSec: 120 }),
    });
    const created = (await createRes.json()) as { code?: string };
    const code = String(created.code ?? "");
    const tampered = `${code}x`;

    const exchange = await fetch(
      `http://127.0.0.1:${port}/api/bootstrap/exchange?code=${encodeURIComponent(tampered)}`,
    );
    expect(exchange.status).toBe(400);
    const payload = (await exchange.json()) as { ok?: boolean; error?: string };
    expect(payload.ok).toBe(false);
    expect((payload.error ?? "").toLowerCase()).toContain("signature");

    await server.close();
  });

  it("rejects expired bootstrap codes", async () => {
    const port = await getFreePort();
    const server = await startGatewayServer(port, {
      bind: "loopback",
      auth: { mode: "token", token: "secret" },
    });

    const createRes = await fetch(`http://127.0.0.1:${port}/api/bootstrap/create`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer secret",
      },
      body: JSON.stringify({ ttlSec: 30 }),
    });
    const created = (await createRes.json()) as { code?: string };

    await new Promise((resolve) => setTimeout(resolve, 31_000));

    const exchange = await fetch(
      `http://127.0.0.1:${port}/api/bootstrap/exchange?code=${encodeURIComponent(String(created.code))}`,
    );
    expect(exchange.status).toBe(400);
    const payload = (await exchange.json()) as { ok?: boolean; error?: string };
    expect(payload.ok).toBe(false);
    expect((payload.error ?? "").toLowerCase()).toContain("expired");

    await server.close();
  }, 45_000);

  it("enforces allowedOrigins on bootstrap endpoints (missing origin denied)", async () => {
    const port = await getFreePort();
    const server = await startGatewayServer(port, {
      bind: "loopback",
      auth: {
        mode: "token",
        token: "secret",
        allowedOrigins: ["https://agentme.example"],
      },
    });

    const missingOrigin = await fetch(`http://127.0.0.1:${port}/api/bootstrap/create`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer secret",
      },
      body: JSON.stringify({ ttlSec: 120 }),
    });
    expect(missingOrigin.status).toBe(403);

    const allowedOrigin = await fetch(`http://127.0.0.1:${port}/api/bootstrap/create`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer secret",
        origin: "https://agentme.example",
      },
      body: JSON.stringify({ ttlSec: 120 }),
    });
    expect(allowedOrigin.status).toBe(200);

    await server.close();
  });

  it("creates and exchanges a bootstrap code once", async () => {
    const port = await getFreePort();
    const server = await startGatewayServer(port, {
      bind: "loopback",
      auth: { mode: "token", token: "secret" },
    });

    const createRes = await fetch(`http://127.0.0.1:${port}/api/bootstrap/create`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer secret",
      },
      body: JSON.stringify({ ttlSec: 120 }),
    });
    expect(createRes.status).toBe(200);
    const created = (await createRes.json()) as { ok?: boolean; code?: string };
    expect(created.ok).toBe(true);
    expect(typeof created.code).toBe("string");

    const exchange1 = await fetch(
      `http://127.0.0.1:${port}/api/bootstrap/exchange?code=${encodeURIComponent(String(created.code))}`,
    );
    expect(exchange1.status).toBe(200);
    const exchanged1 = (await exchange1.json()) as { ok?: boolean; token?: string };
    expect(exchanged1.ok).toBe(true);
    expect(exchanged1.token).toBe("secret");

    const exchange2 = await fetch(
      `http://127.0.0.1:${port}/api/bootstrap/exchange?code=${encodeURIComponent(String(created.code))}`,
    );
    expect(exchange2.status).toBe(400);
    const exchanged2 = (await exchange2.json()) as { ok?: boolean; error?: string };
    expect(exchanged2.ok).toBe(false);
    expect((exchanged2.error ?? "").toLowerCase()).toContain("already used");

    await server.close();
  });
});
