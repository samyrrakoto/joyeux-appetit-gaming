CREATE TABLE "played_games" (
	"night_id" uuid NOT NULL,
	"game_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "played_games_night_id_game_id_pk" PRIMARY KEY("night_id","game_id")
);
--> statement-breakpoint
ALTER TABLE "votes" DROP CONSTRAINT "votes_night_game_id_night_games_id_fk";
--> statement-breakpoint
DROP INDEX "votes_player_night_game_idx";--> statement-breakpoint
ALTER TABLE "votes" ADD COLUMN "night_id" uuid;--> statement-breakpoint
ALTER TABLE "votes" ADD COLUMN "game_id" uuid;--> statement-breakpoint
UPDATE "votes" v SET "night_id" = ng."night_id", "game_id" = ng."game_id" FROM "night_games" ng WHERE ng."id" = v."night_game_id";--> statement-breakpoint
DELETE FROM "votes" WHERE "night_id" IS NULL OR "game_id" IS NULL;--> statement-breakpoint
ALTER TABLE "votes" ALTER COLUMN "night_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "votes" ALTER COLUMN "game_id" SET NOT NULL;--> statement-breakpoint
INSERT INTO "played_games" ("night_id", "game_id") SELECT DISTINCT "night_id", "game_id" FROM "matches" ON CONFLICT DO NOTHING;--> statement-breakpoint
ALTER TABLE "night_games" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "night_games" CASCADE;--> statement-breakpoint
ALTER TABLE "played_games" ADD CONSTRAINT "played_games_night_id_game_nights_id_fk" FOREIGN KEY ("night_id") REFERENCES "public"."game_nights"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "played_games" ADD CONSTRAINT "played_games_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_night_id_game_nights_id_fk" FOREIGN KEY ("night_id") REFERENCES "public"."game_nights"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "votes_night_game_player_idx" ON "votes" USING btree ("night_id","game_id","player_id");--> statement-breakpoint
ALTER TABLE "votes" DROP COLUMN "night_game_id";
