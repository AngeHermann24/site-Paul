import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import { cx } from '@/utils/cx';
import styles from './Container.module.css';

interface ContainerProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  /** `bleed` : pleine largeur sans gouttière (titres coupés par le bord de l'écran). */
  width?: 'default' | 'narrow' | 'bleed';
  children: ReactNode;
}

export function Container({ as: Tag = 'div', width = 'default', className, children, ...rest }: ContainerProps) {
  return (
    <Tag className={cx(styles.container, styles[width], className)} {...rest}>
      {children}
    </Tag>
  );
}
