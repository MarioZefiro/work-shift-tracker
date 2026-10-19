const FAQ: { q: string; a: string }[] = [
  {
    q: "Che cos'è quest'app?",
    a: 'Un calendario dei turni condiviso dal gruppo: mostra chi lavora oggi, i tuoi prossimi turni e il mese. Questa è una demo con dati di esempio inventati.',
  },
  {
    q: 'Come funzionano le 48 ore?',
    a: 'La regola delle 48 ore riguarderà le richieste di cambio turno. Non è ancora attiva: arriverà in una versione successiva.',
  },
  {
    q: 'Come si vota?',
    a: 'Le proposte aperte si potranno votare in una versione successiva. Per ora la demo è in sola lettura.',
  },
  {
    q: 'Dove stanno i miei dati?',
    a: 'In questa demo i dati sono di esempio e vengono generati nel tuo browser: non lasciano il tuo dispositivo e non c’è nessun account.',
  },
]

export function FaqPage() {
  return (
    <div className="page">
      <h1>Domande frequenti</h1>
      {FAQ.map(({ q, a }) => (
        <details key={q} className="faq">
          <summary>{q}</summary>
          <p>{a}</p>
        </details>
      ))}
    </div>
  )
}
