import type { Metadata } from 'next';
import Link from 'next/link';
import { Mail, MessageCircle, Smartphone } from 'lucide-react';
import { MarketingShell } from '@/components/marketing/MarketingShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get support or send a message to the BizRecord team.',
};

const CHANNELS = [
  {
    icon: Mail,
    title: 'Email support',
    text: 'Send us a message and we will respond as soon as possible.',
    action: { label: 'Email us', href: 'mailto:support@bizrecord.tech' },
  },
  {
    icon: MessageCircle,
    title: 'Product questions',
    text: 'Ask about plans, workspaces, teams or billing.',
    action: { label: 'Contact us', href: 'mailto:support@bizrecord.tech' },
  },
  {
    icon: Smartphone,
    title: 'Download the app',
    text: 'Use BizRecord on Android and keep your records with you.',
    action: {
      label: 'Google Play',
      href: 'https://play.google.com/store/apps/details?id=com.bizrecord.inventory',
    },
  },
];

export default function ContactPage() {
  return (
    <MarketingShell>
      <section className="animate-fade-up">
        <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl">
          Talk to us
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted dark:text-text-secondary">
          Have a question about your account, subscription or workspace? We’re here to help.
        </p>
      </section>

      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {CHANNELS.map((channel) => (
          <Card key={channel.title} className="p-6">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-500 dark:bg-brand-500/15">
              <channel.icon className="h-6 w-6" />
            </span>
            <h2 className="mt-5 text-xl font-bold">{channel.title}</h2>
            <p className="mt-2 text-sm text-muted dark:text-text-secondary">{channel.text}</p>
            <Button asChild variant="outline" className="mt-5">
              <a href={channel.action.href} target={channel.action.href.startsWith('http') ? '_blank' : undefined} rel={channel.action.href.startsWith('http') ? 'noopener noreferrer' : undefined}>
                {channel.action.label}
              </a>
            </Button>
          </Card>
        ))}
      </div>

      <Card className="mt-8 p-6">
        <h2 className="text-xl font-bold">Need a new account?</h2>
        <p className="mt-2 text-sm text-muted dark:text-text-secondary">
          Create your BizRecord workspace and start tracking your business today.
        </p>
        <Button asChild className="mt-5">
          <Link href="/register">Get started</Link>
        </Button>
      </Card>
    </MarketingShell>
  );
}

