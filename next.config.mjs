/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  basePath: process.env.NODE_ENV === 'production' ? "/ebook-business/Prompt-Paragraph" : "",
};

export default nextConfig;
