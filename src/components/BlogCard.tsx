import { Calendar, User, Clock, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface BlogCardProps {
  id: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  readTime: string;
  image: string;
  category: string;
}

const BlogCard = ({ 
  id,
  title, 
  excerpt, 
  author, 
  date, 
  readTime, 
  image, 
  category 
}: BlogCardProps) => {
  const navigate = useNavigate();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric',
      year: 'numeric' 
    });
  };

  const handleReadMore = () => {
    navigate(`/blog/${id}`);
  };

  return (
    <Card 
      className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-0 bg-card cursor-pointer"
      onClick={handleReadMore}
    >
      <div className="relative overflow-hidden">
        <img 
          src={image} 
          alt={title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 left-3">
          <Badge variant="secondary" className="bg-white/90 text-foreground">
            {category}
          </Badge>
        </div>
      </div>
      
      <CardContent className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
              {title}
            </h3>
            <p className="text-muted-foreground text-sm line-clamp-3">
              {excerpt}
            </p>
          </div>
          
          <div className="flex items-center text-xs text-muted-foreground space-x-4">
            <div className="flex items-center">
              <User className="h-3 w-3 mr-1" />
              <span>{author}</span>
            </div>
            <div className="flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              <span>{formatDate(date)}</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              <span>{readTime}</span>
            </div>
          </div>
          
          <div className="pt-2">
            <Button 
              variant="ghost" 
              className="p-0 h-auto text-primary hover:text-primary/80 group"
              onClick={handleReadMore}
            >
              Read More
              <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BlogCard;