import { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

interface ActionCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  to: string;
  variant?: "success" | "destructive" | "primary";
}

export function ActionCard({ title, description, icon: Icon, to, variant = "primary" }: ActionCardProps) {
  const variantClasses = {
    success: "bg-success hover:bg-success/90",
    destructive: "bg-destructive hover:bg-destructive/90",
    primary: "bg-primary hover:bg-primary/90",
  };

  return (
    <Link to={to} className="block">
      <div className="bg-card rounded-lg p-6 border border-border shadow-sm hover:shadow-md transition-all group">
        <div className={`w-12 h-12 rounded-lg ${variantClasses[variant]} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-card-foreground mb-2">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground">
          {description}
        </p>
      </div>
    </Link>
  );
}
