# Use the official Node.js image as the base
FROM node:20

# Copy the package.json and package-lock.json files from your app folder to the container
COPY ./package*.json ./

RUN npm install -g npm@11.0.0

# Install dependencies inside the container with --legacy-peer-deps
RUN npm install --legacy-peer-deps

# Copy the rest of your application code into the container
COPY ./ ./

# Build the application
RUN npm run build

# Expose the port that your app will run on
EXPOSE 3000

# Start the application
CMD [ "npm", "start" ]
