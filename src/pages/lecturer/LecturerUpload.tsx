import { useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import LecturerLayout from "@/components/LecturerLayout";
import { Upload, FileText, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const LecturerUpload = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const handleUpload = async () => {
    if (!file || !title || !user) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `lecturer/${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("digital-library").upload(path, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("digital-library").getPublicUrl(path);
      const fileType = ext === "pdf" ? "pdf" : ext === "epub" ? "epub" : "other";

      const { error: insertError } = await supabase.from("books").insert({
        title,
        author: "Uploaded by Lecturer",
        category: "Course Material",
        digital_file_url: urlData.publicUrl,
        digital_file_type: fileType,
        status: "available",
        total_copies: 0,
        available_copies: 0,
      });
      if (insertError) throw insertError;

      toast({ title: "Material uploaded successfully" });
      setTitle(""); setFile(null);
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    }
    setUploading(false);
  };

  const inputClass = "w-full px-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-ring/30";

  return (
    <LecturerLayout title="Upload Materials" description="Upload course materials, PDFs, and ebooks for your students">
      <div className="max-w-xl">
        <div className="bg-card border rounded-xl p-6 space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Material Title *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} placeholder="e.g. CS201 Lecture Notes" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">File *</label>
            <input ref={fileInputRef} type="file" accept=".pdf,.epub,.doc,.docx,.ppt,.pptx" onChange={(e) => setFile(e.target.files?.[0] || null)} className="hidden" />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors"
            >
              {file ? (
                <div className="flex items-center justify-center gap-2 text-foreground">
                  <FileText className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium">{file.name}</span>
                </div>
              ) : (
                <div className="text-muted-foreground">
                  <Upload className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">Click to select a file</p>
                  <p className="text-xs mt-1">PDF, EPUB, DOC, PPT supported</p>
                </div>
              )}
            </button>
          </div>
          <button
            onClick={handleUpload}
            disabled={!title || !file || uploading}
            className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
            {uploading ? "Uploading..." : "Upload Material"}
          </button>
        </div>
      </div>
    </LecturerLayout>
  );
};

export default LecturerUpload;
