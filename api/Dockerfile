# ACHTUNG: The build context should be the project root!
FROM node:14

WORKDIR /app
# Copy source && install dependencies && build
COPY . .
RUN cd /app/common && \
    yarn install
RUN cd /app/api && \
    yarn install && \
    yarn build && \
    yarn install --production --ignore-scripts --prefer-offline
RUN cd /app/common && \
    yarn install --production --ignore-scripts --prefer-offline

# Build args
ARG GIT_BRANCH_NAME=unknown
ARG GIT_COMMIT_SHA=unknown

# Runtime envs
ENV GIT_BRANCH_NAME=${GIT_BRANCH_NAME}
ENV GIT_COMMIT_SHA=${GIT_COMMIT_SHA}
ENV NODE_ENV=production
ENV PORT=3000
ENV TEMP_DIR=/tmp
ENV AWS_ACCESS_KEY_ID=
ENV AWS_SECRET_ACCESS_KEY=
ENV AWS_REGION=eu-central-1
ENV AWS_S3_ENDPOINT=https://s3-ap-southeast-2.amazonaws.com
# ENV PG_USER=
# ENV PG_PASSWORD=
# ENV PG_HOST=
# ENV PG_PORT=5432
# ENV PG_DATABASE=

EXPOSE 3000

CMD ["node", "api/src/index.js"]
