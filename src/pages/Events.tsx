import Header from "@/components/Header";
import EventCard from "@/components/EventCard";

const Events = () => {
  // Mock events data - this will come from Supabase later
  const events = [
    {
      id: "1",
      title: "Sunday Worship Service",
      date: "2024-01-21",
      time: "10:00 AM",
      location: "Main Sanctuary",
      description: "Join us for our weekly worship service with inspiring music and meaningful messages.",
      image: "/placeholder.svg",
      price: 0,
      availableTickets: 200,
      category: "Worship"
    },
    {
      id: "2",
      title: "Youth Group Meeting",
      date: "2024-01-25",
      time: "7:00 PM",
      location: "Youth Center",
      description: "A fun evening of fellowship, games, and spiritual growth for ages 13-18.",
      image: "/placeholder.svg",
      price: 0,
      availableTickets: 50,
      category: "Youth"
    },
    {
      id: "3",
      title: "Community Outreach Dinner",
      date: "2024-02-03",
      time: "6:00 PM",
      location: "Fellowship Hall",
      description: "Come together to serve our community with a special dinner for those in need.",
      image: "/placeholder.svg",
      price: 10,
      availableTickets: 100,
      category: "Community"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">All Events</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover all upcoming events and activities at our church. Join us for worship, fellowship, and community outreach.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.map((event) => (
            <EventCard key={event.id} {...event} />
          ))}
        </div>

        {events.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No events scheduled at this time.</p>
            <p className="text-muted-foreground">Check back soon for upcoming events!</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Events;