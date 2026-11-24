import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '@/utils/cx';
import { Container } from '../Container/Container';
import { Eyebrow } from '../Eyebrow/Eyebrow';
import styles from './Section.module.css';

interface SectionProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  /** Numéro de section affiché en HUD ("01"). */
  index?: string;
  /** Libellé technique associé au numéro. */
  label?: string;
  tone?: 'base' | 'elevated';
  spacing?: 'default' | 'tight' | 'none';
  /** Filet supérieur fin. */
  divider?: boolean;
  /** Si `false`, le contenu n'est pas enveloppé dans un Container. */
  contained?: boolean;
  children: ReactNode;
}

const SPACING_CLASS: Record<NonNullable<SectionProps['spacing']>, string | undefined> = {
  default: styles.spacingDefault,
  tight: styles.spacingTight,
  none: styles.spacingNone,
};

export function Section({
  index,
  label,
  tone = 'base',
  spacing = 'default',
  divider = false,
  contained = true,
  className,
  children,
  ...rest
}: SectionProps) {
  const meta = label ? (
    <div className={styles.meta}>
      <Eyebrow index={index} label={label} as="div" />
    </div>
  ) : null;

  return (
    <section
      className={cx(styles.section, styles[tone], SPACING_CLASS[spacing], divider && styles.divider, className)}
      {...rest}
    >
      {contained ? (
        <Container>
          {meta}
          {children}
        </Container>
      ) : (
        <>
          {meta && <Container>{meta}</Container>}
          {children}
        </>
      )}
    </section>
  );
}
