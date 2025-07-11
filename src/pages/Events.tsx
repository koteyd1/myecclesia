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
      image: "https://images.unsplash.com/photo-1507692049790-de58290a4334?w=800&h=400&fit=crop",
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
      image: "https://images.unsplash.com/photo-1529390079861-591de354faf5?w=800&h=400&fit=crop",
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
      image: "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&h=400&fit=crop",
      price: 10,
      availableTickets: 100,
      category: "Community"
    },
    {
      id: "4",
      title: "Bible Study Workshop",
      date: "2024-02-08",
      time: "7:00 PM",
      location: "Conference Room",
      description: "Deep dive into scripture with guided discussion and study materials provided.",
      image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=400&fit=crop",
      price: 0,
      availableTickets: 25,
      category: "Education"
    },
    {
      id: "5",
      title: "Easter Celebration Service",
      date: "2024-03-31",
      time: "9:00 AM",
      location: "Main Sanctuary",
      description: "Celebrate the resurrection with special music, baptisms, and a message of new life.",
      image: "https://images.unsplash.com/photo-1460904577954-8fadb262612c?w=800&h=400&fit=crop",
      price: 0,
      availableTickets: 200,
      category: "Special Event"
    },
    {
      id: "6",
      title: "Marriage Enrichment Retreat",
      date: "2024-04-15",
      time: "9:00 AM",
      location: "Mountain View Retreat Center",
      description: "A weekend retreat focused on strengthening marriages through workshops and prayer.",
      image: "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&h=400&fit=crop",
      price: 75,
      availableTickets: 30,
      category: "Retreat"
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