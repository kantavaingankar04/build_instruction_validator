import { IBMZPackage } from '../types/validator';

export const SAMPLE_PACKAGES: IBMZPackage[] = [
  {
    id: 'alfresco',
    name: 'Alfresco',
    version: '25.3.0',
    distro: 'RHEL 9.x / Ubuntu 22.04 on s390x',
    wikiUrl: 'https://github.com/linux-on-ibm-z/docs/wiki/Building-Alfresco',
    scriptUrl: 'https://github.com/linux-on-ibm-z/scripts/blob/master/Alfresco/25.3.0/build_alfresco.sh',
    summary: 'Alfresco Content Services enterprise repository and share framework compiled for Linux on IBM Z (s390x).',
    rawWiki: `# Building Alfresco 25.3.0 on Linux on IBM Z (s390x)

The following instructions describe how to build Alfresco Community Edition version 25.3.0 on Linux on IBM Z (s390x) using Ubuntu 22.04 or RHEL 9.

## Prerequisites
- Architecture: IBM Z (s390x)
- Memory: Minimum 16 GB RAM
- Disk space: Minimum 30 GB free disk space
- Operating System: Ubuntu 22.04 LTS or RHEL 9.2

## Section 1: System Dependencies and Packages
Install prerequisite native libraries and tools:
\`\`\`bash
sudo apt-get update
sudo apt-get install -y git wget tar curl openjdk-17-jdk maven patch make gcc g++ libvips-dev libjpeg-dev libpng-dev libtiff-dev zlib1g-dev
\`\`\`

## Section 2: Environment Setup
Set up the Java 17 and Maven paths for s390x:
\`\`\`bash
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-s390x
export PATH=$JAVA_HOME/bin:$PATH
export MAVEN_OPTS="-Xms1024m -Xmx4096m -XX:+UseG1GC"
\`\`\`

Ensure Node.js LTS v20.12.0 is installed for front-end assets:
\`\`\`bash
curl -fsSL https://nodejs.org/dist/v20.12.0/node-v20.12.0-linux-s390x.tar.gz | sudo tar -xz -C /usr/local --strip-components=1
\`\`\`

## Section 3: Cloning Repository
Clone the official Alfresco repository tag 25.3.0:
\`\`\`bash
git clone https://github.com/Alfresco/alfresco-community-repo.git
cd alfresco-community-repo
git checkout 25.3.0
\`\`\`

## Section 4: Applying s390x Architecture Patch
Apply patch for big-endian memory alignment and native ImageMagick bindings on s390x:
\`\`\`bash
curl -sSL https://raw.githubusercontent.com/linux-on-ibm-z/scripts/master/Alfresco/25.3.0/patch/s390x-endian.patch | git apply -
\`\`\`

## Section 5: Building and Compiling
Build the core repository using Maven with tests skipped during initial compilation:
\`\`\`bash
mvn clean install -DskipTests=true -Pcommunity
\`\`\`

## Section 6: Verification and Smoke Tests
Run unit tests for core s390x transformation engines:
\`\`\`bash
mvn test -Dtest=MimetypeServiceTest,ContentServiceTest
\`\`\`
`,
    rawScript: `#!/bin/bash
# © Copyright IBM Corporation 2026.
# LICENSE: Apache License, Version 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
#
# Instructions:
# Run this script to build Alfresco 25.3.0 on Linux on IBM Z (s390x).

set -e
set -o pipefail

PACKAGE_NAME="Alfresco"
PACKAGE_VERSION="25.3.0"
WORK_DIR="$(pwd)/build_alfresco"

echo "=== Starting build of $PACKAGE_NAME $PACKAGE_VERSION for s390x ==="

# Step 1: Install system dependencies
# Note: Missing libvips-dev and libtiff-dev required for imaging support
sudo apt-get update
sudo apt-get install -y git wget tar curl openjdk-17-jdk maven patch make gcc g++ libjpeg-dev libpng-dev zlib1g-dev

# Step 2: Set Environment Variables
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-s390x
export PATH=$JAVA_HOME/bin:$PATH
# Parameter discrepancy: MAVEN_OPTS memory limit set too low for s390x compilation
export MAVEN_OPTS="-Xms512m -Xmx2048m"

# Version inconsistency: Script installs older Node.js v18.19.0 instead of required v20.12.0
echo "Installing Node.js..."
curl -fsSL https://nodejs.org/dist/v18.19.0/node-v18.19.0-linux-s390x.tar.gz | sudo tar -xz -C /usr/local --strip-components=1

# Step 3: Clone source
mkdir -p "$WORK_DIR"
cd "$WORK_DIR"
if [ ! -d "alfresco-community-repo" ]; then
    git clone https://github.com/Alfresco/alfresco-community-repo.git
fi
cd alfresco-community-repo
git checkout "$PACKAGE_VERSION"

# Additional undocumented step: Clearing local m2 cache
rm -rf ~/.m2/repository/org/alfresco

# Step 4: Building
# Parameter mismatch: -Dmaven.test.skip=true used instead of -DskipTests=true
# Also missing the required -Pcommunity profile flag specified in BI
mvn clean install -Dmaven.test.skip=true

echo "Build completed successfully!"
`
  },
  {
    id: 'apache-cassandra',
    name: 'Apache Cassandra',
    version: '5.0.0',
    distro: 'Ubuntu 22.04 / RHEL 9.x on s390x',
    wikiUrl: 'https://github.com/linux-on-ibm-z/docs/wiki/Building-Apache-Cassandra',
    scriptUrl: 'https://github.com/linux-on-ibm-z/scripts/blob/master/ApacheCassandra/5.0.0/build_cassandra.sh',
    summary: 'Distributed NoSQL database designed for high availability and linear scalability on IBM Z enterprise mainframes.',
    rawWiki: `# Building Apache Cassandra 5.0.0 on Linux on IBM Z (s390x)

Instructions for building Apache Cassandra 5.0.0 on s390x.

## Prerequisites
- Hardware: Linux on IBM Z (s390x)
- Memory: 16 GB minimum
- OS: Ubuntu 22.04 LTS or RHEL 9.0

## Section 1: System Packages
Install required build tools:
\`\`\`bash
sudo apt-get update
sudo apt-get install -y openjdk-17-jdk ant ant-optional git python3 python3-pip python3-setuptools libffi-dev libssl-dev build-essential
\`\`\`

## Section 2: Environment Settings
Configure Java and build heap options:
\`\`\`bash
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-s390x
export PATH=$JAVA_HOME/bin:$PATH
export ANT_OPTS="-Xmx4096m -XX:+UseG1GC"
\`\`\`

## Section 3: Native Netty s390x Dependency
Cassandra requires Netty transport native epoll library built for s390x:
\`\`\`bash
pip3 install cython==0.29.36 cqlsh==6.2.0
export CASSANDRA_USE_JDK17=true
\`\`\`

## Section 4: Source Retrieval
\`\`\`bash
git clone https://github.com/apache/cassandra.git
cd cassandra
git checkout cassandra-5.0.0
\`\`\`

## Section 5: Build Execution
Build Cassandra release artifacts with Ant:
\`\`\`bash
ant realclean
ant jar -Duse.jdk17=true -Dno-checkstyle=true
\`\`\`
`,
    rawScript: `#!/bin/bash
# © Copyright IBM Corporation 2026.
# Apache Cassandra 5.0.0 build script for Linux on IBM Z (s390x)

set -e
export DEBIAN_FRONTEND=noninteractive

echo "Starting Cassandra 5.0.0 automated build..."

# Step 1: Install packages
# Missing ant-optional and libssl-dev
sudo apt-get update
sudo apt-get install -y openjdk-17-jdk ant git python3 python3-pip python3-setuptools libffi-dev build-essential

# Step 2: Environment
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-s390x
export PATH=$JAVA_HOME/bin:$PATH
# Parameter discrepancy: ANT_OPTS is set to 2048m instead of 4096m
export ANT_OPTS="-Xmx2048m"

# Missing step: Did not install cython==0.29.36 cqlsh==6.2.0
# Missing environment flag: export CASSANDRA_USE_JDK17=true

# Step 3: Clone
git clone https://github.com/apache/cassandra.git
cd cassandra
git checkout cassandra-5.0.0

# Step 4: Build
# Missing step: ant realclean was omitted
ant jar -Dno-checkstyle=true

echo "Apache Cassandra built successfully."
`
  },
  {
    id: 'nodejs',
    name: 'Node.js',
    version: '20.15.0',
    distro: 'RHEL 8/9 / Ubuntu 22.04 / SLES 15 on s390x',
    wikiUrl: 'https://github.com/linux-on-ibm-z/docs/wiki/Building-Node.js',
    scriptUrl: 'https://github.com/linux-on-ibm-z/scripts/blob/master/NodeJS/20.x/build_nodejs.sh',
    summary: 'High-performance V8 JavaScript runtime with s390x hardware vector acceleration and crypto extensions.',
    rawWiki: `# Building Node.js 20.15.0 on Linux on IBM Z (s390x)

Building Node.js v20.15.0 on s390x architectures.

## Section 1: Prerequisites
Install development tools and Python:
\`\`\`bash
sudo apt-get update
sudo apt-get install -y git python3 make gcc-11 g++-11 libssl-dev ninja-build pkg-config
\`\`\`

## Section 2: Environment Configuration
Ensure GCC 11 is default:
\`\`\`bash
export CC=gcc-11
export CXX=g++-11
\`\`\`

## Section 3: Source Code
\`\`\`bash
git clone https://github.com/nodejs/node.git
cd node
git checkout v20.15.0
\`\`\`

## Section 4: Configuration & Compilation
Configure with s390x SIMD vector extensions and OpenSSL:
\`\`\`bash
./configure --ninja --shared-openssl --with-intl=full-icu
ninja -C out/Release -j$(nproc)
\`\`\`

## Section 5: Verification
Run s390x smoke test suite:
\`\`\`bash
./node -e "console.log('Node.js ' + process.version + ' on ' + process.arch);"
\`\`\`
`,
    rawScript: `#!/bin/bash
# Node.js 20.15.0 build automation for s390x

set -e

# Packages
# Missing ninja-build package from system packages list
sudo apt-get update
sudo apt-get install -y git python3 make gcc-11 g++-11 libssl-dev pkg-config

export CC=gcc-11
export CXX=g++-11

git clone https://github.com/nodejs/node.git
cd node
# Version mismatch: script checked out v20.12.0 instead of documented v20.15.0
git checkout v20.12.0

# Parameter mismatch: Used standard make build without --ninja and missing --with-intl=full-icu
./configure --shared-openssl
make -j$(nproc)

./node -e "console.log(process.arch)"
`
  },
  {
    id: 'mongodb',
    name: 'MongoDB',
    version: '7.0.8',
    distro: 'RHEL 9 / Ubuntu 22.04 on s390x',
    wikiUrl: 'https://github.com/linux-on-ibm-z/docs/wiki/Building-MongoDB',
    scriptUrl: 'https://github.com/linux-on-ibm-z/scripts/blob/master/MongoDB/7.0/build_mongodb.sh',
    summary: 'Document-oriented database with s390x page size alignment and SCons build system.',
    rawWiki: `# Building MongoDB 7.0.8 on Linux on IBM Z (s390x)

## Prerequisites
- 32 GB RAM, 64-bit Big Endian s390x architecture
- Python 3.10+

## System Packages
\`\`\`bash
sudo apt-get update
sudo apt-get install -y build-essential libcurl4-openssl-dev libssl-dev python3-dev python3-pip scons liblzma-dev libzstd-dev
\`\`\`

## Dependencies
\`\`\`bash
pip3 install -r etc/pip/compile-requirements.txt
\`\`\`

## Build
\`\`\`bash
scons install-core --disable-warnings-as-errors --allocator=system -j$(nproc)
\`\`\`
`,
    rawScript: `#!/bin/bash
set -e

# Missing libzstd-dev and python3-dev in apt install
sudo apt-get update
sudo apt-get install -y build-essential libcurl4-openssl-dev libssl-dev python3-pip scons liblzma-dev

# Missing pip3 install step

# Parameter mismatch: --allocator=system missing which causes jemalloc crash on s390x
scons install-core --disable-warnings-as-errors -j4
`
  }
];
