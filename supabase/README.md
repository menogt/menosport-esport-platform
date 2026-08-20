# Meno Arena Supabase migration

The migration in `migrations/20260820000000_meno_arena.sql` creates the PostgreSQL domain foundation for Meno Arena. It includes player profiles, teams, clans, tournaments, registrations, matches, reports, disputes, notifications, media assets, indexes, timestamp triggers, Row Level Security policies, and Realtime publication entries for matches and notifications.

## Apply it once

Open the Supabase project dashboard for `dolihfxvdoiljwbbtlkr`, go to **SQL Editor**, create a new query, paste the complete migration file, and select **Run**. The project anon key cannot create tables, which is why this one-time dashboard action is required.

The migration is additive and does not alter the current Drizzle/MySQL tables. The application continues using the existing domain database until the migration is applied and the data layer is deliberately repointed.

## Validate the result

Run the following queries after the migration completes:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'users', 'player_profiles', 'teams', 'team_members', 'clans',
    'clan_teams', 'clan_members', 'tournaments',
    'tournament_registrations', 'matches', 'match_reports', 'disputes',
    'notifications', 'media_assets'
  )
order by table_name;

select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('users', 'matches', 'notifications', 'media_assets')
order by tablename;
```

The first query should return all fourteen domain tables. The second query should report `rowsecurity = true` for every returned table. Realtime clients can then subscribe to `public.matches` and `public.notifications` after the application data procedures are repointed.

## Next application step

After the SQL has been applied, the next code change will migrate the domain query helpers and mutations from Drizzle/MySQL to Supabase while preserving the existing tRPC procedure names and frontend contracts. This sequencing avoids silently writing to a table that does not yet exist.
