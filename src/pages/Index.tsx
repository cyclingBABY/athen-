import AppSidebar from "@/components/AppSidebar";
import HeroBanner from "@/components/HeroBanner";
import StatsCards from "@/components/StatsCards";
import BookCatalog from "@/components/BookCatalog";
import RecentActivity from "@/components/RecentActivity";

const Index = () => (
  <div className="flex min-h-screen bg-background">
    <AppSidebar />
    <main className="flex-1 p-6 overflow-auto">
      <HeroBanner />
      <StatsCards />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
        <div className="xl:col-span-2">
          <BookCatalog />
        </div>
        <div>
          <RecentActivity />
        </div>
      </div>
    </main>
  </div>
);

export default Index;
