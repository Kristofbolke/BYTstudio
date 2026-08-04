-- 020_intake_forms_uniek.sql — Dedupliceer intake_forms en dwing één rij per project af
-- Achtergrond: door het ontbreken van een unique constraint op project_id konden
-- TabIntake en PubliekeLinkKnop (ProjectDetail.jsx) bij een race of dubbele
-- .maybeSingle()-treffer telkens een nieuwe lege rij aanmaken.

-- Per project de rij met de meeste voortgang behouden (submitted > ingevuld > oudste),
-- de rest verwijderen.
with gerangschikt as (
  select id, project_id,
    row_number() over (
      partition by project_id
      order by
        (status = 'submitted') desc,
        (bedrijfsnaam is not null) desc,
        created_at asc
    ) as rn
  from intake_forms
)
delete from intake_forms
where id in (select id from gerangschikt where rn > 1);

alter table intake_forms
  add constraint intake_forms_project_id_key unique (project_id);
