<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

This is a Vite + React project. Please ensure that suggestions align with the React framework and Vite's build tool capabilities.

Dockerfile generation:
* Make sure you're using the latest stable image for the target language base image
* Generate .dockerignore to exclude unnecessary files from the build context
* Use multi-stage builds to reduce image size
* Avoid running the application as root; create a non-root user
* Leverage caching by ordering instructions effectively (e.g., copy package.json and install dependencies before copying the rest of the code)
* Specify exact versions of dependencies to ensure reproducibility
* Minimize the number of layers by combining RUN instructions where possible
* Confirm that you can build the image successfully by outputting the docker build command
* Confirm that you can run the image successfully by outputting the docker run command
* Create runnable commands as much as you can so that I can test them by clicking a button
* If this is a web app, output the URL the user can use to test