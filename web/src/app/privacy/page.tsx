import type { Metadata } from 'next';
import { ShieldCheck } from 'lucide-react';
import { MarketingShell } from '@/components/marketing/MarketingShell';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How BizRecord collects, uses, and protects your business data.',
};

const SECTIONS = [
  {
    title: 'Information we collect',
    body: [
      'We collect the account details you provide, such as your name, email address, phone number, and business information.',
      'When you use the app, we process the records you create, including inventory items, sales, expenses, debts, customers, branches, and team activity.',
      'We also collect limited technical data needed to operate the service, such as device type, app version, and diagnostic information.',
    ],
  },
  {
    title: 'How we use your data',
    body: [
      'We use your data to provide the BizRecord service, keep your workspace secure, sync your records, and support your account.',
      'We may use aggregate or non-identifying usage data to improve performance, reliability, and product features.',
      'We do not sell your personal data.',
    ],
  },
  {
    title: 'Data sharing',
    body: [
      'We share data only with service providers that help us operate BizRecord, such as hosting, email delivery, push notifications, and payment providers.',
      'Your workspace data is visible to team members you invite, according to the role and permissions you assign them.',
      'We may disclose information where required by law or to protect the rights, safety, or security of the service.',
    ],
  },
  {
    title: 'Data security',
    body: [
      'We use encryption in transit, access controls, and other safeguards designed to protect your records.',
      'No system is perfectly secure, so we encourage you to use a strong password and keep your account credentials private.',
    ],
  },
  {
    title: 'Your choices',
    body: [
      'You can update your account information from the app or by contacting support.',
      'You can request deletion of your account and associated data, subject to legal retention requirements.',
      'If you are a workspace member, data retention may also depend on the workspace owner’s account and subscription.',
    ],
  },
  {
    title: 'Changes to this policy',
    body: [
      'We may update this policy as the product evolves. When changes are material, we will provide reasonable notice through the app or our website.',
      'Continued use of BizRecord after an update means you accept the revised policy.',
    ],
  },
];

export default function PrivacyPage() {
  return (
    <MarketingShell>
      <section className="animate-fade-up">
        <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3.5 py-1.5 text-sm font-semibold text-brand-700 shadow-card dark:border-brand-500/25 dark:bg-brand-500/10 dark:text-brand-300">
          <ShieldCheck className="h-4 w-4" />
          Privacy Policy
        </span>
        <h1 className="mt-6 text-4xl font-black leading-tight tracking-tight sm:text-5xl">
          Your business data, handled responsibly.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted dark:text-text-secondary">
          This policy explains how BizRecord collects, uses, protects, and shares information when you use our web and mobile apps.
        </p>
        <p className="mt-3 text-sm text-muted dark:text-text-secondary">
          Last updated: {new Date().getFullYear()}
        </p>
      </section>

      <div className="mt-10 space-y-5">
        {SECTIONS.map((section) => (
          <section
            key={section.title}
            className="rounded-card border border-line bg-surface p-6 shadow-card transition hover:border-brand-500/30 dark:bg-surface-raised"
          >
            <h2 className="text-xl font-bold">{section.title}</h2>
            <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted dark:text-text-secondary">
              {section.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-8 rounded-card border border-line bg-surface p-6 shadow-card dark:bg-surface-raised">
        <h2 className="text-lg font-bold">Contact us</h2>
        <p className="mt-2 text-sm text-muted dark:text-text-secondary">
          If you have privacy questions or requests, contact our support team through the contact page.
        </p>
      </div>
    </MarketingShell>
  );
}
