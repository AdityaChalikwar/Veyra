import { BarChart3, DollarSign, Globe2, Tag, TrendingDown, UserMinus, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import type { InvestigationTopic } from "@/lib/types";

const icons: Record<InvestigationTopic, LucideIcon> = {
  engagement: BarChart3,
  revenue: TrendingDown,
  retention: UserMinus,
  market: Globe2,
  pricing: DollarSign,
  adoption: Tag,
};

export function TopicIcon({ topic, className }: { topic: InvestigationTopic; className?: string }) {
  const Icon = icons[topic];
  return <Icon className={cn("h-4 w-4", className)} aria-hidden="true" />;
}
