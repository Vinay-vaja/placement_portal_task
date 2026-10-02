import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset Password | LDCE Placement Portal",
  description: "Set a new secure password for your placement account.",
};

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
