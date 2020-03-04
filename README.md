## genome-block-editor

This is a developing project for building a chromsome on webpages by dragging and dropping features blocks.

## sub projects

the frontend folder is a react redux saga axios antd project website.
the api folder is a nodejs koa2 apollo-server socket.io mongoose project wich provides REST/GraphQL/websocket services.

## other dependencies

this service uses cailab-auth as the SSO authtication, unless the "lcoal mode" is set
this service uses cailab-conf project(private) to generate conf.json and .env files, however handwriting conf.json is also OK according conf.default.json
it links to webexe project for executing long time process written by other languages.

## Run projects by Docker

### `docker-compose up --build -d`

when all container starts successfully, goto the address you set in conf.json (http://localhost:10301 by default) to access the website

## Run projects indivisually in production

### frontend
```
cd frontend
yarn install
yarn run build
```
html and javascript files are built and generated in build folder, then use nginx or other software to deploy it.

### api
```
cd api
yarn install
yarn run production
```

the node.js server will listen on the port (default 10302), is OK to use nginx as reverse proxy if SSL is required.

## debug projects

### frontend
```
cd frontend
yarn install
yarn start
```

### api
```
cd api
yarn install
yarn run dev
```
