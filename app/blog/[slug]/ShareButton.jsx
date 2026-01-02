'use client';

import { Share2 } from 'lucide-react';

export default function ShareButton({ title, excerpt, url }) {
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: excerpt,
          url: url || (typeof window !== 'undefined' ? window.location.href : ''),
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      if (typeof window !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(url || window.location.href);
        alert('Link copied to clipboard!');
      }
    }
  };

  return (
    <button
      onClick={handleShare}
      className="flex items-center space-x-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 smooth-transition"
    >
      <Share2 className="w-4 h-4" />
      <span>Share</span>
    </button>
  );
}

