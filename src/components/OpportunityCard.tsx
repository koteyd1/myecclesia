import { MapPin, Building2, User, Heart, BookOpen, Music, Users, ExternalLink, ArrowRight } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";

interface Opportunity {
  id: string;
  title: string;
  description: string;
  opportunity_type: "job" | "volunteer" | "internship";
  application_method: "external" | "in_app" | "both";
  external_url: string | null;
  location: string;
  is_remote: boolean;
  salary_range: string | null;
  hours_per_week: string | null;
  deadline: string | null;
  organization_id: string | null;
  minister_id: string | null;
  created_at: string;
  organization?: { name: string; logo_url: string | null; slug: string } | null;
  minister?: { full_name: string; profile_image_url: string | null; slug: string } | null;
}

interface OpportunityCardProps {
  opportunity: Opportunity;
}

const OpportunityCard = ({ opportunity }: OpportunityCardProps) => {
  const navigate = useNavigate();

  const getServiceConfig = (type: string) => {
    switch (type) {
      case "job":
        return {
          icon: <BookOpen className="h-3.5 w-3.5" />,
          label: "Professional",
          className: "bg-primary/10 text-primary border-primary/20",
        };
      case "volunteer":
        return {
          icon: <Heart className="h-3.5 w-3.5" />,
          label: "Community",
          className: "bg-secondary/10 text-secondary border-secondary/20",
        };
      case "internship":
        return {
          icon: <Users className="h-3.5 w-3.5" />,
          label: "Mentorship",
          className: "bg-accent-foreground/10 text-accent-foreground border-accent-foreground/20",
        };
      default:
        return {
          icon: <Heart className="h-3.5 w-3.5" />,
          label: "Service",
          className: "bg-muted text-muted-foreground",
        };
    }
  };

  const serviceConfig = getServiceConfig(opportunity.opportunity_type);
  const posterName = opportunity.organization?.name || opportunity.minister?.full_name || "Unknown";
  const posterSlug = opportunity.organization?.slug || opportunity.minister?.slug;
  const posterType = opportunity.organization_id ? "organization" : "minister";
  const posterImage = opportunity.organization?.logo_url || opportunity.minister?.profile_image_url;

  const truncateDescription = (text: string, maxLength: number = 100) => {
    const clean = text.replace(/<[^>]*>/g, "");
    if (clean.length <= maxLength) return clean;
    return clean.substring(0, maxLength).trim() + "...";
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 flex flex-col h-full overflow-hidden border-border/60">
      {/* Provider header */}
      <CardHeader className="pb-3 space-y-4">
        <Link
          to={`/${posterType}/${posterSlug}`}
          className="flex items-center gap-3 group/poster"
        >
          {posterImage ? (
            <img
              src={posterImage}
              alt={posterName}
              className="h-12 w-12 rounded-full object-cover ring-2 ring-border"
            />
          ) : (
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-border">
              {opportunity.organization_id ? (
                <Building2 className="h-5 w-5 text-primary" />
              ) : (
                <User className="h-5 w-5 text-primary" />
              )}
            </div>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-foreground group-hover/poster:text-primary transition-colors truncate">
              {posterName}
            </p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{opportunity.location}</span>
              {opportunity.is_remote && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 ml-1">
                  Remote
                </Badge>
              )}
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`gap-1 text-xs ${serviceConfig.className}`}>
            {serviceConfig.icon}
            {serviceConfig.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pt-0 space-y-3">
        <h3
          className="font-semibold text-base text-foreground line-clamp-2 cursor-pointer hover:text-primary transition-colors leading-snug"
          onClick={() => navigate(`/opportunities/${opportunity.id}`)}
        >
          {opportunity.title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
          {truncateDescription(opportunity.description, 130)}
        </p>

        {opportunity.salary_range && (
          <p className="text-xs font-medium text-primary">
            {opportunity.salary_range}
          </p>
        )}
      </CardContent>

      <CardFooter className="pt-4 border-t border-border/50 gap-2">
        <Button
          variant="default"
          className="flex-1 gap-1.5"
          size="sm"
          onClick={() => navigate(`/opportunities/${opportunity.id}`)}
        >
          Learn More
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
        {opportunity.external_url && (
          <Button
            variant="outline"
            size="sm"
            asChild
          >
            <a href={opportunity.external_url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default OpportunityCard;
