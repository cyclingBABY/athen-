import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Key, Users, MonitorSmartphone } from "lucide-react";

const stats = [
  { icon: Key, label: "Active Licenses", value: "0", color: "text-primary" },
  { icon: Users, label: "Active Users", value: "0", color: "text-accent" },
  { icon: MonitorSmartphone, label: "Concurrent Sessions", value: "0", color: "text-info" },
  { icon: Shield, label: "Expired Licenses", value: "0", color: "text-destructive" },
];

const DigitalAccess = () => {
  return (
    <AdminLayout title="Digital Access / License Control" description="Manage digital content licenses, DRM, and concurrent access limits">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {stats.map(s => (
          <Card key={s.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><s.icon className={`w-4 h-4 ${s.color}`} />{s.label}</CardTitle>
            </CardHeader>
            <CardContent><p className="text-2xl font-display font-semibold">{s.value}</p></CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">License Management</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground py-8 text-center">No digital licenses configured. Add licenses to manage digital access control.</p>
          <div className="flex justify-center"><Button>Add License</Button></div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default DigitalAccess;
