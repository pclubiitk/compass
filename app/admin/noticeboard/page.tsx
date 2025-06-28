import { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle, AlertTriangle, Ban } from 'lucide-react';

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
    Suggestion: 'bg-green-50 border-l-4 border-green-500',
    Warning: 'bg-yellow-50 border-l-4 border-yellow-500',
    Ban: 'bg-red-50 border-l-4 border-red-500',
  };

  const getIcon = (type: string) => {
    const baseClass = 'w-6 h-6';
    switch (type) {
      case 'Suggestion':
        return <div className="min-w-min flex items-center gap-2"><CheckCircle className={`${baseClass} text-green-600`} /></div>;
      case 'Warning':
        return <div className="min-w-min flex items-center gap-2"><AlertTriangle className={`${baseClass} text-yellow-600`} /></div>;
      case 'Ban':
        return <div className="min-w-min flex items-center gap-2"><Ban className={`${baseClass} text-red-600`} /></div>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 px-6 py-10">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-blue-900">Published Notices</h1>
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
                <span className="text-sm text-gray-600">({notice.type})</span>
              </div>
              <h2 className="text-xl font-semibold">{notice.title}</h2>
              <p className="text-gray-700 mt-1">{notice.description}</p>
              <p className="text-sm text-gray-600 mt-2">
                <strong>Publisher:</strong> {notice.publisher} <br />
                <strong>Time:</strong> {new Date(notice.time).toLocaleString()} <br />
                <strong>Recipient:</strong> {notice.recipient} <br />
                <strong>Location:</strong> {notice.location}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
