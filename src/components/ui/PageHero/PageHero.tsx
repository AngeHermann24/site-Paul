import type { ReactNode } from 'react';
import { cx } from '@/utils/cx';
import { Container } from '../Container/Container';
import { Eyebrow } from '../Eyebrow/Eyebrow';
import { Heading } from '../Heading/Heading';
import styles from './PageHero.module.css';

interface PageHeroProps {
  index: string;
  label: string;
  title: string;
  intro?: string;
  /** Photo d'ambiance (décorative) : à droite en fondu sur desktop, plein cadre voilé sur mobile. */
  image?: { src: string; position?: string };
  children?: ReactNode;
}

/** En-tête de page interne : numéro HUD, titre monumental, chapô. */
export function PageHero({ index, label, title, intro, image, children }: PageHeroProps) {
  return (
    <header className={cx(styles.hero, image && styles.withImage)}>
      {image && (
        <div className={styles.media} aria-hidden="true">
          <img
            src={image.src}
            alt=""
            loading="eager"
            decoding="async"
            fetchPriority="high"
            className={styles.img}
            style={image.position ? { objectPosition: image.position } : undefined}
          />
        </div>
      )}
      <Container className={styles.content}>
        <Eyebrow index={index} label={label} className={styles.eyebrow} />
        <Heading as="h1" size="3xl" className={styles.title}>
          {title}
        </Heading>
        {intro && <p className={styles.intro}>{intro}</p>}
        {children}
      </Container>
    </header>
  );
}
