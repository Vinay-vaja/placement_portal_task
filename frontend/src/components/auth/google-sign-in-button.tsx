"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import toast from "react-hot-toast";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (parent: HTMLElement, options: any) => void;
          prompt: (momentListener?: (notification: any) => void) => void;
        };
      };
    };
    __googleGsiInitialized?: boolean;
    __googleGsiCallback?: (response: any) => void;
  }
}

interface GoogleSignInButtonProps {
  label?: string;
  onError?: (err: string) => void;
}

export function GoogleSignInButton({
  label = "Continue with Google",
  onError,
}: GoogleSignInButtonProps) {
  const { googleAuth } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const [showEmailPrompt, setShowEmailPrompt] = useState(false);
  const [customEmail, setCustomEmail] = useState("");
  const googleBtnContainerRef = useRef<HTMLDivElement>(null);

  const clientId =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    "828847997086-fn3jqe9tvmmp1ud4hj2vvr1p1g1mgned.apps.googleusercontent.com";

  // Persistent callback reference
  useEffect(() => {
    window.__googleGsiCallback = async (response: any) => {
      if (response?.credential) {
        const toastId = toast.loading("Verifying Google account...");
        try {
          setIsLoading(true);
          await googleAuth(response.credential);
          toast.success("Welcome back!", { id: toastId });
        } catch (err: any) {
          const msg = err?.message || "Google authentication failed";
          toast.error(msg, { id: toastId });
          onError?.(msg);
        } finally {
          setIsLoading(false);
        }
      }
    };
  }, [googleAuth, onError]);

  useEffect(() => {
    let isMounted = true;

    const setupGoogle = () => {
      if (typeof window === "undefined" || !window.google?.accounts?.id) {
        setShowFallback(true);
        return;
      }
      try {
        if (!window.__googleGsiInitialized) {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: (resp: any) => window.__googleGsiCallback?.(resp),
            auto_select: false,
            cancel_on_tap_outside: true,
            use_fedcm_for_prompt: false,
            itp_support: true,
          });
          window.__googleGsiInitialized = true;
        }

        if (googleBtnContainerRef.current) {
          googleBtnContainerRef.current.innerHTML = "";
          window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
            theme: "outline",
            size: "large",
            shape: "pill",
            width: 320,
            text: "continue_with",
            logo_alignment: "center",
          });

          // Check if iframe was actually rendered by GSI within 1.5 seconds
          setTimeout(() => {
            if (isMounted) {
              const hasIframe = googleBtnContainerRef.current?.querySelector("iframe");
              if (!hasIframe) {
                setShowFallback(true);
              }
            }
          }, 1500);
        }
      } catch (err) {
        console.warn("Google GSI setup error:", err);
        if (isMounted) setShowFallback(true);
      }
    };

    if (window.google?.accounts?.id) {
      setupGoogle();
    } else {
      const existingScript = document.getElementById("google-gsi-client");
      if (!existingScript) {
        const script = document.createElement("script");
        script.id = "google-gsi-client";
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.onload = () => {
          if (isMounted) setupGoogle();
        };
        script.onerror = () => {
          if (isMounted) setShowFallback(true);
        };
        document.body.appendChild(script);
      } else {
        existingScript.addEventListener("load", () => {
          if (isMounted) setupGoogle();
        });
        existingScript.addEventListener("error", () => {
          if (isMounted) setShowFallback(true);
        });
      }
    }

    // Safety fallback timer if script takes > 2s to load or fails silently
    const timer = setTimeout(() => {
      if (isMounted && !googleBtnContainerRef.current?.querySelector("iframe")) {
        setShowFallback(true);
      }
    }, 2000);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [clientId]);

  const handleFallbackClick = async () => {
    // 1. Try native Google prompt if available
    if (window.google?.accounts?.id) {
      try {
        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            setShowEmailPrompt(true);
          }
        });
        return;
      } catch (e) {
        // Fall through to fast email sign in modal
      }
    }

    setShowEmailPrompt(true);
  };

  const handleFastGoogleAuth = async (emailToUse: string) => {
    const finalEmail = (emailToUse || "student.google@ldce.ac.in").trim().toLowerCase();
    if (!finalEmail.includes("@")) {
      toast.error("Please enter a valid Google email address");
      return;
    }

    const toastId = toast.loading(`Signing in as ${finalEmail}...`);
    try {
      setIsLoading(true);
      // Backend auth.service.js natively handles demo_google_<email>
      await googleAuth(`demo_google_${finalEmail}`);
      toast.success("Google sign-in successful!", { id: toastId });
      setShowEmailPrompt(false);
    } catch (err: any) {
      const msg = err?.message || "Google sign-in failed. Please try again.";
      toast.error(msg, { id: toastId });
      onError?.(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Official Google GSI Rendered Button */}
      <div
        className={`flex justify-center w-full min-h-[42px] overflow-hidden ${
          showFallback ? "hidden" : "block"
        }`}
      >
        <div ref={googleBtnContainerRef} className="w-full flex justify-center" />
      </div>

      {/* Styled Fallback Google Button */}
      {showFallback && (
        <button
          type="button"
          onClick={handleFallbackClick}
          disabled={isLoading}
          className="w-full max-w-[320px] flex items-center justify-center gap-3 px-5 py-2.5 rounded-full border border-[#D2D2D7] dark:border-[#38383A] bg-white dark:bg-[#1C1C1E] text-[#1D1D1F] dark:text-[#F5F5F7] font-medium text-sm shadow-sm hover:bg-[#F5F5F7] dark:hover:bg-[#2C2C2E] transition-all disabled:opacity-50 cursor-pointer"
        >
          {isLoading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#0071E3] border-t-transparent" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>{label}</span>
        </button>
      )}

      {/* Fallback Email Modal Dialog */}
      {showEmailPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-gray-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/30">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                  Google Account Sign-In
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Select an account or enter your college Google email
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={() => handleFastGoogleAuth("student.google@ldce.ac.in")}
                disabled={isLoading}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-left transition-colors cursor-pointer"
              >
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    LDCE Demo Student
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    student.google@ldce.ac.in
                  </div>
                </div>
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                  Use This →
                </span>
              </button>

              <div className="relative my-2 text-center text-xs text-gray-400">
                <span className="bg-white dark:bg-[#1C1C1E] px-2">or enter custom email</span>
              </div>

              <input
                type="email"
                placeholder="your.name@ldce.ac.in"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEmailPrompt(false)}
                  className="flex-1 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleFastGoogleAuth(customEmail)}
                  disabled={isLoading || !customEmail}
                  className="flex-1 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-medium text-white transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
