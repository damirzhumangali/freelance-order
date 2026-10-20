CREATE TABLE `external_source_orders` (
	`id` text PRIMARY KEY NOT NULL,
	`source` text NOT NULL,
	`data` text NOT NULL,
	`expires_at` integer NOT NULL,
	`fetched_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `external_source_orders_source_expiry_idx` ON `external_source_orders` (`source`,`expires_at`);--> statement-breakpoint
CREATE TABLE `external_source_syncs` (
	`id` text PRIMARY KEY NOT NULL,
	`last_attempt_at` text,
	`last_success_at` text,
	`next_check_at` integer DEFAULT 0 NOT NULL,
	`lease_until` integer DEFAULT 0 NOT NULL,
	`lease_token` text,
	`error` text
);
