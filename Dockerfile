# Dockerfile
# Multi-stage build: installs deps and builds the React app in a Node/Alpine builder stage,
# then copies the static build output into a slim image that serves it with `serve` on port 80.
FROM mhart/alpine-node:11 AS builder
WORKDIR /app
COPY . .
RUN npm install react-scripts -g --silent
RUN yarn install
RUN yarn run build

FROM mhart/alpine-node
RUN yarn global add serve
WORKDIR /app
COPY --from=builder /app/build .
EXPOSE 80
CMD ["serve", "-p", "80", "-s", "."]