import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const orderRequests = sqliteTable("order_requests", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  contact: text("contact").notNull(),
  category: text("category", { enum: ["website", "app"] }).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  budget: text("budget").notNull(),
  deadline: text("deadline").notNull(),
  consent: integer("consent", { mode: "boolean" }).notNull().default(false),
  status: text("status", { enum: ["new", "reviewing", "published", "closed"] }).notNull().default("new"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  publishedAt: text("published_at"),
}, (table) => [index("order_requests_status_created_idx").on(table.status, table.createdAt)]);

export const submissionLimits = sqliteTable("submission_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull().default(1),
  expiresAt: integer("expires_at").notNull(),
}, (table) => [index("submission_limits_expiry_idx").on(table.expiresAt)]);
