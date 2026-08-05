import React from 'react';
import {
  Wrench,
  Disc,
  Activity,
  Cpu,
  Wind,
  CircleDot,
  Truck,
  Zap,
  ShieldAlert,
  Sliders,
  Filter,
  type LucideIcon
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  Wrench,
  Disc,
  Activity,
  Cpu,
  Wind,
  CircleDot,
  Truck,
  Zap,
  ShieldAlert,
  Sliders,
  Filter
};

interface ServiceIconProps {
  name: string;
  className?: string;
}

/** Maps a service `iconName` from the data layer to its Lucide icon. */
export const ServiceIcon: React.FC<ServiceIconProps> = ({ name, className = 'w-5 h-5' }) => {
  const Icon = ICON_MAP[name] || Wrench;
  return <Icon className={className} />;
};
