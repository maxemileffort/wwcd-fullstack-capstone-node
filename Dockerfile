FROM rocker/tidyverse:latest as scripter
RUN mkdir /usr/local/src/data
WORKDIR /usr/local/src/myscripts
COPY ./scripts /usr/local/src/myscripts
RUN Rscript script-scrape-ALLPOSprojections.R

FROM node:8 as backend
WORKDIR /
COPY --from=scripter /usr/local/src /usr/local/src
WORKDIR /usr/src/app
COPY . ./
ARG PORT=8080
ENV PORT $PORT
EXPOSE $PORT 9229 9230
RUN npm install
CMD ["npm", "start"]

