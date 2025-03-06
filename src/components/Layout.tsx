
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { PhoneCall, Users, Mic, Brain, Home, Clock } from "lucide-react";

interface SidebarItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ to, icon, label }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-retell-primary text-white"
          : "text-gray-600 hover:bg-retell-light/20 hover:text-retell-primary"
      )}
    >
      {icon}
      {label}
    </Link>
  );
};

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 p-4">
        <div className="mb-8 flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-retell-primary flex items-center justify-center">
            <PhoneCall className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Retell Connector</h1>
        </div>
        <nav className="space-y-1.5">
          <SidebarItem to="/" icon={<Home className="h-5 w-5" />} label="Dashboard" />
          <SidebarItem to="/agents" icon={<Users className="h-5 w-5" />} label="Agents" />
          <SidebarItem to="/voices" icon={<Mic className="h-5 w-5" />} label="Voices" />
          <SidebarItem to="/llms" icon={<Brain className="h-5 w-5" />} label="LLMs" />
          <SidebarItem to="/calls" icon={<Clock className="h-5 w-5" />} label="Call History" />
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-6">{children}</div>
      </main>
    </div>
  );
};

export default Layout;
