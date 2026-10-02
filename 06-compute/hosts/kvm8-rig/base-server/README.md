# Base server: Phase 1 on the KVM 8

Phase 2 of [`../RUNBOOK.md`](../RUNBOOK.md) (Phase 1 of [`../NETWORK-PLAN.md`](../NETWORK-PLAN.md)): a secured base server. It works the same on a KVM 4.

When it's done:
- the server is up to date and updates itself;
- you log in with a key, over Tailscale only;
- Docker is ready;
- Cloudflare Tunnel is connected;
- nothing is open to the internet.

It takes about 30 minutes.

## 1. In hPanel (on your phone or computer)

1. **Choose what to install:** *Plain OS* ▸ **Ubuntu** ▸ **24.04 LTS**. Not a control panel and not an application: everything is installed by the script, as files in this repository.
2. **Server location:** the data centre closest to most of your visitors (for example a US one if you're in the US).
3. **Root password:** a long random one from a password manager. It's only for emergencies through hPanel's browser terminal.
4. **SSH key:** add your public key here if hPanel offers it (see step 2 to make one). The script copies it to your admin user.
5. **Malware scanner:** optional; it doesn't conflict with anything.
6. Finish, and wait until the VPS shows **Running**. Note its **IP address**.

## 2. On your computer: an SSH key (once)

If you don't have one yet, in PowerShell (Windows) or Terminal (Mac):

```
ssh-keygen -t ed25519 -C "techtheworld"
```

Press Enter to accept the location and set a passphrase. Your public key is the file ending in `.pub`:
- Windows: `C:\Users\<you>\.ssh\id_ed25519.pub`
- Mac: `~/.ssh/id_ed25519.pub`

Paste its contents into hPanel ▸ VPS ▸ **SSH keys**.

Also install **Tailscale** on your computer (and phone if you like) from tailscale.com and sign in. Use your GitHub account so it matches the rest of the setup.

## 3. On the server: the base setup

Log in as root with the IP from step 1:

```
ssh root@<server-ip>
```

Download and run the script:

```
curl -fsSL https://raw.githubusercontent.com/quanwatson/techdojo-ots/main/06-compute/hosts/kvm8-rig/base-server/setup.sh -o setup.sh
bash setup.sh base
```

If the repository is private, `curl` can't fetch it. In that case, open `setup.sh` here, copy it, and paste it into `nano setup.sh` on the server.

The script:
- updates Ubuntu;
- creates your admin user `quan` (change it with `ADMIN_USER=yourname bash setup.sh base`);
- adds a 4 GB swap file;
- turns on automatic security updates and the firewall;
- installs Docker and Tailscale.

At the end, it prints a **Tailscale sign-in link**. Open it on your computer to add the server to your network as `ttw-core`.

## 4. Check you can get in over Tailscale

**Keep the root window open.** In a new window on your computer:

```
ssh quan@ttw-core
```

If that logs you in, the private route works.

## 5. Lock it down

Back in the root window:

```
bash setup.sh lockdown
```

From now on:
- SSH only works over Tailscale, with your key;
- root and password logins are off;
- the firewall allows no inbound web traffic at all.

In hPanel ▸ VPS ▸ **Security ▸ Firewall**, add a rule set that allows nothing inbound except UDP 41641 (Tailscale), and attach it to the server. This is the second wall.

If you're ever locked out: hPanel ▸ VPS ▸ **Browser terminal**, as root.

## 6. Connect Cloudflare Tunnel

1. In the Cloudflare dashboard: **Zero Trust ▸ Networks ▸ Tunnels ▸ Create a tunnel** ▸ *Cloudflared* ▸ name it `ttw-core`.
2. Copy the **token**: the long string after `--token` in the install command it shows.
3. On the server (over Tailscale):

```
sudo bash setup.sh tunnel <TOKEN>
```

The tunnel shows **Healthy** in Cloudflare. Public addresses (`kb.`, `tools.`, `shop.`, and the rest) get added to it in Phase 2, as each service goes up.

## Done when

- [ ] `ssh quan@ttw-core` works over Tailscale.
- [ ] `ssh root@<server-ip>` from your computer is refused or times out.
- [ ] A port scan of the server's public IP shows nothing open. For example, an online "open port checker" for ports 22, 80 and 443 shows all closed.
- [ ] The Cloudflare tunnel shows Healthy.
- [ ] `docker run --rm hello-world` prints its greeting.

Then tell Claude, and Phase 2 starts: the Library at `kb.techtheworld.win` behind GitHub sign-in.

## Useful commands

| What | Command |
|---|---|
| See the firewall | `sudo ufw status verbose` |
| See Tailscale | `tailscale status` |
| See the tunnel | `systemctl status cloudflared` |
| Memory and CPU | `htop` |
| Disk space | `df -h /` |
| Running containers | `docker ps` |
