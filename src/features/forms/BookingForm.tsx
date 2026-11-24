import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLang } from '@/hooks/useLang';
import { submitRequest } from '@/services/requests';
import {
  BOOKING_AUDIENCE,
  BOOKING_BUDGETS,
  BROADCAST_TYPES,
  bookingSchema,
  type BookingFormValues,
} from '@/schemas/requests';
import { Button } from '@/components/ui/Button/Button';
import { useAntispam } from './useAntispam';
import { useTurnstile } from './useTurnstile';
import { issuesToMap } from './formIssues';
import { ConsentField, Field, FormError, FormSuccess, Honeypot, SelectInput, type FormStatus } from './fields';
import fields from './fields.module.css';
import styles from './forms.module.css';

export interface BookingFormOptions {
  /** Prestations publiées (`commentary_services`) pour le select — peut être vide. */
  services: { id: string; title: string }[];
}

type Errors = Partial<Record<keyof BookingFormValues, string>>;

/** Demande de booking commentateur → `booking_requests` (INSERT seul, anti-spam). */
export function BookingForm({ services }: BookingFormOptions) {
  const { t } = useTranslation();
  const lang = useLang();
  const { isSpam, reset: resetSpam } = useAntispam();
  const turnstile = useTurnstile();

  const [values, setValues] = useState({
    organizerName: '',
    organization: '',
    email: '',
    phone: '',
    eventName: '',
    eventDate: '',
    eventCity: '',
    eventCountry: '',
    discipline: '',
    serviceId: '',
    broadcastType: '',
    audienceSize: '',
    budgetRange: '',
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
    const parsed = bookingSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(issuesToMap(t, parsed.error.issues));
      return;
    }
    const d = parsed.data;
    setStatus('sending');
    const res = await submitRequest(
      'booking',
      {
        organizer_name: d.organizerName,
        organization: d.organization || null,
        email: d.email,
        phone: d.phone || null,
        event_name: d.eventName,
        event_date: d.eventDate ?? null,
        event_city: d.eventCity || null,
        event_country: d.eventCountry || null,
        discipline: d.discipline || null,
        service_id: d.serviceId ?? null,
        broadcast_type: d.broadcastType ?? null,
        audience_size: d.audienceSize ?? null,
        budget_range: d.budgetRange ?? null,
        message: d.message,
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
  };

  if (status === 'sent') {
    return (
      <FormSuccess
        title={t('bookingForm.sentTitle')}
        body={t('bookingForm.sentBody')}
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
        <Field label={t('bookingForm.organizer')} error={errors.organizerName} required>
          <input type="text" autoComplete="name" className={fields.input} aria-invalid={Boolean(errors.organizerName)} value={values.organizerName} onChange={(e) => set('organizerName', e.target.value)} />
        </Field>
        <Field label={t('form.organization')} error={errors.organization} optional>
          <input type="text" autoComplete="organization" className={fields.input} value={values.organization} onChange={(e) => set('organization', e.target.value)} />
        </Field>
      </div>

      <div className={styles.row}>
        <Field label={t('form.email')} error={errors.email} required>
          <input type="email" autoComplete="email" className={fields.input} aria-invalid={Boolean(errors.email)} value={values.email} onChange={(e) => set('email', e.target.value)} />
        </Field>
        <Field label={t('form.phone')} error={errors.phone} optional>
          <input type="tel" autoComplete="tel" className={fields.input} value={values.phone} onChange={(e) => set('phone', e.target.value)} />
        </Field>
      </div>

      <div className={styles.row}>
        <Field label={t('bookingForm.eventName')} error={errors.eventName} required>
          <input type="text" className={fields.input} aria-invalid={Boolean(errors.eventName)} value={values.eventName} onChange={(e) => set('eventName', e.target.value)} />
        </Field>
        <Field label={t('bookingForm.eventDate')} error={errors.eventDate} optional>
          <input type="date" className={fields.input} value={values.eventDate} onChange={(e) => set('eventDate', e.target.value)} />
        </Field>
      </div>

      <div className={styles.row}>
        <Field label={t('bookingForm.eventCity')} error={errors.eventCity} optional>
          <input type="text" className={fields.input} value={values.eventCity} onChange={(e) => set('eventCity', e.target.value)} />
        </Field>
        <Field label={t('bookingForm.eventCountry')} error={errors.eventCountry} optional>
          <input type="text" className={fields.input} value={values.eventCountry} onChange={(e) => set('eventCountry', e.target.value)} />
        </Field>
      </div>

      <div className={styles.row}>
        <Field label={t('bookingForm.discipline')} error={errors.discipline} optional>
          <input type="text" className={fields.input} value={values.discipline} onChange={(e) => set('discipline', e.target.value)} />
        </Field>
        <Field label={t('bookingForm.service')} optional>
          <SelectInput
            value={values.serviceId}
            onChange={(v) => set('serviceId', v)}
            placeholder={t('bookingForm.serviceAny')}
            options={services.map((s) => ({ value: s.id, label: s.title }))}
          />
        </Field>
      </div>

      <div className={styles.row}>
        <Field label={t('bookingForm.broadcast')} optional>
          <SelectInput
            value={values.broadcastType}
            onChange={(v) => set('broadcastType', v)}
            placeholder={t('bookingForm.broadcastAny')}
            options={BROADCAST_TYPES.map((b) => ({ value: b, label: t(`bookingForm.broadcasts.${b}`) }))}
          />
        </Field>
        <Field label={t('bookingForm.audience')} optional>
          <SelectInput
            value={values.audienceSize}
            onChange={(v) => set('audienceSize', v)}
            placeholder={t('bookingForm.audienceAny')}
            options={BOOKING_AUDIENCE.map((a) => ({ value: a, label: t(`bookingForm.audiences.${a}`) }))}
          />
        </Field>
      </div>

      <Field label={t('bookingForm.budget')} optional>
        <SelectInput
          value={values.budgetRange}
          onChange={(v) => set('budgetRange', v)}
          placeholder={t('bookingForm.budgetAny')}
          options={BOOKING_BUDGETS.map((b) => ({ value: b, label: t(`bookingForm.budgets.${b}`) }))}
        />
      </Field>

      <Field label={t('form.message')} error={errors.message} required>
        <textarea rows={5} className={`${fields.input} ${fields.textarea}`} aria-invalid={Boolean(errors.message)} value={values.message} onChange={(e) => set('message', e.target.value)} />
      </Field>

      <Honeypot value={values.website} onChange={(e) => set('website', e.target.value)} />
      <ConsentField checked={values.consent} onChange={(v) => set('consent', v)} error={errors.consent} />
      <FormError status={status} />
      {turnstile.enabled && <div ref={turnstile.containerRef} />}

      <Button type="submit" variant="primary" size="lg" disabled={status === 'sending'}>
        {status === 'sending' ? t('form.sending') : t('bookingForm.submit')}
      </Button>
    </form>
  );
}
