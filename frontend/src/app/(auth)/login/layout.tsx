import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | LDCE Placement Portal",
  description: "Sign in to access your student placement account or TPO admin dashboard.",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
