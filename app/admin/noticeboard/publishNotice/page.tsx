import { Metadata } from 'next';
import PublishForm from '@/app/admin/noticeboard/publishNotice/PublishForm';

export const metadata: Metadata = {
  title: 'Publish Notice',
};

export default function NewNoticePage() {
  return <PublishForm />;
}