import { useTranslation } from 'react-i18next';
import { SETTINGS_FIELDS } from '@/features/admin/resources';
import { SingletonForm } from '@/pages/admin/ResourceListPage';
import styles from '@/features/admin/admin.module.css';

/** `/admin/reglages` — `site_settings` est un singleton à édition directe. */
export default function SettingsPage() {
  const { t } = useTranslation();
  return (
    <>
      <div className={styles.topbar}>
        <div>
          <h1 className={styles.pageTitle}>{t('admin.settings.title')}</h1>
          <p className={styles.pageSub}>{t('admin.settings.sub')}</p>
        </div>
      </div>
      <SingletonForm table="site_settings" fields={SETTINGS_FIELDS} />
    </>
  );
}
