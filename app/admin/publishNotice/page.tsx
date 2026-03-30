import { Metadata } from 'next';
import PublishForm from '@/app/admin/publishNotice/PublishForm';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Publish Notice',
};

export default function NewNoticePage() {

  return (
    <>
      <PublishForm />
    </>
  );
}
