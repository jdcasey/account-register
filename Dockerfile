FROM centos
MAINTAINER John Casey <jdcasey@commonjava.org>

RUN yum update -y
RUN yum install -y tar bind-utils lsof

EXPOSE 80

ENV MONGO_URL 'mongodb://admin:password@mongodb:27017/databasename'
ENV ROOT_URL 'http://example.com'
ENV MAIL_URL 'smtp://user:password@mailhost:25'
ENV PORT 80

VOLUME /tmp/dist

ADD https://install.meteor.com/ /usr/local/bin/install-meteor.sh
RUN /bin/sh /usr/local/bin/install-meteor.sh

ADD https://nodejs.org/download/release/v0.10.40/node-v0.10.40-linux-x64.tar.gz /tmp/node.tar.gz

RUN tar -zxvf /tmp/node.tar.gz -C /opt
RUN mv /opt/node* /opt/node

ADD docker/node.sh /etc/profile.d/node.sh
RUN chmod +x /etc/profile.d/node.sh

ADD docker/start.py /usr/local/bin/start.py
RUN chmod +x /usr/local/bin/*

#CMD /bin/bash
ENTRYPOINT /usr/local/bin/start.py
