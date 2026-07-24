import { Metadata } from 'next';
import PublishForm from '@/app/admin/publishNotice/PublishForm';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Publish Notice',
};

export default function NewNoticePage() {

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4 py-8">
      <Suspense fallback={<div>Loading...</div>}>
        <PublishForm />
      </Suspense>
    </div>
  );
}
