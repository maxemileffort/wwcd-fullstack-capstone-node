
# Using this image as it already has devtools and some other packages installed
FROM rocker/tidyverse:latest as scripter

# Making the pseudo volume here that will be shared between images
RUN mkdir /usr/local/src/data

# Create script directory, copy from local machine, and run the script
# from FFA to scrape stats
WORKDIR /usr/local/src/myscripts
COPY ./scripts /usr/local/src/myscripts
RUN Rscript script-scrape-ALLPOSprojections.R

# using node 8 localls as it is latest version with LTS 
FROM node:8 as backend

# Copying pseudo volume
WORKDIR /
COPY --from=scripter /usr/local/src /usr/local/src

# Creating app directory
WORKDIR /usr/src/app
COPY . ./

# Dealing with port issue on heroku
ARG PORT=8080
ENV PORT $PORT
EXPOSE $PORT 9229 9230

# install and go!
RUN npm install
CMD ["npm", "start"]

