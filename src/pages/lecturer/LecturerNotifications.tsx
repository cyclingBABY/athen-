import LecturerLayout from "@/components/LecturerLayout";
import { Bell } from "lucide-react";

const LecturerNotifications = () => {
  return (
    <LecturerLayout title="Notifications" description="Stay updated on library activities">
      <div className="text-center py-20">
        <Bell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-muted-foreground">No notifications yet.</p>
        <p className="text-sm text-muted-foreground mt-1">You'll receive notifications about book approvals, due dates, and more.</p>
      </div>
    </LecturerLayout>
  );
};

export default LecturerNotifications;
