"use client";

import { UnderWorkPage } from "./UnderWorkPage";

type FeatureType = "maps" | "noticeboard" | "location";

type FeatureStatus = {
  [key in FeatureType]: boolean;
};

const getFeatureStatus = (): FeatureStatus => {
  return {
    maps: process.env.NEXT_PUBLIC_MAPS_ENABLED !== "false",
    noticeboard: process.env.NEXT_PUBLIC_NOTICEBOARD_ENABLED !== "false",
    location: process.env.NEXT_PUBLIC_LOCATION_ENABLED !== "false",
  };
};

export function FeatureGuard({
  feature,
  children,
}: {
  feature: FeatureType;
  children: React.ReactNode;
}) {
  const featureStatus = getFeatureStatus();
  const isEnabled = featureStatus[feature];

  if (!isEnabled) {
    return <UnderWorkPage featureName={feature} />;
  }

  return <>{children}</>;
}
