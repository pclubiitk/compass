import { Metadata } from 'next';
import HomeClient from './components/user/HomeClient';

export const metadata: Metadata = {
  title: 'Campus Compass',
};

export default function Page() {
  return <HomeClient/>;
}