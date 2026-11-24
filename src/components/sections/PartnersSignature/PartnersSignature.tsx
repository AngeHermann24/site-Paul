import { useTranslation } from 'react-i18next';
import { useLang, useLocalePath } from '@/hooks/useLang';
import { useServiceQuery } from '@/hooks/useServiceQuery';
import { listActiveSponsors, type Sponsor } from '@/services/sponsors';
import { cx } from '@/utils/cx';
import { Button } from '@/components/ui/Button/Button';
import { Container } from '@/components/ui/Container/Container';
import styles from './PartnersSignature.module.css';

/**
 * Signature de fin de site : « POWERED BY OUR PARTNERS » (recette 11).
 * Logos chargés depuis Supabase (actifs, ordonnés, mis en avant d'abord, cliquables).
 * Aucun sponsor → invitation à devenir partenaire. Jamais de faux logos.
 */
export function PartnersSignature() {
  const { t } = useTranslation();
  const lang = useLang();
  const to = useLocalePath();
  const query = useServiceQuery(() => listActiveSponsors(lang), [lang]);
  const sponsors = query.status === 'success' ? query.data : [];

  return (
    <section className={styles.signature} aria-labelledby="partners-title">
      <Container className={styles.head}>
        <p className={cx('mono', styles.label)}>{t('partners.label')}</p>
        <h2 id="partners-title" className={cx('display', styles.title)}>
          {t('partners.title')}
        </h2>
      </Container>

      {query.status === 'loading' ? (
        <div className={styles.loading} aria-hidden="true" />
      ) : sponsors.length > 0 ? (
        <Marquee sponsors={sponsors} />
      ) : (
        <Container className={styles.empty}>
          <p className={cx('display', styles.emptyTitle)}>{t('partners.emptyTitle')}</p>
          <p className={styles.emptyBody}>{t('partners.emptyBody')}</p>
          <Button to={to('sponsors')} variant="primary">
            {t('cta.becomePartner')}
          </Button>
        </Container>
      )}
    </section>
  );
}

function Marquee({ sponsors }: { sponsors: Sponsor[] }) {
  const { t } = useTranslation();
  // Assez d'items pour couvrir la largeur : le groupe est répété avant d'être dupliqué.
  const repeat = Math.max(1, Math.ceil(8 / sponsors.length));
  const group = Array.from({ length: repeat }, () => sponsors).flat();

  const renderItem = (s: Sponsor, i: number, hidden: boolean) => {
    const content = s.logoUrl ? (
      <img className={styles.logo} src={s.logoUrl} alt={hidden ? '' : s.name} loading="lazy" decoding="async" />
    ) : (
      <span className={cx('display', styles.name)}>{s.name}</span>
    );
    const key = `${s.id}-${i}`;
    if (!s.websiteUrl) {
      return (
        <li key={key} className={cx(styles.item, s.isFeatured && styles.featured)}>
          {content}
        </li>
      );
    }
    return (
      <li key={key} className={cx(styles.item, s.isFeatured && styles.featured)}>
        <a
          href={s.websiteUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className={styles.link}
          aria-label={hidden ? undefined : t('partners.visit', { name: s.name })}
          tabIndex={hidden ? -1 : undefined}
          data-cursor="link"
        >
          {content}
        </a>
      </li>
    );
  };

  return (
    <div className={styles.marquee}>
      <div className={styles.rail}>
        {/* Groupe 1 : accessible. Groupe 2 : copie décorative pour la boucle infinie. */}
        <ul role="list" className={styles.group}>
          {group.map((s, i) => renderItem(s, i, i >= sponsors.length))}
        </ul>
        <ul role="list" className={styles.group} aria-hidden="true">
          {group.map((s, i) => renderItem(s, i, true))}
        </ul>
      </div>
    </div>
  );
}
