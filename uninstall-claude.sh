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
      echo "Options:"
      echo "  --force, -f    Skip confirmation prompts"
      echo "  --quiet, -q    Suppress non-error output (implies --force)"
      echo "  --help, -h     Show this help message"
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

# Check for musl on Linux
if [ "$os" = "linux" ]; then
  if [ -f /lib/libc.musl-x86_64.so.1 ] || [ -f /lib/libc.musl-aarch64.so.1 ] || ldd /bin/ls 2>&1 | grep -q musl; then
    platform="linux-${arch}-musl"
  else
    platform="linux-${arch}"
  fi
else
  platform="${os}-${arch}"
fi

log_info "Detected platform: $platform"

# Command detection helper - try command -v first, fallback to which
find_command() {
  command -v "$1" 2> /dev/null || which "$1" 2> /dev/null
}

# Define paths based on OS
if [ "$os" = "darwin" ]; then
  CLAUDE_DIR="$HOME/.claude"
  BINARY_PATHS=(
    "$HOME/.local/bin/claude"
    "/usr/local/bin/claude"
    "/opt/homebrew/bin/claude"
  )
  NPM_PATHS=(
    "/usr/local/lib/node_modules/@anthropic-ai/claude-code"
    "/opt/homebrew/lib/node_modules/@anthropic-ai/claude-code"
    "$HOME/.npm-global/lib/node_modules/@anthropic-ai/claude-code"
  )
  SHELL_CONFIGS=(
    "$HOME/.zshrc"
    "$HOME/.bashrc"
    "$HOME/.bash_profile"
    "$HOME/.profile"
  )
else
  CLAUDE_DIR="$HOME/.claude"
  BINARY_PATHS=(
    "$HOME/.local/bin/claude"
    "/usr/local/bin/claude"
    "$HOME/bin/claude"
  )
  NPM_PATHS=(
    "/usr/local/lib/node_modules/@anthropic-ai/claude-code"
    "/usr/lib/node_modules/@anthropic-ai/claude-code"
    "$HOME/.npm-global/lib/node_modules/@anthropic-ai/claude-code"
  )
  SHELL_CONFIGS=(
    "$HOME/.bashrc"
    "$HOME/.zshrc"
    "$HOME/.profile"
    "$HOME/.bash_profile"
  )
fi

find_claude_binary() {
  for path in "${BINARY_PATHS[@]}"; do
    if [ -f "$path" ] && [ -x "$path" ]; then
      echo "$path"
      return 0
    fi
  done

  if find_command claude > /dev/null; then
    local claude_path
    claude_path=$(find_command claude)
    # resolve symlinks if possible
    if command -v realpath > /dev/null 2>&1; then
      realpath "$claude_path" 2> /dev/null || echo "$claude_path"
    else
      echo "$claude_path"
    fi
    return 0
  fi

  return 1
}

check_installation_type() {
  local claude_binary
  claude_binary=$(find_claude_binary)

  if [ -n "$claude_binary" ]; then
    if "$claude_binary" --version 2> /dev/null | grep -q "Claude Code"; then
      if echo "$claude_binary" | grep -q "node_modules/@anthropic-ai/claude-code"; then
        echo "npm"
      else
        echo "native"
      fi
    else
      echo "unknown"
    fi
  else
    echo "none"
  fi
}

remove_shell_integration() {
  local removed_count=0

  for config_file in "${SHELL_CONFIGS[@]}"; do
    if [ -f "$config_file" ]; then
      # backup before modifying
      cp "$config_file" "${config_file}.claude-backup.$(date +%Y%m%d-%H%M%S)" 2> /dev/null || true

      # sed syntax differs between macOS and Linux
      if [ "$os" = "darwin" ]; then
        if sed -i '' -e '/# Claude Code integration/,/# End Claude Code integration/d' \
          -e '/claude.*completion/d' \
          -e '/claude.*autocompletion/d' \
          -e '/export.*CLAUDE/d' "$config_file" 2> /dev/null; then
          removed_count=$((removed_count + 1))
          log_info "Cleaned shell integration from $config_file"
        fi
      else
        if sed -i -e '/# Claude Code integration/,/# End Claude Code integration/d' \
          -e '/claude.*completion/d' \
          -e '/claude.*autocompletion/d' \
          -e '/export.*CLAUDE/d' "$config_file" 2> /dev/null; then
          removed_count=$((removed_count + 1))
          log_info "Cleaned shell integration from $config_file"
        fi
      fi
    fi
  done

  if [ $removed_count -gt 0 ]; then
    log_success "Removed shell integration from $removed_count config file(s)"
  fi
}

