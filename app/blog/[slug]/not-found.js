import Link from 'next/link';
import { BookOpen } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Article Not Found</h1>
        <p className="text-gray-600 mb-6">The article you&apos;re looking for doesn&apos;t exist or has been removed.</p>
        <Link
          href="/blog"
          className="px-6 py-3 bg-purple-500 text-white font-semibold rounded-xl hover:bg-purple-600 smooth-transition"
        >
          Back to Blog
        </Link>
      </div>
    </div>
  );
}

