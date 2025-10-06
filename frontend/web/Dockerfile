FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* .
RUN npm install || true
COPY . .
RUN chmod +x ./docker-entrypoint.sh
EXPOSE 3000
ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["npm", "run", "dev", "--", "--host"]


