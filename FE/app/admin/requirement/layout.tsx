"use client";
import { RequirementProvider } from "../../../src/containers/AdminRequirement/RequirementContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import "../../../src/containers/AdminRequirement/AdminRequirement.scss";

const tabs = [
  { label: "Creation", href: "/admin/requirement/creation" },
  { label: "Live requirements", href: "/admin/requirement/summary" },
  { label: "Management", href: "/admin/requirement/management" },
];

export default function RequirementLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <RequirementProvider>
      <div className="admin-requirement">
        <div className="requirement-layout">
          <div className="requirement-tabs">
            {tabs.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                className={`requirement-tab ${pathname?.startsWith(tab.href) ? "active" : ""}`}
              >
                {tab.label}
              </Link>
            ))}
          </div>
          <div className="requirement-wrapper">
            {children}
          </div>
        </div>
      </div>
    </RequirementProvider>
  );
}
