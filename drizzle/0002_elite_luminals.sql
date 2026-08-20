CREATE TABLE `clan_members` (
	`clanId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('owner','manager','scout','member') NOT NULL DEFAULT 'member',
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `clan_members_clanId_userId_pk` PRIMARY KEY(`clanId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `disputes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`matchId` int NOT NULL,
	`openedBy` int NOT NULL,
	`reason` text NOT NULL,
	`status` enum('open','under_review','resolved') NOT NULL DEFAULT 'open',
	`adminDecision` text,
	`winnerTeamId` int,
	`resolvedBy` int,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `disputes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `match_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`matchId` int NOT NULL,
	`submittedBy` int NOT NULL,
	`teamId` int NOT NULL,
	`scoreFor` int NOT NULL,
	`scoreAgainst` int NOT NULL,
	`screenshotUrl` varchar(500),
	`notes` text,
	`status` enum('submitted','waiting_confirmation','confirmed','disputed','admin_resolved') NOT NULL DEFAULT 'submitted',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `match_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tournament_registrations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tournamentId` int NOT NULL,
	`teamId` int NOT NULL,
	`registeredBy` int NOT NULL,
	`status` enum('pending','confirmed','checked_in','withdrawn') NOT NULL DEFAULT 'pending',
	`acceptedRulesAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tournament_registrations_id` PRIMARY KEY(`id`),
	CONSTRAINT `tournament_team_unique` UNIQUE(`tournamentId`,`teamId`)
);
--> statement-breakpoint
ALTER TABLE `clans` ADD `socials` text;--> statement-breakpoint
ALTER TABLE `tournaments` ADD `entryFeeCents` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `tournaments` ADD `rules` text;--> statement-breakpoint
ALTER TABLE `tournaments` ADD `sponsorName` varchar(120);--> statement-breakpoint
ALTER TABLE `tournaments` ADD `streamUrl` varchar(500);--> statement-breakpoint
ALTER TABLE `tournaments` ADD `clanEligible` int DEFAULT 0 NOT NULL;