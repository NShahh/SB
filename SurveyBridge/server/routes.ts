import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { db } from "@db";
import { surveys, users, transactions } from "@db/schema";
import { eq, and, desc } from "drizzle-orm";

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Survey routes
  app.post("/api/surveys", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "business") {
      return res.sendStatus(403);
    }

    const totalBudget = parseFloat(req.body.rewardPerResponse) * req.body.participantQuota;
    const [user] = await db.select().from(users).where(eq(users.id, req.user.id)).limit(1);

    if (!user || parseFloat(user.walletBalance.toString()) < totalBudget) {
      return res.status(400).send("Insufficient wallet balance");
    }

    // Calculate commission and participant pool
    const adminCommission = totalBudget * 0.4; // 40% commission
    const participantPool = totalBudget * 0.6; // 60% for participants

    const [admin] = await db.select().from(users).where(eq(users.role, "admin")).limit(1);
    if (!admin) {
      return res.status(500).send("Admin account not found");
    }

    // Start transaction
    await db.transaction(async (tx) => {
      // Deduct from business wallet
      await tx.update(users)
        .set({ walletBalance: (parseFloat(user.walletBalance.toString()) - totalBudget).toFixed(2) })
        .where(eq(users.id, req.user.id));

      // Add commission to admin wallet
      await tx.update(users)
        .set({ walletBalance: (parseFloat(admin.walletBalance.toString()) + adminCommission).toFixed(2) })
        .where(eq(users.id, admin.id));

      // Record transactions
      await tx.insert(transactions).values([
        {
          userId: req.user.id,
          amount: totalBudget.toFixed(2),
          type: "debit",
          description: `Survey budget allocation for "${req.body.title}"`,
        },
        {
          userId: admin.id,
          amount: adminCommission.toFixed(2),
          type: "credit",
          description: `Commission for survey "${req.body.title}"`,
        }
      ]);

      // Create survey with allocated participant pool
      const [survey] = await tx.insert(surveys).values({
        ...req.body,
        creatorId: req.user.id,
        status: "pending",
      }).returning();

      res.status(201).json(survey);
    });
  });

  app.get("/api/surveys", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const query = db.select({
      survey: surveys,
      creator: users,
    })
    .from(surveys)
    .leftJoin(users, eq(users.id, surveys.creatorId));

    if (req.user.role === "business") {
      query.where(eq(surveys.creatorId, req.user.id));
    } else if (req.user.role === "participant") {
      query.where(eq(surveys.status, "approved"));
    }

    const result = await query;
    res.json(result);
  });

  // Wallet routes
  app.post("/api/wallet/deposit", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "business") {
      return res.sendStatus(403);
    }

    const amount = parseFloat(req.body.amount);
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).send("Invalid amount");
    }

    const [user] = await db.select().from(users).where(eq(users.id, req.user.id)).limit(1);
    if (!user) return res.sendStatus(404);

    try {
      await db.transaction(async (tx) => {
        // Update user's wallet balance
        const newBalance = (parseFloat(user.walletBalance.toString()) + amount).toFixed(2);
        await tx.update(users)
          .set({ walletBalance: newBalance })
          .where(eq(users.id, req.user.id));

        // Record the transaction
        await tx.insert(transactions).values({
          userId: req.user.id,
          amount: amount.toFixed(2),
          type: "credit",
          description: "Wallet deposit",
        });
      });

      const [updatedUser] = await db.select().from(users).where(eq(users.id, req.user.id)).limit(1);
      res.json({ balance: updatedUser.walletBalance });
    } catch (error) {
      console.error('Deposit error:', error);
      res.status(500).send("Failed to process deposit");
    }
  });

  app.get("/api/wallet", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const [user] = await db.select().from(users).where(eq(users.id, req.user.id)).limit(1);
      const userTransactions = await db
        .select()
        .from(transactions)
        .where(eq(transactions.userId, req.user.id))
        .orderBy(desc(transactions.createdAt));

      res.json({
        balance: user?.walletBalance || "0.00",
        transactions: userTransactions
      });
    } catch (error) {
      console.error('Wallet fetch error:', error);
      res.status(500).send("Failed to fetch wallet data");
    }
  });

  // Admin routes
  app.patch("/api/surveys/:surveyId/status", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.sendStatus(403);
    }

    const surveyId = parseInt(req.params.surveyId);
    const [survey] = await db.update(surveys)
      .set({ status: req.body.status })
      .where(eq(surveys.id, surveyId))
      .returning();

    res.json(survey);
  });

  const httpServer = createServer(app);
  return httpServer;
}