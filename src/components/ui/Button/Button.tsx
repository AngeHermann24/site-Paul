import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router';
import { ArrowUpRight } from 'lucide-react';
import { cx } from '@/utils/cx';
import styles from './Button.module.css';

interface BaseProps {
  variant?: 'primary' | 'ghost' | 'link';
  size?: 'md' | 'lg';
  /** Icône à droite. `null` pour aucune, par défaut une flèche. */
  icon?: ReactNode | null;
  className?: string;
  children: ReactNode;
}

type RouterLinkProps = BaseProps & { to: string; href?: never } & Omit<LinkProps, 'to' | 'className' | 'children'>;
type AnchorProps = BaseProps & { href: string; to?: never } & Omit<
    AnchorHTMLAttributes<HTMLAnchorElement>,
    'href' | 'className' | 'children'
  >;
type NativeButtonProps = BaseProps & { to?: never; href?: never } & Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    'className' | 'children'
  >;

export type ButtonProps = RouterLinkProps | AnchorProps | NativeButtonProps;

function Inner({ children, icon }: Pick<BaseProps, 'children' | 'icon'>) {
  const iconNode = icon === undefined ? <ArrowUpRight size={18} strokeWidth={1.75} aria-hidden="true" /> : icon;
  return (
    <>
      <span className={styles.label}>
        {typeof children === 'string' ? (
          <span className={styles.roll} data-text={children}>
            {children}
          </span>
        ) : (
          children
        )}
      </span>
      {iconNode && <span className={styles.icon}>{iconNode}</span>}
    </>
  );
}

export function Button(props: ButtonProps) {
  const { variant = 'primary', size = 'md', icon, className, children } = props;
  const classes = cx(styles.button, styles[variant], styles[size], className);

  if (props.to !== undefined) {
    const { variant: _v, size: _s, icon: _i, className: _c, children: _ch, ...linkProps } = props;
    return (
      <Link className={classes} data-cursor="link" data-magnetic="" {...linkProps}>
        <Inner icon={icon}>{children}</Inner>
      </Link>
    );
  }

  if (props.href !== undefined) {
    const { variant: _v, size: _s, icon: _i, className: _c, children: _ch, ...anchorProps } = props;
    const external = /^https?:\/\//.test(props.href);
    return (
      <a
        className={classes}
        data-cursor="link"
        data-magnetic=""
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        {...anchorProps}
      >
        <Inner icon={icon}>{children}</Inner>
      </a>
    );
  }

  const { variant: _v, size: _s, icon: _i, className: _c, children: _ch, type = 'button', ...buttonProps } = props;
  return (
    <button type={type} className={classes} data-cursor="link" data-magnetic="" {...buttonProps}>
      <Inner icon={icon}>{children}</Inner>
    </button>
  );
}
