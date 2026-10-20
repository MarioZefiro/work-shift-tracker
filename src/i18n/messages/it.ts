export interface Plural {
  one: string
  other: string
  few?: string
  many?: string
}
type Entry = string | Plural

// Italian is the source of truth: every other language must have exactly these keys.
export const it = {
  'app.title': 'Turni — turni di lavoro condivisi',
  'nav.label': 'Principale',
  'nav.home': 'Home',
  'nav.people': 'Persone',
  'nav.profile': 'Profilo',
  'nav.settings': 'Impostazioni',
  'nav.faq': 'FAQ',
  'nav.skip': 'Vai al contenuto',
  'language.label': 'Lingua',
  'landing.intro': 'Guarda i turni del tuo gruppo e scopri chi lavora con te, in una demo con dati di esempio.',
  'landing.notice': 'Progetto dimostrativo: non usare dati reali sensibili',
  'landing.start': 'Prova la demo',
  'state.loading': 'Caricamento',
  'state.retry': 'Riprova',
  'error.group': 'Non riesco a caricare i dati. Controlla la connessione e riprova.',
  'error.shifts': 'Non riesco a caricare i turni. Controlla la connessione e riprova.',
  'home.title': 'Oggi, {date}',
  'home.mineLabel': 'Il tuo turno di oggi',
  'home.none': 'Nessun turno oggi',
  'home.rest': 'Oggi riposi',
  'home.mine': 'Il tuo turno: {shift}',
  'home.withYou': 'Con te: {names}',
  'home.upcoming': 'Prossimi',
  'home.upcomingList': 'Prossimi turni',
  'home.upcomingEmpty': 'Nessun turno nei prossimi giorni.',
  'home.month': 'Il mese',
  'home.monthHint': 'Il numero piccolo indica quante persone sono in servizio.',
  'month.working': { one: '{count} in servizio', other: '{count} in servizio' },
  'month.noData': 'nessun dato',
  'shift.M': 'Mattina',
  'shift.P': 'Pomeriggio',
  'shift.N': 'Notte',
  'shift.R': 'Riposo',
  'role.manager': 'Responsabile',
  'role.member': 'Membro',
  'people.title': 'Persone',
  'people.list': 'Persone del gruppo',
  'people.empty': 'Nessuna persona nel gruppo.',
  'profile.notFound': 'Profilo non trovato.',
  'profile.role': 'Ruolo',
  'profile.group': 'Gruppo',
  'group.demo': 'Reparto demo',
  'settings.title': 'Impostazioni',
  'settings.timeZone': 'Fuso orario del gruppo',
  'settings.later': 'Le modifiche e le notifiche arriveranno in una versione successiva.',
  'settings.leave': 'Esci dalla demo',
  'faq.title': 'Domande frequenti',
  'faq.q1': "Che cos'è quest'app?",
  'faq.a1':
    'Un calendario dei turni condiviso dal gruppo: mostra chi lavora oggi, i tuoi prossimi turni e il mese. Questa è una demo con dati di esempio inventati.',
  'faq.q2': 'Come funzionano le 48 ore?',
  'faq.a2':
    'La regola delle 48 ore riguarderà le richieste di cambio turno. Non è ancora attiva: arriverà in una versione successiva.',
  'faq.q3': 'Come si vota?',
  'faq.a3': 'Le proposte aperte si potranno votare in una versione successiva. Per ora la demo è in sola lettura.',
  'faq.q4': 'Dove stanno i miei dati?',
  'faq.a4':
    'In questa demo i dati sono di esempio e vengono generati nel tuo browser: non lasciano il tuo dispositivo e non c’è nessun account.',
} satisfies Record<string, Entry>

export type MessageKey = keyof typeof it
export type Messages = Record<MessageKey, Entry>
