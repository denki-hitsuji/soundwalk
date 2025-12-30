import OrganizerNav from "@/components/organizer/OrganizerNav";

export default function OrganizerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <OrganizerNav >
        {children}
      </OrganizerNav>
    </div>
  );
}
