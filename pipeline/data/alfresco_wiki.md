# Building Alfresco

The instructions provided below specify the steps to build [Alfresco](https://www.alfresco.com/) version 26.2.0 container images on Linux on IBM Z for following distributions:

* RHEL (8.10, 9.6, 9.7)
* SLES 15 SP7
* Ubuntu 24.04

Additionally, binaries are available to install from [here](https://docs.hyland.com/r/Alfresco/Alfresco-Content-Services-Community-Edition/26.2/Alfresco-Content-Services-Community-Edition/Documentation-Notice) if not using a containerized environment. Instructions for installing the binaries can be found [here](https://docs.hyland.com/r/Alfresco/Alfresco-Content-Services-Community-Edition/26.2/Alfresco-Content-Services-Community-Edition/Install/Install-with-zip).

_**General Notes:**_

* _When following the steps below please use a standard permission user unless otherwise specified._
* _A directory `/<source_root>/` will be referred to in these instructions, this is a temporary writable directory anywhere you'd like to place it._

### Prerequisites:

* For RHEL and Ubuntu distributions, docker can be installed by following the instructions [here](https://docs.docker.com/engine/install/#server).
* For SLES distribution, Docker can be installed directly using the system package manager.


### 1. Build using script

If you want to build Alfresco using manual steps, go to STEP 2.

Use the following commands to build Alfresco using the build [script](https://github.com/linux-on-ibm-z/scripts/tree/master/Alfresco). Please make sure you have wget installed.

```bash
wget -q https://raw.githubusercontent.com/linux-on-ibm-z/scripts/master/Alfresco/26.2.0/build_alfresco.sh

# Build Alfresco
bash build_alfresco.sh  [Provide -t option for executing build with tests]
```

### 2. Install dependencies

  ```bash
  export SOURCE_ROOT=/<source_root>/
  export jver=21  
  export PATCH_URL="https://raw.githubusercontent.com/linux-on-ibm-z/scripts/master/Alfresco/26.2.0/patch"
  ```

  * RHEL 8.10
    ```bash
    sudo yum install -y git gcc gcc-c++ python3 make wget ant iptables-services procps-ng xz curl patch jq
    ```

  * RHEL (9.6, 9.7)
    ```bash
    sudo yum install -y git gcc gcc-c++ python3 make wget ant iptables-services procps-ng xz curl patch jq
    ```

  * SLES 15 SP7
    ```bash
    sudo zypper install -y git gcc gcc-c++ python3 make wget ant iptables procps xz curl patch jq
    ```
    
  * Ubuntu 24.04
    ```bash
    sudo apt-get update
    sudo apt-get install -y git gcc g++ python3 make wget ant iptables procps xz-utils curl patch jq
    ```

#### 2.1. Download and Install Java
* Install OpenJDK Runtime 21.

  ```bash
  # For RHEL only
  sudo yum install -y java-21-openjdk-devel
  export JAVA_HOME=/usr/lib/jvm/java-21
  export PATH=$JAVA_HOME/bin:$PATH
  ```

  ```bash
  # For SLES only
  sudo zypper install -y java-21-openjdk  java-21-openjdk-devel
  export JAVA_HOME=/usr/lib64/jvm/java-21-openjdk
  export PATH=$JAVA_HOME/bin:$PATH
  ```
    
  ```bash
  # For Ubuntu only
  sudo apt-get install -y openjdk-21-jdk
  export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-s390x
  export PATH=$JAVA_HOME/bin:$PATH
  ```

#### 2.2. Install Maven

```bash
cd $SOURCE_ROOT
wget https://archive.apache.org/dist/maven/maven-3/3.9.11/binaries/apache-maven-3.9.11-bin.tar.gz
tar -xzf apache-maven-3.9.11-bin.tar.gz
export PATH=$SOURCE_ROOT/apache-maven-3.9.11/bin:$PATH
```

### 3. Build component docker images
 

#### 3.1. Build alfresco-base-java image

```bash
cd $SOURCE_ROOT
git clone --depth 1 -b master https://github.com/Alfresco/alfresco-docker-base-java.git
cd alfresco-docker-base-java
git fetch --depth 1 origin "caff57d9e20fa8fa2bac5513d1326e10e5387214"
git checkout "caff57d9e20fa8fa2bac5513d1326e10e5387214"
curl -sSL "${PATCH_URL}/base-java.patch" | git apply -

# Execute the Build Command
docker build -t "alfresco/alfresco-base-java:jre${jver}-rockylinux9" . \
  --build-arg DISTRIB_NAME=rockylinux --build-arg DISTRIB_MAJOR=9 \
  --build-arg JAVA_MAJOR="${jver}" \
  --build-arg CREATED="$(date --iso-8601=seconds)" \
  --build-arg REVISION="$(git rev-parse --verify HEAD)" --no-cache
```

#### 3.2. Build alfresco-base-tomcat image

```bash
cd "$SOURCE_ROOT"
git clone --depth 1 -b master https://github.com/Alfresco/alfresco-docker-base-tomcat.git
cd alfresco-docker-base-tomcat
git fetch --depth 1 origin "dc7a9e394cae91c6237cb38ca28a7da8a896bce5"
git checkout "dc7a9e394cae91c6237cb38ca28a7da8a896bce5"
curl -sSL "${PATCH_URL}/base-tomcat.patch" | git apply -

# Only if Building for Rhel Distributions
sed -i '111s|^RUN |RUN rm -rf /var/cache/dnf/* \&\& |' Dockerfile
sed -i '/^RUN if \[ "\$DISTRIB_MAJOR" -eq 8 \]; then \\/i RUN rm -rf /var/cache/dnf/* && dnf clean all' Dockerfile
sed -i 's|dnf clean all \&\& \\|rm -rf /var/cache/dnf/* \&\& dnf clean all \&\& \\|' Dockerfile
sed -i 's|dnf clean all; \\|rm -rf /var/cache/dnf/* \&\& dnf clean all; \\|' Dockerfile

# Execute the Build Command
DOCKER_BUILDKIT=0 docker build -t alfresco/alfresco-base-tomcat:tomcat11-jre${jver}-rockylinux9 . \
  --build-arg DISTRIB_NAME=rockylinux \
  --build-arg DISTRIB_MAJOR=9 \
  --build-arg JAVA_MAJOR="${jver}" \
  --build-arg TOMCAT_MAJOR=11 \
  --build-arg TOMCAT_VERSION="$(jq -r .tomcat_version tomcat11.json)" \
  --build-arg TCNATIVE_VERSION="$(jq -r .tcnative_version tomcat11.json)" \
  --build-arg APR_VERSION="$(jq -r .apr_version tomcat11.json)" \
  --build-arg TOMCAT_SHA512="$(jq -r .tomcat_sha512 tomcat11.json)" \
  --build-arg TCNATIVE_SHA512="$(jq -r .tcnative_sha512 tomcat11.json)" \
  --build-arg APR_SHA256="$(jq -r .apr_sha256 tomcat11.json)" \
  --no-cache 
```

#### 3.3. Build alfresco-community-repo

```bash
export PACKAGE_VERSION="26.2.0"
export COMMUNITY_REPO_VERSION="26.2.3.1"
cd $SOURCE_ROOT
git clone --depth 1 -b "${COMMUNITY_REPO_VERSION}" https://github.com/Alfresco/alfresco-community-repo.git
cd alfresco-community-repo

sed -i "s/FROM.*/FROM alfresco\/alfresco-base-tomcat:tomcat11-jre${jver}-rockylinux9/g" packaging/docker-alfresco/Dockerfile
mvn clean install -DskipTests=true -Dversion.edition=Community -Pbuild-docker-images -Dimage.tag="${COMMUNITY_REPO_VERSION}"
```

#### 3.4. Build Alfresco share

```bash
export COMMUNITY_SHARE_VERSION="26.2.3.1"
cd $SOURCE_ROOT
git clone --depth 1 -b "${COMMUNITY_SHARE_VERSION}" https://github.com/Alfresco/alfresco-community-share.git
cd alfresco-community-share
sed -i "s/FROM.*/FROM alfresco\/alfresco-base-tomcat:tomcat11-jre${jver}-rockylinux9/g" packaging/docker/Dockerfile
mvn clean install -DskipTests=true -Dmaven.javadoc.skip=true -Pbuild-docker-images -Dimage.tag="${COMMUNITY_SHARE_VERSION}" -Drepo.image.tag="${COMMUNITY_REPO_VERSION}"
docker tag "alfresco/alfresco-share-base:${COMMUNITY_SHARE_VERSION}" "alfresco/alfresco-share:${PACKAGE_VERSION}"
```

#### 3.5. Build acs-community-packaging

```bash
cd "$SOURCE_ROOT"
git clone --depth 1 -b "${PACKAGE_VERSION}" https://github.com/Alfresco/acs-community-packaging.git
cd acs-community-packaging
mvn clean install -Pbuild-docker-images -Dimage.tag="${PACKAGE_VERSION}" -Drepo.image.tag="${COMMUNITY_REPO_VERSION}" -Dshare.image.tag="${COMMUNITY_SHARE_VERSION}"
```

#### 3.6. Build Alfresco Elasticsearch batch-indexing
_*Note:*_ _Starting with ACS 26.2, Alfresco uses Batch Indexing instead of the deprecated Solr search service as mentioned [here](https://github.com/Alfresco/acs-deployment/blob/v10.7.0/docker-compose/community-compose.yaml#L5C14-L6C74). 
The s390x image is built using the architecture-independent Batch Indexing JAR and runs on any compatible JVM. Source code for batch-indexing is not published for this release as mentioned in Releases under Licensing section [here](https://connect.hyland.com/t5/alfresco-blog/alfresco-community-edition-26-2-release-notes/ba-p/499848) ._

```bash
cd "$SOURCE_ROOT"
mkdir alfresco-elasticsearch-batch-indexing && cd alfresco-elasticsearch-batch-indexing
export ES_BATCH_INDEXING_VERSION="5.7.0"
curl -sSL "https://nexus.alfresco.com/nexus/repository/releases/org/alfresco/alfresco-elasticsearch-batch-indexing/${ES_BATCH_INDEXING_VERSION}/alfresco-elasticsearch-batch-indexing-${ES_BATCH_INDEXING_VERSION}-app.jar" -o app.jar
curl -sSL "${PATCH_URL}/Batchindexing-Dockerfile" -o Dockerfile
docker build -t alfresco/alfresco-elasticsearch-batch-indexing:${ES_BATCH_INDEXING_VERSION} . --build-arg JAVA_MAJOR="${jver}" --no-cache
```

#### 3.7. Build Alfresco Activemq

```bash
export ACTIVEMQ_VERSION="5.18.7"
export ACTIVEMQ_COMMIT="ba740d465bbe8c3f984c8f937f4d3f0b22970fca"
cd "$SOURCE_ROOT"
git clone --depth 1 -b master https://github.com/Alfresco/alfresco-docker-activemq.git
cd alfresco-docker-activemq/
git fetch --depth 1 origin "${ACTIVEMQ_COMMIT}"
git checkout "${ACTIVEMQ_COMMIT}"
DOCKER_BUILDKIT=0 docker build -t "alfresco/alfresco-activemq:${ACTIVEMQ_VERSION}-jre${jver}-rockylinux9" . --build-arg ACTIVEMQ_VERSION=${ACTIVEMQ_VERSION} --build-arg DISTRIB_NAME=rockylinux --build-arg DISTRIB_MAJOR=9 --build-arg JAVA_MAJOR="${jver}" --build-arg JDIST=jre --no-cache
```

#### 3.8. Build Alfresco transform core

```bash
export TRANSFORM_CORE_VERSION="5.4.3"
cd "$SOURCE_ROOT"
git clone --depth 1 -b "${TRANSFORM_CORE_VERSION}" https://github.com/Alfresco/alfresco-transform-core.git
cd alfresco-transform-core

# Point transform Dockerfiles at the locally built s390x base images
grep -RiIl 'jre17-rockylinux9@sha256' | xargs sed -i "s/jre17-rockylinux9@sha256.*/jre${jver}-rockylinux9/g"
grep -RiIl 'jre21-rockylinux9@sha256' | xargs sed -i "s/jre21-rockylinux9@sha256.*/jre${jver}-rockylinux9/g"
grep -RiIl '5.18.3-jre17-rockylinux8' | xargs sed -i "s/5.18.3-jre17-rockylinux8/${ACTIVEMQ_VERSION}-jre${jver}-rockylinux9/g"

mvn clean install -pl '!engines/aio,!engines/pdfrenderer,!engines/imagemagick,!engines/libreoffice' -Plocal,docker-it-setup -DskipTests=true
```

#### 3.9. Build Alfresco content app

```bash
export CONTENT_APP_VERSION="8.0.0"
cd "$SOURCE_ROOT"
git clone --depth 1 -b "${CONTENT_APP_VERSION}" https://github.com/Alfresco/alfresco-content-app.git
cd alfresco-content-app/
sed -i "/RUN mkdir -p/ i RUN yarn config set network-timeout 600000 && yarn config set registry https:\/\/registry.npmjs.org\/" Dockerfile

# Fetch the standalone angular.json (since Nx, which is used by ACA, does not have support for s390x; we build using standalone angular CLI)
curl -sSL "${PATCH_URL}/content-app-angular.json" -o angular.json

docker run --rm \
    -e CI=true \
    -e TERM=dumb \
    -e FORCE_COLOR=0 \
    -e NG_CLI_ANALYTICS=false \
    --mount type=bind,source="${SOURCE_ROOT}",target=/src \
    s390x/node:24 \
    sh -c '
        cd /src/alfresco-content-app &&
        npm install --ignore-scripts &&
        npm install --save-dev @angular/cli@20 --ignore-scripts &&
        node ./node_modules/@angular/cli/bin/ng.js build content-ce --configuration=production'

sudo chown -R "$(id -u):$(id -g)" .
docker build -t "alfresco/alfresco-content-app:${CONTENT_APP_VERSION}" . --build-arg PROJECT_NAME=content-ce
```

#### 3.10. Pull Traefik and Postgres Images

```bash
docker pull postgres:17.9
docker pull traefik:3.6
```

### 4. Execute Test Suite (Optional)

Run a subset of tests that do not require a full Alfresco development environment to be setup.

```bash
cd "$SOURCE_ROOT/alfresco-community-repo"
mvn -B test -pl core,data-model -am -DfailIfNoTests=false
mvn -B test -pl "repository,mmt" -am "-Dtest=AllUnitTestsSuite,AllMmtUnitTestSuite" -DfailIfNoTests=false
cd "$SOURCE_ROOT/alfresco-transform-core"
mvn -U clean test -pl '!engines/aio,!engines/pdfrenderer,!engines/imagemagick,!engines/libreoffice' -DadditionalOption=-Xdoclint:none -Dmaven.javadoc.skip=true -Dparent.core.deploy.skip=true -Dtransformer.base.deploy.skip=true -Plocal,docker-it-setup
```

### 5 Start Alfresco service

#### 5.1. Get Alfresco docker compose file

```bash
cd "$SOURCE_ROOT"
git clone --depth 1 -b v10.7.0 https://github.com/Alfresco/acs-deployment.git
cd acs-deployment/docker-compose
curl -sSL "${PATCH_URL}/acs-deploy-compose.patch" | git apply -
cd "$SOURCE_ROOT"
mkdir -p docker-compose-source && cd docker-compose-source
cp "$SOURCE_ROOT"/acs-deployment/docker-compose/community-compose.yaml docker-compose.yml

#Copy the Base Configuration Template
mkdir -p commons && cd commons
cp "$SOURCE_ROOT"/acs-deployment/docker-compose/commons/base.yaml base.yaml
```

_**Notes:**_ 

_1. Some third party Alfresco transformers are not available on s390x. Hence we have enabled the available transformers._

_2. We have skipped "alfresco-control-center" module as the source code for same is not published for 26.x as mentioned in Release Notes [here](https://connect.hyland.com/t5/alfresco-blog/alfresco-community-edition-26-2-release-notes/ba-p/499848) and docker image is available only for intel._

#### 5.2. Build Elasticsearch and Kibana Docker image
Build instructions for building Elasticsearch docker image can be found [here](https://github.com/linux-on-ibm-z/docs/wiki/Building-Elasticsearch/2a8c0030468daedf6bed272fd70554023f53b023).

Dockerfile to build Kibana docker image can be found [here](https://github.com/linux-on-ibm-z/dockerfile-examples/blob/f43e9db47406067d58d40a0d1491abd294906e7b/Kibana/Dockerfile).

_**Note:** Alfresco was verified with v9.3.0 of Elasticsearch as well as Kibana at the time of creation of these instructions._

#### 5.3. Start Alfresco

The Docker Compose plugin is required to start the alfresco docker-compose.yml script. Please ensure the docker-compose-plugin package is installed based on your distro.

```bash
cd $SOURCE_ROOT/docker-compose-source
docker compose up
```
Once cluster is up, UI will be accessible for following:

* Share UI:                        `http://localhost:8080/share`  (default login `admin`/`admin`)
* Administration and REST APIs:    `http://localhost:8080/alfresco`
* ActiveMQ Admin Web Console       `http://localhost:8161/admin`  (default login `admin`/`admin`)
* Elasticsearch server             `http://localhost:9200`
* Kibana                           `http://localhost:5601` (default login `admin`/`admin`)

### Reference:

- https://www.alfresco.com/
