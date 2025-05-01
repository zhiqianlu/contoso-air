# Copilot Instructions for Dockerfile

This project will use a multi-stage Dockerfile setup for a Vite + React application with a backend. Follow these instructions to generate a Dockerfile:

1. Use the latest stable Node.js image as the base image for the builder stage.
2. Set the working directory to `/app`.
3. Copy all `package.json` and `package-lock.json` files from the root, frontend, and backend directories into their respective locations.
4. Install dependencies for each directory using appropriate npm commands.
5. Copy the rest of the application code into the `/app` directory.
6. Build the application using `npm run build`, assuming the build process handles both frontend and backend.
7. Use a smaller Node.js image (such as slim variant) for the runtime stage.
8. Set the working directory to `/app`.
9. Copy the necessary package.json files into their appropriate locations.
10. Install only production dependencies using `npm install --only=production` commands for each directory as needed.
11. Copy the built application from the builder stage into the runtime stage.
12. Create a non-root user (appuser) and set proper permissions for `/app`.
13. Expose the port used by the backend server. Don't assume the default, look for the port to use in the source code.
14. Use `CMD ["npm", "start"]` to start the application.

Ensure the Dockerfile follows best practices for containerization including proper layer caching and security.

When you're done, update the README.md with instructions on how to start the container using Docker, includng the port.