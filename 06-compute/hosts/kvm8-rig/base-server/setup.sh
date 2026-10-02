#!/usr/bin/env bash
# =============================================================================
# techtheworld.win · Phase 1: the base server (Hostinger KVM 8 or KVM 4, Ubuntu 24.04 LTS)
#
# Run as root on a fresh server, in two steps:
#
#   bash setup.sh base        Updates, your admin user, swap, firewall, automatic
#                             security updates, Docker, Tailscale. Public SSH stays
#                             open so you can't lock yourself out.
#
#   bash setup.sh lockdown    Run only after you've logged in over Tailscale as
#                             your admin user. Closes SSH to the public internet,
#                             turns off password and root login.
#
#   bash setup.sh tunnel <TOKEN>
#                             Installs Cloudflare Tunnel with the token from
#                             Cloudflare Zero Trust ▸ Networks ▸ Tunnels.
#
# Settings (optional, as environment variables):
#   ADMIN_USER   your login name on the server (default: quan)
#   SWAP_GB      swap file size in GB (default: 4)
#
# Safe to run again: each step checks what's already done.
# =============================================================================
set -euo pipefail

ADMIN_USER="${ADMIN_USER:-quan}"
SWAP_GB="${SWAP_GB:-4}"

say()  { printf '\n\033[1;33m==> %s\033[0m\n' "$*"; }
ok()   { printf '    \033[32m✓\033[0m %s\n' "$*"; }
warn() { printf '    \033[31m!\033[0m %s\n' "$*"; }
die()  { printf '\n\033[1;31mStopped: %s\033[0m\n' "$*" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] || die "run this as root (or with sudo)."
. /etc/os-release
[ "${ID:-}" = "ubuntu" ] || die "this script is written for Ubuntu 24.04 LTS (found: ${PRETTY_NAME:-unknown})."

# -----------------------------------------------------------------------------
base() {
  export DEBIAN_FRONTEND=noninteractive

  say "Updating the system"
  apt-get update -q
  apt-get -y -q -o Dpkg::Options::=--force-confold full-upgrade
  apt-get install -y -q ca-certificates curl gnupg ufw fail2ban unattended-upgrades git jq htop
  ok "system up to date"

  say "Time zone and hostname"
  timedatectl set-timezone UTC
  hostnamectl set-hostname ttw-core
  ok "UTC, hostname ttw-core"

  say "Admin user: $ADMIN_USER"
  if ! id "$ADMIN_USER" >/dev/null 2>&1; then
    adduser --disabled-password --gecos "" "$ADMIN_USER"
  fi
  usermod -aG sudo "$ADMIN_USER"
  echo "$ADMIN_USER ALL=(ALL) NOPASSWD:ALL" > "/etc/sudoers.d/90-$ADMIN_USER"
  chmod 440 "/etc/sudoers.d/90-$ADMIN_USER"
  install -d -m 700 -o "$ADMIN_USER" -g "$ADMIN_USER" "/home/$ADMIN_USER/.ssh"
  if [ -s /root/.ssh/authorized_keys ]; then
    cat /root/.ssh/authorized_keys >> "/home/$ADMIN_USER/.ssh/authorized_keys"
    sort -u -o "/home/$ADMIN_USER/.ssh/authorized_keys" "/home/$ADMIN_USER/.ssh/authorized_keys"
    chown "$ADMIN_USER:$ADMIN_USER" "/home/$ADMIN_USER/.ssh/authorized_keys"
    chmod 600 "/home/$ADMIN_USER/.ssh/authorized_keys"
    ok "copied root's SSH key(s) to $ADMIN_USER"
  else
    warn "no SSH key found for root. Add your public key to /home/$ADMIN_USER/.ssh/authorized_keys before 'lockdown'."
  fi

  say "Swap: ${SWAP_GB} GB"
  if ! swapon --show | grep -q /swapfile; then
    fallocate -l "${SWAP_GB}G" /swapfile
    chmod 600 /swapfile
    mkswap /swapfile >/dev/null
    swapon /swapfile
    grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
  fi
  echo 'vm.swappiness=10' > /etc/sysctl.d/90-swap.conf
  sysctl -q --system
  ok "swap on"

  say "Automatic security updates"
  cat > /etc/apt/apt.conf.d/20auto-upgrades <<'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::AutocleanInterval "7";
EOF
  ok "security updates install daily"

  say "Firewall: block everything inbound except SSH (for now)"
  ufw --force reset >/dev/null
  ufw default deny incoming
  ufw default allow outgoing
  ufw allow 22/tcp comment 'SSH, temporary until lockdown'
  ufw allow 41641/udp comment 'Tailscale direct connections'
  ufw --force enable
  ok "firewall on"

  say "fail2ban (slows down password guessing on SSH)"
  systemctl enable --now fail2ban >/dev/null
  ok "fail2ban running"

  say "Docker"
  if ! command -v docker >/dev/null; then
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
    chmod a+r /etc/apt/keyrings/docker.asc
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu ${VERSION_CODENAME} stable" > /etc/apt/sources.list.d/docker.list
    apt-get update -q
    apt-get install -y -q docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  fi
  # Containers publish ports to localhost only unless a compose file says otherwise.
  # Docker skips the ufw firewall for published ports, so this default keeps
  # every service off the internet; Cloudflare Tunnel reaches them from inside.
  mkdir -p /etc/docker
  cat > /etc/docker/daemon.json <<'EOF'
{
  "ip": "127.0.0.1",
  "log-driver": "json-file",
  "log-opts": { "max-size": "10m", "max-file": "3" }
}
EOF
  systemctl restart docker
  usermod -aG docker "$ADMIN_USER"
  ok "Docker $(docker --version | awk '{print $3}' | tr -d ,) with Compose"

  say "Tailscale"
  if ! command -v tailscale >/dev/null; then
    curl -fsSL https://tailscale.com/install.sh | sh
  fi
  if ! tailscale status >/dev/null 2>&1; then
    echo
    echo "    Open the link below on your computer and sign in to Tailscale to add this server:"
    tailscale up --hostname=ttw-core
  fi
  ok "Tailscale address: $(tailscale ip -4 2>/dev/null || echo 'not connected yet')"

  cat <<EOF

=============================================================================
 Base setup done.

 Next, from YOUR computer (with Tailscale installed and signed in):

     ssh $ADMIN_USER@ttw-core          (or: ssh $ADMIN_USER@$(tailscale ip -4 2>/dev/null || echo '<tailscale-ip>'))

 If that works, come back here and run:

     bash setup.sh lockdown

 Don't close this session until the Tailscale login works.
=============================================================================
EOF
}

