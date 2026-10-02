
# Building Apache Spark

The instructions provided below specify the steps to build [Apache Spark](https://spark.apache.org/) version 4.0.1 in Standalone Mode on Linux on IBM Z for the following distributions:

* RHEL (8.10, 9.6, 9.7, 10.0, 10.1)
* SLES (15 SP7, 16.0)
* Ubuntu (22.04, 24.04)

Limitation: Hive does not currently fully support big-endian systems. The use of this component should be avoided.

_**General Notes:**_

* _When following the steps below please use a standard permission user unless otherwise specified._

* _A directory `/<source_root>/` will be referred to in these instructions, this is a temporary writeable directory anywhere you'd like to place it._

## 1. Build using script

If you want to build Spark using manual steps, go to STEP 2.

Use the following commands to build Spark using the build [script](https://github.com/linux-on-ibm-z/scripts/tree/master/ApacheSpark). Please make sure you have wget installed.

```bash
wget -q https://raw.githubusercontent.com/linux-on-ibm-z/scripts/master/ApacheSpark/4.0.1/build_spark.sh

# Build Spark
bash build_spark.sh   [Provide -h option to print help menu]
```

If the build completes successfully, go to STEP 5. In case of error, check logs for more details or go to STEP 2 to follow manual build steps.

## 2. Build Prerequisites for Apache Spark

### 2.1. Install the dependencies

```bash
export SOURCE_ROOT=/<source_root>/
```

* RHEL 8.10

  ```bash
  sudo yum groupinstall -y 'Development Tools'
  sudo yum install -y wget tar git libtool autoconf make curl python3 procps-ng
  ```
  
* RHEL (9.6, 9.7, 10.0, 10.1)

  ```bash
  sudo yum groupinstall -y 'Development Tools'
  sudo yum install -y --allowerasing rpmdevtools wget tar git libtool autoconf make curl python3 flex gcc redhat-rpm-config rpm-build pkgconfig gettext automake gdb bison gcc-c++ binutils procps-ng
  ```

* SLES (15 SP7, 16.0)

  ```bash
  sudo zypper install -y wget tar git libtool autoconf curl gcc make gcc-c++ zip unzip gzip gawk python3 procps
  ```

* Ubuntu (22.04, 24.04)

  ```bash
  sudo apt-get update
  sudo apt-get install -y wget tar git libtool autoconf build-essential curl apt-transport-https cmake python3 procps
  ```

### 2.2. Install Java

  * Install Java 8 (required for building LevelDB JNI):

  ```bash
  cd "${SOURCE_ROOT}"
  curl -SL -o jdk8.tar.gz "https://github.com/ibmruntimes/semeru8-binaries/releases/download/jdk8u472-b08_openj9-0.56.0/ibm-semeru-open-jdk_s390x_linux_8u472b08_openj9-0.56.0.tar.gz"
  sudo mkdir -p /opt/openjdk/8/
  sudo tar -zxf jdk8.tar.gz -C /opt/openjdk/8/ --strip-components 1
  ```

  * With Eclipse Adoptium Temurin Runtime (previously known as AdoptOpenJDK hotspot)
    * Download and install Eclipse Adoptium Temurin Runtime (Java 17 or 21) from [here](https://adoptium.net/temurin/releases/).

  * With OpenJDK 17
    * RHEL (8.10, 9.6, 9.7, 10.0, 10.1)
    ```bash
    sudo yum install -y java-17-openjdk java-17-openjdk-devel
    ```
    * SLES (15 SP7, 16.0)
    ```bash
    sudo zypper install -y java-17-openjdk java-17-openjdk-devel
    ```
    * Ubuntu (22.04, 24.04)
    ```bash
    sudo DEBIAN_FRONTEND=noninteractive apt-get install -y openjdk-17-jdk
    ```

  * With OpenJDK 21
    * RHEL (8.10, 9.6, 9.7, 10.0, 10.1)
    ```bash
    sudo yum install -y java-21-openjdk java-21-openjdk-devel
    ```
    * SLES (15 SP7, 16.0)
    ```bash
    sudo zypper install -y java-21-openjdk java-21-openjdk-devel
    ```
    * Ubuntu (22.04, 24.04)
    ```bash
    sudo DEBIAN_FRONTEND=noninteractive apt-get install -y openjdk-21-jdk 
    ```

  _**Note:** At the time of creation of these build instructions, Apache Spark version 4.0.1 was verified with OpenJDK 17,21 (latest distro provided version) and Eclipse Adoptium Temurin Runtime (`build 17.0.13+11, 21.0.9+10`) on all above distributions._

### 2.3. Set JAVA_HOME and PATH

 ```bash
  export JAVA_HOME=/<Path to Java>/
  export PATH="${JAVA_HOME}/bin:${PATH}"
 ```

### 2.4. Install Maven

  ```bash
  cd "${SOURCE_ROOT}"
  wget -O apache-maven-3.8.8.tar.gz "https://www.apache.org/dyn/mirrors/mirrors.cgi?action=download&filename=maven/maven-3/3.8.8/binaries/apache-maven-3.8.8-bin.tar.gz"
  tar -xzf apache-maven-3.8.8.tar.gz
  ```

### 2.5. Build LevelDB JNI

* Download and configure Snappy

  ```bash
  cd "${SOURCE_ROOT}"
  wget https://github.com/google/snappy/releases/download/1.1.4/snappy-1.1.4.tar.gz
  tar -zxvf snappy-1.1.4.tar.gz
  export SNAPPY_HOME="${SOURCE_ROOT}/snappy-1.1.4"
  cd "${SNAPPY_HOME}"
  ./configure --disable-shared --with-pic
  make
  sudo make install
  ```

* Download the source code for LevelDB and LevelDB JNI

  ```bash
  cd "${SOURCE_ROOT}"
  git clone -b s390x https://github.com/linux-on-ibm-z/leveldb.git
  git clone -b leveldbjni-1.8-s390x https://github.com/linux-on-ibm-z/leveldbjni.git
  ```

* Set the environment variables

  ```bash
  export LEVELDB_HOME="${SOURCE_ROOT}/leveldb"
  export LEVELDBJNI_HOME="${SOURCE_ROOT}/leveldbjni"
  export LIBRARY_PATH="${SNAPPY_HOME}"
  export C_INCLUDE_PATH="${LIBRARY_PATH}"
  export CPLUS_INCLUDE_PATH="${LIBRARY_PATH}"
  ```

* Apply the LevelDB patch

  ```bash
  cd "${LEVELDB_HOME}"
  git apply "${LEVELDBJNI_HOME}/leveldb.patch"
  make libleveldb.a
  ```

* Build the jar file

  ```bash
  cd "${LEVELDBJNI_HOME}"
  JAVA_HOME="/opt/openjdk/8/" PATH="/opt/openjdk/8/bin/:${SOURCE_ROOT}/apache-maven-3.8.8/bin:${PATH}" mvn clean install -P download -Plinux64-s390x -DskipTests
  JAVA_HOME="/opt/openjdk/8/" PATH="/opt/openjdk/8/bin/:${SOURCE_ROOT}/apache-maven-3.8.8/bin:${PATH}" jar -xvf "${LEVELDBJNI_HOME}/leveldbjni-linux64-s390x/target/leveldbjni-linux64-s390x-1.8.jar"
  export LD_LIBRARY_PATH="${LEVELDBJNI_HOME}/META-INF/native/linux64/s390x${LD_LIBRARY_PATH:+:${LD_LIBRARY_PATH}}"
  ```

### 2.6. Build AirCompressor

```bash
cd "${SOURCE_ROOT}"
git clone -b "2.0.2" --single-branch https://github.com/airlift/aircompressor.git
cd aircompressor
curl -sSL "https://raw.githubusercontent.com/linux-on-ibm-z/scripts/master/ApacheSpark/4.0.1/patch/aircompressor.diff" | git apply -
PATH="${SOURCE_ROOT}/apache-maven-3.8.8/bin:${PATH}" mvn install -B -V -DskipTests -Dair.check.skip-all
```

### 2.7. Set Environment Variables

```bash
export LANG="C.UTF-8"
```

## 3. Build Apache Spark

### 3.1. Clone Spark Repository

```bash
cd "${SOURCE_ROOT}"
git clone -b v4.0.1 --depth 1 https://github.com/apache/spark.git
```

### 3.2. Apply Patches to Fix Known Issues

```bash
    cd "${SOURCE_ROOT}/spark"
    curl -sSL "https://raw.githubusercontent.com/linux-on-ibm-z/scripts/master/ApacheSpark/4.0.1/patch/spark.diff" | git apply -
    curl -sSL "https://raw.githubusercontent.com/linux-on-ibm-z/scripts/master/ApacheSpark/4.0.1/patch/disabledTests.diff" | git apply -
```

### 3.3. Build Spark

```bash
  cd "${SOURCE_ROOT}/spark"
  ./build/mvn -DskipTests clean install
  ```

## 4. Run the test cases (Optional)

  ```bash
  # Fix for TTY related issues when launching the Ammonite REPL in tests.
  ORIG_TERM="$TERM"
  export TERM=vt100

  cd "${SOURCE_ROOT}/spark"
  ./build/mvn -B test -fn -pl '!sql/hive'

  export TERM="$ORIG_TERM"

  # There are TTY related issues when launching the Ammonite REPL in tests so try to reset to sane values.
  stty sane || true
  ```

_**Note:** Hive does not currently support big-endian systems so its test suites are skipped._

_**Note:** Some test cases have been observed to fail intermittently. They should pass on rerun._

To run an individual scala test:

  ```bash
  cd "${SOURCE_ROOT}/spark"
  build/mvn -pl :spark-connect_2.13 -Dtest=none -Dsuites="org.apache.spark.sql.connect.execution.ReattachableExecuteSuite @reattach after connection expired" test
  ```

To run an individual java test:

  ```bash
  cd "${SOURCE_ROOT}/spark"
  build/mvn -pl :spark-streaming_2.13 -Dtest="org.apache.spark.streaming.JavaMapWithStateSuite#testBasicFunction" -DwildcardSuites=none test
  ```

_**Note:** Some tests have been disabled because they load native-endian files that were generated on a little-endian system._

_**Note:** Some tests may fail with distro provided OpenJDK JVMs due to system wide `cyrpto-policy` settings on RHEL and SLES._

If a test fails with an exception like:

```txt
java.security.cert.CertPathValidatorException: Algorithm constraints check failed on keysize limits: RSA 1024 bit key used with certificate: CN=spark, OU=spark, O=spark, L=spark, ST=spark, C=spark
```

set the `crypto-policy` to `LEGACY` with the command `update-crypto-policy --set LEGACY` and rerun the test.

If test `SPARK-47788: Ensure hash function for streaming stateful ops is compatibilityacross Spark versions` fails, then generate the golden file and re-run the test as shown [here](https://github.com/apache/spark/blob/v4.0.1/sql/core/src/test/scala/org/apache/spark/sql/streaming/StreamingQueryHashPartitionVerifySuite.scala#L34C1-L46C4) 

## 5. Start Apache Spark Shell

```bash
cd "${SOURCE_ROOT}/spark"
./bin/spark-shell
  ```

## References

* <https://spark.apache.org/docs/4.0.1/building-spark.html>
* <https://spark.apache.org/docs/4.0.1/spark-standalone.html>
* <https://spark.apache.org/developer-tools.html#individual-tests>
* https://spark.apache.org/docs/latest/quick-start.html
