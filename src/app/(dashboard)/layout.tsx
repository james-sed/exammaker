// TODO: Implement authenticated dashboard shell with responsive sidebar and topbar
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="dashboard-layout">{children}</div>;
}
