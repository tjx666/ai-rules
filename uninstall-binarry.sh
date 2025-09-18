#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

FORCE=false
QUIET=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --force | -f)
      FORCE=true
      shift
      ;;
    --quiet | -q)
      QUIET=true
      FORCE=true # quiet implies force to avoid hanging automation
      shift
      ;;
    --help | -h)
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Uninstall Claude Code binary files while preserving configuration files."
      echo ""
      echo "Options:"
      echo "  --force, -f    Skip confirmation prompts"
      echo "  --quiet, -q    Suppress non-error output (implies --force)"
      echo "  --help, -h     Show this help message"
      echo ""
      echo "Preserved files:"
      echo "  - ~/.claude/ (configuration directory)"
      echo "  - ~/.claude.json (configuration file)"
      echo "  - Shell integration in ~/.zshrc"
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      echo "Use --help for usage information" >&2
      exit 1
      ;;
  esac
done

log_info() {
  if [ "$QUIET" = false ]; then
    echo -e "${BLUE}[INFO]${NC} $1"
  fi
}

log_success() {
  if [ "$QUIET" = false ]; then
    echo -e "${GREEN}[SUCCESS]${NC} $1"
  fi
}

log_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1" >&2
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1" >&2
}

# Platform detection
case "$(uname -s)" in
  Darwin) os="darwin" ;;
  Linux) os="linux" ;;
  *)
    log_error "Windows is not supported"
    exit 1
    ;;
esac

case "$(uname -m)" in
  x86_64 | amd64) arch="x64" ;;
  arm64 | aarch64) arch="arm64" ;;
  *)
    log_error "Unsupported architecture: $(uname -m)"
    exit 1
    ;;
esac

log_info "Detected platform: $os-$arch"

# Define binary paths to check and remove
BINARY_PATHS=(
  "$HOME/.local/bin/claude"
  "/usr/local/bin/claude"
  "/opt/homebrew/bin/claude"
)

# Version directory (contains actual binary files)
VERSION_DIR="$HOME/.local/share/claude"

find_command() {
  command -v "$1" 2> /dev/null || which "$1" 2> /dev/null
}

scan_installation() {
  log_info "Scanning for Claude Code binary installations..."

  local found_any=false

  # Check version directory
  if [ -d "$VERSION_DIR" ]; then
    local dir_size
    dir_size=$(du -sh "$VERSION_DIR" 2> /dev/null | cut -f1 || echo "unknown size")
    log_info "  Found versions directory: $VERSION_DIR ($dir_size)"
    found_any=true
  else
    log_info "  Not found: $VERSION_DIR"
  fi

  # Check binary paths
  log_info "Checking binary locations:"
  for binary_path in "${BINARY_PATHS[@]}"; do
    if [ -f "$binary_path" ] && [ -x "$binary_path" ]; then
      log_info "  Found: $binary_path"
      found_any=true
    else
      log_info "  Not found: $binary_path"
    fi
  done

  # Check claude in PATH
  if find_command claude > /dev/null; then
    local claude_in_path
    claude_in_path=$(find_command claude)
    log_info "  Found in PATH: $claude_in_path"
    found_any=true
  else
    log_info "  Not found in PATH"
  fi

  if [ "$found_any" = false ]; then
    log_info "No Claude Code binary installation found."
    exit 0
  fi
}

