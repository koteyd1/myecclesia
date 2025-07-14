import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Users, Globe, BookOpen } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">About Our Church</h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Welcome to our church family! We are a community of believers dedicated to worship, fellowship, and serving others with love and compassion.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-4">Our Story</h2>
            <p className="text-muted-foreground mb-4">
              Welcome to Churchevents, a dedicated ticketing platform created to serve the vibrant Christian community across the UK. Our mission is to bring believers together, fostering unity within the Body of Christ by making it easy to discover, attend, and support Christian events—from worship nights and conferences to community outreach and faith-based workshops.
            </p>
            <p className="text-muted-foreground mb-4">
              We believe that every event is an opportunity to grow spiritually, build meaningful connections, and share the transformative message of Christ. By providing a seamless, user-friendly platform, we aim to empower churches, ministries, and Christian organizations to reach more people and strengthen the faith community nationwide.
            </p>
            <p className="text-muted-foreground">
              We are passionate about promoting the Gospel and encouraging fellowship across all denominations. Whether you're organizing a small local gathering or a large-scale conference, our platform is designed to support your vision and help you connect with others who share your faith.
            </p>
          </div>
          
          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-4">Our Mission</h2>
            <p className="text-muted-foreground mb-4">
              To create a loving community where everyone feels welcomed, valued, and encouraged to grow 
              in their relationship with God and with one another.
            </p>
            <p className="text-muted-foreground mb-4">
              We believe in the power of faith to transform lives and communities, and we strive to be 
              a beacon of hope and love in our neighborhood and beyond.
            </p>
            <p className="text-muted-foreground mb-4">
              The inspiration behind creating this Christian events ticketing platform came from a desire to unite the Body of Christ and make it easier for believers across the UK to connect, worship, and grow together. Recognizing that Christian events—such as worship nights, conferences, and community outreach—play a vital role in nurturing faith and building fellowship, the platform was developed to remove barriers to participation and help ministries reach a wider audience.
            </p>
            <p className="text-muted-foreground mb-4">
              We saw the need for a user-friendly, dedicated solution tailored to the unique needs of churches and Christian organizations, making it simple to promote events, manage ticketing, and encourage community involvement. By leveraging innovation and technology, the platform aims to empower churches to focus more on ministry and outreach, while seamlessly handling the logistics of event management.
            </p>
            <p className="text-muted-foreground">
              Ultimately, the vision is to promote the Christian faith, foster unity among believers, and support the growth of vibrant, faith-filled communities throughout the UK.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="text-center">
            <CardHeader>
              <Heart className="h-12 w-12 text-primary mx-auto mb-2" />
              <CardTitle>Love</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                We believe in showing Christ's love through our actions and words to everyone we meet.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Users className="h-12 w-12 text-primary mx-auto mb-2" />
              <CardTitle>Community</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Building strong relationships and supporting one another through life's joys and challenges.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Globe className="h-12 w-12 text-primary mx-auto mb-2" />
              <CardTitle>Service</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Reaching out to serve our local community and making a positive impact in the world.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <BookOpen className="h-12 w-12 text-primary mx-auto mb-2" />
              <CardTitle>Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Encouraging spiritual growth and learning through Bible study, prayer, and fellowship.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Join Us</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Whether you're new to faith or have been walking with God for years, you'll find a warm welcome here. 
            We invite you to join us for worship, connect with our community, and discover how you can be part 
            of something bigger than yourself.
          </p>
        </div>
      </main>
    </div>
  );
};

export default About;