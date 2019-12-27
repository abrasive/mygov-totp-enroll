# usage:
# docker build -t mygov .
# docker run -e DISPLAY --net=host -it mygov npm start
FROM node:13
WORKDIR /tmp/mygov

RUN apt update && \
    apt install -y libxss1 libgtk-3-0 libnss3-dev libasound2

ADD . /tmp/mygov
RUN npm install
