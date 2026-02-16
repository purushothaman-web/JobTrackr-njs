declare module 'lucide-react' {
  import { FC, SVGProps } from 'react';
  export interface IconProps extends SVGProps<SVGSVGElement> {
    size?: string | number;
    absoluteStrokeWidth?: boolean;
  }
  export type Icon = FC<IconProps>;
  export const Eye: Icon;
  export const EyeOff: Icon;
}
