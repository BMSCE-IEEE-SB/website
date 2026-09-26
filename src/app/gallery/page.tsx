import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import GalleryGrid from '@/components/sections/GalleryGrid';

export const metadata: Metadata = { title: 'Gallery', description: 'Photos from BMSCE IEEE hackathons, workshops, summits and student life.' };

export default function GalleryPage() {
  return (
    <div className="container-page py-12 sm:py-16">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Back to home
      </Link>
      <h1 className="display mt-6 text-5xl text-ink sm:text-7xl">Gallery</h1>
      <p className="lead mt-4 max-w-xl">Hackathon nights, lab sessions, summits and everything in between. Tap any photo to view it full size.</p>
      <div className="mt-10">
        <GalleryGrid />
      </div>
    </div>
  );
}
