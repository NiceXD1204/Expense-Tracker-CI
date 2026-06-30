# ---- Stage 1: build the static assets ----
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

ARG VITE_BACKEND_URL=/api
ENV VITE_BACKEND_URL=${VITE_BACKEND_URL}
RUN npm run build

# ---- Stage 2: serve with nginx ----
FROM nginx:alpine AS serve

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template

# nginx's own entrypoint runs envsubst on every file under
# /etc/nginx/templates/*.template into /etc/nginx/conf.d/*.conf at container
# start, substituting only variables that exist in the environment - so
# ${BACKEND_URL} below gets replaced while nginx variables like $host stay literal.
ENV BACKEND_URL=http://backend:8000

EXPOSE 80
