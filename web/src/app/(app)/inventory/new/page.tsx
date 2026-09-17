'use client';

import { PageHeader } from '@/components/PageHeader';
import { InventoryItemForm } from '@/components/inventory/InventoryItemForm';

export default function NewInventoryItemPage() {
  return (
    <div>
      <PageHeader title="Add inventory item" subtitle="Create a new product to track in your stock." />
      <InventoryItemForm mode="create" />
    </div>
  );
}
