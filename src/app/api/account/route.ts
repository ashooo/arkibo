import { createHash, randomBytes, randomUUID, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { NextRequest, NextResponse } from "next/server";
import { accountDb } from "@/lib/server/account-db.mjs";
import { alertTopics, maxProfilePhotoBytes, yearLevels } from "@/lib/account";

const deriveKey = promisify(scrypt);
const sessionCookie = "scholarready_session";
const sessionSeconds = 60 * 60 * 24 * 7;

function isProfilePhoto(value: unknown) {
  if (typeof value !== "string" || value.length > Math.ceil(maxProfilePhotoBytes / 3) * 4 + 32) return false;
  const match = /^data:image\/(png|jpeg);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!match) return false;
  const bytes = Buffer.from(match[2], "base64");
  if (bytes.length > maxProfilePhotoBytes || bytes.toString("base64") !== match[2]) return false;
  return match[1] === "png"
    ? bytes.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"))
    : bytes.subarray(0, 3).equals(Buffer.from("ffd8ff", "hex"));
}

function digest(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function json(user: { id: string; profile: unknown } | null) {
  return NextResponse.json({ user }, { headers: { "Cache-Control": "no-store" } });
}

function failure(error: string, status: number) {
  return NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
}

function isLocal(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const origin = request.headers.get("origin");
  return /^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(host)
    && (!origin || origin === `http://${host}` || origin === `https://${host}`);
}

async function getUser(token?: string) {
  if (!token) return null;
  const result = await accountDb().query(
    `SELECT a.id, a.profile FROM accounts a
     JOIN account_sessions s ON s.account_id = a.id
     WHERE s.token_hash = $1 AND s.expires_at > now()`,
    [digest(token)],
  );
  return result.rows[0] ?? null;
}

export async function GET(request: NextRequest) {
  if (!isLocal(request)) return json(null);
  try {
    return json(await getUser(request.cookies.get(sessionCookie)?.value));
  } catch {
    return failure("Couldn’t load your session. Check the local database and try again.", 503);
  }
}

export async function POST(request: NextRequest) {
  if (!isLocal(request)) return failure("Open ScholarReady on localhost to use local accounts.", 403);
  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return failure("Expected JSON.", 415);
  }

  const body = await request.json().catch(() => null);
  const token = request.cookies.get(sessionCookie)?.value;
  try {
    const db = accountDb();
    if (body?.action === "signout") {
      if (token) await db.query("DELETE FROM account_sessions WHERE token_hash = $1", [digest(token)]);
      const response = json(null);
      response.cookies.delete(sessionCookie);
      return response;
    }

    if (body?.action === "profile" || body?.action === "track") {
      const user = await getUser(token);
      if (!user) return failure("Sign in to edit your profile.", 401);
      const { track } = body;
      if (track !== "new" && track !== "renewal") return failure("Select an application track.", 400);
      if (body.action === "track") {
        const result = await db.query(
          "UPDATE accounts SET profile = jsonb_set(profile, '{track}', to_jsonb($2::text)) WHERE id = $1 AND profile IS NOT NULL RETURNING id, profile",
          [user.id, track],
        );
        return result.rows[0] ? json(result.rows[0]) : failure("Set up your profile first.", 400);
      }

      const firstName = typeof body.firstName === "string" ? body.firstName.trim() : "";
      const middleName = typeof body.middleName === "string" ? body.middleName.trim() : "";
      const lastName = typeof body.lastName === "string" ? body.lastName.trim() : "";
      if (!firstName || !lastName || [firstName, middleName, lastName].some((part) => part.length > 100)
        || !yearLevels.includes(body.yearLevel)) {
        return failure("Enter valid first and last names and select your year level.", 400);
      }
      const name = [firstName, middleName, lastName].filter(Boolean).join(" ");
      const topics = Array.isArray(body.topics) ? alertTopics.filter((topic) => body.topics.includes(topic)) : [];
      if (body.photo !== undefined && body.photo !== null && !isProfilePhoto(body.photo)) {
        return failure("Choose a JPG or PNG photo up to 512 KB.", 400);
      }
      const photo = body.photo === undefined ? user.profile?.photo : body.photo;
      const profile = { name, firstName, middleName, lastName, yearLevel: body.yearLevel, track, topics, photo };
      await db.query("UPDATE accounts SET profile = $2 WHERE id = $1", [user.id, profile]);
      return json({ id: user.id, profile });
    }

    if (body?.action !== "signup" && body?.action !== "signin") return failure("Unknown account action.", 400);
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const signup = body.action === "signup";
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      || password.length > 128 || password.length < (signup ? 8 : 1)) {
      return failure(signup ? "Enter a valid email and a password of 8–128 characters." : "Check your email and password.", 400);
    }

    const newToken = randomBytes(32).toString("hex");
    const client = await db.connect();
    let user;
    try {
      await client.query("BEGIN");
      if (signup) {
        const salt = randomBytes(16).toString("hex");
        const key = (await deriveKey(password, salt, 64)) as Buffer;
        const result = await client.query(
          "INSERT INTO accounts (id, email, password_hash) VALUES ($1, $2, $3) ON CONFLICT (email) DO NOTHING RETURNING id, profile",
          [randomUUID(), email, `${salt}:${key.toString("hex")}`],
        );
        user = result.rows[0];
        if (!user) {
          await client.query("ROLLBACK");
          return failure("Couldn’t create an account with that email. If you already registered, sign in.", 409);
        }
      } else {
        const result = await client.query("SELECT id, profile, password_hash FROM accounts WHERE email = $1", [email]);
        const account = result.rows[0];
        const [salt, encoded] = account ? account.password_hash.split(":") : ["local-auth-dummy-salt", "0".repeat(128)];
        const key = (await deriveKey(password, salt, 64)) as Buffer;
        if (!timingSafeEqual(key, Buffer.from(encoded, "hex")) || !account) {
          await client.query("ROLLBACK");
          return failure("Check your email and password.", 401);
        }
        user = { id: account.id, profile: account.profile };
      }
      await client.query("DELETE FROM account_sessions WHERE expires_at <= now() OR token_hash = $1", [token ? digest(token) : null]);
      await client.query("INSERT INTO account_sessions VALUES ($1, $2, $3)", [
        digest(newToken), user.id, new Date(Date.now() + sessionSeconds * 1000),
      ]);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
    const response = json(user);
    response.cookies.set(sessionCookie, newToken, {
      httpOnly: true, sameSite: "lax", path: "/", maxAge: sessionSeconds,
      secure: request.nextUrl.protocol === "https:",
    });
    return response;
  } catch {
    return failure("Account storage is unavailable. Check the local database and run npm run db:migrate.", 503);
  }
}
