'use client';

import { useRef, useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';

const PROFILE_IMAGE_KEY_PREFIX = 'swiftfund_profile_';
const PROFILE_IMAGE_MAX_SIZE = 256; // Resize to this (square) for upload and display

function getProfileStorageKey(userId: string | undefined): string | null {
  return userId ? `${PROFILE_IMAGE_KEY_PREFIX}${userId}` : null;
}

/** Resize image to a square of at most PROFILE_IMAGE_MAX_SIZE, center-cropped; returns a new File. Handles edge cases so different sizes/orientations do not crash. */
function resizeImageFile(file: File): Promise<File> {
  return new Promise((resolve) => {
    let url: string | null = null;
    const cleanup = () => {
      if (url) {
        URL.revokeObjectURL(url);
        url = null;
      }
    };
    try {
      url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        cleanup();
        const w = img.naturalWidth || 1;
        const h = img.naturalHeight || 1;
        const dim = Math.max(1, Math.min(w, h, PROFILE_IMAGE_MAX_SIZE));
        const canvas = document.createElement('canvas');
        canvas.width = dim;
        canvas.height = dim;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }
        const sx = (w - dim) / 2;
        const sy = (h - dim) / 2;
        ctx.drawImage(img, sx, sy, dim, dim, 0, 0, dim, dim);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg') || 'avatar.jpg', { type: 'image/jpeg' }));
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          0.88
        );
      };
      img.onerror = () => {
        cleanup();
        resolve(file);
      };
      img.src = url;
    } catch {
      cleanup();
      resolve(file);
    }
  });
}

export default function LoginButton() {
  const { login, logout, authenticated, user, ready, getAccessToken } = usePrivy();
  const [profileOpen, setProfileOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  // Restore profile image: fetch from API (backend), fallback to localStorage cache
  useEffect(() => {
    if (!authenticated || !user?.id) {
      setProfileImageUrl(null);
      return;
    }
    const key = getProfileStorageKey(user.id);
    let cancelled = false;

    const loadAvatar = async () => {
      try {
        const token = await getAccessToken();
        if (cancelled || !token) {
          const stored = key && typeof window !== 'undefined' ? localStorage.getItem(key) : null;
          if (stored) setProfileImageUrl(stored);
          return;
        }
        const res = await fetch('/api/profile/avatar', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          if (data?.url) {
            setProfileImageUrl(data.url);
            if (key) {
              try {
                localStorage.setItem(key, data.url);
              } catch {
                /* ignore */
              }
            }
            return;
          }
        }
      } catch {
        /* ignore */
      }
      if (cancelled) return;
      const stored = key && typeof window !== 'undefined' ? localStorage.getItem(key) : null;
      if (stored) setProfileImageUrl(stored);
    };

    loadAvatar();
    return () => {
      cancelled = true;
    };
  }, [authenticated, user?.id, getAccessToken]);

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

  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleProfileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    const key = getProfileStorageKey(user.id);
    e.target.value = '';

    setUploadingAvatar(true);
    try {
      const token = await getAccessToken();
      if (!token) {
        setUploadingAvatar(false);
        return;
      }
      const resizedFile = await resizeImageFile(file);
      const formData = new FormData();
      formData.append('file', resizedFile);
      const res = await fetch('/api/profile/avatar', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Upload failed');
      if (data?.url) {
        setProfileImageUrl(data.url);
        if (key) {
          try {
            localStorage.setItem(key, data.url);
          } catch {
            /* ignore */
          }
        }
      }
    } catch (err) {
      console.error('Profile upload failed:', err);
      // Fallback: keep previous localStorage-only flow for this session if API fails
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const img = new Image();
        const saveAndSet = (url: string) => {
          try {
            if (key) localStorage.setItem(key, url);
          } catch {
            /* ignore */
          }
          setProfileImageUrl(url);
        };
        img.onload = () => {
          try {
            const w = img.naturalWidth || 1;
            const h = img.naturalHeight || 1;
            const dim = Math.max(1, Math.min(w, h, PROFILE_IMAGE_MAX_SIZE));
            const canvas = document.createElement('canvas');
            canvas.width = dim;
            canvas.height = dim;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              saveAndSet(dataUrl);
              setUploadingAvatar(false);
              return;
            }
            const sx = (w - dim) / 2;
            const sy = (h - dim) / 2;
            ctx.drawImage(img, sx, sy, dim, dim, 0, 0, dim, dim);
            saveAndSet(canvas.toDataURL('image/jpeg', 0.85));
          } catch {
            saveAndSet(dataUrl);
          }
          setUploadingAvatar(false);
        };
        img.onerror = () => {
          saveAndSet(dataUrl);
          setUploadingAvatar(false);
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
      return;
    } finally {
      setUploadingAvatar(false);
    }
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
                <img
                  src={profileImageUrl}
                  alt="Profile"
                  className="h-full w-full object-cover object-center aspect-square min-w-0 min-h-0"
                  onError={() => setProfileImageUrl(null)}
                />
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
                  <p className="font-heading text-xs text-neutral-500 uppercase tracking-wider mb-1">
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
                  <label className="font-heading block text-xs text-neutral-500 uppercase tracking-wider mb-2">
                    Profile photo
                  </label>
                  <label className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-colors ${uploadingAvatar ? 'bg-neutral-700 cursor-wait' : 'bg-neutral-800 hover:bg-neutral-700 cursor-pointer'}`}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfileUpload}
                      className="sr-only"
                      disabled={uploadingAvatar}
                    />
                    {uploadingAvatar ? 'Uploading…' : 'Upload profile'}
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
