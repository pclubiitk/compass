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
  entity: string;       //to represent department / Club / Cell
  // publisher: string;    // Person or org name
  eventTime: string;    // ISO date string
  location: string;
  coverpic?: Image;     // single image
  biopics: Image[];     // multiple images
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  ContributedBy?: string;
}
