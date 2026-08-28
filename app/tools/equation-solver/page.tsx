import type { Metadata } from 'next';
import { EquationSolver } from '@/Components/Functions/EquationSolverTools';

export const metadata: Metadata = {
  title: 'Equation Solver — Linear, Quadratic & Systems | DevOven',
  description: 'Solve linear equations, quadratic equations, and 2×2 systems of equations step-by-step in your browser. No eval() used.',
};

export default function Page() {
  return <EquationSolver />;
}
