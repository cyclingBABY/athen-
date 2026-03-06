import { useRef } from "react";
import { Library, Printer } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useState } from "react";

interface LibraryCardProps {
  fullName: string;
  email: string;
  cardNumber: string;
  role: "patron" | "lecturer" | "admin";
  photoUrl?: string | null;
  department?: string | null;
  campus?: string | null;
  registrationNumber?: string | null;
}

const LibraryIDCard = ({ fullName, email, cardNumber, role, photoUrl, department, campus, registrationNumber }: LibraryCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    if (cardNumber) {
      QRCode.toDataURL(cardNumber, { width: 100, margin: 1 }).then(setQrDataUrl);
    }
  }, [cardNumber]);

  const handlePrint = () => {
    const card = cardRef.current;
    if (!card) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Library ID Card - ${fullName}</title>
        <style>
          @page { size: 85.6mm 53.98mm; margin: 0; }
          body { margin: 0; padding: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #fff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
          .card { width: 85.6mm; height: 53.98mm; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-sizing: border-box; }
          .header { background: linear-gradient(135deg, #1e3a5f, #2563eb); color: white; padding: 6px 12px; display: flex; align-items: center; gap: 8px; }
          .header-icon { width: 20px; height: 20px; background: rgba(255,255,255,0.2); border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 10px; }
          .header h1 { font-size: 11px; font-weight: 700; margin: 0; }
          .header p { font-size: 7px; margin: 0; opacity: 0.8; text-transform: uppercase; letter-spacing: 1px; }
          .body { padding: 8px 12px; display: flex; gap: 10px; height: calc(100% - 32px); }
          .photo { width: 55px; height: 65px; border-radius: 4px; object-fit: cover; border: 1px solid #e2e8f0; flex-shrink: 0; }
          .photo-placeholder { width: 55px; height: 65px; border-radius: 4px; background: #f1f5f9; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 18px; font-weight: 600; flex-shrink: 0; border: 1px solid #e2e8f0; }
          .info { flex: 1; display: flex; flex-direction: column; justify-content: space-between; min-width: 0; }
          .name { font-size: 10px; font-weight: 700; color: #1e293b; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .detail { font-size: 7px; color: #64748b; margin: 1px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .role-badge { display: inline-block; font-size: 6px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; padding: 1px 6px; border-radius: 3px; background: ${role === 'lecturer' ? '#dbeafe' : '#dcfce7'}; color: ${role === 'lecturer' ? '#1d4ed8' : '#166534'}; }
          .bottom { display: flex; align-items: flex-end; justify-content: space-between; gap: 6px; }
          .card-num { font-size: 9px; font-weight: 700; font-family: monospace; color: #1e3a5f; }
          .qr { width: 42px; height: 42px; }
          @media print { body { min-height: auto; } .card { border: none; } }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <div class="header-icon">📚</div>
            <div>
              <h1>Athena Library</h1>
              <p>Official Library Card</p>
            </div>
          </div>
          <div class="body">
            ${photoUrl
              ? `<img src="${photoUrl}" class="photo" crossorigin="anonymous" />`
              : `<div class="photo-placeholder">${fullName?.[0]?.toUpperCase() || '?'}</div>`
            }
            <div class="info">
              <div>
                <p class="name">${fullName || 'Member'}</p>
                <p class="detail">${email}</p>
                ${department ? `<p class="detail">${department}</p>` : ''}
                ${campus ? `<p class="detail">Campus: ${campus}</p>` : ''}
                ${registrationNumber ? `<p class="detail">Reg: ${registrationNumber}</p>` : ''}
                <span class="role-badge">${role === 'lecturer' ? 'Staff' : role === 'admin' ? 'Admin' : 'Student'}</span>
              </div>
              <div class="bottom">
                <div class="card-num">${cardNumber || 'N/A'}</div>
                ${qrDataUrl ? `<img src="${qrDataUrl}" class="qr" />` : ''}
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
  };

  return (
    <div className="space-y-4">
      {/* Preview Card */}
      <div ref={cardRef} className="w-full max-w-[340px] mx-auto rounded-xl overflow-hidden border shadow-lg">
        {/* Header */}
        <div className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--chart-1))] px-4 py-2.5 flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-primary-foreground/20 flex items-center justify-center">
            <Library className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-primary-foreground">Athena Library</h3>
            <p className="text-[8px] text-primary-foreground/70 uppercase tracking-widest">Official Library Card</p>
          </div>
        </div>

        {/* Body */}
        <div className="bg-card p-3 flex gap-3">
          {/* Photo */}
          {photoUrl ? (
            <img src={photoUrl} alt="" className="w-16 h-20 rounded-md object-cover border shrink-0" />
          ) : (
            <div className="w-16 h-20 rounded-md bg-muted flex items-center justify-center text-lg font-bold text-muted-foreground shrink-0">
              {fullName?.[0]?.toUpperCase() || "?"}
            </div>
          )}

          {/* Info */}
          <div className="flex-1 flex flex-col justify-between min-w-0">
            <div>
              <p className="text-sm font-bold text-foreground truncate">{fullName || "Member"}</p>
              <p className="text-[10px] text-muted-foreground truncate">{email}</p>
              {department && <p className="text-[10px] text-muted-foreground truncate">{department}</p>}
              {campus && <p className="text-[10px] text-muted-foreground truncate">Campus: {campus}</p>}
              {registrationNumber && <p className="text-[10px] text-muted-foreground truncate font-mono">Reg: {registrationNumber}</p>}
              <span className={`inline-block text-[8px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded mt-1 ${
                role === "lecturer" ? "bg-primary/10 text-primary" : role === "admin" ? "bg-destructive/10 text-destructive" : "bg-accent/10 text-accent"
              }`}>
                {role === "lecturer" ? "Staff" : role === "admin" ? "Admin" : "Student"}
              </span>
            </div>
            <div className="flex items-end justify-between mt-2 gap-2">
              <span className="text-xs font-bold font-mono text-primary">{cardNumber || "N/A"}</span>
              {qrDataUrl && <img src={qrDataUrl} alt="QR" className="w-10 h-10 rounded" />}
            </div>
          </div>
        </div>
      </div>

      {/* Print Button */}
      <div className="flex justify-center">
        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Printer className="w-4 h-4" />
          Print Library ID Card
        </button>
      </div>
    </div>
  );
};

export default LibraryIDCard;
