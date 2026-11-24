import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useParams } from 'react-router';
import { ArrowLeft, Check, Link2, Share2 } from 'lucide-react';
import { useLang, useLocalePath } from '@/hooks/useLang';
import { useServiceQuery } from '@/hooks/useServiceQuery';
import { getArticleBySlug } from '@/services/articles';
import { env } from '@/utils/env';
import { formatDate } from '@/utils/format';
import { articleJsonLd } from '@/utils/jsonLd';
import { cx } from '@/utils/cx';
import { Seo } from '@/components/system/Seo/Seo';
import { RichText } from '@/components/data/RichText/RichText';
import { Skeleton } from '@/components/data/Skeleton/Skeleton';
import { Button } from '@/components/ui/Button/Button';
import { Container } from '@/components/ui/Container/Container';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { Eyebrow } from '@/components/ui/Eyebrow/Eyebrow';
import { Section } from '@/components/ui/Section/Section';
import { RevealImage } from '@/components/motion/RevealImage/RevealImage';
import styles from './NewsDetailPage.module.css';

export default function NewsDetailPage() {
  const { t } = useTranslation();
  const lang = useLang();
  const to = useLocalePath();
  const { slug = '' } = useParams();
  const { pathname } = useLocation();
  const [copied, setCopied] = useState(false);

  const article = useServiceQuery(() => getArticleBySlug(lang, slug), [lang, slug]);

  if (article.status === 'loading') {
    return (
      <Section spacing="tight">
        <Skeleton height="60vh" />
      </Section>
    );
  }

  if (article.status === 'error' || !article.data) {
    return (
      <Section spacing="tight">
        <Seo title={t('newsPage.notFoundTitle')} noindex />
        <EmptyState
          title={t('newsPage.notFoundTitle')}
          body={t('newsPage.notFoundBody')}
          action={
            <Button to={to('news')} variant="ghost" icon={<ArrowLeft size={18} aria-hidden="true" />}>
              {t('newsPage.back')}
            </Button>
          }
        />
      </Section>
    );
  }

  const a = article.data;
  const pageUrl = `${env.siteUrl || window.location.origin}${pathname}`;

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: a.title, url: pageUrl });
        return;
      } catch {
        // Partage annulé : on ne fait rien.
      }
    }
    copyLink();
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard indisponible : le bouton reste sans effet visible.
    }
  };

  return (
    <>
      <Seo
        title={a.seoTitle ?? a.title}
        description={a.seoDescription ?? a.excerpt ?? undefined}
        image={a.cover?.url}
        type="article"
        jsonLd={articleJsonLd(a, pageUrl)}
      />

      <article>
        <header className={styles.hero}>
          <Container className={styles.heroInner}>
            <Eyebrow index={t(`enums.articleCategory.${a.category}`)} label={formatDate(lang, a.publishedAt)} />
            <h1 className={cx('display', styles.title)}>{a.title}</h1>
            <div className={styles.meta}>
              {a.authorName && <span className="mono">{t('newsPage.by', { author: a.authorName })}</span>}
              <time dateTime={a.publishedAt} className="mono">
                {formatDate(lang, a.publishedAt)}
              </time>
              {a.updatedAt.slice(0, 10) !== a.publishedAt.slice(0, 10) && (
                <span className="mono">{t('newsPage.updated', { date: formatDate(lang, a.updatedAt) })}</span>
              )}
            </div>
            {a.excerpt && <p className={styles.excerpt}>{a.excerpt}</p>}
          </Container>
        </header>

        <Section spacing="tight" contained={false}>
          <Container>
            <RevealImage src={a.cover?.url} alt={a.cover?.alt || a.title} placeholderLabel={t('media.placeholder')} ratio="21 / 10" priority />
          </Container>
        </Section>

        <Section spacing="tight" aria-label={a.title}>
          <div className={styles.body}>
            {a.body ? <RichText text={a.body} /> : <p className={styles.noBody}>{a.excerpt}</p>}
            {a.tags.length > 0 && (
              <ul className={styles.tags}>
                {a.tags.map((tag) => (
                  <li key={tag} className="mono">
                    #{tag}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Section>

        <Section spacing="tight" divider aria-label={t('newsPage.share')}>
          <div className={styles.footer}>
            <Button to={to('news')} variant="ghost" icon={<ArrowLeft size={18} aria-hidden="true" />}>
              {t('newsPage.back')}
            </Button>
            <div className={styles.share}>
              <span className={cx('mono', styles.shareLabel)}>{t('newsPage.share')}</span>
              {'share' in navigator && (
                <Button variant="ghost" onClick={share} icon={<Share2 size={16} aria-hidden="true" />}>
                  {t('newsPage.share')}
                </Button>
              )}
              <Button variant="ghost" onClick={copyLink} icon={copied ? <Check size={16} aria-hidden="true" /> : <Link2 size={16} aria-hidden="true" />}>
                {copied ? t('newsPage.copied') : t('newsPage.copyLink')}
              </Button>
            </div>
          </div>
        </Section>
      </article>
    </>
  );
}
