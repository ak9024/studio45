FROM node:22.12-alpine AS build

ARG VITE_APP_TITLE="Studio45"
ARG VITE_API_HOST="http://localhost"

ENV VITE_APP_TITLE=${VITE_APP_TITLE}
ENV VITE_API_HOST=${VITE_API_HOST}

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

FROM nginx:1.25-alpine

COPY nginx/default.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

