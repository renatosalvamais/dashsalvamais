interface StatCardProps {
  value: number;
  label: string;
  color?: "total" | "active" | "family" | "removed";
}

export function StatCard({ value, label, color = "total" }: StatCardProps) {
  const colorClasses = {
    total: "text-stat-total",
    active: "text-stat-active",
    family: "text-stat-family",
    removed: "text-stat-removed",
  };

  return (
    <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
      <div className={`text-4xl font-bold ${colorClasses[color]} mb-2`}>
        {value}
      </div>
      <div className="text-sm text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
