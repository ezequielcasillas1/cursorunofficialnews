#!/usr/bin/env node
const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const MOBILE_ROOT = path.resolve(__dirname, '..');
const MERGED_TRUST_DIR = path.join(MOBILE_ROOT, '.gradle-trust');
const MERGED_TRUST_STORE = path.join(MERGED_TRUST_DIR, 'cacerts-merged');
const MERGED_TRUST_STAMP = path.join(MERGED_TRUST_DIR, '.merged-from-jbr');

function pathExists(dir) {
  try {
    return fs.existsSync(dir);
  } catch {
    return false;
  }
}

function hasJava(javaHome) {
  const javaName = process.platform === 'win32' ? 'java.exe' : 'java';
  return pathExists(path.join(javaHome, 'bin', javaName));
}

function detectJavaHome() {
  if (process.env.JAVA_HOME && hasJava(process.env.JAVA_HOME)) {
    return process.env.JAVA_HOME;
  }

  const candidates = [];

  if (process.platform === 'win32') {
    candidates.push(
      'C:\\Program Files\\Android\\Android Studio\\jbr',
      path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Android Studio', 'jbr'),
      'C:\\Program Files\\Java\\jdk-21',
      'C:\\Program Files\\Java\\jdk-17',
      'C:\\Program Files\\Eclipse Adoptium\\jdk-21.0.5.11-hotspot',
      'C:\\Program Files\\Microsoft\\jdk-17.0.13.11-hotspot',
    );
  } else if (process.platform === 'darwin') {
    candidates.push(
      '/Applications/Android Studio.app/Contents/jbr/Contents/Home',
      '/Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home',
    );
  } else {
    candidates.push(
      '/usr/lib/jvm/java-21-openjdk',
      '/usr/lib/jvm/java-17-openjdk',
      path.join(process.env.HOME || '', 'android-studio/jbr'),
    );
  }

  for (const candidate of candidates) {
    if (candidate && hasJava(candidate)) {
      return candidate;
    }
  }

  return null;
}

function detectAndroidSdk() {
  if (process.env.ANDROID_HOME && pathExists(process.env.ANDROID_HOME)) {
    return process.env.ANDROID_HOME;
  }
  if (process.env.ANDROID_SDK_ROOT && pathExists(process.env.ANDROID_SDK_ROOT)) {
    return process.env.ANDROID_SDK_ROOT;
  }

  const candidates = [];

  if (process.platform === 'win32') {
    candidates.push(
      path.join(process.env.LOCALAPPDATA || '', 'Android', 'Sdk'),
      path.join(process.env.USERPROFILE || '', 'AppData', 'Local', 'Android', 'Sdk'),
    );
  } else if (process.platform === 'darwin') {
    candidates.push(path.join(process.env.HOME || '', 'Library', 'Android', 'sdk'));
  } else {
    candidates.push(path.join(process.env.HOME || '', 'Android', 'Sdk'));
  }

  for (const candidate of candidates) {
    if (candidate && pathExists(candidate)) {
      return candidate;
    }
  }

  return null;
}

function prependPath(entry) {
  if (!entry || !pathExists(entry)) {
    return;
  }
  const current = process.env.PATH || process.env.Path || '';
  process.env.PATH = `${entry}${path.delimiter}${current}`;
  if (process.platform === 'win32') {
    process.env.Path = process.env.PATH;
  }
}

