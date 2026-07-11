// Re-export the upload handler under the admin path so that requests from the
// admin subdomain (admin.markdevelopers.in) stay same-origin and the session
// cookie is correctly sent. Previously the fetch targeted /api/upload which
// lives on the main domain, causing the session cookie to never be sent.
export { POST } from "@/app/api/upload/route";
