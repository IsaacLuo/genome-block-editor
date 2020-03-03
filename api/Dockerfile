FROM isaacluo/ubuntu
WORKDIR /app
ADD ./package.json .
ADD ./yarn.lock .
RUN yarn install
ADD . .
WORKDIR /app/utility
RUN pipenv install
WORKDIR /app
RUN yarn run build
ENTRYPOINT []
ENV NODE_ENV=production
CMD ["node", "build/src/index.js"]


