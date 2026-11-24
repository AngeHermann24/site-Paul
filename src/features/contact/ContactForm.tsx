import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import { useLang } from '@/hooks/useLang';
import { submitRequest } from '@/services/requests';
import { contactSchema, CONTACT_TYPES, type ContactFormValues } from '@/schemas/requests';
import { cx } from '@/utils/cx';
import { Button } from '@/components/ui/Button/Button';
import { useAntispam } from '@/features/forms/useAntispam';
import { useTurnstile } from '@/features/forms/useTurnstile';
import { issueMessage } from '@/features/forms/formIssues';
import { Chips, ConsentField, Field, FormError, FormSuccess, Honeypot, type FormStatus } from '@/features/forms/fields';
import shared from '@/features/forms/fields.module.css';
import styles from './ContactForm.module.css';

const isContactType = (v: string | null): v is ContactFormValues['type'] =>
  Boolean(v && (CONTACT_TYPES as readonly string[]).includes(v));

/** Formulaire de contact général : types de demande, honeypot + délai anti-spam, envoi direct en base. */
export function ContactForm() {
  const { t } = useTranslation();
  const lang = useLang();
  const [params] = useSearchParams();
  const [status, setStatus] = useState<FormStatus>('idle');
  const { isSpam, reset: resetSpam } = useAntispam();
  const turnstile = useTurnstile();
  const requestedType = params.get('type');

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ContactFormValues>({
    defaultValues: {
      type: isContactType(requestedType) ? requestedType : 'professional',
      fullName: '',
      email: '',
      phone: '',
      organization: '',
      subject: '',
      message: '',
      consent: false,
      website: '',
    },
  });
  const selectedType = watch('type');

  // Le type peut arriver par l'URL (?type=gym) après le montage.
  useEffect(() => {
    const type = params.get('type');
    if (isContactType(type)) setValue('type', type);
  }, [params, setValue]);

  // Une saisie corrige immédiatement l'erreur affichée du champ.
  useEffect(() => {
    const sub = watch((_v, { name }) => {
      if (name) clearErrors(name as keyof ContactFormValues);
    });
    return () => sub.unsubscribe();
  }, [watch, clearErrors]);

  const onSubmit = handleSubmit(async (values) => {
    // Anti-spam d'abord : honeypot rempli ou envoi quasi instantané → succès simulé (sans insertion).
    if (isSpam(values.website)) {
      setStatus('sent');
      return;
    }

    const parsed = contactSchema.safeParse(values);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (typeof field === 'string') {
          setError(field as keyof ContactFormValues, { message: issueMessage(t, issue) });
        }
      }
      return;
    }

    setStatus('sending');
    const res = await submitRequest(
      'contact',
      {
        type: parsed.data.type,
        full_name: parsed.data.fullName,
        email: parsed.data.email,
        phone: parsed.data.phone || null,
        organization: parsed.data.organization || null,
        subject: parsed.data.subject,
        message: parsed.data.message,
        consent: true,
        locale: lang,
      },
      { turnstileToken: turnstile.token },
    );
    if (res.error) {
      turnstile.reset();
      setStatus(res.error.kind === 'rate_limited' ? 'rate_limited' : 'error');
      return;
    }
    setStatus('sent');
  });

  if (status === 'sent') {
    return (
      <FormSuccess
        title={t('form.sentTitle')}
        body={t('form.sentBody')}
        againLabel={t('form.sendAnother')}
        onAgain={() => {
          reset();
          resetSpam();
          setStatus('idle');
        }}
      />
    );
  }

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <fieldset className={styles.typeField}>
        <legend className={cx('mono', shared.label)}>{t('form.type')}</legend>
        <Chips
          name="type"
          options={CONTACT_TYPES.map((type) => ({ value: type, label: t(`contactPage.types.${type}`) }))}
          value={selectedType}
          onChange={(v) => setValue('type', v as ContactFormValues['type'])}
        />
      </fieldset>

      <div className={styles.row}>
        <Field label={t('form.fullName')} error={errors.fullName?.message} required>
          <input type="text" autoComplete="name" className={shared.input} aria-invalid={Boolean(errors.fullName)} {...register('fullName')} />
        </Field>
        <Field label={t('form.email')} error={errors.email?.message} required>
          <input type="email" autoComplete="email" className={shared.input} aria-invalid={Boolean(errors.email)} {...register('email')} />
        </Field>
      </div>

      <div className={styles.row}>
        <Field label={t('form.phone')} optional>
          <input type="tel" autoComplete="tel" className={shared.input} {...register('phone')} />
        </Field>
        <Field label={t('form.organization')} optional>
          <input type="text" autoComplete="organization" className={shared.input} {...register('organization')} />
        </Field>
      </div>

      <Field label={t('form.subject')} error={errors.subject?.message} required>
        <input type="text" className={shared.input} aria-invalid={Boolean(errors.subject)} {...register('subject')} />
      </Field>

      <Field label={t('form.message')} error={errors.message?.message} required>
        <textarea rows={6} className={cx(shared.input, shared.textarea)} aria-invalid={Boolean(errors.message)} {...register('message')} />
      </Field>

      <Honeypot {...register('website')} />
      <ConsentField
        checked={watch('consent')}
        onChange={(v) => setValue('consent', v, { shouldValidate: false })}
        error={errors.consent?.message}
      />
      <FormError status={status} />
      {turnstile.enabled && <div ref={turnstile.containerRef} />}

      <Button type="submit" variant="primary" size="lg" disabled={status === 'sending'}>
        {status === 'sending' ? t('form.sending') : t('form.send')}
      </Button>
    </form>
  );
}
