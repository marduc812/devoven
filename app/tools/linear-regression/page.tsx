import type { Metadata } from 'next';
import { LinearRegressionCalculator } from '@/Components/Functions/LinearRegressionTools';

export const metadata: Metadata = {
  title: 'Linear Regression Calculator | DevOven',
  description: 'Compute OLS linear regression from X,Y data pairs. Outputs slope, y-intercept, R² (coefficient of determination), Pearson r, step-by-step formula, prediction, and residuals table.',
};

export default function Page() {
  return <LinearRegressionCalculator />;
}
