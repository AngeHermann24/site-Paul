import { Fragment, type ReactNode } from 'react';
import { cx } from '@/utils/cx';
import styles from './RichText.module.css';

/**
 * Rendu d'un sous-ensemble Markdown sûr (aucun HTML injecté, aucun dangerouslySetInnerHTML) :
 * paragraphes, `## titre`, `### sous-titre`, listes `- `, citations `> `, **gras**, *italique*, [lien](https://…).
 */
export function RichText({ text, className }: { text: string | null | undefined; className?: string }) {
  if (!text) return null;
  const blocks = text.replace(/\r\n/g, '\n').split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return <div className={cx(styles.rich, className)}>{blocks.map((block, i) => renderBlock(block, i))}</div>;
}

function renderBlock(block: string, key: number): ReactNode {
  if (block.startsWith('### ')) return <h4 key={key}>{inline(block.slice(4))}</h4>;
  if (block.startsWith('## ')) return <h3 key={key}>{inline(block.slice(3))}</h3>;
  const lines = block.split('\n');
  if (lines.every((l) => /^[-*] /.test(l))) {
    return (
      <ul key={key}>
        {lines.map((l, i) => (
          <li key={i}>{inline(l.slice(2))}</li>
        ))}
      </ul>
    );
  }
  if (lines.every((l) => l.startsWith('>'))) {
    return <blockquote key={key}>{inline(lines.map((l) => l.replace(/^>\s?/, '')).join(' '))}</blockquote>;
  }
  return (
    <p key={key}>
      {lines.map((l, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {inline(l)}
        </Fragment>
      ))}
    </p>
  );
}

const TOKEN = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\(https?:\/\/[^)\s]+\))/g;

function inline(text: string): ReactNode[] {
  return text.split(TOKEN).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) return <em key={i}>{part.slice(1, -1)}</em>;
    const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/);
    if (link) {
      return (
        <a key={i} href={link[2]} target="_blank" rel="noopener noreferrer">
          {link[1]}
        </a>
      );
    }
    return part;
  });
}
