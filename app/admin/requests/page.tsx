import { Metadata } from 'next';
import TableBuilt from '@/app/components/admin/tablebuilt';

export const metadata: Metadata = {
  title: 'Requests',
};

export default function Page() {
  return (
    //random filler data rn to show the tablebuilt component
    <TableBuilt data = {[{"id": 1, "description": {"user":"yatin","body":"test", "date": "12-12-2006"}, "actions": [{"icon":"TrashIcon","text":"add"}]}]} />
    
    );
}