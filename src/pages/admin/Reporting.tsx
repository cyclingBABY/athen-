import AdminLayout from "@/components/AdminLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { BookOpen, Users, ArrowRightLeft, DollarSign } from "lucide-react";

const COLORS = ["hsl(24, 80%, 30%)", "hsl(36, 70%, 55%)", "hsl(142, 40%, 35%)", "hsl(210, 60%, 50%)", "hsl(0, 72%, 50%)"];

const Reporting = () => {
  const { data: books } = useQuery({
    queryKey: ["report-books"],
    queryFn: async () => { const { data } = await supabase.from("books").select("*"); return data || []; },
  });

  const { data: circulation } = useQuery({
    queryKey: ["report-circulation"],
    queryFn: async () => { const { data } = await supabase.from("circulation_records").select("*"); return data || []; },
  });

  const { data: fines } = useQuery({
    queryKey: ["report-fines"],
    queryFn: async () => { const { data } = await supabase.from("fines").select("*"); return data || []; },
  });

  const { data: profiles } = useQuery({
    queryKey: ["report-profiles"],
    queryFn: async () => { const { data } = await supabase.from("profiles").select("id"); return data || []; },
  });

  const categoryData = books?.reduce((acc: Record<string, number>, b) => {
    acc[b.category] = (acc[b.category] || 0) + 1;
    return acc;
  }, {});
  const categoryChart = Object.entries(categoryData || {}).map(([name, value]) => ({ name, value }));

  const totalFinesCollected = fines?.filter(f => f.paid).reduce((a, f) => a + Number(f.amount), 0) || 0;

  return (
    <AdminLayout title="Reporting & Analytics" description="Library performance metrics, circulation trends, and collection analytics">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><BookOpen className="w-4 h-4" />Total Titles</CardTitle></CardHeader><CardContent><p className="text-2xl font-display font-semibold">{books?.length || 0}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Users className="w-4 h-4" />Total Patrons</CardTitle></CardHeader><CardContent><p className="text-2xl font-display font-semibold">{profiles?.length || 0}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><ArrowRightLeft className="w-4 h-4" />Circulations</CardTitle></CardHeader><CardContent><p className="text-2xl font-display font-semibold">{circulation?.length || 0}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><DollarSign className="w-4 h-4" />Fines Collected</CardTitle></CardHeader><CardContent><p className="text-2xl font-display font-semibold">${totalFinesCollected.toFixed(2)}</p></CardContent></Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Books by Category</CardTitle></CardHeader>
          <CardContent>
            {categoryChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(24, 80%, 30%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-muted-foreground py-8 text-center">No data available</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Collection Distribution</CardTitle></CardHeader>
          <CardContent>
            {categoryChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={categoryChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {categoryChart.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-muted-foreground py-8 text-center">No data available</p>}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Reporting;
