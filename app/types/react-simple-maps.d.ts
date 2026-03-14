declare module "react-simple-maps" {
  import { ComponentType, ReactNode, CSSProperties, SVGProps } from "react";

  interface GeographyStyle {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    outline?: string;
    cursor?: string;
  }

  interface GeographyStyleProp {
    default?: GeographyStyle;
    hover?: GeographyStyle;
    pressed?: GeographyStyle;
  }

  interface GeoFeature {
    rsmKey: string;
    id: string;
    properties: { name: string } & Record<string, string>;
    geometry: object;
  }

  interface GeographiesChildProps {
    geographies: GeoFeature[];
  }

  export interface ComposableMapProps {
    projection?: string;
    projectionConfig?: {
      center?: [number, number];
      scale?: number;
      rotate?: [number, number, number];
    };
    width?: number;
    height?: number;
    style?: CSSProperties;
    children?: ReactNode;
  }

  export interface GeographiesProps {
    geography: string | object;
    children: (props: GeographiesChildProps) => ReactNode;
  }

  export interface GeographyProps extends SVGProps<SVGPathElement> {
    geography: GeoFeature;
    style?: GeographyStyleProp;
    onMouseEnter?: (event: React.MouseEvent) => void;
    onMouseLeave?: (event: React.MouseEvent) => void;
    onClick?: (event: React.MouseEvent) => void;
  }

  export const ComposableMap: ComponentType<ComposableMapProps>;
  export const Geographies: ComponentType<GeographiesProps>;
  export const Geography: ComponentType<GeographyProps>;
  export const ZoomableGroup: ComponentType<{ children?: ReactNode; [key: string]: unknown }>;
  export const Marker: ComponentType<{ coordinates: [number, number]; children?: ReactNode; [key: string]: unknown }>;
  export const Line: ComponentType<{ from: [number, number]; to: [number, number]; [key: string]: unknown }>;
}
