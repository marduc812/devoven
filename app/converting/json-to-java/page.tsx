import { JsonToJava } from '@/Components/Functions/CodeGenTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'JSON to Java Class — DevOven',
  description: 'Convert a JSON object to a Java POJO class with private fields, getters, and setters. Types are automatically inferred (String, Integer, Double, Boolean, List).',
};

const page = () => (
  <>
    <JsonToJava />
  </>
);

export default page;
