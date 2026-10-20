import { Component, type ReactNode } from 'react'

// Last-resort net so a render error shows a message instead of a blank page.
// Sits outside I18nProvider (which could be the thing that failed), so the text is fixed.
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? <p role="alert">Qualcosa è andato storto. Ricarica la pagina.</p> : this.props.children
  }
}
