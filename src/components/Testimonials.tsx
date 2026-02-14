import { useState, useEffect } from 'react';
import { Quote, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

const testimonials = [
  {
    id: 1,
    name: 'Michael R.',
    country: 'United States',
    comment: 'Fast and reliable! I received my USDT within minutes. The rates are transparent and the process is smooth.',
    rating: 5,
  },
  {
    id: 2,
    name: 'Sarah K.',
    country: 'United Kingdom',
    comment: 'Best P2P platform I\'ve used. The profit rates are great and customer support is always helpful.',
    rating: 5,
  },
  {
    id: 3,
    name: 'Ahmed M.',
    country: 'UAE',
    comment: 'Global accessibility is what I needed. No regional restrictions, no hassle. Highly recommended!',
    rating: 5,
  },
  {
    id: 4,
    name: 'Elena V.',
    country: 'Germany',
    comment: 'Secure and trustworthy. I\'ve been using this platform for months without any issues.',
    rating: 5,
  },
  {
    id: 5,
    name: 'James L.',
    country: 'Australia',
    comment: 'The calculator feature is very useful. I always know exactly what I\'m getting before making a purchase.',
    rating: 5,
  },
];

export const Testimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToPrev = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goToNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const goToSlide = (index: number) => {
    setIsAutoPlaying(false);
    setCurrentIndex(index);
  };

  return (
    <section className="py-16 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <p className="text-sm text-primary font-medium mb-2">User Reviews</p>
          <h2 className="text-3xl sm:text-4xl font-display font-bold">
            What Our <span className="gradient-text">Users</span> Say
          </h2>
        </div>

        <div className="max-w-3xl mx-auto relative">
          {/* Main Testimonial Card */}
          <div className="glass-card rounded-2xl p-8 relative min-h-[250px] flex flex-col justify-center">
            <div className="absolute top-6 left-6 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Quote className="h-5 w-5 text-primary" />
            </div>
            
            <div 
              key={testimonials[currentIndex].id}
              className="animate-fade-in text-center pt-6"
            >
              {/* Stars */}
              <div className="flex justify-center gap-1 mb-4">
                {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-warning text-warning" />
                ))}
              </div>
              
              {/* Comment */}
              <p className="text-lg text-foreground leading-relaxed mb-6">
                "{testimonials[currentIndex].comment}"
              </p>
              
              {/* User Info */}
              <div>
                <p className="font-display font-semibold text-foreground">
                  {testimonials[currentIndex].name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {testimonials[currentIndex].country}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Arrows */}
          <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-between pointer-events-none px-2 sm:-mx-16">
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPrev}
              className="pointer-events-auto rounded-full bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-secondary"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={goToNext}
              className="pointer-events-auto rounded-full bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-secondary"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-2 mt-6">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex 
                    ? 'w-6 bg-primary' 
                    : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
