import type { Metadata } from 'next';
import { LinearRegressionCalculator } from '@/Components/Functions/LinearRegressionTools';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/linear-regression', {
  title: 'Linear Regression Calculator | DevOven',
  description: 'Compute OLS linear regression from X,Y data pairs. Outputs slope, y-intercept, R² (coefficient of determination), Pearson r, step-by-step formula, prediction, and residuals table.',
});

export default function Page() {
  return <LinearRegressionCalculator />;
}