function psEscape(value) {
  return value.replace(/'/g, "''");
}

function ensureMergedWindowsTrustStore(javaHome) {
  const src = path.join(javaHome, 'lib', 'security', 'cacerts');
  const keytool = path.join(javaHome, 'bin', 'keytool.exe');

  if (
    pathExists(MERGED_TRUST_STORE) &&
    pathExists(MERGED_TRUST_STAMP) &&
    fs.readFileSync(MERGED_TRUST_STAMP, 'utf8').trim() === javaHome &&
    process.env.CAIN_REFRESH_TRUST !== '1'
  ) {
    return MERGED_TRUST_STORE;
  }

  if (!pathExists(src) || !pathExists(keytool)) {
    throw new Error(`JBR cacerts or keytool not found under ${javaHome}`);
  }

  fs.mkdirSync(MERGED_TRUST_DIR, { recursive: true });
  fs.copyFileSync(src, MERGED_TRUST_STORE);
  fs.writeFileSync(MERGED_TRUST_STAMP, javaHome, 'utf8');

  const dest = psEscape(MERGED_TRUST_STORE);
  const kt = psEscape(keytool);
  const psScript = `
$dest = '${dest}'
$keytool = '${kt}'
Get-ChildItem Cert:\\LocalMachine\\Root | ForEach-Object {
  $alias = 'winroot-' + $_.Thumbprint
  $tmp = Join-Path $env:TEMP ('cain-cert-' + $_.Thumbprint + '.cer')
  Export-Certificate -Cert $_ -FilePath $tmp -Force | Out-Null
  & $keytool -importcert -noprompt -alias $alias -file $tmp -keystore $dest -storepass changeit 2>$null
  Remove-Item $tmp -Force -ErrorAction SilentlyContinue
}
`;

  const result = spawnSync('powershell.exe', ['-NoProfile', '-Command', psScript], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  if (result.status !== 0) {
    console.warn(
      'Warning: could not merge all Windows root certs into Java trust store:',
      (result.stderr || result.stdout || '').trim(),
    );
  }

  return MERGED_TRUST_STORE;
}

function appendGradleOpts(fragment) {
  process.env.GRADLE_OPTS = process.env.GRADLE_OPTS
    ? `${process.env.GRADLE_OPTS} ${fragment}`
    : fragment;
}

function ensureShortGradleUserHome() {
  const explicit = process.env.GRADLE_USER_HOME;
  const sandboxMarker = 'cursor-sandbox-cache';
  const defaultHome =
    process.platform === 'win32'
      ? 'C:\\g'
      : path.join(process.env.HOME || '/tmp', '.gradle');

  const current = explicit || defaultHome;
  const tooLong = current.length > 40;
  const sandboxed = current.includes(sandboxMarker);

  if (!explicit || sandboxed || tooLong) {
    process.env.GRADLE_USER_HOME = defaultHome;
    try {
      fs.mkdirSync(defaultHome, { recursive: true });
    } catch {
      // Fall back to the user profile cache if C:\g is unavailable.
      if (process.platform === 'win32') {
        process.env.GRADLE_USER_HOME = path.join(
          process.env.USERPROFILE || '',
          '.gradle',
        );
      }
    }
    return true;
  }

  return false;
}

function cleanStaleNativeBuildCaches() {
  const cxxRoots = [
    path.join(MOBILE_ROOT, 'node_modules', 'expo-modules-core', 'android', '.cxx'),
    path.join(MOBILE_ROOT, 'node_modules', 'react-native', 'ReactAndroid', '.cxx'),
  ];

  for (const cxxRoot of cxxRoots) {
    if (!pathExists(cxxRoot)) {
      continue;
    }
    try {
      fs.rmSync(cxxRoot, { recursive: true, force: true });
    } catch {
      // Non-fatal; Gradle will recreate native build dirs.
    }
  }
}

function applyGradleSslOpts(javaHome) {
  const useWindowsTrust =
    process.env.CAIN_USE_WINDOWS_TRUST === '1' ||
    (process.platform === 'win32' && process.env.CAIN_USE_WINDOWS_TRUST !== '0');

  if (!useWindowsTrust) {
    return;
  }

  if (process.platform !== 'win32') {
    console.warn('CAIN_USE_WINDOWS_TRUST=1 is supported on Windows only.');
    return;
  }

  if (!javaHome) {
    console.warn('CAIN_USE_WINDOWS_TRUST=1 set but JAVA_HOME was not detected.');
    return;
  }

  let trustStore = process.env.CAIN_GRADLE_TRUSTSTORE;
  if (trustStore) {
    if (!pathExists(trustStore)) {
      console.warn(`CAIN_GRADLE_TRUSTSTORE not found: ${trustStore}`);
      return;
    }
  } else {
    try {
      trustStore = ensureMergedWindowsTrustStore(javaHome);
    } catch (err) {
      console.warn(`Could not build merged trust store: ${err.message}`);
      console.warn(
        'Manual Gradle zip: download gradle-8.10.2-all.zip (see android/gradle/wrapper/gradle-wrapper.properties) into %USERPROFILE%\\.gradle\\wrapper\\dists\\ after first gradlew attempt creates the hash folder.',
      );
      return;
    }
  }

  appendGradleOpts(
    `-Djavax.net.ssl.trustStore="${trustStore}" -Djavax.net.ssl.trustStorePassword=changeit`,
  );
}

function setupEnv() {
  const gradleHomeChanged = ensureShortGradleUserHome();
  if (gradleHomeChanged || process.env.CAIN_CLEAN_NATIVE === '1') {
    cleanStaleNativeBuildCaches();
  }

  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'development';
  }

  const javaHome = detectJavaHome();
  const androidSdk = detectAndroidSdk();

  if (javaHome) {
    process.env.JAVA_HOME = javaHome;
    prependPath(path.join(javaHome, 'bin'));
  }

  if (androidSdk) {
    process.env.ANDROID_HOME = androidSdk;
    process.env.ANDROID_SDK_ROOT = androidSdk;
    prependPath(path.join(androidSdk, 'platform-tools'));
  }

  applyGradleSslOpts(javaHome);

  return { javaHome, androidSdk };
}

function printHelp() {
  console.log(`Usage: node scripts/run-android.js [expo run:android options]

Configures JAVA_HOME, ANDROID_HOME, and optional GRADLE_OPTS for local Android builds, then runs:
  npx expo run:android [args]

Options:
  --help         Show this help
  --verify-env   Print detected env and run java -version (no build)

Zscaler / corporate TLS (Windows):
  Enabled by default on win32 (merged JBR cacerts + Windows root CAs → GRADLE_OPTS).
  CAIN_USE_WINDOWS_TRUST=0   Disable merged trust store
  CAIN_GRADLE_TRUSTSTORE=... Override merged store path
  CAIN_REFRESH_TRUST=1       Rebuild merged store on next run
  CAIN_CLEAN_NATIVE=1        Force-delete stale .cxx native caches

Windows MAX_PATH (260 chars):
  GRADLE_USER_HOME defaults to C:\\g when unset/sandboxed/too long.
  Override with GRADLE_USER_HOME if needed. Stale .cxx caches are cleared each run.
`);
}

function verifyEnv() {
  const { javaHome, androidSdk } = setupEnv();

  console.log('Detected environment:');
  console.log(`  JAVA_HOME=${javaHome || '(not found)'}`);
  console.log(`  ANDROID_HOME=${androidSdk || '(not found)'}`);
  console.log(`  GRADLE_USER_HOME=${process.env.GRADLE_USER_HOME || '(not set)'}`);
  console.log(`  GRADLE_OPTS=${process.env.GRADLE_OPTS || '(not set)'}`);
  console.log(`  CAIN_USE_WINDOWS_TRUST=${process.env.CAIN_USE_WINDOWS_TRUST || '(not set)'}`);

  if (!javaHome) {
    console.error('\nERROR: JAVA_HOME could not be detected.');
    process.exit(1);
  }

  const javaExe = path.join(
    javaHome,
    'bin',
    process.platform === 'win32' ? 'java.exe' : 'java',
  );
  console.log(`\nRunning: ${javaExe} -version\n`);

  const result = spawnSync(javaExe, ['-version'], {
    stdio: 'inherit',
    env: process.env,
  });

  process.exit(result.status ?? (result.error ? 1 : 0));
}

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  printHelp();
  process.exit(0);
}

if (args.includes('--verify-env')) {
  verifyEnv();
}

setupEnv();

const expoArgs = ['expo', 'run:android', ...args];
// Node 20+ on Windows: spawning npx.cmd directly throws EINVAL (common on Node 24).
const spawnOptions = {
  cwd: MOBILE_ROOT,
  stdio: 'inherit',
  env: process.env,
};
const child =
  process.platform === 'win32'
    ? spawn(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', 'npx', ...expoArgs], spawnOptions)
    : spawn('npx', expoArgs, spawnOptions);

child.on('error', (err) => {
  console.error(err);
  process.exit(1);
});

child.on('close', (code) => {
  process.exit(code ?? 1);
});
