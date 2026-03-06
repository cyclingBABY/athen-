import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Loader2, ArrowLeft, Camera, Upload } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingApproval, setPendingApproval] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, role, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user && role) {
      navigate(role === "admin" ? "/dashboard" : "/home", { replace: true });
    }
  }, [user, role, authLoading, navigate]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "Photo too large", description: "Max 5MB allowed", variant: "destructive" });
        return;
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const uploadPhoto = async (userId: string): Promise<string | null> => {
    if (!photoFile) return null;
    const ext = photoFile.name.split(".").pop();
    const path = `${userId}/avatar.${ext}`;
    const { error } = await supabase.storage.from("book-covers").upload(path, photoFile, { upsert: true });
    if (error) {
      console.error("Photo upload error:", error);
      return null;
    }
    const { data } = supabase.storage.from("book-covers").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setPendingApproval(false);

    if (isLogin) {
      const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast({ title: "Login failed", description: error.message, variant: "destructive" });
        setLoading(false);
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("approved")
        .eq("user_id", signInData.user.id)
        .maybeSingle();

      if (profile && !profile.approved) {
        await supabase.auth.signOut();
        setPendingApproval(true);
        setLoading(false);
        return;
      }
    } else {
      // Registration — sign up, then ask for OTP
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            account_type: "patron",
            registration_number: registrationNumber,
          },
        },
      });
      if (error) {
        toast({ title: "Registration failed", description: error.message, variant: "destructive" });
        setLoading(false);
        return;
      }

      // If photo was provided, upload it now using the new user ID
      if (data.user && photoFile) {
        const photoUrl = await uploadPhoto(data.user.id);
        if (photoUrl) {
          // Update profile with photo URL (will be created by trigger)
          setTimeout(async () => {
            await supabase.from("profiles").update({ photo_url: photoUrl }).eq("user_id", data.user!.id);
          }, 1000);
        }
      }

      toast({
        title: "Verification code sent!",
        description: "Check your email for the 6-digit code.",
      });
      setOtpStep(true);
      setLoading(false);
      return;
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otpCode,
      type: "signup",
    });
    if (error) {
      toast({ title: "Verification failed", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }
    // Verified — sign out and show pending approval
    await supabase.auth.signOut();
    setOtpStep(false);
    setPendingApproval(true);
    setLoading(false);
  };

  const inputClass =
    "w-full px-3 py-2.5 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-ring/30";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center mb-4">
            <BookOpen className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-display font-bold">Athena</h1>
          <p className="text-sm text-muted-foreground mt-1">Library Management System</p>
          <Link to="/" className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
            <ArrowLeft className="w-3.5 h-3.5" />Back to Home
          </Link>
        </div>

        {/* OTP Verification Step */}
        {otpStep ? (
          <div className="bg-card rounded-xl border p-6">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto text-xl mb-3">📧</div>
              <h2 className="text-lg font-semibold">Verify Your Email</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Enter the 6-digit code sent to <span className="font-medium text-foreground">{email}</span>
              </p>
            </div>
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Verification Code</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  className={`${inputClass} text-center text-2xl tracking-[0.5em] font-mono`}
                  placeholder="000000"
                />
              </div>
              <button
                type="submit"
                disabled={loading || otpCode.length !== 6}
                className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Verify & Complete Registration
              </button>
              <button
                type="button"
                onClick={() => { setOtpStep(false); setOtpCode(""); }}
                className="w-full text-sm text-muted-foreground hover:text-foreground"
              >
                Back to Registration
              </button>
            </form>
          </div>
        ) : pendingApproval ? (
          <div className="bg-card rounded-xl border p-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto text-xl">⏳</div>
            <h2 className="text-lg font-semibold">Pending Approval</h2>
            <p className="text-sm text-muted-foreground">
              Your account has been created and verified. It requires administrator approval before you can sign in. Please contact your librarian.
            </p>
            <button
              onClick={() => { setPendingApproval(false); setIsLogin(true); }}
              className="text-sm text-primary hover:underline mt-2"
            >
              Back to Sign In
            </button>
          </div>
        ) : (
          <div className="bg-card rounded-xl border p-6">
            <div className="flex mb-6 bg-secondary rounded-lg p-1">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${isLogin ? "bg-card shadow-sm" : "text-muted-foreground"}`}
              >
                Sign In
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${!isLogin ? "bg-card shadow-sm" : "text-muted-foreground"}`}
              >
                Register
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  {/* Photo Upload */}
                  <div className="flex flex-col items-center">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="relative w-24 h-24 rounded-full border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-colors overflow-hidden group"
                    >
                      {photoPreview ? (
                        <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground group-hover:text-primary transition-colors">
                          <Camera className="w-6 h-6" />
                          <span className="text-[10px] mt-1">Add Photo</span>
                        </div>
                      )}
                      {photoPreview && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Upload className="w-5 h-5 text-white" />
                        </div>
                      )}
                    </button>
                    <p className="text-xs text-muted-foreground mt-2">Upload your passport photo</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Full Name</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className={inputClass}
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Registration Number</label>
                    <input
                      type="text"
                      required
                      value={registrationNumber}
                      onChange={(e) => setRegistrationNumber(e.target.value)}
                      className={inputClass}
                      placeholder="e.g. 22/BIT/BU/R/1001"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Your student/staff registration number</p>
                  </div>
                </>
              )}
              <div>
                <label className="text-sm font-medium mb-1.5 block">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {isLogin ? "Sign In" : "Create Account"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Auth;
