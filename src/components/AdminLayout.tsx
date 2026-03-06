import AppSidebar from "@/components/AppSidebar";

const AdminLayout = ({ children, title, description }: { children: React.ReactNode; title: string; description?: string }) => {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-display font-semibold text-foreground">{title}</h1>
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        </div>
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
