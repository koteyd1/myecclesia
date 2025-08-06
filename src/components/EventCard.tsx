
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Clock, DollarSign, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";

interface EventCardProps {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  image: string;
  price: number;
  availableTickets: number;
  category: string;
  denominations: string;
}

const EventCard = ({
  id,
  title,
  date,
  time,
  location,
  description,
  image,
  price,
  availableTickets,
  category,
  denominations
}: EventCardProps) => {
  const formattedDate = format(new Date(date), "MMM dd, yyyy");
  const formattedTime = format(new Date(`2000-01-01T${time}`), "h:mm a");
  
  const handleCardClick = () => {
    // Save current scroll position and page before navigating
    sessionStorage.setItem('eventsScrollPosition', window.scrollY.toString());
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full flex flex-col">
      <div className="relative h-48 overflow-hidden">
        <img 
          src={image} 
          alt={title}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-4 left-4">
          <Badge variant="secondary" className="bg-primary/90 text-primary-foreground">
            {category}
          </Badge>
        </div>
        {availableTickets === 0 && (
          <div className="absolute top-4 right-4">
            <Badge variant="destructive">Sold Out</Badge>
          </div>
        )}
      </div>
      
      <CardHeader className="pb-3">
        <h3 className="font-semibold text-lg line-clamp-2 leading-tight">{title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
      </CardHeader>
      
      <CardContent className="pt-0 flex-grow flex flex-col justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 flex-shrink-0" />
            <span>{formattedDate}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4 flex-shrink-0" />
            <span>{formattedTime}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 flex-shrink-0" />
            <span className="line-clamp-1">{location}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 flex-shrink-0" />
              <span className="font-medium">
                {price === 0 ? "Free" : `$${price.toFixed(2)}`}
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4 flex-shrink-0" />
              <span>{availableTickets} spots left</span>
            </div>
          </div>
          
          {denominations && (
            <div className="text-xs text-muted-foreground">
              <span className="font-medium">Denominations:</span> {denominations}
            </div>
          )}
        </div>
        
        <div className="mt-4 pt-4 border-t">
          <Link 
            to={`/events/${id}`}
            state={{ from: 'events' }}
            onClick={handleCardClick}
          >
            <Button className="w-full" disabled={availableTickets === 0}>
              {availableTickets === 0 ? "Sold Out" : "View Details"}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default EventCard;
