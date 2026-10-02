import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register | LDCE Placement Portal",
  description: "Create your student placement account for campus recruitment drives.",
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
