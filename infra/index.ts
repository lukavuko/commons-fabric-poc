import * as pulumi from "@pulumi/pulumi";
import * as command from "@pulumi/command";
// import * as cloudflare from "@pulumi/cloudflare"; // uncomment when managing DNS here
// import * as oci from "@pulumi/oci";               // uncomment for Oracle Cloud compute
// import * as fly from "@ediri/fly";                // uncomment for Fly.io compute

const config = new pulumi.Config();

// ─── Stack config ──────────────────────────────────────────────────────────
// Values:  pulumi config set <key> <value>
// Secrets: pulumi config set --secret <key> <value>
//
// Required secrets (not committed):
//   pulumi config set --secret cfp-poc:host <vps-ip>
//   pulumi config set --secret cfp-poc:sshPrivateKey "$(cat ~/.ssh/id_rsa)"

const host = config.requireSecret("host");
const sshUser = config.get("sshUser") ?? "ubuntu";
const sshPrivateKey = config.requireSecret("sshPrivateKey");
const appDir = config.get("appDir") ?? "/opt/cfp";
const domain = config.get("domain") ?? "commonsfabric.app";

// ─── SSH connection ─────────────────────────────────────────────────────────
const connection = {
  host,
  user: sshUser,
  privateKey: sshPrivateKey,
};

// ─── Bootstrap ─────────────────────────────────────────────────────────────
// Installs Docker on the VPS and creates the app directory.
// Safe to re-run — `which docker` short-circuits if already installed.
const bootstrap = new command.remote.Command("bootstrap", {
  connection,
  create: pulumi.interpolate`
    set -e
    which docker || (curl -fsSL https://get.docker.com | sh && sudo usermod -aG docker ${sshUser})
    sudo mkdir -p ${appDir}
    sudo chown ${sshUser}:${sshUser} ${appDir}
    [ -d ${appDir}/.git ] || git clone <REPO_URL> ${appDir}
  `,
});

// ─── Deploy ────────────────────────────────────────────────────────────────
// Pulls latest main, rebuilds containers, and restarts the stack.
// Caddy handles TLS automatically on first run — no cert management needed.
const deploy = new command.remote.Command("deploy", {
  connection,
  create: pulumi.interpolate`
    set -e
    cd ${appDir}
    git fetch origin main
    git reset --hard origin/main
    docker compose -f docker-compose.yml -f docker-compose.prod.yml pull --quiet
    docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build --remove-orphans
    docker system prune -f
  `,
  // Increment this string to force a redeploy on next `pulumi up`
  triggers: ["v1"],
}, { dependsOn: bootstrap });

// ─── DNS via Cloudflare ────────────────────────────────────────────────────
// Uncomment once the domain and zone ID are confirmed.
//
// const zoneId = config.require("cloudflareZoneId");
//
// const rootRecord = new cloudflare.Record("root", {
//   zoneId,
//   name: "@",
//   type: "A",
//   value: host,
//   ttl: 1,
//   proxied: true,   // route through Cloudflare CDN
// });
//
// const wwwRecord = new cloudflare.Record("www", {
//   zoneId,
//   name: "www",
//   type: "CNAME",
//   value: domain,
//   ttl: 1,
//   proxied: true,
// });

// ─── Outputs ───────────────────────────────────────────────────────────────
export const appUrl = pulumi.interpolate`https://${domain}`;
export const deployStatus = deploy.stdout;
