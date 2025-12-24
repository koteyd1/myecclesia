import { MapPin, Clock, Building2, User, Briefcase, Heart, GraduationCap, ExternalLink, Calendar } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";
import { format, isPast, parseISO } from "date-fns";

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

  const getTypeConfig = (type: string) => {
    switch (type) {
      case "job":
        return {
          icon: <Briefcase className="h-4 w-4" />,
          label: "Job",
          color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
        };
      case "volunteer":
        return {
          icon: <Heart className="h-4 w-4" />,
          label: "Volunteer",
          color: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
        };
      case "internship":
        return {
          icon: <GraduationCap className="h-4 w-4" />,
          label: "Internship",
          color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
        };
      default:
        return {
          icon: <Briefcase className="h-4 w-4" />,
          label: "Opportunity",
          color: "bg-gray-100 text-gray-800",
        };
    }
  };

  const typeConfig = getTypeConfig(opportunity.opportunity_type);
  const posterName = opportunity.organization?.name || opportunity.minister?.full_name || "Unknown";
  const posterSlug = opportunity.organization?.slug || opportunity.minister?.slug;
  const posterType = opportunity.organization_id ? "organization" : "minister";
  const posterImage = opportunity.organization?.logo_url || opportunity.minister?.profile_image_url;

  const isDeadlinePassed = opportunity.deadline ? isPast(parseISO(opportunity.deadline)) : false;

  const truncateDescription = (text: string, maxLength: number = 120) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + "...";
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 flex flex-col h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={`${typeConfig.color} gap-1 shrink-0`}>
                {typeConfig.icon}
                {typeConfig.label}
              </Badge>
              {opportunity.is_remote && (
                <Badge variant="outline" className="shrink-0">
                  Remote
                </Badge>
              )}
            </div>
            <h3
              className="font-semibold text-lg text-foreground line-clamp-2 cursor-pointer hover:text-primary transition-colors"
              onClick={() => navigate(`/opportunities/${opportunity.id}`)}
            >
              {opportunity.title}
            </h3>
          </div>
        </div>

        {/* Poster Info */}
        <Link
          to={`/${posterType}/${posterSlug}`}
          className="flex items-center gap-2 mt-3 group/poster"
        >
          {posterImage ? (
            <img
              src={posterImage}
              alt={posterName}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              {opportunity.organization_id ? (
                <Building2 className="h-4 w-4 text-primary" />
              ) : (
                <User className="h-4 w-4 text-primary" />
              )}
            </div>
          )}
          <span className="text-sm text-muted-foreground group-hover/poster:text-primary transition-colors">
            {posterName}
          </span>
        </Link>
      </CardHeader>

      <CardContent className="flex-1 pt-0">
        <p className="text-sm text-muted-foreground mb-4">
          {truncateDescription(opportunity.description.replace(/<[^>]*>/g, ""))}
        </p>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="truncate">{opportunity.location}</span>
          </div>

          {opportunity.hours_per_week && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4 shrink-0" />
              <span>{opportunity.hours_per_week}</span>
            </div>
          )}

          {opportunity.salary_range && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Briefcase className="h-4 w-4 shrink-0" />
              <span>{opportunity.salary_range}</span>
            </div>
          )}

          {opportunity.deadline && (
            <div className={`flex items-center gap-2 ${isDeadlinePassed ? "text-destructive" : "text-muted-foreground"}`}>
              <Calendar className="h-4 w-4 shrink-0" />
              <span>
                {isDeadlinePassed ? "Deadline passed: " : "Apply by: "}
                {format(parseISO(opportunity.deadline), "MMM d, yyyy")}
              </span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-4 border-t">
        <Button
          className="w-full"
          onClick={() => navigate(`/opportunities/${opportunity.id}`)}
          disabled={isDeadlinePassed}
        >
          {isDeadlinePassed ? "Deadline Passed" : "View Details"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default OpportunityCard;
