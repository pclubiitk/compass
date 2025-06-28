import { Metadata } from 'next';
import { ThemeDD } from '../components/ThemeDD';
import { Accordions } from '../components/noticeboard/Accordions';



export const metadata: Metadata = {
  title: 'Noticeboard',
};

export default function Page() {
  
  return (
    <>
    <ThemeDD/>
    <Accordions/>
    </>
  );
}