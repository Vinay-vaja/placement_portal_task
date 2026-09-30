"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";


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

  return (
    <div className="w-full">
      {/* Official Google GSI Rendered Button */}
      <div className="flex justify-center w-full min-h-[42px] overflow-hidden">
        <div ref={googleBtnContainerRef} className="w-full flex justify-center" />
      </div>
    </div>
  );
}
