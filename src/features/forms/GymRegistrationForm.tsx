import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLang } from '@/hooks/useLang';
import { submitRequest } from '@/services/requests';
import {
  EXPERIENCE_LEVELS,
  PREFERRED_CONTACT,
  gymRegistrationSchema,
  type GymRegistrationValues,
} from '@/schemas/requests';
import { Button } from '@/components/ui/Button/Button';
import { useAntispam } from './useAntispam';
import { useTurnstile } from './useTurnstile';
import { issuesToMap } from './formIssues';
import { Chips, ConsentField, Field, FormError, FormSuccess, Honeypot, SelectInput, type FormStatus } from './fields';
import fields from './fields.module.css';
import styles from './forms.module.css';

export interface GymFormOptions {
  memberships: { id: string; name: string }[];
  /** Slugs stables envoyés en base (`gym_services.slug`). */
  disciplines: { slug: string; label: string }[];
}

type Errors = Partial<Record<keyof GymRegistrationValues, string>>;

/** Demande d'inscription à la salle → `gym_registration_requests` (INSERT seul, anti-spam). */
export function GymRegistrationForm({ memberships, disciplines }: GymFormOptions) {
  const { t } = useTranslation();
  const lang = useLang();
  const { isSpam, reset: resetSpam } = useAntispam();
  const turnstile = useTurnstile();

  const [values, setValues] = useState({
    fullName: '',
    email: '',
    phone: '',
    membershipId: '',
    disciplines: [] as string[],
    experienceLevel: '',
    preferredContact: 'email',
    message: '',
    consent: false,
    website: '',
  });
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<FormStatus>('idle');
  const set = <K extends keyof typeof values>(k: K, v: (typeof values)[K]) => {
    setValues((s) => ({ ...s, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSpam(values.website)) {
      setStatus('sent');
      return;
    }
    const parsed = gymRegistrationSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(issuesToMap(t, parsed.error.issues));
      return;
    }
    const d = parsed.data;
    setStatus('sending');
    const res = await submitRequest('gym', {
      full_name: d.fullName,
      email: d.email,
      phone: d.phone || null,
      membership_id: d.membershipId ?? null,
      disciplines: d.disciplines,
      experience_level: d.experienceLevel ?? null,
      preferred_contact: d.preferredContact,
      message: d.message || null,
      consent: true,
      locale: lang,
    }, { turnstileToken: turnstile.token });
    if (res.error) {
      turnstile.reset();
      setStatus(res.error.kind === 'rate_limited' ? 'rate_limited' : 'error');
      return;
    }
    setStatus('sent');
  };

  if (status === 'sent') {
    return (
      <FormSuccess
        title={t('gymForm.sentTitle')}
        body={t('gymForm.sentBody')}
        againLabel={t('form.sendAnother')}
        onAgain={() => {
          setValues((v) => ({ ...v, message: '', website: '', consent: false }));
          setErrors({});
          resetSpam();
          setStatus('idle');
        }}
      />
    );
  }

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <div className={styles.row}>
        <Field label={t('form.fullName')} error={errors.fullName} required>
          <input type="text" autoComplete="name" className={fields.input} aria-invalid={Boolean(errors.fullName)} value={values.fullName} onChange={(e) => set('fullName', e.target.value)} />
        </Field>
        <Field label={t('form.email')} error={errors.email} required>
          <input type="email" autoComplete="email" className={fields.input} aria-invalid={Boolean(errors.email)} value={values.email} onChange={(e) => set('email', e.target.value)} />
        </Field>
      </div>

      <div className={styles.row}>
        <Field label={t('form.phone')} error={errors.phone} optional>
          <input type="tel" autoComplete="tel" className={fields.input} value={values.phone} onChange={(e) => set('phone', e.target.value)} />
        </Field>
        <Field label={t('gymForm.membership')} optional>
          <SelectInput
            value={values.membershipId}
            onChange={(v) => set('membershipId', v)}
            placeholder={t('gymForm.membershipAny')}
            options={memberships.map((m) => ({ value: m.id, label: m.name }))}
          />
        </Field>
      </div>

      {disciplines.length > 0 && (
        <Field label={t('gymForm.disciplines')} optional>
          <Chips
            name="disciplines"
            multiple
            options={disciplines.map((d) => ({ value: d.slug, label: d.label }))}
            value={values.disciplines}
            onChange={(v) => set('disciplines', v as string[])}
          />
        </Field>
      )}

      <div className={styles.row}>
        <Field label={t('gymForm.experience')} optional>
          <SelectInput
            value={values.experienceLevel}
            onChange={(v) => set('experienceLevel', v)}
            placeholder={t('gymForm.experienceAny')}
            options={EXPERIENCE_LEVELS.map((l) => ({ value: l, label: t(`gymForm.levels.${l}`) }))}
          />
        </Field>
        <Field label={t('gymForm.preferredContact')}>
          <Chips
            name="preferred_contact"
            options={PREFERRED_CONTACT.map((c) => ({ value: c, label: t(`gymForm.preferredContacts.${c}`) }))}
            value={values.preferredContact}
            onChange={(v) => set('preferredContact', v as 'email' | 'phone')}
          />
        </Field>
      </div>

      <Field label={t('form.message')} error={errors.message} optional>
        <textarea rows={5} className={`${fields.input} ${fields.textarea}`} aria-invalid={Boolean(errors.message)} value={values.message} onChange={(e) => set('message', e.target.value)} />
      </Field>

      <Honeypot value={values.website} onChange={(e) => set('website', e.target.value)} />
      <ConsentField checked={values.consent} onChange={(v) => set('consent', v)} error={errors.consent} />
      <FormError status={status} />
      {turnstile.enabled && <div ref={turnstile.containerRef} />}

      <Button type="submit" variant="primary" size="lg" disabled={status === 'sending'}>
        {status === 'sending' ? t('form.sending') : t('gymForm.submit')}
      </Button>
    </form>
  );
}