remove_binaries() {
  local removed_count=0
  local failed_count=0

  log_info "Removing Claude Code binary files..."

  # Remove version directory (contains actual binaries)
  if [ -d "$VERSION_DIR" ]; then
    local dir_size
    dir_size=$(du -sh "$VERSION_DIR" 2> /dev/null | cut -f1 || echo "unknown size")

    if rm -rf "$VERSION_DIR" 2> /dev/null; then
      log_success "Removed versions directory: $VERSION_DIR ($dir_size)"
      removed_count=$((removed_count + 1))
    else
      log_warning "Could not remove versions directory: $VERSION_DIR"
      failed_count=$((failed_count + 1))
    fi
  else
    log_info "Versions directory not found: $VERSION_DIR (skipping)"
  fi

  # Remove binary files/symlinks
  for binary_path in "${BINARY_PATHS[@]}"; do
    if [ -f "$binary_path" ] || [ -L "$binary_path" ]; then
      if rm -f "$binary_path" 2> /dev/null; then
        removed_count=$((removed_count + 1))
        log_success "Removed binary: $binary_path"
      else
        log_warning "Could not remove $binary_path (try: sudo rm -f $binary_path)"
        failed_count=$((failed_count + 1))
      fi
    else
      log_info "Binary not found: $binary_path (skipping)"
    fi
  done

  # Remove any claude binary in PATH that we haven't covered
  if find_command claude > /dev/null; then
    local claude_in_path
    claude_in_path=$(find_command claude)

    # Check if it's not one of the paths we already processed
    local is_known_path=false
    for known_path in "${BINARY_PATHS[@]}" "$VERSION_DIR"/*; do
      if [ "$claude_in_path" = "$known_path" ]; then
        is_known_path=true
        break
      fi
    done

    if [ "$is_known_path" = false ] && [[ "$claude_in_path" == */claude ]]; then
      log_info "Found additional claude binary in PATH: $claude_in_path"
      if rm -f "$claude_in_path" 2> /dev/null; then
        removed_count=$((removed_count + 1))
        log_success "Removed additional binary: $claude_in_path"
      else
        log_warning "Could not remove $claude_in_path (try: sudo rm -f $claude_in_path)"
        failed_count=$((failed_count + 1))
      fi
    fi
  fi

  if [ $removed_count -gt 0 ]; then
    log_success "Successfully removed $removed_count binary file(s)/directory"
  else
    log_info "No binary files were found to remove"
  fi

  if [ $failed_count -gt 0 ]; then
    log_warning "Failed to remove $failed_count item(s)"
  fi

  [ $failed_count -eq 0 ]
}

verify_preservation() {
  log_info "Verifying preserved configuration files..."

  local preserved_count=0

  # Check ~/.claude directory
  if [ -d "$HOME/.claude" ]; then
    local dir_size
    dir_size=$(du -sh "$HOME/.claude" 2> /dev/null | cut -f1 || echo "unknown size")
    log_success "Preserved: ~/.claude/ ($dir_size)"
    preserved_count=$((preserved_count + 1))
  fi

  # Check ~/.claude.json
  if [ -f "$HOME/.claude.json" ]; then
    log_success "Preserved: ~/.claude.json"
    preserved_count=$((preserved_count + 1))
  fi

  # Check .zshrc for claude configuration
  if [ -f "$HOME/.zshrc" ] && grep -q "claude" "$HOME/.zshrc" 2>/dev/null; then
    log_success "Preserved: claude configuration in ~/.zshrc"
    preserved_count=$((preserved_count + 1))
  fi

  if [ $preserved_count -gt 0 ]; then
    log_success "Successfully preserved $preserved_count configuration item(s)"
  fi
}

main() {
  local exit_code=0

  log_info "Starting Claude Code binary uninstallation..."

  # Scan for installations
  scan_installation

  # Show what will be preserved
  echo ""
  if [ "$FORCE" = false ] && [ "$QUIET" = false ]; then
    echo -e "${YELLOW}This will remove Claude Code binary files ONLY.${NC}"
    echo -e "${GREEN}The following will be PRESERVED:${NC}"
    echo -e "${GREEN}  - ~/.claude/ (configuration directory)${NC}"
    echo -e "${GREEN}  - ~/.claude.json (configuration file)${NC}"
    echo -e "${GREEN}  - Shell integration in ~/.zshrc${NC}"
    echo ""
    echo -n "Do you want to continue? [y/N]: "
    read -r response
    case "$response" in
      [yY][eE][sS] | [yY]) ;;
      *)
        log_info "Uninstallation cancelled"
        exit 0
        ;;
    esac
  fi

  # Remove binaries
  if ! remove_binaries; then
    exit_code=1
  fi

  # Verify preservation
  verify_preservation

  echo ""
  if [ $exit_code -eq 0 ]; then
    log_success "Claude Code binary uninstallation complete!"
    echo -e "${GREEN}Binary files have been successfully removed from your system.${NC}"
    echo -e "${GREEN}Configuration files have been preserved.${NC}"
  else
    log_warning "Claude Code binary uninstallation completed with some issues"
  fi

  echo ""
  echo -e "${BLUE}Note: You may need to restart your shell to remove claude from your current session.${NC}"

  # Final verification - check if claude is still accessible
  if command -v claude > /dev/null 2>&1; then
    echo ""
    log_warning "Claude command is still accessible in PATH. You may need to:"
    log_warning "1. Restart your terminal"
    log_warning "2. Check for additional installations"
    log_warning "3. Clear shell command cache with: hash -r"
    exit_code=1
  fi

  exit $exit_code
}

# Handle interrupts cleanly
trap 'log_error "Uninstallation interrupted"; exit 1' INT TERM

main "$@"