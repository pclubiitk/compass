import { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle, AlertTriangle, Ban } from 'lucide-react';
import { ThemeDD } from '@/app/components/ThemeDD';

export const metadata: Metadata = {
  title: 'Noticeboard',
};

export default function Page() {
  const mockNotices = [
    {
      type: 'Suggestion',
      title: 'Add a better description of the place',
      description: 'Your description was quite vague. From future, try to be more specific.',
      publisher: 'Ayush Singh',
      time: '2069-02-28T14:00',
      recipient: 'Shubham',
      location: 'Mama Mio',
    },
    {
      type: 'Warning',
      title: 'Try to avoid smoking shots from pics',
      description: 'The pics you tried  to post had some guys smoking in the background. I cannot allow such a pic to be posted. Try to avoid uploading such pics from the future.',
      publisher: 'Ayush Singh',
      time: '2069-02-02T09:00',
      recipient: 'Bhavishya',
      location: 'OAT',
    },
    {
      type: 'Ban',
      title: 'Your Account is getting banned',
      description: 'You kept trying to use racial slurs in your posts even after repeated warnings. Thus, we are disabling your account to be ever able to interact with Campus-Compass',
      publisher: 'Ayush Singh',
      time: '2069-02-05T08:30',
      recipient: 'Real Nigger',
      location: 'DJAC',
    },
    {
      type: 'Suggestion',
      title: 'Add a better description of the place',
      description: 'Your description was quite vague. From future, try to be more specific.',
      publisher: 'Ayush Singh',
      time: '2069-02-28T14:00',
      recipient: 'Himanshu',
      location: 'Mama Mio',
    },
    {
      type: 'Warning',
      title: 'Try to avoid smoking shots from pics',
      description: 'The pics you tried  to post had some guys smoking in the background. I cannot allow such a pic to be posted. Try to avoid uploading such pics from the future.',
      publisher: 'Ayush Singh',
      time: '2069-02-02T09:00',
      recipient: 'Anant',
      location: 'OAT',
    },
    {
      type: 'Ban',
      title: 'Your Account is getting banned',
      description: 'You kept trying to use racial slurs in your posts even after repeated warnings. Thus, we are disabling your account to be ever able to interact with Campus-Compass',
      publisher: 'Ayush Singh',
      time: '2069-02-05T08:30',
      recipient: 'Fatty Acid',
      location: 'DJAC',
    },
  ];

  const typeStyles: Record<string, string> = {
    Suggestion: 'bg-green-50 dark:bg-[lab(57_-74.16_60.86)] border-l-4 border-green-500 dark:border-[lab(27_-30.96_21.06))] ' ,
    Warning: 'bg-yellow-50 dark:bg-[lab(63_-4.48_85.59)]  border-l-4 border-yellow-500 dark:border-[lab(47_11.01_70.73)]',
    Ban: 'bg-red-50 dark:bg-[lab(31_58.3_49.03)] border-l-4 border-red-500 dark:border-[lab(22_36.71_21.81)]',
  };

  const getIcon = (type: string) => {
    const baseClass = 'w-6 h-6';
    switch (type) {
      case 'Suggestion':
        return <div className="min-w-min flex items-center gap-2"><CheckCircle className={`${baseClass} text-green-600 dark:text-[lab(87_-105.86_96.59)]`} /></div>;
      case 'Warning':
        return <div className="min-w-min flex items-center gap-2"><AlertTriangle className={`${baseClass} text-yellow-600  dark:text-[lab(78_30.26_107.78)]`} /></div>;
      case 'Ban':
        return <div className="min-w-min flex items-center gap-2"><Ban className={`${baseClass} text-red-600`} /></div>;
      default:
        return null;
    }
  };

  return (
    <>
    <ThemeDD/>
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-blue-900 dark:text-[lab(49_18.52_-85.84)]">Published Notices</h1>
          <Link
            href="/admin/noticeboard/publishNotice"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Publish New Notice
          </Link>
        </div>

        <div className="space-y-4">
          {mockNotices.map((notice, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl shadow-sm ${typeStyles[notice.type]}`}
            >
              <div className="flex items-center space-x-2">
                {getIcon(notice.type)}
                <span className="text-sm">({notice.type})</span>
              </div>
              <h2 className="text-xl font-semibold">{notice.title}</h2>
              <p className=" mt-1">{notice.description}</p>
              <p className="text-sm  mt-2">
                <strong>Publisher:</strong> {notice.publisher} <br />
                <strong>Time:</strong> {new Date(notice.time).toLocaleString()} <br />
                <strong>Recipient:</strong> {notice.recipient} <br />
                <strong>Location:</strong> {notice.location}
              </p>
            </div>
          ))}
        </div>
      </div>
  </>
  );
}
