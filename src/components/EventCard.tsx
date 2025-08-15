import { Calendar, MapPin, Users, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { SocialShare } from "@/components/SocialShare";

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
  const navigate = useNavigate();

  const handleViewEvent = () => {
    // Save current scroll position and page before navigating
    sessionStorage.setItem('eventsScrollPosition', window.scrollY.toString());
    const currentPage = sessionStorage.getItem('eventsCurrentPage') || '1';
    sessionStorage.setItem('eventsCurrentPage', currentPage);
    navigate(`/events/${id}`);
  };

  const handleRegisterNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Save current scroll position and page before navigating
    sessionStorage.setItem('eventsScrollPosition', window.scrollY.toString());
    const currentPage = sessionStorage.getItem('eventsCurrentPage') || '1';
    sessionStorage.setItem('eventsCurrentPage', currentPage);
    navigate(`/events/${id}#register`);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const isSalesEnded = () => {
    const eventDateTime = new Date(`${date}T${time}`);
    const now = new Date();
    return eventDateTime <= now;
  };

  return (
    <Card 
      className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-0 bg-card cursor-pointer" 
      onClick={handleViewEvent}
    >
      <div className="relative overflow-hidden">
        <img
          src={image}
          alt={`${title} event image`}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 left-3 flex flex-col gap-1">
          {category && (
            <Badge variant="secondary" className="bg-white/90 text-foreground">
              {category}
            </Badge>
          )}
          {denominations && (
            <Badge variant="outline" className="bg-white/90 text-foreground border-primary">
              {denominations}
            </Badge>
          )}
        </div>
        {price === 0 ? (
          <div className="absolute top-3 right-3">
            <Badge className="bg-success text-success-foreground">
              Free
            </Badge>
          </div>
        ) : (
          <div className="absolute top-3 right-3">
            <Badge variant="outline" className="bg-white/90 text-foreground">
              £{price}
            </Badge>
          </div>
        )}
      </div>
      
      <CardContent className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
              {title}
            </h3>
            <p className="text-muted-foreground text-sm line-clamp-2">
              {description}
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 mr-2 text-primary" />
              {formatDate(date)}
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="h-4 w-4 mr-2 text-primary" />
              {formatTime(time)}
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 mr-2 text-primary" />
              {location}
            </div>
          </div>
          
          <div className="pt-2 flex gap-2">
            {isSalesEnded() ? (
              <div className="flex-1">
                <Badge variant="secondary" className="w-full justify-center py-2 bg-muted text-muted-foreground">
                  Sales Ended
                </Badge>
              </div>
            ) : (
              <Button 
                className="flex-1 bg-gradient-primary hover:opacity-90 transition-opacity"
                onClick={handleRegisterNow}
              >
                Register Now
              </Button>
            )}
            <div onClick={(e) => e.stopPropagation()}>
              <SocialShare
                url={`/events/${id}`}
                title={title}
                description={description}
                className="h-10"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EventCard;
