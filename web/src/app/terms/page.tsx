import type { Metadata } from 'next';
import { FileText } from 'lucide-react';
import { MarketingShell } from '@/components/marketing/MarketingShell';

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description: 'The terms governing your use of the BizRecord platform.',
};

const SECTIONS = [
  {
    title: 'Accepting these terms',
    body: [
      'By creating an account or using BizRecord, you agree to these Terms & Conditions.',
      'If you use BizRecord on behalf of a business, you confirm that you are authorised to accept these terms for that business.',
    ],
  },
  {
    title: 'Accounts and access',
    body: [
      'You are responsible for keeping your login details secure and for activity carried out under your account.',
      'Workspace owners control who can join their workspace and what role or permissions those members receive.',
      'We may suspend or restrict access if we detect misuse, security risk, or breach of these terms.',
    ],
  },
  {
    title: 'Subscription and billing',
    body: [
      'Paid plans are billed in advance according to the plan and billing cycle you select.',
      'Plan limits, such as workspace count, team seats, and messaging quotas, apply based on your active subscription.',
      'If a subscription expires or is downgraded, access may be reduced and Pro-only features may become unavailable.',
    ],
  },
  {
    title: 'Acceptable use',
    body: [
      'You agree not to use BizRecord for unlawful activity or to infringe the rights of others.',
      'You agree not to attempt to access another workspace without permission, disrupt the service, or bypass security controls.',
    ],
  },
  {
    title: 'Your business data',
    body: [
      'You retain ownership of the business records you create in BizRecord.',
      'You grant us the limited permission needed to store, back up, sync, and process that data to operate the service.',
    ],
  },
  {
    title: 'Service availability',
    body: [
      'We aim to provide a reliable service, but we do not guarantee that the platform will always be uninterrupted or error-free.',
      'Scheduled maintenance, third-party service issues, or events beyond our reasonable control may affect availability.',
    ],
  },
  {
    title: 'Changes and termination',
    body: [
      'We may update these terms to reflect product or legal changes. Material updates will be communicated reasonably.',
      'You can stop using BizRecord at any time. We may also limit or terminate access for breach of these terms.',
    ],
  },
];

export default function TermsPage() {
  return (
    <MarketingShell>
      <section className="animate-fade-up">
        <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3.5 py-1.5 text-sm font-semibold text-brand-700 shadow-card dark:border-brand-500/25 dark:bg-brand-500/10 dark:text-brand-300">
          <FileText className="h-4 w-4" />
          Terms & Conditions
        </span>
        <h1 className="mt-6 text-4xl font-black leading-tight tracking-tight sm:text-5xl">
          Clear terms for using BizRecord.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted dark:text-text-secondary">
          These terms cover your BizRecord account, workspace access, subscription, and acceptable use of the platform.
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
    </MarketingShell>
  );
}
