import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { m } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useLang } from '@/hooks/useLang';
import { canAttachFiles, submitRequest, type RequestFile } from '@/services/requests';
import type { SponsorshipPackage } from '@/services/sponsors';
import {
  ATTACHMENT_MAX_BYTES,
  ATTACHMENT_MIME_TYPES,
  COMPANY_SIZES,
  LOGO_MAX_BYTES,
  LOGO_MIME_TYPES,
  SPONSOR_ACTIVITIES,
  SPONSOR_BUDGETS,
  SPONSOR_OBJECTIVES,
  SPONSOR_STEP_FIELDS,
  SPONSOR_TIERS,
  sponsorshipSchema,
  type SponsorshipFormValues,
} from '@/schemas/requests';
import { cx } from '@/utils/cx';
import { Button } from '@/components/ui/Button/Button';
import { useAntispam } from './useAntispam';
import { useTurnstile } from './useTurnstile';
import { issuesToMap } from './formIssues';
import { Chips, ConsentField, Field, FileField, FormError, FormSuccess, Honeypot, SelectInput, type FormStatus } from './fields';
import fields from './fields.module.css';
import styles from './SponsorshipForm.module.css';
import formStyles from './forms.module.css';

const STEPS = ['company', 'contact', 'partnership', 'presentation', 'review'] as const;

// Schémas par étape : `pick` sur le schéma complet (source unique des bornes).
const STEP_SCHEMAS = SPONSOR_STEP_FIELDS.map((list) =>
  sponsorshipSchema.pick(Object.fromEntries(list.map((f) => [f, true])) as Record<keyof SponsorshipFormValues, true>),
);

type Errors = Partial<Record<keyof SponsorshipFormValues | 'logo' | 'attachment', string>>;

type TierValue = (typeof SPONSOR_TIERS)[number];
type ActivityValue = (typeof SPONSOR_ACTIVITIES)[number];
type ObjectiveValue = (typeof SPONSOR_OBJECTIVES)[number];
type BudgetValue = (typeof SPONSOR_BUDGETS)[number];
type SizeValue = (typeof COMPANY_SIZES)[number];

const initialValues = {
  companyName: '',
  companyWebsite: '',
  companySector: '',
  companySize: '' as '' | SizeValue,
  companyCountry: '',
  contactName: '',
  contactRole: '',
  email: '',
  phone: '',
  packageTier: '' as '' | TierValue,
  packageId: '',
  activities: [] as ActivityValue[],
  objectives: [] as ObjectiveValue[],
  budgetRange: '' as '' | BudgetValue,
  desiredStart: '',
  durationMonths: '',
  presentation: '',
  consent: false,
  website: '',
};

function fileError(t: TFunction, file: File, mimes: readonly string[], max: number): string | null {
  if (!mimes.includes(file.type)) return t('form.fileType');
  if (file.size > max) return t('form.fileTooLarge', { max: `${Math.round(max / 1024 / 1024)} Mo` });
  return null;
}

