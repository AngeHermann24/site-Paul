import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { useAdminAuth } from '@/features/admin/AdminAuth';
import { isSupabaseConfigured } from '@/utils/env';
import { cx } from '@/utils/cx';
import styles from '@/features/admin/admin.module.css';

/** `/admin/login` — connexion par email + mot de passe (Supabase Auth). */
export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { status, signIn } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as { from?: string } | null)?.from ?? '/admin';
  if (status === 'ready') return <Navigate to={from} replace />;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError(null);
    const err = await signIn(email.trim(), password);
    setPending(false);
    if (err) {
      setError(err.kind === 'auth' ? t('admin.login.invalid') : err.message);
      return;
    }
    // 'denied' est géré par le guard de layout (compte non admin).
    navigate(from, { replace: true });
  };

  return (
    <div className={styles.login}>
      <Helmet>
        <title>{t('admin.login.title')} — PAUL</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <form className={styles.loginCard} onSubmit={onSubmit}>
        <div>
          <p className={styles.loginBrand}>
            PAUL<span>.</span>
          </p>
          <p className={cx('mono', styles.loginSub)}>{t('admin.login.sub')}</p>
        </div>
        {!isSupabaseConfigured && <p className={styles.loginError}>{t('admin.login.notConfigured')}</p>}
        <label className={styles.formField}>
          <span className={cx('mono', styles.formLabel)}>{t('admin.login.email')}</span>
          <input type="email" required autoComplete="username" className={styles.input} value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className={styles.formField}>
          <span className={cx('mono', styles.formLabel)}>{t('admin.login.password')}</span>
          <input type="password" required autoComplete="current-password" className={styles.input} value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && (
          <p className={styles.loginError} role="alert">
            {error}
          </p>
        )}
        <button type="submit" className={cx('mono', styles.btn, styles.btnPrimary)} disabled={pending || !isSupabaseConfigured}>
          {pending ? t('admin.login.loading') : t('admin.login.submit')}
        </button>
      </form>
    </div>
  );
}
