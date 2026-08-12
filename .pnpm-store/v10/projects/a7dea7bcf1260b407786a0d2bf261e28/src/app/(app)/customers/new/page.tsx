'use client';

import { PageHeader } from '@/components/PageHeader';
import { CustomerForm } from '@/components/customers/CustomerForm';

export default function NewCustomerPage() {
  return (
    <div>
      <PageHeader title="Add customer" subtitle="Create a new customer record." />
      <CustomerForm mode="create" />
    </div>
  );
}
