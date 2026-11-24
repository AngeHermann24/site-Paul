import { Component, type ErrorInfo, type ReactNode } from 'react';
import i18n from '@/locales';
import styles from './ErrorBoundary.module.css';

interface Props {
  children: ReactNode;
  /** Change de valeur → réinitialise l'erreur (ex : pathname). */
  resetKey?: string;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) console.error('[ErrorBoundary]', error, info.componentStack);
  }

  override componentDidUpdate(prev: Props) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null });
  }

  override render() {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert" className={styles.wrap}>
        <p className={`mono ${styles.code}`}>ERR</p>
        <h1 className={`display ${styles.title}`}>{i18n.t('error.title')}</h1>
        <p className={styles.body}>{i18n.t('error.body')}</p>
        <button type="button" className={`mono ${styles.reload}`} onClick={() => window.location.reload()}>
          {i18n.t('error.reload')}
        </button>
      </div>
    );
  }
}
