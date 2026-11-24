import { Fragment, type ReactNode } from 'react';
import { cx } from '@/utils/cx';
import styles from './RichText.module.css';

interface RichTextProps {
  /** Texte éditorial saisi dans l'admin (markdown allégé, jamais de HTML brut). */
  text: string;
  className?: string;
}

const isSafeUrl = (url: string) => /^(https?:\/\/|mailto:)/i.test(url.trim());

/** Rendu inline : `**gras**`, `*italique*`, `[label](url)` — tout en nœuds React, aucun innerHTML. */
function inline(text: string, keyPrefix: string): ReactNode[] {
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)\s]+\))/g;
  return text
    .split(pattern)
    .filter(Boolean)
    .map((part, i) => {
      const key = `${keyPrefix}-${i}`;
      if (part.startsWith('**') && part.endsWith('**')) return <strong key={key}>{part.slice(2, -2)}</strong>;
      if (part.startsWith('*') && part.endsWith('*') && part.length > 2) return <em key={key}>{part.slice(1, -1)}</em>;
      const link = part.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
      if (link && link[1] && link[2] && isSafeUrl(link[2])) {
        const external = /^https?:\/\//i.test(link[2]);
        return (
          <a key={key} href={link[2]} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
            {link[1]}
          </a>
        );
      }
      return <Fragment key={key}>{part}</Fragment>;
    });
}

/**
 * Rendu du texte enrichi de l'admin — sous-ensemble volontairement limité :
 * paragraphes (lignes vides), `##`/`###` titres, listes `- `, citations `> `,
 * et les marques inline ci-dessus. Aucune balise n'est interprétée.
 */
export function RichText({ text, className }: RichTextProps) {
  const blocks = text
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

  return (
    <div className={cx(styles.rich, className)}>
      {blocks.map((block, i) => {
        const key = `b${i}`;
        if (block.startsWith('### ')) return <h3 key={key}>{inline(block.slice(4), key)}</h3>;
        if (block.startsWith('## ')) return <h2 key={key}>{inline(block.slice(3), key)}</h2>;
        if (block.startsWith('> ')) return <blockquote key={key}>{inline(block.slice(2), key)}</blockquote>;
        const lines = block.split('\n').map((l) => l.trim());
        if (lines.every((l) => l.startsWith('- '))) {
          return (
            <ul key={key}>
              {lines.map((l, j) => (
                <li key={`${key}-${j}`}>{inline(l.slice(2), `${key}-${j}`)}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={key}>
            {lines.map((l, j) => (
              <Fragment key={`${key}-${j}`}>
                {j > 0 && <br />}
                {inline(l, `${key}-${j}`)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
