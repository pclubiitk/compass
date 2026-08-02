export interface TableRowModel {
  id: string | number;
  description: DescriptionDetails;
  actions: Actions[];
}

export interface DescriptionDetails {
  user: string;
  date: string;
  body: string;
}

//maximum 3 actions which can be optional
interface Actions {
  icon: string;
  text: string;
  function?: () => void;
}

export interface Notice {
  id: string;
  title: string;
  description: string;
  publisher: string;
  eventTime: string;
  eventEndTime: string;
  location: string;
  entity: string;
}

export interface Img {
  imageId: string;
  ownerId: string;
  parentAssetId: string;
  parentAssetType: string;
  status: string;
}
