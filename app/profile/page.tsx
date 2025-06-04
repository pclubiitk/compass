'use client'
import Image from "next/image";
import * as React from "react";
import { Card, CardContent } from "@/components/ui/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import {
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Share2 } from "lucide-react"
import { useState } from 'react';


export default function Home() {

  const [locationUrl, setLocationUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');

  const shareLocation = () => {
    setStatus('Getting your location...');

    if (!navigator.geolocation) {
      setStatus('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const mapUrl = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=15/${latitude}/${longitude}`;
        setLocationUrl(mapUrl);
        setStatus('Location retrieved! You can copy the link below.');
      },
      () => {
        setStatus('Unable to retrieve your location.');
      }
    );
  };

  const StarFilled = ({ className }: { className?: string }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
        clipRule="evenodd"
      />
    </svg>
  );

  const StarEmpty = ({ className }: { className?: string }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.563.563 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
      />
    </svg>
  );

  // Add this function in your component
const shareViaNative = async () => {
  if (!locationUrl) {
    alert('No location URL to share!');
    return;
  }

  if (navigator.share) {
    try {
      await navigator.share({
        title: 'My Current Location',
        text: 'Check out my location!',
        url: locationUrl, // now guaranteed string
      });
      alert('Shared successfully!');
    } catch (error) {
      alert('Sharing failed or cancelled.');
      console.error('Share error:', error);
    }
  } else {
    alert('Web Share API is not supported on your browser.');
  }
};



  return (
    <div className="min-h-screen p-4 pb-16 sm:p-8 sm:pb-20 font-sans">
      <main className="flex flex-col gap-6 sm:gap-8 items-center w-full mx-auto max-w-4xl">
        {/* Profile Section */}
        <div className="w-full text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 mb-6 sm:mb-8">
            {/* Profile Image */}
            <div className="relative w-20 h-20 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-white dark:border-gray-800 shadow-lg">
              <Image
                src="/person2.jpg"
                alt="Profile picture"
                width={128}
                height={128}
                className="object-cover w-full h-full"
                priority
              />
              <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity rounded-full flex items-center justify-center cursor-pointer">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="white" 
                  strokeWidth="2"
                  className="w-5 h-5 sm:w-6 sm:h-6"
                >
                  <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                </svg>
              </div>
            </div>
            
            <div>
              <h1 className="text-3xl sm:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-500 bg-clip-text text-transparent mb-1 sm:mb-2">
                Sabrina
              </h1>
              <h2 className="text-lg sm:text-2xl text-gray-600 dark:text-gray-300">
                Y22, PhD - Photonics
              </h2>
            </div>
          </div>
          
          <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-300 to-transparent dark:via-gray-600 my-4 sm:my-6" />
        </div>

        {/* Exploration Section */}
        <div className="w-full">
          <h1 className="text-3xl sm:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-500 bg-clip-text text-transparent mb-2 sm:mb-4">
            Exploration
          </h1>
          <h2 className="text-lg sm:text-2xl text-gray-600 dark:text-gray-300 mb-4">
            Reviews given: 
          </h2>
          
          <Carousel className="w-full max-w-xs sm:max-w-md mx-auto">
            <CarouselContent>
              {[
                {
                  image: "mamamio.jpg",
                  title: "Mama Mio",
                  description: "Good food but poor seating arrangement"
                },
                {
                  image: "oat.jpg",
                  title: "OAT, NewSAC", 
                  description: "Humongous in size, an epitome of freedom. I love the vibe there!"
                },
                {
                  image: "ccd.jpg",
                  title: "CCD",
                  description: "A luxury indeed but not very economic. Cool ambience though."
                }
              ].map((item, index) => (
                <CarouselItem key={index}>
                  <div className="p-1">
                    <Card>
                      <CardContent className="flex flex-col items-center p-3 sm:p-4 gap-3 sm:gap-4">
                        <div className="relative w-full aspect-video overflow-hidden rounded-lg">
                          <img 
                            src={item.image} 
                            alt={item.description}
                            className="object-cover w-full h-full"
                          />
                        </div>
                        
                        <div className="text-center space-y-1 sm:space-y-2">
                          <h3 className="text-lg sm:text-xl font-semibold">{item.title}</h3>
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                            {item.description}
                          </p>
                          <button className="mt-1 sm:mt-2 px-3 py-1 sm:px-4 sm:py-2 bg-blue-500 text-white rounded-md text-xs sm:text-sm hover:bg-blue-600 transition">
                            View Location
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden sm:flex" />
            <CarouselNext className="hidden sm:flex" />
          </Carousel>
        </div>

        {/* Starred Spots Section */}
        <div className="w-full">
          <h1 className="text-3xl sm:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-500 bg-clip-text text-transparent mb-2 sm:mb-4">
            Favourite spots
          </h1>
          
          <Card className="w-full max-w-xs sm:max-w-sm mx-auto">
            <CardHeader>
              <div>
      <Share2 className="w-5 h-5 mr-3" />
</div>
              <CardTitle className="text-xl sm:text-2xl relative">OAT</CardTitle>
              
              <CardDescription className="text-sm sm:text-base">
                You liked this place. Share your experience with others.
              </CardDescription>
              
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="grid gap-2">
                  Your experience : 
                  <div className="flex justify-center items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star}>
                        {star <= 4 ? (
                          <StarFilled className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
                        ) : (
                          <StarEmpty className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300" />
                        )}
                      </span>
                    ))}
                    <span className="ml-2 text-sm text-gray-600">4/5</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="w-full max-w-xs sm:max-w-sm mx-auto">
            <CardHeader>
               <div>
      <Share2 className="w-5 h-5 mr-3" />
</div>
              <CardTitle className="text-xl sm:text-2xl">ESB 2</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                You liked this place. Share your experience with others.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="grid gap-2">
                  Your experience : 
                  <div className="flex justify-center items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star}>
                        {star <= 5 ? (
                          <StarFilled className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
                        ) : (
                          <StarEmpty className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300" />
                        )}
                      </span>
                    ))}
                    <span className="ml-2 text-sm text-gray-600">5/5</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
        </div>
        
       
  <button
    onClick={shareLocation}
    style={{
      marginTop: '1rem',
      padding: '0.75rem 1.5rem',
      fontSize: '1rem',
      backgroundColor: '#0070f3',
      color: '#fff',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      width: '100%',
    }}
  >
    Share My Location
  </button>
  <p style={{ marginTop: '1rem' }}>{status}</p>

  {locationUrl && (
    <div
      style={{
        marginTop: '1rem',
        display: 'flex',
        gap: '0.5rem',
        flexWrap: 'wrap',
        alignItems: 'center',
      }}
    >
      <input
        type="text"
        value={locationUrl}
        readOnly
        onClick={(e) => (e.target as HTMLInputElement).select()}
        style={{
          flexGrow: 1,
          minWidth: 0,
          padding: '0.75rem 1rem',
          fontSize: '1rem',
          borderRadius: '8px',
          border: '1px solid #ccc',
          userSelect: 'all',
          wordBreak: 'break-all',
        }}
      />
      <button
        onClick={() => {
          navigator.clipboard.writeText(locationUrl);
          alert('Copied to clipboard!');
        }}
        style={{
          padding: '0.75rem 1rem',
          fontSize: '1rem',
          backgroundColor: '#0070f3',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        Copy
      </button>
      <button
      onClick={shareViaNative}
      style={{
        padding: '0.75rem 1.5rem',
        fontSize: '1rem',
        backgroundColor: '#28a745', // green for share
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        flexShrink: 0,
      }}
    >
      Share via…
    </button>
    </div>
  )}
        <div className="w-full max-w-xs sm:max-w-sm mx-auto">
      <Button>Sign Out</Button>
    </div>
        
      </main>
      
      
    </div>
    
  );
}