/** Formulaire sponsors en 5 étapes → `sponsorship_requests` + pièces jointes via Edge Function. */
export function SponsorshipForm({ packages }: { packages: SponsorshipPackage[] }) {
  const { t } = useTranslation();
  const lang = useLang();
  const { isSpam, reset: resetSpam } = useAntispam();
  const turnstile = useTurnstile();

  const [step, setStep] = useState(0);
  const [values, setValues] = useState(initialValues);
  const [files, setFiles] = useState<{ logo: File | null; attachment: File | null }>({ logo: null, attachment: null });
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<FormStatus>('idle');
  const [uploadWarning, setUploadWarning] = useState(false);

  const set = <K extends keyof typeof values>(k: K, v: (typeof values)[K]) => {
    setValues((s) => ({ ...s, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };
  const setFile = (k: 'logo' | 'attachment', f: File | null) => {
    setFiles((s) => ({ ...s, [k]: f }));
    setErrors((e) => ({ ...e, [k]: f ? fileError(t, f, k === 'logo' ? LOGO_MIME_TYPES : ATTACHMENT_MIME_TYPES, k === 'logo' ? LOGO_MAX_BYTES : ATTACHMENT_MAX_BYTES) ?? undefined : undefined }));
  };

  /** Valide l'étape courante (schéma `pick` + fichiers déclarés). */
  const validateStep = (i: number): boolean => {
    const schema = STEP_SCHEMAS[i];
    if (!schema) return true;
    const parsed = schema.safeParse(values);
    const fileErrors: Errors = {};
    if (files.logo) {
      const e = fileError(t, files.logo, LOGO_MIME_TYPES, LOGO_MAX_BYTES);
      if (e) fileErrors.logo = e;
    }
    if (files.attachment) {
      const e = fileError(t, files.attachment, ATTACHMENT_MIME_TYPES, ATTACHMENT_MAX_BYTES);
      if (e) fileErrors.attachment = e;
    }
    const map = parsed.success ? {} : issuesToMap(t, parsed.error.issues);
    setErrors({ ...map, ...fileErrors });
    return parsed.success && Object.keys(fileErrors).length === 0;
  };

  const next = () => {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSpam(values.website)) {
      setStatus('sent');
      return;
    }
    if (!validateStep(step)) return;
    const parsed = sponsorshipSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(issuesToMap(t, parsed.error.issues));
      return;
    }
    const d = parsed.data;
    const sendFiles: RequestFile[] = canAttachFiles
      ? ([['logo', files.logo], ['attachment', files.attachment]] as const)
          .filter((kv): kv is readonly ['logo' | 'attachment', File] => Boolean(kv[1]))
          .map(([field, file]) => ({ field, file }))
      : [];

    setStatus('sending');
    const res = await submitRequest(
      'sponsorship',
      {
        company_name: d.companyName,
        company_website: d.companyWebsite ?? null,
        company_sector: d.companySector || null,
        company_size: d.companySize ?? null,
        company_country: d.companyCountry || null,
        contact_name: d.contactName,
        contact_role: d.contactRole || null,
        email: d.email,
        phone: d.phone || null,
        package_tier: d.packageTier ?? null,
        package_id: d.packageId ?? null,
        activities: d.activities,
        objectives: d.objectives,
        budget_range: d.budgetRange ?? null,
        desired_start: d.desiredStart ?? null,
        duration_months: d.durationMonths ?? null,
        presentation: d.presentation,
        consent: true,
        locale: lang,
      },
      { files: sendFiles, turnstileToken: turnstile.token },
    );
    if (res.error) {
      turnstile.reset();
      setStatus(res.error.kind === 'rate_limited' ? 'rate_limited' : 'error');
      return;
    }
    setUploadWarning(res.data.uploadWarnings.length > 0);
    setStatus('sent');
  };

  if (status === 'sent') {
    return (
      <FormSuccess
        title={t('sponsorForm.sentTitle')}
        body={t('sponsorForm.sentBody')}
        warning={uploadWarning ? t('form.uploadWarning') : undefined}
        againLabel={t('sponsorForm.again')}
        onAgain={() => {
          setValues(initialValues);
          setFiles({ logo: null, attachment: null });
          setErrors({});
          setStep(0);
          setUploadWarning(false);
          resetSpam();
          setStatus('idle');
        }}
      />
    );
  }

  const tierOptions = [
    ...packages.map((p) => ({ value: p.id, label: `${p.name} — ${t(`enums.sponsorTier.${p.tier}`)}` })),
    { value: 'undecided', label: t('sponsorForm.tierUndecided') },
  ];

  return (
    <form className={formStyles.form} onSubmit={onSubmit} noValidate>
      {/* Stepper */}
      <div className={styles.stepper} aria-label={t('sponsorForm.stepOf', { current: step + 1, total: STEPS.length })}>
        <ol className={styles.stepList}>
          {STEPS.map((s, i) => (
            <li key={s} className={cx(styles.stepItem, i === step && styles.stepCurrent, i < step && styles.stepDone)}>
              <span className={cx('mono', styles.stepIndex)}>{String(i + 1).padStart(2, '0')}</span>
              <span className={styles.stepName}>{t(`sponsorsPage.steps.${s}`)}</span>
            </li>
          ))}
        </ol>
        <div className={styles.progress} aria-hidden="true">
          <div className={styles.progressBar} style={{ transform: `scaleX(${(step + 1) / STEPS.length})` }} />
        </div>
      </div>

      <m.div
        key={step}
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className={styles.stepBody}
      >
        {step === 0 && (
          <>
            <div className={formStyles.row}>
              <Field label={t('sponsorForm.company.name')} error={errors.companyName} required>
                <input type="text" autoComplete="organization" className={fields.input} aria-invalid={Boolean(errors.companyName)} value={values.companyName} onChange={(e) => set('companyName', e.target.value)} />
              </Field>
              <Field label={t('sponsorForm.company.website')} error={errors.companyWebsite} optional>
                <input type="url" inputMode="url" placeholder="https://" className={fields.input} aria-invalid={Boolean(errors.companyWebsite)} value={values.companyWebsite} onChange={(e) => set('companyWebsite', e.target.value)} />
              </Field>
            </div>
            <div className={formStyles.row}>
              <Field label={t('sponsorForm.company.sector')} error={errors.companySector} optional>
                <input type="text" className={fields.input} value={values.companySector} onChange={(e) => set('companySector', e.target.value)} />
              </Field>
              <Field label={t('sponsorForm.company.country')} error={errors.companyCountry} optional>
                <input type="text" autoComplete="country-name" className={fields.input} value={values.companyCountry} onChange={(e) => set('companyCountry', e.target.value)} />
              </Field>
            </div>
            <div className={formStyles.row}>
              <Field label={t('sponsorForm.company.size')} optional>
                <SelectInput value={values.companySize} onChange={(v) => set('companySize', v as '' | SizeValue)} placeholder={t('sponsorForm.selectPlaceholder')} options={COMPANY_SIZES.map((s) => ({ value: s, label: t(`sponsorForm.sizes.${s}`) }))} />
              </Field>
              {canAttachFiles ? (
                <FileField
                  label={t('sponsorForm.company.logo')}
                  hint={t('sponsorForm.logoHint')}
                  accept={LOGO_MIME_TYPES.join(',')}
                  file={files.logo}
                  error={errors.logo}
                  optional
                  onSelect={(f) => setFile('logo', f)}
                />
              ) : (
                <div />
              )}
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div className={formStyles.row}>
              <Field label={t('sponsorForm.contact.name')} error={errors.contactName} required>
                <input type="text" autoComplete="name" className={fields.input} aria-invalid={Boolean(errors.contactName)} value={values.contactName} onChange={(e) => set('contactName', e.target.value)} />
              </Field>
              <Field label={t('sponsorForm.contact.role')} error={errors.contactRole} optional>
                <input type="text" autoComplete="organization-title" className={fields.input} value={values.contactRole} onChange={(e) => set('contactRole', e.target.value)} />
              </Field>
            </div>
            <div className={formStyles.row}>
              <Field label={t('form.email')} error={errors.email} required>
                <input type="email" autoComplete="email" className={fields.input} aria-invalid={Boolean(errors.email)} value={values.email} onChange={(e) => set('email', e.target.value)} />
              </Field>
              <Field label={t('form.phone')} error={errors.phone} optional>
                <input type="tel" autoComplete="tel" className={fields.input} value={values.phone} onChange={(e) => set('phone', e.target.value)} />
              </Field>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <Field label={t('sponsorForm.partnership.tier')} error={errors.packageTier ?? errors.packageId} optional>
              <SelectInput
                value={values.packageId || values.packageTier}
                onChange={(v) => {
                  const pkg = packages.find((p) => p.id === v);
                  set('packageId', pkg ? v : '');
                  set('packageTier', pkg ? pkg.tier : v === 'undecided' ? 'undecided' : '');
                }}
                placeholder={t('sponsorForm.selectPlaceholder')}
                options={tierOptions}
              />
            </Field>
            <div className={formStyles.row}>
              <Field label={t('sponsorForm.partnership.activities')} error={errors.activities} optional>
                <Chips name="activities" multiple options={SPONSOR_ACTIVITIES.map((a) => ({ value: a, label: t(`sponsorForm.activityItems.${a}`) }))} value={values.activities} onChange={(v) => set('activities', v as ActivityValue[])} />
              </Field>
              <Field label={t('sponsorForm.partnership.budget')} optional>
                <SelectInput value={values.budgetRange} onChange={(v) => set('budgetRange', v as '' | BudgetValue)} placeholder={t('sponsorForm.budgetAny')} options={SPONSOR_BUDGETS.map((b) => ({ value: b, label: t(`sponsorForm.budgets.${b}`) }))} />
              </Field>
            </div>
            <Field label={t('sponsorForm.partnership.objectives')} error={errors.objectives} optional>
              <Chips name="objectives" multiple options={SPONSOR_OBJECTIVES.map((o) => ({ value: o, label: t(`sponsorForm.objectives.${o}`) }))} value={values.objectives} onChange={(v) => set('objectives', v as ObjectiveValue[])} />
            </Field>
            <div className={formStyles.row}>
              <Field label={t('sponsorForm.partnership.desiredStart')} error={errors.desiredStart} optional>
                <input type="date" className={fields.input} value={values.desiredStart} onChange={(e) => set('desiredStart', e.target.value)} />
              </Field>
              <Field label={t('sponsorForm.partnership.duration')} error={errors.durationMonths} optional>
                <input type="number" min={1} max={60} inputMode="numeric" className={fields.input} aria-invalid={Boolean(errors.durationMonths)} value={values.durationMonths} onChange={(e) => set('durationMonths', e.target.value)} />
              </Field>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <Field label={t('sponsorForm.presentation.label')} error={errors.presentation} required>
              <textarea rows={7} className={`${fields.input} ${fields.textarea}`} aria-invalid={Boolean(errors.presentation)} value={values.presentation} onChange={(e) => set('presentation', e.target.value)} />
            </Field>
            <p className={cx('mono', styles.hint)}>{t('sponsorForm.presentation.hint')}</p>
            {canAttachFiles && (
              <FileField
                label={t('sponsorForm.presentation.attachment')}
                hint={t('sponsorForm.attachmentHint')}
                accept={ATTACHMENT_MIME_TYPES.join(',')}
                file={files.attachment}
                error={errors.attachment}
                optional
                onSelect={(f) => setFile('attachment', f)}
              />
            )}
          </>
        )}

        {step === 4 && (
          <div className={styles.recap}>
            <RecapBlock title={t('sponsorsPage.steps.company')} rows={[
              [t('sponsorForm.company.name'), values.companyName],
              [t('sponsorForm.company.website'), values.companyWebsite],
              [t('sponsorForm.company.sector'), values.companySector],
              [t('sponsorForm.company.size'), values.companySize ? t(`sponsorForm.sizes.${values.companySize}`) : ''],
              [t('sponsorForm.company.country'), values.companyCountry],
              [t('sponsorForm.company.logo'), files.logo?.name ?? ''],
            ]} />
            <RecapBlock title={t('sponsorsPage.steps.contact')} rows={[
              [t('sponsorForm.contact.name'), values.contactName],
              [t('sponsorForm.contact.role'), values.contactRole],
              [t('form.email'), values.email],
              [t('form.phone'), values.phone],
            ]} />
            <RecapBlock title={t('sponsorsPage.steps.partnership')} rows={[
              [t('sponsorForm.partnership.tier'), packages.find((p) => p.id === values.packageId)?.name ?? (values.packageTier === 'undecided' ? t('sponsorForm.tierUndecided') : '')],
              [t('sponsorForm.partnership.activities'), values.activities.map((a) => t(`sponsorForm.activityItems.${a}`)).join(', ')],
              [t('sponsorForm.partnership.objectives'), values.objectives.map((o) => t(`sponsorForm.objectives.${o}`)).join(', ')],
              [t('sponsorForm.partnership.budget'), values.budgetRange ? t(`sponsorForm.budgets.${values.budgetRange}`) : ''],
              [t('sponsorForm.partnership.desiredStart'), values.desiredStart],
              [t('sponsorForm.partnership.duration'), values.durationMonths ? t('sponsorForm.durationValue', { count: Number(values.durationMonths) }) : ''],
            ]} />
            <RecapBlock title={t('sponsorsPage.steps.presentation')} rows={[
              [t('sponsorForm.presentation.label'), values.presentation.length > 160 ? `${values.presentation.slice(0, 160)}…` : values.presentation],
              [t('sponsorForm.presentation.attachment'), files.attachment?.name ?? ''],
            ]} />
            <Honeypot value={values.website} onChange={(e) => set('website', e.target.value)} />
            <ConsentField checked={values.consent} onChange={(v) => set('consent', v)} error={errors.consent} />
            {turnstile.enabled && <div ref={turnstile.containerRef} />}
          </div>
        )}
      </m.div>

      <FormError status={status} />

      <div className={styles.nav}>
        {step > 0 && (
          <Button type="button" variant="ghost" onClick={back} icon={<ArrowLeft size={16} aria-hidden="true" />}>
            {t('sponsorForm.back')}
          </Button>
        )}
        <span className={styles.navSpacer} />
        {step < STEPS.length - 1 ? (
          <Button type="button" variant="primary" onClick={next} icon={<ArrowRight size={16} aria-hidden="true" />}>
            {t('sponsorForm.next')}
          </Button>
        ) : (
          <Button type="submit" variant="primary" size="lg" disabled={status === 'sending'}>
            {status === 'sending' ? t('form.sending') : t('sponsorForm.submit')}
          </Button>
        )}
      </div>
    </form>
  );
}

function RecapBlock({ title, rows }: { title: string; rows: [string, string][] }) {
  const { t } = useTranslation();
  const visible = rows.filter(([, v]) => v);
  return (
    <section className={styles.recapBlock}>
      <h3 className={cx('mono', styles.recapTitle)}>{title}</h3>
      {visible.length === 0 ? (
        <p className={styles.recapEmpty}>{t('sponsorForm.reviewEmpty')}</p>
      ) : (
        <dl className={styles.recapRows}>
          {visible.map(([k, v]) => (
            <div key={k} className={styles.recapRow}>
              <dt className={cx('mono', styles.recapKey)}>{k}</dt>
              <dd className={styles.recapValue}>{v}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
