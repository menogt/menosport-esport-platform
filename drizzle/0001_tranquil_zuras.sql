CREATE TABLE `clan_teams` (
	`clanId` int NOT NULL,
	`teamId` int NOT NULL,
	`addedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `clan_teams_clanId_teamId_pk` PRIMARY KEY(`clanId`,`teamId`)
);
--> statement-breakpoint
CREATE TABLE `clans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`name` varchar(80) NOT NULL,
	`tag` varchar(12) NOT NULL,
	`region` varchar(64),
	`bio` text,
	`foundedYear` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `matches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tournamentId` int NOT NULL,
	`round` int NOT NULL,
	`position` int NOT NULL,
	`homeTeamId` int,
	`awayTeamId` int,
	`homeScore` int NOT NULL DEFAULT 0,
	`awayScore` int NOT NULL DEFAULT 0,
	`status` enum('upcoming','live','waiting','disputed','completed') NOT NULL DEFAULT 'upcoming',
	`scheduledAt` timestamp,
	`winnerTeamId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `matches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `player_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`handle` varchar(48) NOT NULL,
	`bio` text,
	`region` varchar(64),
	`primaryGame` varchar(64),
	`wins` int NOT NULL DEFAULT 0,
	`losses` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `player_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `player_profiles_user_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `team_members` (
	`teamId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('captain','player','manager') NOT NULL DEFAULT 'player',
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `team_members_teamId_userId_pk` PRIMARY KEY(`teamId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `teams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`name` varchar(80) NOT NULL,
	`tag` varchar(12) NOT NULL,
	`game` varchar(64) NOT NULL,
	`region` varchar(64),
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `teams_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tournaments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`game` varchar(64) NOT NULL,
	`format` enum('single_elimination','double_elimination','round_robin','swiss') NOT NULL DEFAULT 'single_elimination',
	`status` enum('registration','live','completed') NOT NULL DEFAULT 'registration',
	`startsAt` timestamp NOT NULL,
	`registrationClosesAt` timestamp,
	`prizePoolCents` int NOT NULL DEFAULT 0,
	`maxTeams` int NOT NULL DEFAULT 16,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tournaments_id` PRIMARY KEY(`id`)
);
