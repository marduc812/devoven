import { GeometryCalculator } from '@/Components/Functions/GeometryCalcTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Geometry Calculator | DevOven',
  description: 'Calculate area, perimeter, volume, and surface area for common 2D and 3D shapes including circle, rectangle, triangle, sphere, cylinder, cone, and more.',
};

const page = () => <GeometryCalculator />;
export default page;
