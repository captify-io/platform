import ShellLayout from "@/components/layout/ShellLayout";

export default function AppLayout({ children, params }: any) {
  return <ShellLayout params={params}>{children}</ShellLayout>;
}
