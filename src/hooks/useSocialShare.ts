"use client";

import { useState, useCallback } from 'react';

interface ShareContentParams {
  title: string;
  text: string;
  url: string;
  imageUrls?: string[];
}

interface UseSocialShareReturn {
  shareContent: (params: ShareContentParams) => Promise<void>;
  isSharing: boolean;
  platform: string | null;
}

/**
 * Custom hook for social sharing with image support
 * Handles native share API (mobile) and clipboard fallback (desktop)
 * Automatically rewards user with 3 credits on successful share
 */
export function useSocialShare(): UseSocialShareReturn {
  const [isSharing, setIsSharing] = useState(false);
  const [platform, setPlatform] = useState<string | null>(null);

  /**
   * Process images from URLs
   * Fetches images, handles CORS, and converts to File objects
   */
  const processImages = useCallback(async (imageUrls: string[]): Promise<File[]> => {
    const files: File[] = [];

    for (const imageUrl of imageUrls) {
      try {
        // Fetch image with CORS handling
        const response = await fetch(imageUrl, {
          mode: 'cors',
          credentials: 'omit',
        }).catch((error) => {
          console.warn(`[useSocialShare] CORS error for ${imageUrl}:`, error);
          // Return null to skip this image
          return null;
        });

        if (!response || !response.ok) {
          console.warn(`[useSocialShare] Failed to fetch image: ${imageUrl}`);
          continue;
        }

        // Convert to Blob
        const blob = await response.blob();
        
        // Extract filename from URL or use default
        const urlParts = imageUrl.split('/');
        const filename = urlParts[urlParts.length - 1] || 'tarot-card.png';
        
        // Convert Blob to File
        const file = new File([blob], filename, { type: blob.type || 'image/png' });
        files.push(file);
      } catch (error) {
        console.warn(`[useSocialShare] Error processing image ${imageUrl}:`, error);
        // Continue with other images even if one fails
      }
    }

    return files;
  }, []);

  /**
   * Call reward API to give user 3 credits
   */
  const claimReward = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/user/reward-share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log('[useSocialShare] Reward claimed:', data);
        return true;
      } else {
        console.warn('[useSocialShare] Reward claim failed:', data.message || data.error);
        // Don't throw - reward failure shouldn't break sharing
        return false;
      }
    } catch (error) {
      console.error('[useSocialShare] Reward API error:', error);
      // Don't throw - reward failure shouldn't break sharing
      return false;
    }
  }, []);

  /**
   * Copy text to clipboard (fallback for desktop)
   */
  const copyToClipboard = useCallback(async (text: string, url: string): Promise<boolean> => {
    try {
      const shareText = `${text}\n\n${url}`;
      
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareText);
        return true;
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = shareText;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textArea);
        return success;
      }
    } catch (error) {
      console.error('[useSocialShare] Clipboard error:', error);
      return false;
    }
  }, []);

  /**
   * Main share function
   */
  const shareContent = useCallback(async ({
    title,
    text,
    url,
    imageUrls = [],
  }: ShareContentParams): Promise<void> => {
    setIsSharing(true);
    setPlatform(null);

    try {
      let files: File[] = [];

      // Process images if provided
      if (imageUrls.length > 0) {
        files = await processImages(imageUrls);
      }

      // Try native share API (mobile - TikTok, Instagram, etc.)
      if (navigator.share) {
        // Check if we can share files
        const canShareFiles = files.length > 0 && navigator.canShare && navigator.canShare({ files });

        if (canShareFiles) {
          // Share with files (images)
          try {
            await navigator.share({
              files,
              title,
              text,
              url,
            });

            setPlatform('native');
            
            // Reward user on successful share
            await claimReward();
            return;
          } catch (shareError: any) {
            // User cancelled or share failed
            if (shareError.name === 'AbortError') {
              console.log('[useSocialShare] User cancelled share');
              // Don't reward if user cancels
              return;
            }
            // Fall through to clipboard fallback
            console.warn('[useSocialShare] Native share failed:', shareError);
          }
        } else {
          // Share without files (text + URL)
          try {
            await navigator.share({
              title,
              text,
              url,
            });

            setPlatform('native');
            
            // Reward user on successful share
            await claimReward();
            return;
          } catch (shareError: any) {
            // User cancelled or share failed
            if (shareError.name === 'AbortError') {
              console.log('[useSocialShare] User cancelled share');
              // Don't reward if user cancels
              return;
            }
            // Fall through to clipboard fallback
            console.warn('[useSocialShare] Native share failed:', shareError);
          }
        }
      }

      // Clipboard fallback (desktop/unsupported)
      const copied = await copyToClipboard(text, url);
      
      if (copied) {
        setPlatform('clipboard');
        
        // Show toast notification (you can customize this)
        if (typeof window !== 'undefined' && (window as any).toast) {
          (window as any).toast('Reading copied! Paste it on your social media.', {
            type: 'success',
          });
        } else {
          // Fallback alert if toast system not available
          alert('Reading copied! Paste it on your social media.');
        }
        
        // Reward user for copying (we can't track actual post)
        await claimReward();
      } else {
        throw new Error('Failed to copy to clipboard');
      }

    } catch (error) {
      console.error('[useSocialShare] Share error:', error);
      
      // Show error notification
      if (typeof window !== 'undefined' && (window as any).toast) {
        (window as any).toast('Failed to share. Please try again.', {
          type: 'error',
        });
      } else {
        alert('Failed to share. Please try again.');
      }
      
      throw error;
    } finally {
      setIsSharing(false);
    }
  }, [processImages, claimReward, copyToClipboard]);

  return {
    shareContent,
    isSharing,
    platform,
  };
}













