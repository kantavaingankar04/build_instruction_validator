# Building Apache Tomcat

Below versions of [Apache Tomcat](https://tomcat.apache.org/) are available in respective distributions at the time of creation of these build instructions:

*    RHEL (8.10) has 9.0.87
*    RHEL (9.6, 9.7, 9.8) have 9.0.117
*    RHEL (10.0, 10.1, 10.2) have 10.1.49
*    SLES 15 SP7 has 10.1.56
*    SLES 16 has 10.1.44
*    Ubuntu 22.04 has 9.0.58
*    Ubuntu 24.04 has 10.1.16

#### _General Notes:_
*   _When following the steps below please use a standard permission user unless otherwise specified._
*   _A directory `/<source_root>/` will be referred to in these instructions, this is a temporary writable directory anywhere you'd like to place it._

Apache Tomcat binaries are available and can be downloaded from [here](http://tomcat.apache.org/). To use these binaries, different Java flavors can be installed on mentioned distributions.

_**Note:** Apache Tomcat version 11.0.26 was verified at the time of creation of these instructions_

## 1. Install Java
```
   export SOURCE_ROOT=/<source_root>/
```

*   RHEL (8.10, 9.6, 9.7, 9.8, 10.0, 10.1, 10.2)

    *   With OpenJDK17: (Except for RHEL 10.x)
        ```shell
        sudo yum install -y java-17-openjdk
        ```
	
    *   With OpenJDK21:
        ```shell
        sudo yum install -y java-21-openjdk-devel
        ```

    *   With OpenJDK25: (Except for RHEL 8.10)
        ```shell
        sudo yum install -y java-25-openjdk-devel
        ```

    *   With IBM Semeru Runtime

        * Download and install IBM Semeru Runtime (Java 17, Java 21 or Java 25) from [here](https://developer.ibm.com/languages/java/semeru-runtimes/downloads).
     
    *   With Eclipse Adoptium Temurin Runtime

        * Download and install Eclipse Adoptium Temurin Runtime (Java 17, Java 21 or Java 25) from [here](https://adoptium.net/releases.html?variant=openjdk17&jvmVariant=hotspot).

*   SLES (15 SP7, 16)

    *   With OpenJDK17:
        ```shell
        sudo zypper install -y java-17-openjdk-devel
        ```
	
    *   With OpenJDK21:
        ```shell
        sudo zypper install -y java-21-openjdk-devel
        ```

    *   With OpenJDK25:
        ```shell
        sudo zypper install -y java-25-openjdk-devel
        ```
        
    *   With IBM Semeru Runtime

        * Download and install IBM Semeru Runtime (Java 17, Java 21 or Java 25) from [here](https://developer.ibm.com/languages/java/semeru-runtimes/downloads).
     
    *   With Eclipse Adoptium Temurin Runtime

        * Download and install Eclipse Adoptium Temurin Runtime (Java 17, Java 21 or Java 25) from [here](https://adoptium.net/releases.html?variant=openjdk17&jvmVariant=hotspot).


*   Ubuntu (22.04, 24.04)

    *   With OpenJDK17:
        ```shell
        sudo apt-get update
        sudo apt-get install -y openjdk-17-jdk
        ```
        
    *   With OpenJDK21:
        ```shell
        sudo apt-get update
        sudo apt-get install -y openjdk-21-jdk
        ```

    *   With OpenJDK25:
        ```shell
        sudo apt-get update
        sudo apt-get install -y openjdk-25-jdk
        ```
        
    *   With IBM Semeru Runtime

        * Download and install IBM Semeru Runtime (Java 17, Java 21 or Java 25) from [here](https://developer.ibm.com/languages/java/semeru-runtimes/downloads).
     
    *   With Eclipse Adoptium Temurin Runtime

        * Download and install Eclipse Adoptium Temurin Runtime (Java 17, Java 21 or Java 25) from [here](https://adoptium.net/releases.html?variant=openjdk17&jvmVariant=hotspot).


_**Note:** At the time of creation of these build instructions, Apache Tomcat 11.0.26 was verified with `OpenJDK 17 (build 17.0.20+8), OpenJDK 21 (build 21.0.12+7) and OpenJDK 25 (build 25.0.4+10)`,  `Temurin-17 (build 17.0.20+8), Temurin-21 (build 21.0.12+7), Temurin-25 (build 25.0.4+10)` and `IBM Semeru Runtime Open Edition 17 (build 17.0.20+8), IBM Semeru Runtime Open Edition 21 (build 21.0.12+7) and IBM Semeru Runtime Open Edition 25 (build 25.0.4+10)`._

## 2. Set environment variables

```shell
export JAVA_HOME=<Path to Java>
export PATH=$JAVA_HOME/bin:$PATH
```

## 3. Start server (Optional)

To start the server, extract the binary tar to `/<source_root>/` and follow steps given below:
```shell
cd $SOURCE_ROOT/<apache_tomcat_binary_folder>/
bin/startup.sh
```

Open ```http://<ip_address>:8080/``` in your browser to access Web UI.

## References:
- [http://tomcat.apache.org/](http://tomcat.apache.org/)
- https://tomcat.apache.org/tomcat-11.0-doc/manager-howto.html
