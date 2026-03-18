import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Camera, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProfilePhotoUploadProps {
  userId: string;
  currentPhotoUrl: string | null;
  onPhotoUpdated: (url: string) => void;
}

const ProfilePhotoUpload = ({ userId, currentPhotoUrl, onPhotoUpdated }: ProfilePhotoUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const displayUrl = previewUrl || currentPhotoUrl;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image file.", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 5MB.", variant: "destructive" });
      return;
    }

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${userId}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("profile-photos")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("profile-photos")
        .getPublicUrl(filePath);

      // Add cache buster
      const finalUrl = `${publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ photo_url: finalUrl })
        .eq("user_id", userId);

      if (updateError) throw updateError;

      onPhotoUpdated(finalUrl);
      toast({ title: "Photo updated!" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative group w-20 h-20 flex-shrink-0">
      {displayUrl ? (
        <img src={displayUrl} alt="Profile" className="w-20 h-20 rounded-full object-cover border-2 border-muted" />
      ) : (
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
          <User className="w-10 h-10 text-muted-foreground" />
        </div>
      )}

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
      >
        {uploading ? (
          <Loader2 className="w-5 h-5 text-white animate-spin" />
        ) : (
          <Camera className="w-5 h-5 text-white" />
        )}
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};

export default ProfilePhotoUpload;
