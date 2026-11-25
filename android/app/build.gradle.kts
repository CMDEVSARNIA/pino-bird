// Pino for Android: a tiny full-screen window onto https://pino-bird.netlify.app
// Built by .github/workflows/android.yml. Signing key comes from repository secrets.
plugins {
    id("com.android.application")
}

android {
    namespace = "town.pino.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "town.pino.app"
        minSdk = 24
        targetSdk = 34
        versionCode = (System.getenv("GITHUB_RUN_NUMBER") ?: "1").toInt()
        versionName = "1.0.${System.getenv("GITHUB_RUN_NUMBER") ?: "0"}"
    }

    signingConfigs {
        create("release") {
            val ks = System.getenv("PINO_KEYSTORE_FILE")
            if (ks != null) {
                storeFile = file(ks)
                storePassword = System.getenv("PINO_KEYSTORE_PASSWORD")
                keyAlias = "pino"
                keyPassword = System.getenv("PINO_KEYSTORE_PASSWORD")
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            signingConfig = if (System.getenv("PINO_KEYSTORE_FILE") != null) signingConfigs.getByName("release") else signingConfigs.getByName("debug")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}
