import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Sails } from '@/components/site/BrandShapes';

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[70vh] flex-col items-center justify-center py-20 text-center">
      <Sails className="h-28 w-28 animate-float" />
      <p className="display mt-8 text-8xl text-ink sm:text-9xl">404</p>
      <p className="lead mt-4 max-w-md">This page wandered off to a hackathon. Let&apos;s get you back.</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href="/" className="btn btn-dark btn-lg">Go home</Link>
        <Link href="/membership" className="btn btn-primary btn-lg">
          Become a member <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
