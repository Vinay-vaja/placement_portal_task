"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, ArrowRight, X } from "lucide-react";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (parent: HTMLElement, options: any) => void;
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
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [demoEmail, setDemoEmail] = useState("");
  const googleBtnContainerRef = useRef<HTMLDivElement>(null);

  const clientId =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    "828847997086-fn3jqe9tvmmp1ud4hj2vvr1p1g1mgned.apps.googleusercontent.com";

  // Persistent callback reference
  useEffect(() => {
    window.__googleGsiCallback = async (response: any) => {
      if (response?.credential) {
        try {
          setIsLoading(true);
          await googleAuth(response.credential);
        } catch (err: any) {
          onError?.(err?.message || "Google authentication failed");
        } finally {
          setIsLoading(false);
        }
      }
    };
  }, [googleAuth, onError]);

  useEffect(() => {
    let isMounted = true;

    const setupGoogle = () => {
      if (typeof window === "undefined" || !window.google?.accounts?.id) return;
      try {
        if (!window.__googleGsiInitialized) {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: (resp: any) => window.__googleGsiCallback?.(resp),
            auto_select: false,
            cancel_on_tap_outside: true,
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
        }
      } catch (err) {
        console.warn("Google GSI setup notice:", err);
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
        document.body.appendChild(script);
      } else {
        existingScript.addEventListener("load", () => {
          if (isMounted) setupGoogle();
        });
      }
    }

    return () => {
      isMounted = false;
    };
  }, [clientId]);

  const handleInstantGoogleAuth = async (emailToUse: string) => {
    try {
      setIsLoading(true);
      const email = emailToUse.trim().toLowerCase();
      if (!email || !email.includes("@")) {
        onError?.("Please enter a valid Google email address");
        return;
      }
      await googleAuth(`demo_google_${email}`);
      setShowDemoModal(false);
    } catch (err: any) {
      onError?.(err?.message || "Failed to sign in with Google");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full space-y-2.5">
      {/* Official Google GSI Rendered Button (Popup window, no FedCM issues) */}
      <div className="flex justify-center w-full min-h-[42px] overflow-hidden">
        <div ref={googleBtnContainerRef} className="w-full flex justify-center" />
      </div>

      {/* Quick College Google Sign-In button (opens instant selection modal) */}
      <Button
        variant="outline"
        type="button"
        disabled={isLoading}
        isLoading={isLoading}
        className="w-full h-10 rounded-full border border-black/[0.1] bg-white hover:bg-neutral-50 text-neutral-800 text-xs font-medium transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
        onClick={() => setShowDemoModal(true)}
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24">
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
        <span>One-Click College Google Sign-In</span>
      </Button>

      {/* Quick Google Account Selection Dialog */}
      {showDemoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-black/[0.08] space-y-4">
            <button
              onClick={() => setShowDemoModal(false)}
              className="absolute right-4 top-4 rounded-full p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="text-center space-y-1 pt-1">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-[#0071E3]">
                <Mail className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold tracking-tight text-[#1D1D1F]">
                Sign In with Google
              </h3>
              <p className="text-xs text-[#86868B]">
                Choose a pre-configured student or enter any Google email
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => handleInstantGoogleAuth("student.patel@ldce.ac.in")}
                className="w-full flex items-center justify-between p-3 rounded-2xl border border-black/[0.08] hover:border-[#0071E3] hover:bg-[#F5F5F7] transition-all text-left group"
              >
                <div>
                  <p className="text-xs font-semibold text-[#1D1D1F]">
                    Harshil Patel (Regular)
                  </p>
                  <p className="text-[11px] text-[#86868B]">student.patel@ldce.ac.in</p>
                </div>
                <ArrowRight className="h-4 w-4 text-[#86868B] group-hover:text-[#0071E3] transition-colors" />
              </button>

              <button
                type="button"
                onClick={() => handleInstantGoogleAuth("rahul.sharma@ldce.ac.in")}
                className="w-full flex items-center justify-between p-3 rounded-2xl border border-black/[0.08] hover:border-[#0071E3] hover:bg-[#F5F5F7] transition-all text-left group"
              >
                <div>
                  <p className="text-xs font-semibold text-[#1D1D1F]">
                    Rahul Sharma (D2D)
                  </p>
                  <p className="text-[11px] text-[#86868B]">rahul.sharma@ldce.ac.in</p>
                </div>
                <ArrowRight className="h-4 w-4 text-[#86868B] group-hover:text-[#0071E3] transition-colors" />
              </button>
            </div>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-black/[0.06]" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-semibold text-[#86868B] tracking-wider">
                <span className="bg-white px-2">Or custom Google email</span>
              </div>
            </div>

            <div className="space-y-2.5">
              <Input
                type="email"
                placeholder="e.g. patelgaming4766@gmail.com"
                value={demoEmail}
                onChange={(e) => setDemoEmail(e.target.value)}
                className="rounded-xl text-xs h-10"
              />
              <Button
                type="button"
                variant="primary"
                className="w-full rounded-full h-10 text-xs font-medium"
                onClick={() => handleInstantGoogleAuth(demoEmail)}
                disabled={!demoEmail || !demoEmail.includes("@")}
                isLoading={isLoading}
              >
                Continue with this Email
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
