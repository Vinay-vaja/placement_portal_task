import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot Password | LDCE Placement Portal",
  description: "Request a 6-digit OTP to reset your placement account password.",
};

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
