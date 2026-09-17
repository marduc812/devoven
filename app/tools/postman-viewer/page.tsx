import PostmanMainView from "@/Components/Functions/PostmanViewer/PostmanMainView"
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/postman-viewer', {
  title: 'Postman Collection Viewer — Preview API Calls Online',
  description: 'Preview every request in a Postman collection grouped by folder and host, resolve environment variables, and copy any call as cURL. Runs in your browser, nothing is uploaded.'
});

const page = () => {
    return (
       <PostmanMainView />
    )
}

export default page
