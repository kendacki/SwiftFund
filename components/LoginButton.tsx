'use client';

import { useRef, useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';

const PROFILE_IMAGE_KEY_PREFIX = 'swiftfund_profile_';
const PROFILE_IMAGE_MAX_SIZE = 128;

function getProfileStorageKey(userId: string | undefined): string | null {
  return userId ? `${PROFILE_IMAGE_KEY_PREFIX}${userId}` : null;
}

export default function LoginButton() {
  const { login, logout, authenticated, user, ready } = usePrivy();
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  // Restore profile image from localStorage when user is available
  useEffect(() => {
    if (!authenticated || !user?.id) {
      setProfileImageUrl(null);
      return;
    }
    const key = getProfileStorageKey(user.id);
    if (!key) return;
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
      if (stored) setProfileImageUrl(stored);
    } catch {
      setProfileImageUrl(null);
    }
  }, [authenticated, user?.id]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    if (profileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileOpen]);

  const copyAddress = () => {
    const addr = user?.wallet?.address;
    if (!addr) return;
    navigator.clipboard.writeText(addr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatAddressForDisplay = (addr: string | undefined) => {
    if (!addr || addr.length < 11) return addr ?? '—';
    return `${addr.slice(0, 6)}xxxx${addr.slice(-4)}`;
  };

  const handleProfileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    const key = getProfileStorageKey(user.id);
    if (!key) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      const saveAndSet = (url: string) => {
        try {
          localStorage.setItem(key, url);
        } catch {
          // quota exceeded or disabled; still show in session
        }
        setProfileImageUrl(url);
      };
      img.onload = () => {
        const dim = Math.min(img.naturalWidth, img.naturalHeight, PROFILE_IMAGE_MAX_SIZE);
        const canvas = document.createElement('canvas');
        canvas.width = dim;
        canvas.height = dim;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          saveAndSet(dataUrl);
          return;
        }
        const sx = (img.naturalWidth - dim) / 2;
        const sy = (img.naturalHeight - dim) / 2;
        ctx.drawImage(img, sx, sy, dim, dim, 0, 0, dim, dim);
        const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        saveAndSet(resizedDataUrl);
      };
      img.onerror = () => saveAndSet(dataUrl);
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  if (!ready) {
    return (
      <div className="h-10 w-32 bg-neutral-900 animate-pulse rounded-lg border border-neutral-800" />
    );
  }

  return (
    <div className="flex items-center gap-4" ref={popupRef}>
      {authenticated ? (
        <>
          <button
            onClick={() => router.push('/portfolio')}
            className="text-sm font-medium text-neutral-400 hover:text-white transition-colors"
          >
            Wallet
          </button>
          <button
            onClick={() => router.push('/creator')}
            className="text-sm font-medium text-neutral-400 hover:text-white transition-colors"
          >
            Dashboard
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((o) => !o)}
              className="flex items-center justify-center rounded-full border-2 border-neutral-700 hover:border-red-500/50 transition-colors overflow-hidden bg-neutral-800 h-9 w-9 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-neutral-950"
              aria-expanded={profileOpen}
              aria-haspopup="true"
              aria-label="Profile menu"
            >
              {profileImageUrl ? (
                <img src={profileImageUrl} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <svg
                  className="h-5 w-5 text-neutral-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              )}
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-xl border border-neutral-800 bg-neutral-900 shadow-xl py-3 z-50">
                <div className="px-4 pb-3 border-b border-neutral-800">
                  <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">
                    Wallet address
                  </p>
                  <p className="font-mono text-xs text-neutral-300">
                    {formatAddressForDisplay(user?.wallet?.address)}
                  </p>
                  <button
                    type="button"
                    onClick={copyAddress}
                    className="mt-2 text-xs font-medium text-red-400 hover:text-red-300"
                  >
                    {copied ? 'Copied' : 'Copy address'}
                  </button>
                </div>
                <div className="px-4 py-3 border-b border-neutral-800">
                  <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-2">
                    Profile photo
                  </label>
                  <label className="inline-flex items-center gap-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 px-3 py-1.5 text-xs font-medium text-white cursor-pointer transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfileUpload}
                      className="sr-only"
                    />
                    Upload profile
                  </label>
                </div>
                <div className="px-4 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      logout();
                    }}
                    className="text-xs font-medium text-neutral-400 hover:text-white transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <button
          onClick={login}
          className="font-heading bg-red-600 hover:bg-red-500 text-white font-bold px-6 py-2 rounded-lg shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-all transform hover:scale-105 active:scale-95"
        >
          Login
        </button>
      )}
    </div>
  );
}
