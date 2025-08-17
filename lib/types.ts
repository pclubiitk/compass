export interface Image {
  id: string;
  url: string;
  ownerId: string;
  ownerType: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface Notice {
  id: string;
  title: string;
  description: string;
  entity: string;       // Department / Club / Cell
  publisher: string;    // Person or org name
  eventTime: string;    // ISO date string
  location: string;
  coverpic?: Image;     // single image
  biopics: Image[];     // multiple images
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}


export const notices: Notice[] = [
  {
    id: "1",
    title: "TechFest 2025 Hackathon",
    description:
      "Join us for a 24-hour hackathon where innovators come together to build groundbreaking solutions.",
    entity: "Tech Club",
    publisher: "Dr. Sharma",
    eventTime: new Date("2025-09-10T09:00:00").toISOString(),
    location: "Main Auditorium",
    coverpic: {
      id: "img-1",
      url: "https://placehold.co/600x300/indigo/white?text=Hackathon+Banner",
      ownerId: "1",
      ownerType: "notices",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    biopics: [
      {
        id: "img-2",
        url: "https://placehold.co/200x200/blue/white?text=Team+Pic",
        ownerId: "1",
        ownerType: "notices",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "img-3",
        url: "https://placehold.co/200x200/green/white?text=Workshop",
        ownerId: "1",
        ownerType: "notices",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    title: "Drama Club Presents: Hamlet",
    description:
      "Experience Shakespeare’s classic tragedy performed by our college drama club.",
    entity: "Drama Club",
    publisher: "Ms. Kapoor",
    eventTime: new Date("2025-09-15T18:00:00").toISOString(),
    location: "Open Air Theatre",
    coverpic: {
      id: "img-4",
      url: "https://placehold.co/600x300/purple/white?text=Hamlet+Play",
      ownerId: "2",
      ownerType: "notices",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    biopics: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