run_claude_uninstall() {
  local claude_binary
  local install_type
  claude_binary=$(find_claude_binary)
  install_type=$(check_installation_type)

  if [ -n "$claude_binary" ]; then
    log_info "Found Claude binary at: $claude_binary (Type: $install_type)"

    if "$claude_binary" --help 2> /dev/null | grep -q "uninstall\|remove"; then
      log_info "Running built-in claude uninstall command..."
      if "$claude_binary" uninstall 2> /dev/null; then
        log_success "Built-in claude uninstall command completed"
        return 0
      else
        log_warning "Built-in claude uninstall command failed, proceeding with manual cleanup"
      fi
    else
      log_info "No built-in uninstall command found, proceeding with manual cleanup"
    fi

    # try npm uninstall for npm installations
    if [ "$install_type" = "npm" ]; then
      if find_command npm > /dev/null; then
        if npm uninstall -g @anthropic-ai/claude-code > /dev/null 2>&1; then
          log_success "NPM uninstall completed"
          return 0
        else
          log_warning "NPM uninstall failed, proceeding with manual cleanup"
        fi
      fi
    fi
  else
    log_info "No Claude binary found, proceeding with manual cleanup"
  fi

  return 1
}

remove_binaries() {
  local removed_count=0
  local failed_count=0

  log_info "Removing binary files..."

  for binary_path in "${BINARY_PATHS[@]}"; do
    if [ -f "$binary_path" ]; then
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

  # remove any claude binary in PATH
  if find_command claude > /dev/null; then
    local claude_in_path
    claude_in_path=$(find_command claude)
    log_info "Checking claude in PATH: $claude_in_path"
    # safety check - only remove files ending with "claude"
    if [ -f "$claude_in_path" ] && [[ "$claude_in_path" == */claude ]]; then
      if rm -f "$claude_in_path" 2> /dev/null; then
        removed_count=$((removed_count + 1))
        log_success "Removed binary from PATH: $claude_in_path"
      else
        log_warning "Could not remove $claude_in_path (try: sudo rm -f $claude_in_path)"
        failed_count=$((failed_count + 1))
      fi
    else
      log_info "PATH binary does not match expected pattern, skipping"
    fi
  else
    log_info "No claude command found in PATH"
  fi

  if [ $removed_count -gt 0 ]; then
    log_success "Successfully removed $removed_count binary file(s)"
  else
    log_info "No binary files were found to remove"
  fi

  if [ $failed_count -gt 0 ]; then
    log_warning "Failed to remove $failed_count binary file(s)"
  fi

  [ $failed_count -eq 0 ]
}

cleanup_npm_installation() {
  local removed_npm=false
  local failed=false

  log_info "Checking for npm installation..."

  if find_command npm > /dev/null; then
    if npm list -g @anthropic-ai/claude-code > /dev/null 2>&1; then
      log_info "Found npm installation, using official uninstall method..."
      local npm_output
      if npm_output=$(npm uninstall -g @anthropic-ai/claude-code 2>&1); then
        log_success "Removed Claude Code via official npm uninstall"
        removed_npm=true
      else
        log_warning "Official npm uninstall failed, trying manual cleanup"
        # npm ENOTEMPTY errors are common and expected
        if echo "$npm_output" | grep -q "ENOTEMPTY"; then
          log_info "npm ENOTEMPTY error detected - this is a common npm issue"
          log_info "Manual cleanup will handle this..."
        else
          log_info "Try running manually: npm uninstall -g @anthropic-ai/claude-code"
        fi
        failed=true
      fi
    fi

    # remove npm binary symlink
    local npm_bin
    npm_bin=$(npm bin -g 2> /dev/null)
    if [ -n "$npm_bin" ] && [ -f "$npm_bin/claude" ]; then
      if rm -f "$npm_bin/claude" 2> /dev/null; then
        log_success "Removed npm binary: $npm_bin/claude"
        removed_npm=true
      else
        log_warning "Could not remove npm binary: $npm_bin/claude"
        failed=true
      fi
    fi
  fi

  # manual cleanup of npm directories
  for npm_path in "${NPM_PATHS[@]}"; do
    if [ -d "$npm_path" ]; then
      if rm -rf "$npm_path" 2> /dev/null; then
        log_success "Removed npm installation directory: $npm_path"
        removed_npm=true
      else
        log_warning "Could not remove npm directory: $npm_path"
        failed=true
      fi
    fi
  done

  if [ "$removed_npm" = true ]; then
    log_success "NPM installation cleanup completed"
  fi

  [ "$failed" = false ]
}

remove_claude_directory() {
  # safety check - only remove ~/.claude
  if [[ "$CLAUDE_DIR" != "$HOME/.claude" ]]; then
    log_error "Refusing to remove unexpected directory: $CLAUDE_DIR"
    return 1
  fi

  if [ -d "$CLAUDE_DIR" ]; then
    local dir_size
    dir_size=$(du -sh "$CLAUDE_DIR" 2> /dev/null | cut -f1 || echo "unknown size")

    if [ "$FORCE" = false ] && [ "$QUIET" = false ]; then
      echo -e "${YELLOW}This will remove the Claude directory: $CLAUDE_DIR${NC}"
      echo -e "${YELLOW}Directory size: $dir_size${NC}"
      echo -e "${YELLOW}This includes configuration, cache, and downloaded files.${NC}"
      echo -n "Are you sure you want to continue? [y/N]: "
      read -r response
      case "$response" in
        [yY][eE][sS] | [yY]) ;;

        *)
          log_info "Skipping Claude directory removal"
          return 0
          ;;
      esac
    fi

    if rm -rf "$CLAUDE_DIR"; then
      log_success "Removed Claude directory: $CLAUDE_DIR ($dir_size)"
      return 0
    else
      log_error "Failed to remove Claude directory: $CLAUDE_DIR"
      return 1
    fi
  else
    log_info "Claude directory not found: $CLAUDE_DIR"
    return 0
  fi
}

