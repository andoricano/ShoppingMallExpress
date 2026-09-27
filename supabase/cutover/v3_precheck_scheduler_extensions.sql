-- ============================================================
-- Mall v3 cutover: READ-ONLY check of the scheduler prerequisites
-- (docs/mall1/v3/CUTOVER.md 3.3)
--
-- The reconcile scheduler needs the extensions pg_cron, pg_net and
-- supabase_vault. The scheduler migration creates them (`create extension if
-- not exists`); this only tells whether the project can. Reads catalogs only:
-- no Vault entry is read, no job is created. A row with available = f means the
-- migration would fail: stop and report.
-- ============================================================

select e.name as extension,
       e.default_version,
       e.installed_version is not null as installed_now,
       true as available
from pg_available_extensions e
where e.name in ('pg_cron', 'pg_net', 'supabase_vault')
union all
select n.name, null, false, false
from (values ('pg_cron'), ('pg_net'), ('supabase_vault')) n(name)
where not exists (select 1 from pg_available_extensions e where e.name = n.name)
order by 1;

-- cron.database_name must be this database for pg_cron to run its jobs
select current_setting('cron.database_name', true) as cron_database_name,
       current_database() as this_database;
