import { useState, useEffect, useRef } from "react";
import { BookOpen, Loader2, ArrowLeft, Camera, Upload, Eye, EyeOff } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (window.location.origin + (window.location.pathname.includes('/athen-') ? '/athen-/api' : '/api'));

interface AuthProps {
  initialMode?: "login" | "register";
}

const Auth = ({ initialMode = "login" }: AuthProps) => {
  const [isLogin, setIsLogin] = useState(initialMode !== "register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [campus, setCampus] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingApproval, setPendingApproval] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // NOTE: Ensure your local useAuth hook reads credentials from localStorage or cookies set during login
  const { user, role, loading: authLoading, loginLocalContext } = useAuth();

  useEffect(() => {
    if (!authLoading && user && role) {
      if (role === "admin") navigate("/dashboard", { replace: true });
      else if (role === "lecturer") navigate("/lecturer/dashboard", { replace: true });
      else navigate("/home", { replace: true });
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

  // Local storage upload target for photos using a custom local endpoint or standard storage script
  const uploadPhotoLocal = async (userId: string): Promise<string | null> => {
    if (!photoFile) return null;
    
    const formData = new FormData();
    formData.append("photo", photoFile);
    formData.append("userId", userId);

    try {
      const response = await fetch(`${API_BASE_URL}/storage.php`, {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      return result.publicUrl || null;
    } catch (error) {
      console.error("Local photo upload error:", error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setPendingApproval(false);

    try {
      if (isLogin) {
        // 1. Authenticate user against local XAMPP custom auth endpoint
        const authResponse = await fetch(`${API_BASE_URL}/auth.php`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "login", email, password }),
        });

        const authResult = await authResponse.json();

        if (!authResponse.ok || authResult.error) {
          const errMsg = typeof authResult.error === 'object' && authResult.error !== null
            ? (authResult.error.message || JSON.stringify(authResult.error))
            : (authResult.error || "Invalid credentials");
          toast({ title: "Login failed", description: errMsg, variant: "destructive" });
          setLoading(false);
          return;
        }

        // 2. Query permissions using the universal router engine
        const profileResponse = await fetch(`${API_BASE_URL}/index.php`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            table: "profiles",
            action: "select",
            isMaybeSingle: true,
            filters: [{ col: "user_id", op: "eq", val: authResult.user.id }],
          }),
        });

        const profileResult = await profileResponse.json();

        if (profileResult.data && !profileResult.data.approved) {
          toast({ title: "Access Denied", description: "Your account is pending administrator approval.", variant: "warning" });
          setPendingApproval(true);
          setLoading(false);
          return;
        }

        // Initialize local authentication session context
        if (loginLocalContext) {
          loginLocalContext(authResult.user, authResult.token, authResult.role);
        }

      } else {
        // 1. Process Registration over local XAMPP system
        const registerResponse = await fetch(`${API_BASE_URL}/auth.php`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "register",
            email,
            password,
            full_name: fullName,
            registration_number: registrationNumber,
            account_type: "patron"
          }),
        });

        const registerResult = await registerResponse.json();

        if (!registerResponse.ok || registerResult.error) {
          const errMsg = typeof registerResult.error === 'object' && registerResult.error !== null
            ? (registerResult.error.message || JSON.stringify(registerResult.error))
            : (registerResult.error || "System error");
          toast({ title: "Registration failed", description: errMsg, variant: "destructive" });
          setLoading(false);
          return;
        }

        // 2. Upload photo and update profile metadata if profile entries are generated
        if (registerResult.user?.id) {
          const updates: any = { campus: campus || null };
          
          if (photoFile) {
            const photoUrl = await uploadPhotoLocal(registerResult.user.id);
            if (photoUrl) updates.photo_url = photoUrl;
          }

          await fetch(`${API_BASE_URL}/index.php`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              table: "profiles",
              action: "update",
              payload: updates,
              filters: [{ col: "user_id", op: "eq", val: registerResult.user.id }]
            }),
          });
        }

        // No pending approval step for new registrations
        setIsLogin(true);
        toast({ title: "Account Created", description: "You can now sign in." });
      }
    } catch (err: any) {
      toast({ title: "Server Connection Error", description: "Failed to connect to local host API.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
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

        {pendingApproval ? (
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
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Campus</label>
                    <input
                      type="text"
                      required
                      value={campus}
                      onChange={(e) => setCampus(e.target.value)}
                      className={inputClass}
                      placeholder="e.g. Main Campus"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground bg-secondary/50 p-2 rounded-lg">
                    📋 Your Library Card Number will be generated automatically after registration.
                  </p>
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
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${inputClass} pr-10`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
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
