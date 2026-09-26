import { splitEvents } from '@/data/site';
import Hero from '@/components/sections/Hero';
import Ticker from '@/components/sections/Ticker';
import About from '@/components/sections/About';
import Chapters from '@/components/sections/Chapters';
import Events from '@/components/sections/Events';
import GalleryStrip from '@/components/sections/GalleryStrip';
import Voices from '@/components/sections/Voices';
import Team from '@/components/sections/Team';
import Join from '@/components/sections/Join';
import Contact from '@/components/sections/Contact';

// Re-render hourly so "upcoming" and "past" events stay correct without a redeploy.
export const revalidate = 3600;

export default function Home() {
  const { upcoming, past } = splitEvents();

  return (
    <>
      <Hero upcoming={upcoming} />
      <Ticker />
      <About />
      <Chapters />
      <Events upcoming={upcoming} past={past} />
      <GalleryStrip />
      <Voices />
      <Team />
      <Join />
      <Contact />
    </>
  );
}
