FROM node:20
WORKDIR /app
COPY package*.json ./
RUN npm install
# Copy application code but exclude node_modules
COPY . .
# Set NODE_ENV environment variable
ENV NODE_ENV=development
EXPOSE 5000
CMD ["npm","run","dev"]
