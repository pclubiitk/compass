import {
  TrashIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const iconMap: Record<string, React.ElementType> = {
  TrashIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
};

export default function DynamicIcon({ iconName }: { iconName: string }) {
  const IconComponent = iconMap[iconName];

  if (!IconComponent) {
    return null; // or a fallback icon
  }

  return <IconComponent className="h-5 w-5 text-gray-600" />;
}
