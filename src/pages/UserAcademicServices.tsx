import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import UserSidebar from "@/components/UserSidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  GraduationCap,
  AlertTriangle,
  Lock,
  Unlock,
  FileText,
  Printer,
  Sparkles,
  Send,
  Loader2,
  CheckCircle,
  HelpCircle
} from "lucide-react";
import { format } from "date-fns";

const UserAcademicServices = () => {
  const [profile, setProfile] = useState<any>(null);
  const [unreturnedBooks, setUnreturnedBooks] = useState<any[]>([]);
  const [unpaidFines, setUnpaidFines] = useState<any[]>([]);
  const [lecturers, setLecturers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Recommendation request state
  const [selectedLecturer, setSelectedLecturer] = useState("");
  const [purpose, setPurpose] = useState("");
  const [reqSent, setReqSent] = useState(false);
  const [recLetter, setRecLetter] = useState<string | null>(null);
  const [sendingReq, setSendingReq] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();

  const fetchClearanceData = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      // 1. Fetch profile details
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      setProfile(profileData);

      // 2. Fetch unreturned books
      const { data: booksData } = await supabase
        .from("circulation_records")
        .select("*, books(title, author)")
        .eq("user_id", user.id)
        .neq("status", "returned");

      // 3. Fetch unpaid fines
      const { data: finesData } = await supabase
        .from("fines")
        .select("*")
        .eq("user_id", user.id)
        .eq("paid", false);

      // 4. Fetch lecturers
      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "lecturer");
      
      const lecturerIds = rolesData?.map(r => r.user_id) || [];
      if (lecturerIds.length > 0) {
        const { data: lecturersData } = await supabase
          .from("profiles")
          .select("user_id, full_name, department")
          .in("user_id", lecturerIds);
        setLecturers(lecturersData || []);
      }

      if (booksData) setUnreturnedBooks(booksData);
      if (finesData) setUnpaidFines(finesData);
    } catch (e: any) {
      console.error(e);
      toast({ title: "Error loading clearance", description: e.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClearanceData();
  }, [user]);

  const totalFines = unpaidFines.reduce((sum, f) => sum + Number(f.amount), 0);
  const isCleared = unreturnedBooks.length === 0 && totalFines === 0;

  const handleRequestRecommendation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCleared) {
      toast({ title: "Blocked", description: "You must be cleared to request a recommendation letter.", variant: "destructive" });
      return;
    }
    if (!selectedLecturer || !purpose) {
      toast({ title: "Required", description: "Please fill all fields.", variant: "destructive" });
      return;
    }

    setSendingReq(true);
    // Simulate API request delay
    setTimeout(() => {
      const lecturerObj = lecturers.find(l => l.user_id === selectedLecturer);
      const generatedLetter = `UNIVERSITY ACADEMIC REGISTRY
RECOMMENDATION LETTER

Date: ${format(new Date(), "MMMM d, yyyy")}

To Whom It May Concern,

I am pleased to write this letter of recommendation on behalf of ${profile?.full_name || "the student"} (${profile?.registration_number || "N/A"}). I have known the student in my capacity as a lecturer in the Department of ${lecturerObj?.department || "Academic Studies"}.

During their academic journey, they have shown great diligence, high intellectual capacity, and excellent character. Their library records are fully cleared, demonstrating high responsibility and commitment to academic rules.

I highly recommend them for "${purpose}" and wish them success in all future pursuits.

Sincerely,

______________________________
${lecturerObj?.full_name || "Faculty Lecturer"}
Department of ${lecturerObj?.department || "Academic Studies"}
Athena University`;

      setRecLetter(generatedLetter);
      setReqSent(true);
      setSendingReq(false);
      toast({ title: "Recommendation Approved", description: "The letter has been generated successfully." });
    }, 1200);
  };

  const triggerPrint = (printId: string) => {
    const printContent = document.getElementById(printId);
    const windowUrl = 'about:blank';
    const uniqueName = new Date();
    const windowName = 'Print' + uniqueName.getTime();
    const prtWindow = window.open(windowUrl, windowName, 'left=100,top=100,width=800,height=900');
    
    prtWindow?.document.write(`
      <html>
        <head>
          <title>Print Document</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; padding: 40px; color: #111; }
            .print-card { border: 4px double #333; padding: 30px; border-radius: 8px; max-width: 600px; margin: auto; text-align: center; }
            .print-header { border-bottom: 2px solid #333; padding-bottom: 15px; margin-bottom: 20px; }
            .print-title { font-size: 24px; font-weight: bold; text-transform: uppercase; margin: 0; }
            .print-subtitle { font-size: 12px; color: #666; margin-top: 5px; }
            .print-body { font-size: 14px; text-align: left; line-height: 1.6; margin-bottom: 30px; }
            .print-field { margin-bottom: 10px; }
            .print-field strong { display: inline-block; width: 150px; }
            .print-badge { display: inline-block; border: 2px solid green; color: green; font-weight: bold; padding: 5px 15px; border-radius: 4px; font-size: 16px; margin: 15px 0; }
            .print-footer { margin-top: 40px; border-top: 1px dashed #999; padding-top: 20px; text-align: center; font-size: 11px; color: #666; }
            .cert-body { text-align: center; font-family: 'Times New Roman', Times, serif; }
            .cert-text { font-size: 18px; font-style: italic; line-height: 1.8; }
            .signature { font-family: 'Brush Script MT', cursive, sans-serif; font-size: 32px; margin-top: 20px; }
          </style>
        </head>
        <body onload="window.print();window.close();">
          ${printContent?.innerHTML}
        </body>
      </html>
    `);
    prtWindow?.document.close();
    prtWindow?.focus();
  };

  return (
    <div className="flex min-h-screen bg-background">
      <UserSidebar />
      <main className="flex-1 p-6 md:p-8 overflow-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold flex items-center gap-2">
              <GraduationCap className="w-7 h-7 text-primary" />
              Academic Services Portal
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Access university exam permits, lecturer recommendation letters, and final graduation clearance.
            </p>
          </div>
          <div>
            {isLoading ? (
              <Badge variant="outline" className="animate-pulse">Checking Clearance...</Badge>
            ) : isCleared ? (
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 flex items-center gap-1.5 py-1.5 px-3">
                <Unlock className="w-3.5 h-3.5" /> Cleared for Academic Actions
              </Badge>
            ) : (
              <Badge variant="destructive" className="flex items-center gap-1.5 py-1.5 px-3">
                <Lock className="w-3.5 h-3.5" /> Academic Services Blocked
              </Badge>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="bg-card rounded-xl border p-12 text-center text-muted-foreground flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-3" />
            <p className="text-sm">Verifying student library clearance obligations...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Clearance Alert Banners */}
            {!isCleared ? (
              <div className="bg-rose-500/15 border border-rose-500/30 rounded-xl p-5 flex flex-col md:flex-row items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-rose-500 flex items-center justify-center text-white shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-rose-800 dark:text-rose-400">Academic Clearance Enforcement Block</h3>
                  <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">
                    You have outstanding library liabilities. In accordance with university clearance rules, you are currently <strong>blocked</strong> from accessing examinations, recommendation letters, and final graduation clearance.
                  </p>
                  <div className="flex gap-4 text-xs font-semibold mt-2">
                    <span className="text-rose-600 dark:text-rose-400">Outstanding Books: {unreturnedBooks.length}</span>
                    <span className="text-rose-600 dark:text-rose-400">Unpaid Fines: ${totalFines.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-emerald-800 dark:text-emerald-400">All Library Dues Cleared</h3>
                  <p className="text-sm text-muted-foreground">
                    Congratulations! Your real-time status is fully cleared. You have zero unreturned books and zero unpaid fines. You can access all academic services below.
                  </p>
                </div>
              </div>
            )}

            {/* Academic Service Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Exam Permit Permit Card */}
              <Card className={`relative overflow-hidden ${!isCleared && "opacity-60 bg-muted/20"}`}>
                {!isCleared && <div className="absolute top-3 right-3"><Lock className="w-4 h-4 text-muted-foreground" /></div>}
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Final Examinations
                  </CardTitle>
                  <CardDescription>Generate and download your examination entry permit.</CardDescription>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground leading-relaxed">
                  Students require a library-cleared entry slip to sit for terminal examinations. Your library borrowing record will be validated in real time before permit generation.
                </CardContent>
                <CardFooter>
                  {isCleared ? (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="w-full text-xs font-medium">Generate Exam Permit</Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Examination Entry Permit</DialogTitle>
                          <DialogDescription>Use the print option below to generate a physical entry permit.</DialogDescription>
                        </DialogHeader>
                        
                        <div id="print-exam-permit" className="p-6 border-4 double border-primary/20 bg-card rounded-xl text-center font-mono space-y-4">
                          <div className="border-b-2 pb-3 mb-2">
                            <h2 className="text-lg font-bold font-display tracking-tight text-foreground">ATHENA ACADEMIC REGISTRY</h2>
                            <p className="text-[10px] text-muted-foreground uppercase">Official Examination Admission Permit</p>
                          </div>
                          
                          <div className="flex flex-col items-center gap-2 mb-4">
                            <div className="w-16 h-16 rounded-full border bg-muted overflow-hidden flex items-center justify-center font-bold text-lg text-primary">
                              {profile?.photo_url ? (
                                <img src={profile.photo_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                profile?.full_name?.[0]?.toUpperCase() || "S"
                              )}
                            </div>
                            <div className="inline-block border-2 border-emerald-500 bg-emerald-500/10 text-emerald-600 font-bold px-3 py-1 rounded text-xs">
                              LIBRARY STATUS: CLEARED
                            </div>
                          </div>

                          <div className="text-left text-xs space-y-1.5 max-w-xs mx-auto">
                            <div className="print-field"><strong>Student Name:</strong> {profile?.full_name || "—"}</div>
                            <div className="print-field"><strong>Reg Number:</strong> {profile?.registration_number || "—"}</div>
                            <div className="print-field"><strong>Library Card:</strong> {profile?.library_card_number || "—"}</div>
                            <div className="print-field"><strong>Campus:</strong> {profile?.campus || "Main Campus"}</div>
                            <div className="print-field"><strong>Issue Date:</strong> {format(new Date(), "MMM d, yyyy")}</div>
                          </div>

                          <div className="border-t border-dashed pt-4 text-[10px] text-muted-foreground">
                            This permit confirms the candidate has no outstanding library books or fines and is approved to sit for all exams.
                            <div className="mt-3 flex items-center justify-center gap-1 font-bold text-[8px]">
                              BARCODE VALIDATED: [{profile?.library_card_number || "ATH-STD"}]
                            </div>
                          </div>
                        </div>

                        <DialogFooter className="flex gap-2">
                          <Button variant="outline" className="text-xs" onClick={() => triggerPrint("print-exam-permit")}>
                            <Printer className="w-4 h-4 mr-2" /> Print Permit
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  ) : (
                    <Button disabled className="w-full text-xs" variant="secondary">
                      <Lock className="w-3.5 h-3.5 mr-2" /> Permit Blocked
                    </Button>
                  )}
                </CardFooter>
              </Card>

              {/* Recommendation Letter Card */}
              <Card className={`relative overflow-hidden ${!isCleared && "opacity-60 bg-muted/20"}`}>
                {!isCleared && <div className="absolute top-3 right-3"><Lock className="w-4 h-4 text-muted-foreground" /></div>}
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Recommendation Letters
                  </CardTitle>
                  <CardDescription>Request official recommendation letters from faculty.</CardDescription>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground leading-relaxed">
                  Need a recommendation letter for employment or post-graduate studies? Faculty members require a verified library clearance record to approve recommendations.
                </CardContent>
                <CardFooter>
                  {isCleared ? (
                    <Dialog onOpenChange={(o) => { if (!o) { setReqSent(false); setRecLetter(null); } }}>
                      <DialogTrigger asChild>
                        <Button className="w-full text-xs font-medium">Request Recommendation</Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Request Recommendation Letter</DialogTitle>
                          <DialogDescription>Submit a quick request to a library-cleared faculty lecturer.</DialogDescription>
                        </DialogHeader>

                        {!reqSent ? (
                          <form onSubmit={handleRequestRecommendation} className="space-y-4 py-2">
                            <div className="space-y-1">
                              <Label>Select Lecturer</Label>
                              <Select value={selectedLecturer} onValueChange={setSelectedLecturer}>
                                <SelectTrigger><SelectValue placeholder="Choose lecturer" /></SelectTrigger>
                                <SelectContent>
                                  {lecturers.map(l => (
                                    <SelectItem key={l.user_id} value={l.user_id}>
                                      {l.full_name} ({l.department || "Faculty"})
                                    </SelectItem>
                                  ))}
                                  {lecturers.length === 0 && (
                                    <SelectItem disabled value="none">No lecturers found</SelectItem>
                                  )}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label>Purpose</Label>
                              <Input
                                placeholder="e.g. Master of Science in CS Admission"
                                value={purpose}
                                onChange={e => setPurpose(e.target.value)}
                              />
                            </div>
                            <Button type="submit" disabled={sendingReq} className="w-full">
                              {sendingReq ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                              Submit Request
                            </Button>
                          </form>
                        ) : (
                          <div className="space-y-4">
                            <div id="print-rec-letter" className="p-6 border-4 double border-primary/20 bg-card rounded-xl text-left font-mono whitespace-pre-line text-xs max-h-96 overflow-y-auto leading-relaxed">
                              {recLetter}
                            </div>
                            <div className="flex gap-2">
                              <Button className="flex-1 text-xs" onClick={() => triggerPrint("print-rec-letter")}>
                                <Printer className="w-4 h-4 mr-2" /> Print Letter
                              </Button>
                              <Button variant="outline" className="flex-1 text-xs" onClick={() => { setReqSent(false); setRecLetter(null); }}>
                                Request Another
                              </Button>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  ) : (
                    <Button disabled className="w-full text-xs" variant="secondary">
                      <Lock className="w-3.5 h-3.5 mr-2" /> Request Blocked
                    </Button>
                  )}
                </CardFooter>
              </Card>

              {/* Graduation Clearance Card */}
              <Card className={`relative overflow-hidden ${!isCleared && "opacity-60 bg-muted/20"}`}>
                {!isCleared && <div className="absolute top-3 right-3"><Lock className="w-4 h-4 text-muted-foreground" /></div>}
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-primary" />
                    Graduation Clearance
                  </CardTitle>
                  <CardDescription>Apply for final graduation library sign-off.</CardDescription>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground leading-relaxed">
                  Final clearance is mandatory for graduation and certificate conferral. Ensure all library cards, physical books, and unpaid fines are cleared before requesting sign-off.
                </CardContent>
                <CardFooter>
                  {isCleared ? (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="w-full text-xs font-medium">Download Graduation Certificate</Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Graduation Clearance Certificate</DialogTitle>
                          <DialogDescription>Print or save your formal graduation clearance document.</DialogDescription>
                        </DialogHeader>

                        <div id="print-grad-cert" className="p-8 border-8 double border-amber-500/30 bg-card rounded-xl text-center font-serif space-y-6 shadow-inner relative overflow-hidden">
                          {/* Decorative border */}
                          <div className="absolute inset-2 border border-amber-500/10 pointer-events-none" />
                          
                          <div className="space-y-1">
                            <h2 className="text-2xl font-bold tracking-widest text-amber-800 dark:text-amber-400">ATHENA UNIVERSITY</h2>
                            <p className="text-[10px] tracking-widest text-muted-foreground uppercase">Office of the Registrar &middot; Library Services</p>
                          </div>

                          <div className="py-2">
                            <h3 className="text-xl font-semibold italic text-foreground/80">Clearance Certificate</h3>
                          </div>

                          <div className="space-y-4 max-w-md mx-auto text-sm text-foreground/75 leading-relaxed">
                            <p>This document certifies that the student named below:</p>
                            <p className="font-bold text-lg text-foreground border-b border-muted pb-1">{profile?.full_name || "—"}</p>
                            <p className="text-xs text-muted-foreground">Registration Number: <strong>{profile?.registration_number || "—"}</strong></p>
                            <p>
                              has successfully returned all borrowed resource catalogue books, settled all fine payments and assessments,
                              and holds no active liabilities with the University Library Catalogue system.
                            </p>
                            <p className="font-medium italic text-emerald-600 dark:text-emerald-400 text-base">
                              Is Officially Cleared for Graduation & Degree Conferral
                            </p>
                          </div>

                          <div className="pt-6 grid grid-cols-2 gap-8 border-t border-muted max-w-md mx-auto text-xs">
                            <div>
                              <div className="font-mono text-[9px] text-muted-foreground">Verification Code:</div>
                              <div className="font-bold font-mono tracking-wider text-[10px] text-foreground">{profile?.library_card_number || "ATH-STD"}-CLEAR</div>
                            </div>
                            <div>
                              <div className="font-mono text-[9px] text-muted-foreground">Registrar:</div>
                              <div className="font-semibold text-foreground/90 font-display signature italic mt-0.5">Stuart Swafa</div>
                            </div>
                          </div>
                        </div>

                        <DialogFooter className="flex gap-2">
                          <Button variant="outline" className="text-xs" onClick={() => triggerPrint("print-grad-cert")}>
                            <Printer className="w-4 h-4 mr-2" /> Print Certificate
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  ) : (
                    <Button disabled className="w-full text-xs" variant="secondary">
                      <Lock className="w-3.5 h-3.5 mr-2" /> Graduation Blocked
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default UserAcademicServices;
