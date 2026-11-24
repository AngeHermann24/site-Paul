import type { ReactNode } from 'react';
import { cx } from '@/utils/cx';
import styles from './Heading.module.css';

type HeadingTag = 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span';
type HeadingSize = 'mega' | '3xl' | '2xl' | 'xl' | 'lg';

interface HeadingProps {
  as?: HeadingTag;
  size?: HeadingSize;
  /** `outline` : texte en contour (contraste avec le plein). */
  tone?: 'solid' | 'outline' | 'accent';
  /** Autorise le titre à déborder du bord de l'écran. */
  bleed?: boolean;
  /**
   * Texte du titre. Une chaîne contenant des `\n` est découpée en lignes masquées
   * (`.line-mask`) prêtes pour la révélation GSAP ligne par ligne.
   */
  children: ReactNode;
  id?: string;
  className?: string;
}

const SIZE_CLASS: Record<HeadingSize, string | undefined> = {
  mega: styles.sizeMega,
  '3xl': styles.sizeXxxl,
  '2xl': styles.sizeXxl,
  xl: styles.sizeXl,
  lg: styles.sizeLg,
};

export function Heading({ as: Tag = 'h2', size = '2xl', tone = 'solid', bleed, children, id, className }: HeadingProps) {
  const content =
    typeof children === 'string'
      ? children.split('\n').map((line, i) => (
          <span key={i} className="line-mask">
            <span className={styles.line} data-line="">
              {line}
            </span>
          </span>
        ))
      : children;

  return (
    <Tag
      id={id}
      className={cx('display', styles.heading, SIZE_CLASS[size], styles[tone], bleed && styles.bleed, className)}
      data-reveal={typeof children === 'string' ? 'lines' : undefined}
    >
      {content}
    </Tag>
  );
}
