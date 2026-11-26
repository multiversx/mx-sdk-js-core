#!/usr/bin/env bash
#
# Tests the package the way a consumer receives it.
#
# The unit tests import from "src". This script instead builds the tarball that "npm publish" would upload,
# installs it into an empty project outside the repository, and checks that:
#   1. the published type declarations do not contain "Buffer<...>" / "Uint8Array<...>",
#      which TypeScript < 5.7 cannot parse;
#   2. a consumer can type-check against the package with the oldest supported and the newest TypeScript;
#   3. the built JavaScript loads and works through both require() and import;
#   4. the package still loads when the optional dependencies (axios, bip39, bls-wasm) are not installed.
#
# Usage: npm run test-package

set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FIXTURES_DIR="$REPO_DIR/package-tests"
WORK_DIR="$(mktemp -d)"
trap 'rm -rf "$WORK_DIR"' EXIT

# The oldest TypeScript version consumers are expected to use, and the newest one published.
TYPESCRIPT_OLDEST="5.0"
TYPESCRIPT_NEWEST="latest"

step() {
    echo
    echo "==> $1"
}

fail() {
    echo "FAILED: $1" >&2
    exit 1
}

step "Building and packing (the same tarball 'npm publish' would upload)"
cd "$REPO_DIR"
npm run compile
# The build above is what the 'prepare' script does, so it is skipped here to keep the output short.
npm pack --ignore-scripts --silent --pack-destination "$WORK_DIR" >/dev/null
TARBALL="$(ls "$WORK_DIR"/*.tgz)"
echo "$(basename "$TARBALL") ($(wc -c <"$TARBALL" | tr -d ' ') bytes)"

step "Type declarations must not use generic Buffer / Uint8Array"
if grep -rnE 'Buffer<|Uint8Array<' "$REPO_DIR/out" --include='*.d.ts'; then
    fail "the declarations above break consumers on TypeScript < 5.7. Add an explicit ': Buffer' or ': Uint8Array' annotation in the source."
fi
echo "ok"

step "Installing the tarball into an empty project"
CONSUMER_DIR="$WORK_DIR/consumer"
mkdir "$CONSUMER_DIR"
cp "$FIXTURES_DIR/consumer.ts" "$FIXTURES_DIR/smoke.cjs" "$FIXTURES_DIR/smoke.mjs" "$CONSUMER_DIR"
cd "$CONSUMER_DIR"
npm init -y >/dev/null
npm install --no-audit --no-fund "$TARBALL" "@types/node@20" >/dev/null
echo "ok"

typecheck() {
    local version="$1" module="$2" resolution="$3"
    echo "typescript@$version, module=$module, moduleResolution=$resolution"
    npx --yes --package "typescript@$version" -- tsc consumer.ts \
        --noEmit --strict --skipLibCheck false --target es2020 --esModuleInterop \
        --module "$module" --moduleResolution "$resolution" ||
        fail "a consumer on typescript@$version ($resolution resolution) cannot type-check against the package."
}

step "Type-checking a consumer (strict, skipLibCheck: false)"
typecheck "$TYPESCRIPT_OLDEST" commonjs node
typecheck "$TYPESCRIPT_OLDEST" node16 node16
typecheck "$TYPESCRIPT_NEWEST" node16 node16
typecheck "$TYPESCRIPT_NEWEST" esnext bundler
echo "ok"

step "Running the built package on Node $(node --version)"
node smoke.cjs || fail "the package does not work when loaded with require()."
node smoke.mjs || fail "the package does not work when loaded with import."

step "Loading the package without optional dependencies"
BARE_DIR="$WORK_DIR/bare"
mkdir "$BARE_DIR"
cd "$BARE_DIR"
npm init -y >/dev/null
npm install --no-audit --no-fund --omit=optional "$TARBALL" >/dev/null
if [ -d node_modules/axios ]; then
    fail "axios was installed although optional dependencies were omitted; this check would not prove anything."
fi
node -e 'require("@multiversx/sdk-core")' ||
    fail "the package cannot be loaded without its optional dependencies. An optional dependency is imported at module load."
echo "ok"

echo
echo "All package tests passed."
