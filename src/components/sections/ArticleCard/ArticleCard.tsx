import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ArrowUpRight } from 'lucide-react';
import { useLang, useLocalePath } from '@/hooks/useLang';
import type { ArticleSummary } from '@/services/articles';
import { formatDate } from '@/utils/format';
import { cx } from '@/utils/cx';
import styles from './ArticleCard.module.css';

export function ArticleCard({ article, index, titleLevel = 3 }: { article: ArticleSummary; index?: number; titleLevel?: 2 | 3 }) {
  const { t } = useTranslation();
  const lang = useLang();
  const to = useLocalePath();
  const TitleTag = `h${titleLevel}` as 'h2' | 'h3';

  return (
    <article className={styles.card}>
      <Link to={to('news', article.slug)} className={styles.link} data-cursor="link">
        <div className={styles.media} aria-hidden="true">
          {article.cover ? (
            <img src={article.cover.url} alt="" loading="lazy" decoding="async" className={styles.img} />
          ) : (
            <span className={styles.placeholder} />
          )}
        </div>
        <p className={cx('mono', styles.meta)}>
          {index !== undefined && <span className={styles.index}>{String(index + 1).padStart(2, '0')}</span>}
          <span>{t(`enums.articleCategory.${article.category}`)}</span>
          <time dateTime={article.publishedAt}>{formatDate(lang, article.publishedAt, 'short')}</time>
        </p>
        <TitleTag className={cx('display', styles.title)}>{article.title}</TitleTag>
        {article.excerpt && <p className={styles.excerpt}>{article.excerpt}</p>}
        <span className={cx('mono', styles.more)}>
          {t('newsPage.readMore')} <ArrowUpRight size={14} aria-hidden="true" />
        </span>
      </Link>
    </article>
  );
}
