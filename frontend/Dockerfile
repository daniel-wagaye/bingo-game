FROM node:20
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5173
ENV VITE_SOCKET_URL=http://localhost:5000
ENV VITE_API_URL=http://localhost:5000/api
CMD ["npm","run","dev", "--", "--host", "0.0.0.0"]
