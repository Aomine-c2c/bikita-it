#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_DIR="$ROOT_DIR/apps/web"
API_DIR="$ROOT_DIR/apps/api"
TAURI_DIR="$WEB_DIR/src-tauri"
VERSION="$(tr -d '[:space:]' < "$ROOT_DIR/VERSION")"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info()    { echo -e "${BLUE}[pulse]${NC} $*"; }
success() { echo -e "${GREEN}[pulse]${NC} $*"; }
warn()    { echo -e "${YELLOW}[pulse]${NC} $*"; }
err()     { echo -e "${RED}[pulse]${NC} $*" >&2; }

usage() {
  cat <<EOF
Pulse IT Operations Platform (v${VERSION}) — Dev & Release CLI

Usage:
  ./run.sh <mode> [options]

Developer Modes:
  --dev           Launch Tauri desktop + Next.js (standalone native mode)
  --dev-full      Launch Tauri desktop + Next.js + Django API
  --dev-web       Launch Next.js web frontend only (http://localhost:3000)
  --dev-api       Launch Django API only (http://127.0.0.1:3001)

Validation & Build Modes:
  --check         Run full checks (typecheck, lint, unit tests, Rust cargo check)
  --build-win     Cross-compile Windows NSIS (.exe) installer locally
  --build-linux   Build Linux AppImage & .deb packages locally
  --build-all     Build both Windows and Linux installers locally
  --release       Full release pipeline: --check -> --build-all -> package into
                  releases/v${VERSION}/ with SHA256SUMS.txt -> local git tag v${VERSION}
                  (pass --no-tag to skip creating the git tag)
  -h, --help      Show this help message

Examples:
  ./run.sh --dev
  ./run.sh --check
  ./run.sh --build-win
  ./run.sh --release
  ./run.sh --release --no-tag
EOF
}

ensure_node_deps() {
  if [ ! -d "$ROOT_DIR/node_modules" ]; then
    info "Installing root npm dependencies..."
    (cd "$ROOT_DIR" && npm install)
  fi
}

ensure_python_venv() {
  if [ ! -d "$API_DIR/venv" ]; then
    info "Creating Python virtualenv in apps/api/venv..."
    python3 -m venv "$API_DIR/venv"
    "$API_DIR/venv/bin/pip" install --upgrade pip
    "$API_DIR/venv/bin/pip" install -r "$API_DIR/requirements.txt"
  fi
}

ensure_win_cross_tools() {
  info "Checking Windows cross-compilation toolchain..."
  if ! rustup target list --installed | grep -q '^x86_64-pc-windows-msvc$'; then
    info "Adding Rust target x86_64-pc-windows-msvc..."
    rustup target add x86_64-pc-windows-msvc
  fi

  local missing_pkgs=()
  command -v makensis >/dev/null 2>&1 || missing_pkgs+=(nsis)
  command -v lld-link >/dev/null 2>&1 || missing_pkgs+=(lld)
  command -v llvm-lib >/dev/null 2>&1 || missing_pkgs+=(llvm)

  if [ "${#missing_pkgs[@]}" -gt 0 ]; then
    if command -v pacman >/dev/null 2>&1; then
      info "Installing missing system packages via pacman: ${missing_pkgs[*]}"
      sudo pacman -S --needed --noconfirm "${missing_pkgs[@]}"
    elif command -v apt-get >/dev/null 2>&1; then
      info "Installing missing system packages via apt-get: ${missing_pkgs[*]}"
      sudo apt-get update && sudo apt-get install -y "${missing_pkgs[@]}"
    else
      err "Missing required tools: ${missing_pkgs[*]}. Please install them manually."
      exit 1
    fi
  fi

  if ! command -v cargo-xwin >/dev/null 2>&1; then
    info "Installing cargo-xwin..."
    cargo install --locked cargo-xwin
  fi
  success "Windows cross-compilation toolchain ready."
}

cmd_dev_web() {
  ensure_node_deps
  info "Starting Next.js web frontend..."
  cd "$WEB_DIR" && npm run dev
}

cmd_dev_api() {
  ensure_python_venv
  info "Running Django migrations & starting API server on :3001..."
  cd "$API_DIR"
  "$API_DIR/venv/bin/python" manage.py migrate
  "$API_DIR/venv/bin/python" manage.py runserver 0.0.0.0:3001
}

cmd_dev() {
  ensure_node_deps
  info "Starting Tauri desktop app (standalone mode)..."
  cd "$WEB_DIR"
  npx tauri dev --config '{"build":{"beforeDevCommand":"npm run dev"}}'
}

cmd_dev_full() {
  ensure_node_deps
  ensure_python_venv
  info "Starting Django API (:3001) + Next.js + Tauri desktop..."
  (cd "$API_DIR" && "$API_DIR/venv/bin/python" manage.py migrate && "$API_DIR/venv/bin/python" manage.py runserver 0.0.0.0:3001) &
  API_PID=$!
  trap 'kill $API_PID 2>/dev/null || true' EXIT
  cd "$WEB_DIR"
  npx tauri dev --config '{"build":{"beforeDevCommand":"npm run dev"}}'
}

cmd_check() {
  ensure_node_deps
  info "1/4 Running TypeScript typecheck..."
  (cd "$WEB_DIR" && npm run typecheck)

  info "2/4 Running ESLint..."
  (cd "$WEB_DIR" && npm run lint)

  info "3/4 Running unit tests (Vitest)..."
  (cd "$WEB_DIR" && npm run test)

  info "4/4 Running Rust cargo check..."
  (cd "$TAURI_DIR" && cargo check)

  success "All pre-release checks passed!"
}

cmd_build_linux() {
  ensure_node_deps
  info "Building Linux installers (AppImage, .deb) for Pulse v${VERSION}..."
  cd "$WEB_DIR"
  npx tauri build --bundles appimage,deb
  success "Linux build complete!"
}

cmd_build_win() {
  ensure_node_deps
  ensure_win_cross_tools
  info "Cross-compiling Windows NSIS (.exe) installer for Pulse v${VERSION}..."
  cd "$WEB_DIR"
  npx tauri build --runner cargo-xwin --target x86_64-pc-windows-msvc --bundles nsis
  success "Windows NSIS build complete!"
}

cmd_package_release() {
  local no_tag="${1:-false}"
  local out_dir="$ROOT_DIR/releases/v${VERSION}"
  mkdir -p "$out_dir"

  info "Collecting built installers into releases/v${VERSION}/..."
  find "$TAURI_DIR/target/x86_64-pc-windows-msvc/release/bundle/nsis" -maxdepth 1 -type f -name '*.exe' -exec cp -v {} "$out_dir/" \; 2>/dev/null || true
  find "$TAURI_DIR/target/release/bundle/appimage" -maxdepth 1 -type f -name '*.AppImage' -exec cp -v {} "$out_dir/" \; 2>/dev/null || true
  find "$TAURI_DIR/target/release/bundle/deb" -maxdepth 1 -type f -name '*.deb' -exec cp -v {} "$out_dir/" \; 2>/dev/null || true

  if [ -z "$(ls -A "$out_dir")" ]; then
    err "No installer artifacts found in $out_dir!"
    exit 1
  fi

  info "Generating SHA256SUMS.txt..."
  (cd "$out_dir" && sha256sum * > SHA256SUMS.txt)
  cat "$out_dir/SHA256SUMS.txt"

  if [ "$no_tag" != "true" ]; then
    if git -C "$ROOT_DIR" rev-parse "v${VERSION}" >/dev/null 2>&1; then
      warn "Git tag v${VERSION} already exists; skipping tag creation."
    else
      info "Creating local git tag v${VERSION}..."
      git -C "$ROOT_DIR" tag -a "v${VERSION}" -m "Release Pulse IT Operations v${VERSION}"
      success "Created local tag v${VERSION} (not pushed)."
    fi
  fi

  success "Release v${VERSION} packaged in $out_dir"
}

if [ $# -eq 0 ]; then
  usage
  exit 0
fi

MODE="$1"
shift || true
NO_TAG="false"
for arg in "$@"; do
  [ "$arg" = "--no-tag" ] && NO_TAG="true"
done

case "$MODE" in
  --dev)         cmd_dev ;;
  --dev-full)    cmd_dev_full ;;
  --dev-web)     cmd_dev_web ;;
  --dev-api)     cmd_dev_api ;;
  --check)       cmd_check ;;
  --build-linux) cmd_build_linux ;;
  --build-win)   cmd_build_win ;;
  --build-all)   cmd_build_linux && cmd_build_win ;;
  --release)     cmd_check && cmd_build_linux && cmd_build_win && cmd_package_release "$NO_TAG" ;;
  -h|--help)     usage ;;
  *)
    err "Unknown option: $MODE"
    usage
    exit 1
    ;;
esac
