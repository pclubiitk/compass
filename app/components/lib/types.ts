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

//According to me (Rohit Kumar , Y25) , these interfaces are not in use .
// export interface Notice {
//   id: string;
//   title: string;
//   description: string;
//   publisher: string;
//   eventTime: string;
//   eventEndTime: string;
//   location: string;
//   entity: string;
// }

// export interface Img {
//     CreatedAt: Date;
//     UpdatedAt: Date;
//     DeletedAt: Date;
//     ImageID: string;
//     OwnerID: string;
//     ParentAssetID: string;
//     ParentAssetType: string;
//     Status: string;
//     Submitted: boolean;
// }