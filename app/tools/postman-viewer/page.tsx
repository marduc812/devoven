import PostmanMainView from "@/Components/Functions/PostmanViewer/PostmanMainView"

export const metadata = {
  title: 'Postman Collection Viewer — Preview API Calls Online',
  description: 'Preview every request in a Postman collection grouped by folder and host, resolve environment variables, and copy any call as cURL. Runs in your browser, nothing is uploaded.'
}

const page = () => {
    return (
       <PostmanMainView />
    )
}

export default page
