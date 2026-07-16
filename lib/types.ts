export interface Image {
  ImageID: string;
  url: string;
  OwnerID: string;
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