# -----------------------------------------------------------------------------
lockdown() {
  say "Checking it's safe to close public SSH"
  tailscale status >/dev/null 2>&1 || die "Tailscale isn't connected. Run 'bash setup.sh base' first."
  [ -s "/home/$ADMIN_USER/.ssh/authorized_keys" ] || die "$ADMIN_USER has no SSH key; you'd be locked out."
  ok "Tailscale connected, $ADMIN_USER has a key"

  say "SSH: keys only, no root, no passwords"
  cat > /etc/ssh/sshd_config.d/90-ttw.conf <<'EOF'
PermitRootLogin no
PasswordAuthentication no
KbdInteractiveAuthentication no
PubkeyAuthentication yes
X11Forwarding no
MaxAuthTries 3
EOF
  sshd -t || die "the SSH settings didn't validate; nothing changed."
  systemctl restart ssh 2>/dev/null || systemctl restart sshd
  ok "SSH hardened"

  say "Firewall: SSH only over Tailscale"
  ufw allow in on tailscale0 to any port 22 proto tcp comment 'SSH over Tailscale only'
  ufw delete allow 22/tcp >/dev/null 2>&1 || true
  ufw reload
  ok "public SSH closed"

  cat <<'EOF'

=============================================================================
 Locked down. SSH now works only over Tailscale, with your key.

 If you ever get locked out, use hPanel ▸ VPS ▸ Browser terminal.

 Also in hPanel ▸ VPS ▸ Security ▸ Firewall: create a rule set that allows
 nothing inbound except UDP 41641, and attach it to this server.
=============================================================================
EOF
}

# -----------------------------------------------------------------------------
tunnel() {
  local token="${1:-}"
  [ -n "$token" ] || die "usage: bash setup.sh tunnel <TOKEN>  (copy it from Cloudflare Zero Trust ▸ Networks ▸ Tunnels ▸ your tunnel)."
  say "Cloudflare Tunnel"
  if ! command -v cloudflared >/dev/null; then
    install -m 0755 -d /usr/share/keyrings
    curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg -o /usr/share/keyrings/cloudflare-main.gpg
    echo "deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared any main" > /etc/apt/sources.list.d/cloudflared.list
    apt-get update -q && apt-get install -y -q cloudflared
  fi
  cloudflared service install "$token" || systemctl restart cloudflared
  systemctl is-active --quiet cloudflared && ok "tunnel connected; add public hostnames in the Cloudflare dashboard" || warn "cloudflared isn't running; check: journalctl -u cloudflared"
}

case "${1:-}" in
  base) base ;;
  lockdown) lockdown ;;
  tunnel) shift; tunnel "${1:-}" ;;
  *) sed -n '2,24p' "$0"; exit 1 ;;
esac
