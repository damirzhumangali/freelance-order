CREATE TABLE `order_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`contact` text NOT NULL,
	`category` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`budget` text NOT NULL,
	`deadline` text NOT NULL,
	`consent` integer DEFAULT false NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`published_at` text
);
--> statement-breakpoint
CREATE INDEX `order_requests_status_created_idx` ON `order_requests` (`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `submission_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer DEFAULT 1 NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `submission_limits_expiry_idx` ON `submission_limits` (`expires_at`);