import type { TFunction } from 'i18next';
import type { z } from 'zod';

/** Traduit un `ZodIssue` en message localisé (`form.errors.*`). */
export function issueMessage(t: TFunction, issue: z.core.$ZodIssue): string {
  if (issue.path[0] === 'consent') return t('form.errors.consent');
  if (issue.code === 'invalid_format' || ('format' in issue && issue.format === 'email')) return t('form.errors.email');
  if (issue.code === 'too_small') {
    const min = 'minimum' in issue ? Number(issue.minimum) : 1;
    return min > 1 ? t('form.errors.minLength', { count: min }) : t('form.errors.required');
  }
  if (issue.code === 'too_big') {
    const max = 'maximum' in issue ? Number(issue.maximum) : 0;
    return t('form.errors.maxLength', { count: max });
  }
  return t('form.errors.required');
}

type AnyErrors<T> = Partial<Record<keyof T, string>>;

/** Convertit le résultat d'un `safeParse` en map champ → message localisé. */
export function issuesToMap<T extends Record<string, unknown>>(t: TFunction, issues: readonly z.core.$ZodIssue[]): AnyErrors<T> {
  const map: AnyErrors<T> = {};
  for (const issue of issues) {
    const field = issue.path[0];
    if (typeof field === 'string' && !(field in map)) {
      (map as Record<string, string>)[field] = issueMessage(t, issue);
    }
  }
  return map;
}
