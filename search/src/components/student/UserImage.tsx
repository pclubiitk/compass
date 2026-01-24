// TODO: Facing issue in the build - reason - sharp install issue, but works fine when docker build is performed.

const ASSET_URL = process.env.NEXT_PUBLIC_ASSET_URL || "";

interface ImageProps {
  style: Object;
  email: string;
  gender: string;
  alt: string;
  profilePic?: string;
}

export default function Image(props: ImageProps) {
  const userName = props.email?.split("@")[0] || "";
  const urls: string[] = [];

  // Priority 1: Profile picture from our server
  if (props.profilePic) {
    urls.push(`url("${ASSET_URL}/${props.profilePic}")`);
  }

  // Priority 2: User's home page dp
  // if (userName) {
  //   urls.push(
  //     `url("https://home.iitk.ac.in/~${encodeURIComponent(userName)}/dp")`
  //   );
  // }
  // Priority 3: Generic fallback
  urls.push(`url("${props.gender === "F" ? "/GenericFemale.png" : "/GenericMale.png"}")`);
  return (
    <div
      style={{
        width: "150px",
        height: "150px",
        position: "relative",
        borderRadius: "5%",
        flexShrink: "0",
        backgroundImage: urls.join(","),
        backgroundPosition: "center top",
        backgroundSize: "cover",
        ...props.style,
      }}
    />
  );
}
