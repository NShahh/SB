import { pgTable, text, serial, integer, boolean, decimal, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  role: text("role", { enum: ["business", "participant", "admin"] }).notNull(),
  walletBalance: decimal("wallet_balance", { precision: 10, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const surveys = pgTable("surveys", {
  id: serial("id").primaryKey(),
  creatorId: integer("creator_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  questions: jsonb("questions").$type<{
    type: "mcq" | "checkbox" | "text" | "rating" | "ranking";
    text: string;
    options?: string[];
    minRating?: number;
    maxRating?: number;
    required: boolean;
  }[]>().notNull(),
  rewardPerResponse: decimal("reward_per_response", { precision: 10, scale: 2 }).notNull(),
  participantQuota: integer("participant_quota").notNull(),
  timeLimit: integer("time_limit").default(0),
  completedResponses: integer("completed_responses").notNull().default(0),
  status: text("status", { 
    enum: ["draft", "pending", "approved", "rejected", "completed"] 
  }).notNull().default("draft"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const responses = pgTable("responses", {
  id: serial("id").primaryKey(),
  surveyId: integer("survey_id").notNull().references(() => surveys.id),
  participantId: integer("participant_id").notNull().references(() => users.id),
  answers: jsonb("answers").notNull(),
  startTime: timestamp("start_time").notNull(),
  completionTime: timestamp("completion_time").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  type: text("type", { enum: ["credit", "debit"] }).notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  surveys: many(surveys),
  responses: many(responses),
  transactions: many(transactions),
}));

export const surveysRelations = relations(surveys, ({ one, many }) => ({
  creator: one(users, { fields: [surveys.creatorId], references: [users.id] }),
  responses: many(responses),
}));

export const responsesRelations = relations(responses, ({ one }) => ({
  survey: one(surveys, { fields: [responses.surveyId], references: [surveys.id] }),
  participant: one(users, { fields: [responses.participantId], references: [users.id] }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, { fields: [transactions.userId], references: [users.id] }),
}));

// Zod Schemas
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const insertSurveySchema = createInsertSchema(surveys);
export const selectSurveySchema = createSelectSchema(surveys);
export const insertResponseSchema = createInsertSchema(responses);
export const selectResponseSchema = createSelectSchema(responses);
export const insertTransactionSchema = createInsertSchema(transactions);
export const selectTransactionSchema = createSelectSchema(transactions);

// Types
export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;
export type InsertSurvey = typeof surveys.$inferInsert;
export type SelectSurvey = typeof surveys.$inferSelect;
export type InsertResponse = typeof responses.$inferInsert;
export type SelectResponse = typeof responses.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;
export type SelectTransaction = typeof transactions.$inferSelect;