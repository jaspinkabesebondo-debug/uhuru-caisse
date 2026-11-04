import { useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase, supabaseConfigured } from './supabase'

type Row = Record<string, unknown>
const sections = [
  { id: 'Accueil', icon: '⌂', table: null },
  { id: 'Membres', icon: '♙', table: 'members' },
  { id: 'Cotisations', icon: '₣', table: 'contributions' },
  { id: 'Dépenses', icon: '↗', table: 'expenses' },
  { id: 'Solidarité', icon: '♡', table: null },
  { id: 'Rapports', icon: '▤', table: null },
  { id: 'Élections', icon: '☑', table: 'elections' },
  { id: 'Comité', icon: '♧', table: 'committee' },
] as const

function pretty(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}
function money(value: number) {
  return new Intl.NumberFormat('fr-FR').format(value) + ' FC'
}
function label(key: string) {
  return key.replaceAll('_', ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [checking, setChecking] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [page, setPage] = useState<string>('Accueil')
  const [profile, setProfile] = useState<Row | null>(null)
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(false)
  const [dataError, setDataError] = useState('')
  const [search, setSearch] = useState('')
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    if (!supabase) { setChecking(false); return }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setChecking(false)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next))
    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    let alive = true
    async function loadProfile() {
      if (!supabase || !session?.user) { setProfile(null); return }
      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
      if (alive) setProfile((data as Row | null) ?? null)
    }
    void loadProfile()
    return () => { alive = false }
  }, [session])

  const current = sections.find(s => s.id === page)
  useEffect(() => {
    let alive = true
    async function loadRows() {
      setRows([]); setDataError('')
      if (!supabase || !session || !current?.table) return
      setLoading(true)
      const { data, error } = await supabase.from(current.table).select('*').limit(250)
      if (!alive) return
      if (error) setDataError(error.message)
      else setRows((data ?? []) as Row[])
      setLoading(false)
    }
    void loadRows()
    return () => { alive = false }
  }, [page, session, refresh])

  const filteredRows = useMemo(() => {
    const q = search.trim().toLocaleLowerCase('fr')
    if (!q) return rows
    return rows.filter(row => Object.values(row).some(v => pretty(v).toLocaleLowerCase('fr').includes(q)))
  }, [rows, search])

  async function signIn(e: React.FormEvent) {
    e.preventDefault(); setLoginError('')
    if (!supabase) return
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) setLoginError(error.message)
  }
  async function signOut() {
    await supabase?.auth.signOut()
    setPage('Accueil'); setProfile(null)
  }

  if (checking) return <div className="center-screen"><div className="spinner" />Chargement de UHURU CAISSE…</div>

  if (!supabaseConfigured) return <main className="setup-screen">
    <div className="setup-card">
      <div className="brand-mark">U</div><p className="eyebrow">ANCIENS DE L’INSTITUT UHURU</p>
      <h1>UHURU CAISSE</h1><h2>Configuration nécessaire</h2>
      <p>L’interface est prête. Il faut maintenant relier ce projet à <strong>votre base Supabase existante</strong>.</p>
      <ol><li>Ouvrez les paramètres du projet Supabase existant.</li><li>Copiez l’URL du projet et la clé publique <em>anon</em> ou <em>publishable</em>.</li><li>Dans StackBlitz, créez un fichier <code>.env</code> à la racine et ajoutez les deux variables indiquées dans <code>.env.example</code>.</li><li>Rechargez l’aperçu.</li></ol>
      <div className="notice">Aucune nouvelle base n’est créée et aucune table existante n’est modifiée par cette application.</div>
    </div>
  </main>

  if (!session) return <main className="login-screen">
    <form className="login-card" onSubmit={signIn}>
      <div className="brand-mark">U</div><p className="eyebrow">LES ANCIENS DE L’INSTITUT UHURU</p>
      <h1>UHURU CAISSE</h1><p className="muted">Espace sécurisé des membres</p>
      <label>Adresse e-mail<input type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="username" required placeholder="Votre adresse e-mail" /></label>
      <label>Mot de passe<input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" required placeholder="Votre mot de passe" /></label>
      {loginError && <div className="error">{loginError}</div>}
      <button className="primary full" type="submit">Se connecter</button>
      <small>Accès individuel — identifiants fournis par l’administration.</small>
    </form>
  </main>

  const role = pretty(profile?.role ?? profile?.fonction ?? 'Membre')
  const displayName = [profile?.prenom, profile?.postnom, profile?.nom].filter(Boolean).map(pretty).join(' ') || session.user.email || 'Membre'
  const countMembers = page === 'Membres' ? rows.length : undefined

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="side-brand"><div className="brand-mini">U</div><div><b>UHURU CAISSE</b><span>Gestion de la caisse</span></div></div>
      <nav>{sections.map(item => <button key={item.id} className={page === item.id ? 'nav-item active' : 'nav-item'} onClick={() => { setPage(item.id); setSearch('') }}><span className="nav-icon">{item.icon}</span>{item.id}</button>)}</nav>
      <div className="side-foot"><span className="online-dot" /> Connexion sécurisée</div>
    </aside>
    <main className="main-area">
      <header className="topbar"><div><span className="eyebrow">ESPACE DE GESTION</span><h1>{page}</h1></div><div className="user-box"><div className="avatar">{displayName.slice(0,1).toUpperCase()}</div><div className="user-meta"><b>{displayName}</b><span>{role}</span></div><button className="logout" onClick={signOut}>Déconnexion</button></div></header>
      {page === 'Accueil' ? <section className="content">
        <div className="welcome"><div><p className="eyebrow">BIENVENUE</p><h2>Bonjour, {displayName.split(' ')[0]} 👋</h2><p>Suivez les activités de la caisse des Anciens de l’Institut Uhuru.</p></div><div className="welcome-symbol">U</div></div>
        <div className="stats-grid">
          <article className="stat-card"><span>Membres prévus</span><strong>65</strong><small>Effectif du groupe</small></article>
          <article className="stat-card"><span>Cotisation mensuelle</span><strong>4 000 <i>FC</i></strong><small>Par membre et par mois</small></article>
          <article className="stat-card"><span>Rubriques</span><strong>8</strong><small>Modules de gestion</small></article>
        </div>
        <div className="panel"><div className="panel-heading"><div><h3>Accès rapide</h3><p>Choisissez une rubrique pour consulter les informations.</p></div></div><div className="quick-grid">{sections.slice(1).map(item => <button key={item.id} onClick={() => setPage(item.id)}><span>{item.icon}</span><b>{item.id}</b><small>Ouvrir la rubrique →</small></button>)}</div></div>
        <div className="notice">Les données affichées proviennent de votre base Supabase. Les actions d’ajout et de modification seront activées après vérification des colonnes et des règles de sécurité déjà en place.</div>
      </section> : <section className="content">
        {current?.table ? <div className="panel">
          <div className="panel-heading"><div><h3>{page}</h3><p>Données lues depuis la table <code>{current.table}</code>.</p></div><button className="secondary" onClick={() => setRefresh(v => v+1)}>↻ Actualiser</button></div>
          <div className="table-tools"><input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Rechercher dans ${page.toLocaleLowerCase('fr')}…`} /><span>{filteredRows.length} ligne(s)</span></div>
          {loading ? <div className="empty"><div className="spinner" />Chargement des données…</div> : dataError ? <div className="error-block"><b>Lecture impossible</b><p>{dataError}</p><small>Vérifiez les autorisations RLS de cette table pour le compte connecté.</small></div> : filteredRows.length === 0 ? <div className="empty">Aucune donnée à afficher pour le moment.</div> :
            <div className="table-wrap"><table><thead><tr>{Object.keys(filteredRows[0]).map(k => <th key={k}>{label(k)}</th>)}</tr></thead><tbody>{filteredRows.map((row, i) => <tr key={String(row.id ?? i)}>{Object.keys(filteredRows[0]).map(k => <td key={k}>{pretty(row[k])}</td>)}</tr>)}</tbody></table></div>}
          {page === 'Membres' && <p className="table-foot">Identifiants attendus : UHURU001 à UHURU065. Membres trouvés dans la base : {countMembers ?? 0}.</p>}
        </div> : <div className="panel coming"><div className="coming-icon">{current?.icon ?? '•'}</div><h2>{page}</h2><p>Cette rubrique est prévue dans l’application. Son raccordement nécessite de confirmer la structure des données et les règles de validation existantes afin de ne rien écraser dans votre base.</p></div>}
      </section>}
      <footer>UHURU CAISSE © 2026 <span>• Les Anciens de l’Institut Uhuru</span></footer>
    </main>
  </div>
}
