plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.idklmao.planb"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.idklmao.planb"
        minSdk = 26
        targetSdk = 36
        // CI sets GITHUB_RUN_NUMBER, so every GitHub build is a higher version than the last.
        val build = System.getenv("GITHUB_RUN_NUMBER")?.toIntOrNull() ?: 1
        versionCode = build
        versionName = "1.$build"
    }

    signingConfigs {
        // A fixed key checked into the repo, so each new build installs over the previous one
        // and keeps the saved ticks. (Without it every CI runner makes a random key.)
        getByName("debug") {
            storeFile = file("debug.keystore")
            storePassword = "android"
            keyAlias = "androiddebugkey"
            keyPassword = "android"
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    // FileProvider: hands the camera a file to write the photo into, and shares the export zip.
    implementation("androidx.core:core:1.13.1")
}
