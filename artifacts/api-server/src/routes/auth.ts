import "../types";
import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable, entriesTable, feedbackTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

function publicUser(u: typeof usersTable.$inferSelect) {
  return {
    id: u.id,
    name: u.name,
    preferredName: u.preferredName,
    email: u.email,
    createdAt: u.createdAt.toISOString(),
  };
}

// POST /api/auth/signup
router.post("/auth/signup", async (req, res) => {
  const { name, email, password, preferredName, anonymousUserId } = req.body as {
    name?: string;
    email?: string;
    password?: string;
    preferredName?: string;
    anonymousUserId?: string;
  };

  if (!name?.trim() || !email?.trim() || !password) {
    res.status(400).json({ message: "Name, email, and password are required." });
    return;
  }

  const emailLower = email.toLowerCase().trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailLower)) {
    res.status(400).json({ message: "Please enter a valid email address." });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ message: "Password must be at least 8 characters." });
    return;
  }

  try {
    const existing = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, emailLower))
      .limit(1);

    if (existing.length > 0) {
      res.status(409).json({ message: "An account with this email already exists." });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [user] = await db
      .insert(usersTable)
      .values({
        name: name.trim(),
        preferredName: preferredName?.trim() || null,
        email: emailLower,
        passwordHash,
      })
      .returning();

    if (!user) {
      res.status(500).json({ message: "Failed to create account." });
      return;
    }

    // Migrate any anonymous entries into this account
    if (anonymousUserId && typeof anonymousUserId === "string") {
      await db
        .update(entriesTable)
        .set({ userId: String(user.id) })
        .where(eq(entriesTable.userId, anonymousUserId));
    }

    await new Promise<void>((resolve, reject) => {
      req.session.userId = user.id;
      req.session.save((err) => (err ? reject(err) : resolve()));
    });

    res.status(201).json(publicUser(user));
  } catch (err) {
    req.log.error({ err }, "Signup error");
    res.status(500).json({ message: "Something went wrong. Please try again." });
  }
});

// POST /api/auth/login
router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email?.trim() || !password) {
    res.status(400).json({ message: "Email and password are required." });
    return;
  }

  try {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email.toLowerCase().trim()))
      .limit(1);

    if (!user) {
      res.status(401).json({ message: "Invalid email or password." });
      return;
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      res.status(401).json({ message: "Invalid email or password." });
      return;
    }

    await new Promise<void>((resolve, reject) => {
      req.session.userId = user.id;
      req.session.save((err) => (err ? reject(err) : resolve()));
    });

    res.json(publicUser(user));
  } catch (err) {
    req.log.error({ err }, "Login error");
    res.status(500).json({ message: "Something went wrong. Please try again." });
  }
});

// POST /api/auth/logout
router.post("/auth/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) req.log.error({ err }, "Logout error");
    res.clearCookie("connect.sid");
    res.status(204).send();
  });
});

// GET /api/auth/me
router.get("/auth/me", async (req, res) => {
  if (!req.session?.userId) {
    res.status(401).json({ message: "Not authenticated." });
    return;
  }

  try {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, req.session.userId))
      .limit(1);

    if (!user) {
      req.session.destroy(() => {});
      res.status(401).json({ message: "User not found." });
      return;
    }

    res.json(publicUser(user));
  } catch (err) {
    req.log.error({ err }, "Get me error");
    res.status(500).json({ message: "Failed to get user." });
  }
});

// POST /api/auth/claim-entries — migrate anonymous entries after login
router.post("/auth/claim-entries", requireAuth, async (req, res) => {
  const { anonymousUserId } = req.body as { anonymousUserId?: string };

  if (!anonymousUserId || typeof anonymousUserId !== "string") {
    res.status(400).json({ message: "anonymousUserId is required." });
    return;
  }

  try {
    await db
      .update(entriesTable)
      .set({ userId: String(req.session.userId!) })
      .where(eq(entriesTable.userId, anonymousUserId));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Claim entries error");
    res.status(500).json({ message: "Failed to claim entries." });
  }
});

// DELETE /api/auth/account — delete account and all data
router.delete("/auth/account", requireAuth, async (req, res) => {
  const userId = String(req.session.userId!);
  const numericUserId = req.session.userId!;

  try {
    await db.delete(feedbackTable).where(eq(feedbackTable.userId, userId));
    await db.delete(entriesTable).where(eq(entriesTable.userId, userId));
    await db.delete(usersTable).where(eq(usersTable.id, numericUserId));
    req.session.destroy(() => {});
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Delete account error");
    res.status(500).json({ message: "Failed to delete account." });
  }
});

export default router;
