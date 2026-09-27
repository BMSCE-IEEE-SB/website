import Hero from '@/components/sections/Hero';
import Ticker from '@/components/sections/Ticker';
import About from '@/components/sections/About';
import Chapters from '@/components/sections/Chapters';
import GalleryStrip from '@/components/sections/GalleryStrip';
import Team from '@/components/sections/Team';
import BangaloreSection from '@/components/sections/BangaloreSection';
import Join from '@/components/sections/Join';
import Contact from '@/components/sections/Contact';

export default function Home() {
  return (
    <>
      <Hero />
      <Ticker />
      <About />
      <Chapters />
      <GalleryStrip />
      <Team />
      <BangaloreSection />
      <Join />
      <Contact />
    </>
  );
}
