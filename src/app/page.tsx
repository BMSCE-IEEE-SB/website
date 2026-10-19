import Hero from '@/components/sections/Hero';
import Ticker from '@/components/sections/Ticker';
import About from '@/components/sections/About';
import Chapters from '@/components/sections/Chapters';
import Team from '@/components/sections/Team';
import BangaloreSection from '@/components/sections/BangaloreSection';
import Join from '@/components/sections/Join';
import XtremeSpotlight from '@/components/sections/XtremeSpotlight';
import Contact from '@/components/sections/Contact';
import { MEMBERSHIP_DRIVE_OPEN } from '@/config/membership';

export default function Home() {
  return (
    <>
      <Hero />
      <Ticker />
      <About />
      <Chapters />
      <Team />
      <BangaloreSection />
      {MEMBERSHIP_DRIVE_OPEN ? <Join /> : <XtremeSpotlight />}
      <Contact />
    </>
  );
}
