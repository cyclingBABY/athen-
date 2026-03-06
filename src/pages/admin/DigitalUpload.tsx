import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, Headphones, BookOpen } from "lucide-react";

const formats = [
  { icon: FileText, label: "PDF Documents", ext: ".pdf", color: "text-destructive" },
  { icon: BookOpen, label: "EPUB eBooks", ext: ".epub", color: "text-primary" },
  { icon: Headphones, label: "Audiobooks", ext: ".mp3, .m4b", color: "text-accent" },
];

const DigitalUpload = () => {
  return (
    <AdminLayout title="Digital File Uploading" description="Upload PDF, EPUB, and audio files for digital catalog items">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {formats.map(f => (
          <Card key={f.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <f.icon className={`w-4 h-4 ${f.color}`} />
                {f.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-3">Accepted: {f.ext}</p>
              <Button variant="outline" size="sm" className="w-full"><Upload className="w-4 h-4 mr-2" />Upload Files</Button>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Uploads</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground py-8 text-center">No digital files uploaded yet. Use the upload buttons above to add files.</p>
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default DigitalUpload;