cleanup_package_managers() {
  if [ "$os" = "darwin" ] && find_command brew > /dev/null; then
    if brew list claude > /dev/null 2>&1; then
      log_info "Found Homebrew installation, attempting to uninstall..."
      if brew uninstall claude 2> /dev/null; then
        log_success "Removed Claude via Homebrew"
        return 0
      else
        log_warning "Failed to remove Claude via Homebrew"
        return 1
      fi
    fi
  fi

  return 0
}

main() {
  local exit_code=0

  log_info "Starting Claude Code uninstallation for $platform..."
  
  # Display detection results
  log_info "Scanning for Claude installations..."
  log_info "Claude directory: $CLAUDE_DIR"
  if [ -d "$CLAUDE_DIR" ]; then
    local dir_size
    dir_size=$(du -sh "$CLAUDE_DIR" 2> /dev/null | cut -f1 || echo "unknown size")
    log_info "  ✓ Found: $CLAUDE_DIR ($dir_size)"
  else
    log_info "  ✗ Not found: $CLAUDE_DIR"
  fi
  
  log_info "Checking binary paths:"
  for binary_path in "${BINARY_PATHS[@]}"; do
    if [ -f "$binary_path" ] && [ -x "$binary_path" ]; then
      log_info "  ✓ Found: $binary_path"
    else
      log_info "  ✗ Not found: $binary_path"
    fi
  done
  
  # Check claude in PATH
  if find_command claude > /dev/null; then
    local claude_in_path
    claude_in_path=$(find_command claude)
    log_info "  ✓ Found in PATH: $claude_in_path"
  else
    log_info "  ✗ Not found in PATH"
  fi
  
  log_info "Checking NPM paths:"
  for npm_path in "${NPM_PATHS[@]}"; do
    if [ -d "$npm_path" ]; then
      log_info "  ✓ Found: $npm_path"
    else
      log_info "  ✗ Not found: $npm_path"
    fi
  done
  
  # Check npm global installation
  if find_command npm > /dev/null; then
    if npm list -g @anthropic-ai/claude-code > /dev/null 2>&1; then
      log_info "  ✓ Found npm global installation"
    else
      log_info "  ✗ No npm global installation found"
    fi
  else
    log_info "  ✗ npm not available"
  fi
  
  echo ""

  if [ "$FORCE" = false ] && [ "$QUIET" = false ]; then
    echo -e "${YELLOW}This will remove Claude Code binary files only.${NC}"
    echo -e "${YELLOW}Configuration files in ~/.claude will be preserved.${NC}"
    echo -e "${YELLOW}  - Claude binary files${NC}"
    # echo -e "${YELLOW}  - Shell integration${NC}"
    # echo -e "${YELLOW}  - Configuration and cache files${NC}"
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

  # try built-in uninstall first
  if ! run_claude_uninstall; then
    log_info "Performing manual cleanup..."

    # DISABLED: remove_shell_integration

    if ! remove_binaries; then
      exit_code=1
    fi

    # DISABLED: cleanup_npm_installation
    # if ! cleanup_npm_installation; then
    #   exit_code=1
    # fi

    # DISABLED: cleanup_package_managers  
    # if ! cleanup_package_managers; then
    #   exit_code=1
    # fi
  fi

  # DISABLED: always try to remove the Claude directory
  # if ! remove_claude_directory; then
  #   exit_code=1
  # fi

  if [ $exit_code -eq 0 ]; then
    log_success "Claude Code uninstallation complete!"
  else
    log_warning "Claude Code uninstallation completed with some issues"
  fi

  echo ""
  echo -e "${GREEN}✅ Claude Code binaries have been successfully removed from your system.${NC}"
  echo -e "${GREEN}Configuration files in ~/.claude are preserved.${NC}"
  echo ""
  echo -e "${BLUE}Note: You may need to restart your shell or run 'source ~/.bashrc' (or equivalent)${NC}"
  echo -e "${BLUE}to remove claude from your current shell session.${NC}"

  # check if claude is still accessible
  if command -v claude > /dev/null 2>&1; then
    echo ""
    log_warning "Claude command is still accessible in PATH. You may need to:"
    log_warning "1. Restart your terminal"
    log_warning "2. Check for additional installations"
    log_warning "3. Manually remove remaining files"
    exit_code=1
  fi

  exit $exit_code
}

# handle interrupts cleanly
trap 'log_error "Uninstallation interrupted"; exit 1' INT TERM

main "$@"
