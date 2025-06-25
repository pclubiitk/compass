import { Metadata } from 'next';
import { ThemeDD } from './components/ThemeDD';

export const metadata: Metadata = {
  title: 'Campus Compass',
};

export default function Page() {
  return(
  <>
    <p>Home Screen, current location on the map will be shown here</p>
    <ThemeDD></ThemeDD>
  </>
  )
}