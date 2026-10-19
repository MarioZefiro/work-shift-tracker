# GitHubProjectOne

Progetto vetrina per il profilo GitHub: app frontend piccola, finita, online. Obiettivo: far vedere ai recruiter che so consegnare codice pulito.

## Progetto

- **Idea:** tracker dei turni di lavoro condivisi tra colleghi (ognuno vede il proprio calendario e quello dei colleghi che ha invitato). Una sola app piccola. Dettagli da definire in brainstorming.
- **Stack:** Vite + React + TypeScript (strict). Backend gestito (es. Supabase o Firebase, scelta da decidere), niente server scritto a mano.
- **Deploy:** GitHub Pages o Vercel. Link live in cima al README.
- **Fuori scope:** server proprio, librerie UI pesanti. Si aggiungono solo se servono davvero.
- **Dati dei turni:** sono dati personali. Chiavi e segreti mai nel codice né nella repo (variabili d'ambiente), accesso ai dati regolato lato backend.

## Regole

- **Nessun dato o codice di lavoro.** Repo pubblica: zero nomi di colleghi reali, zero materiale di lavoro, zero riferimenti ad aziende o ad altri progetti.
- Fai solo quanto chiesto. Codice minimo che funziona.
- Commenti nel codice: solo il perché, mai il cosa.
- Accessibilità di base sempre: elementi semantici, label sui campi, focus visibile, contrasto.
- Test con Vitest + React Testing Library sulla logica che conta (calcoli, storage). Non su ogni componente.
- Commit piccoli, messaggi chiari ("Aggiunge form serie"), mai "fix".
- Push, creazione repo e deploy: chiedi sempre prima.

## Definizione di "finito"

1. `npm run build` e `npm test` passano.
2. App online con link funzionante.
3. README con screenshot o GIF, link live, stack, 3 scelte tecniche e il perché.
4. Lighthouse accessibilità ≥ 90.

## Skill e agent

| Quando | Cosa usare |
|--------|-----------|
| Nuova feature | `superpowers:brainstorming`, poi `react-expert` e `typescript-pro` |
| Bug | `superpowers:systematic-debugging` |
| Test E2E | `playwright-expert` |
| Prima di dire "fatto" | `superpowers:verification-before-completion` |
| Revisione codice | agent `frontend-reviewer` |
| README | agent `readme-writer` |

## Lingua

Italiano in chat. Codice, commit e README in inglese: lo leggono recruiter internazionali.
