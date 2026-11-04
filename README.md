# UHURU CAISSE — base de projet

Application React + TypeScript + Vite, pensée pour téléphone et ordinateur, reliée à la base Supabase existante.

## Ce qui est déjà inclus
- Interface française responsive.
- Connexion individuelle par Supabase Auth.
- Lecture du profil connecté depuis `profiles`.
- Navigation : Accueil, Membres, Cotisations, Dépenses, Solidarité, Rapports, Élections, Comité.
- Lecture et recherche dans les tables existantes `members`, `contributions`, `expenses`, `elections`, `committee`.
- Aucune création, suppression ou modification de table et aucune fausse donnée métier.

## Démarrage dans StackBlitz
1. Importer cette archive comme projet (ou déposer son contenu dans un projet Vite React TypeScript).
2. À la racine, créer `.env` en copiant `.env.example`.
3. Renseigner l'URL du projet Supabase existant et sa clé publique `anon` ou `publishable`.
4. Lancer `npm run dev` (StackBlitz peut lancer automatiquement la commande).
5. Ouvrir Preview puis se connecter avec un compte déjà créé dans Supabase Auth.

Ne jamais mettre la clé `service_role` dans le navigateur. Utiliser uniquement la clé publique anon/publishable.

## Important — schéma Supabase
Les tables identifiées dans le projet existant sont : `audit_log`, `candidates`, `committee`, `contributions`, `election_votes`, `elections`, `expense_votes`, `expenses`, `members`, `profiles`.

Le code ne suppose pas encore les noms exacts des colonnes métier : les tables de lecture affichent dynamiquement les colonnes renvoyées par Supabase. La table `profiles` est recherchée par `id = auth.uid()` et le rôle est lu depuis `role` ou `fonction` si disponible.

Les rubriques Solidarité et Rapports sont des écrans de préparation, car aucune table Solidarité distincte n'a été confirmée. Les opérations d'écriture (cotisation, dépense, solidarité, vote, administration des membres) ne doivent être activées qu'après vérification du schéma et des politiques RLS, pour éviter d'écrire dans les mauvaises colonnes.

## Contrôle en lecture seule du schéma
Dans Supabase > SQL Editor, exécuter ce diagnostic (il ne modifie rien) et transmettre le résultat pour adapter précisément les formulaires :

```sql
select table_name, column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name in (
    'audit_log','candidates','committee','contributions','election_votes',
    'elections','expense_votes','expenses','members','profiles'
  )
order by table_name, ordinal_position;
```

Pour les politiques de sécurité :
```sql
select tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
```

## Règles de départ à respecter
- Groupe : 65 membres.
- Cotisation : 4 000 FC par mois.
- Identifiants membres prévus : UHURU001 à UHURU065.
- Les noms affichés doivent être les vrais nom, postnom et prénom.
- Rôles à prendre en compte : administrateur, président, trésorier, secrétaire, deux contrôleurs et membres. Les rôles effectivement enregistrés dans la base restent à vérifier.
