export interface Image {
  imageId: string;
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
  body: string;
  // publisher: string;    // Person or org name
  entity: string;          //to represent department / Club / Cell
  eventTime: string;       // ISO date string
  eventEndTime: string;    // ISO date string
  location: string;
  coverPic?: Image;        // single image
  bioPics: Image[];        // multiple images
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  ContributedBy?: string;
}

// Types
export interface LocationData {
  id: string;
  locationId?: string;
  name: string;
  description: string;
  avg_rating: number;
  ReviewCount: number;
  Tag: string;
  Time: string;
  Contact: string; // Name of contact person?
  contact: string; // Phone/Email?
  coverpic: string;
  biopics: string[];
  location_type?: string;
}

export interface ReviewData {
  id: string;
  rating: number;
  description: string;
  CreatedAt: string;
  Images?: {
    imageId: string;
  }[];
  User: {
    name: string;
    profile_pic?: string;
  };
}
