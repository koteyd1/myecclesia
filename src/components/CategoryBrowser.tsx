import { useNavigate } from "react-router-dom";
import { 
  Church, 
  BookOpen, 
  Users, 
  Music, 
  Heart, 
  Tent, 
  GraduationCap,
  PartyPopper,
  Globe,
  Mic2
} from "lucide-react";

interface CategoryCardProps {
  name: string;
  icon: React.ReactNode;
  color: string;
  count?: number;
}

const CategoryCard = ({ name, icon, color, count }: CategoryCardProps) => {
  const navigate = useNavigate();
  
  return (
    <button
      onClick={() => navigate(`/events?category=${encodeURIComponent(name)}`)}
      className="group flex flex-col items-center p-4 sm:p-6 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300"
    >
      <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full ${color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <span className="text-sm sm:text-base font-medium text-foreground text-center">
        {name}
      </span>
      {count !== undefined && (
        <span className="text-xs text-muted-foreground mt-1">
          {count} events
        </span>
      )}
    </button>
  );
};

const categories = [
  { 
    name: "Conference", 
    icon: <Mic2 className="h-7 w-7 text-purple-600" />, 
    color: "bg-purple-100 dark:bg-purple-900/30" 
  },
  { 
    name: "Worship and Music", 
    icon: <Music className="h-7 w-7 text-pink-600" />, 
    color: "bg-pink-100 dark:bg-pink-900/30" 
  },
  { 
    name: "Church Service", 
    icon: <Church className="h-7 w-7 text-blue-600" />, 
    color: "bg-blue-100 dark:bg-blue-900/30" 
  },
  { 
    name: "Bible Study", 
    icon: <BookOpen className="h-7 w-7 text-emerald-600" />, 
    color: "bg-emerald-100 dark:bg-emerald-900/30" 
  },
  { 
    name: "Youth Events", 
    icon: <Users className="h-7 w-7 text-orange-600" />, 
    color: "bg-orange-100 dark:bg-orange-900/30" 
  },
  { 
    name: "Community Outreach", 
    icon: <Heart className="h-7 w-7 text-red-600" />, 
    color: "bg-red-100 dark:bg-red-900/30" 
  },
  { 
    name: "Camps and Retreats", 
    icon: <Tent className="h-7 w-7 text-teal-600" />, 
    color: "bg-teal-100 dark:bg-teal-900/30" 
  },
  { 
    name: "Educational", 
    icon: <GraduationCap className="h-7 w-7 text-indigo-600" />, 
    color: "bg-indigo-100 dark:bg-indigo-900/30" 
  },
  { 
    name: "Special Events", 
    icon: <PartyPopper className="h-7 w-7 text-amber-600" />, 
    color: "bg-amber-100 dark:bg-amber-900/30" 
  },
  { 
    name: "Missions", 
    icon: <Globe className="h-7 w-7 text-cyan-600" />, 
    color: "bg-cyan-100 dark:bg-cyan-900/30" 
  },
];

interface CategoryBrowserProps {
  eventCounts?: Record<string, number>;
}

const CategoryBrowser = ({ eventCounts }: CategoryBrowserProps) => {
  return (
    <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="container mx-auto">
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
            Browse by Category
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Find events that match your interests
          </p>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {categories.map((category) => (
            <CategoryCard 
              key={category.name}
              name={category.name}
              icon={category.icon}
              color={category.color}
              count={eventCounts?.[category.name]}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryBrowser;
