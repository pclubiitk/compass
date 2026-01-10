import Male from "@/components/assets/GenericMale.png";
import Female from "@/components/assets/GenericFemale.png";

interface ImageProps {
  style: Object;
  email: string;
  rollNo: string;
  gender: string;
  alt: string;
}

export default function Image(props: ImageProps) {
  const userName = props.email?.split("@")[0] || "";
  const urls: string[] = [];
  if (userName) {
    urls.push(
      `url("https://home.iitk.ac.in/~${encodeURIComponent(userName)}/dp")`
    );
  }
  urls.push(
    `url("https://oa.cc.iitk.ac.in/Oa/Jsp/Photo/${props.rollNo}_0.jpg")`
  );
  urls.push(`url("${props.gender === "F" ? Female.src : Male.src}")`);
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
