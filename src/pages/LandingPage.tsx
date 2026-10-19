export function LandingPage({ onStart }: { onStart: () => void }) {
  return (
    <main className="landing">
      <img className="landing-logo" src="/favicon.svg" alt="" width="72" height="72" />
      <h1>Turni</h1>
      <p>Organizza i turni del gruppo e le proposte di cambio in un unico posto.</p>
      <p className="hint" role="note">
        Progetto dimostrativo: non usare dati reali sensibili
      </p>
      <button type="button" className="button" onClick={onStart}>
        Prova la demo
      </button>
    </main>
  )
}
