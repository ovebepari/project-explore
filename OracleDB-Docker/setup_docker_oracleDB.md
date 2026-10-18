# Oracle Database Free — Docker Setup Guide

> **Local Development Setup** — Spin up an Oracle Database Free instance in Docker with persistent storage, then connect using the official **SQLcl** container image. Zero native installs required.

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                            HOST MACHINE                                  │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                      Docker Engine                                  │ │
│  │                                                                     │ │
│  │  ┌───────────────────────────────┐   ┌────────────────────────────┐ │ │
│  │  │  oracle-dev container        │   │  SQLcl container           │ │ │
│  │  │  (gvenzl/oracle-free:latest) │   │  (oracle/sqlcl:latest)     │ │ │
│  │  │                              │   │                            │ │ │
│  │  │  ┌────────────────────────┐  │   │  Ephemeral (--rm)          │ │ │
│  │  │  │  Oracle Database Free  │  │   │  Runs SQLcl client         │ │ │
│  │  │  │                        │  │   │  Connects via --network=   │ │ │
│  │  │  │  Listener: 1521       │◄─┼───┤  host to localhost:1521    │ │ │
│  │  │  │  PDB: FREEPDB1        │  │   │                            │ │ │
│  │  │  │  SID: FREE            │  │   └────────────────────────────┘ │ │
│  │  │  └────────────────────────┘  │                                  │ │
│  │  │                              │                                  │ │
│  │  │  Port Map: 1521 ──► 1521     │                                  │ │
│  │  └──────────┬────────────────────┘                                  │ │
│  │             │ Volume Mount                                         │ │
│  └─────────────┼───────────────────────────────────────────────────────┘ │
│                │                                                        │
│  ┌─────────────▼──────────────────────────────┐                         │
│  │  ~/oracle-data  ──►  /opt/oracle/oradata    │                         │
│  │  (Persistent storage for datafiles,         │                         │
│  │   redo logs, control files)                 │                         │
│  └─────────────────────────────────────────────┘                         │
│                                                                          │
│  Connection Methods:                                                     │
│  ─────────────────                                                       │
│  1. SQLcl via Docker    ──►  docker run ... sqlcl 'sys/...@localhost'    │
│  2. SQLcl alias         ──►  sql 'sys/...@localhost:1521/FREEPDB1'      │
│  3. SQL*Plus (built-in) ──►  docker exec ... sqlplus 'sys/...@FREEPDB1' │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Configuration

| Variable         | Default Value                                          | Description                          |
|------------------|--------------------------------------------------------|--------------------------------------|
| `DATA_DIR`       | `$HOME/oracle-data`                                    | Host directory for persistent data   |
| `CONTAINER_NAME` | `oracle-dev`                                           | Docker container name                |
| `ORACLE_PWD`     | `YourSecurePassword123`                                | SYS/SYSTEM password                  |
| `ORACLE_IMAGE`   | `gvenzl/oracle-free:latest`                            | Oracle DB container image            |
| `SQLCL_IMAGE`    | `container-registry.oracle.com/database/sqlcl:latest`  | Official SQLcl image                 |

> **Note:** The password deliberately avoids `!` characters to prevent Bash history expansion issues in interactive shells.

---

## Step-by-Step Walkthrough

### Step 1 — Prepare Storage Directory

Remove any existing container with the same name, create the data directory, and set permissions:

```bash
docker rm -f "oracle-dev" 2>/dev/null || true
mkdir -p "$HOME/oracle-data"
sudo chmod -R 777 "$HOME/oracle-data"
```

```
  Host Filesystem
  ────────────────
  ~/oracle-data/        ◄── Oracle writes datafiles, redo logs,
       │                     and control files here
       └── Mounted as /opt/oracle/oradata inside the container
```

### Step 2 — Pull the Oracle Image

```bash
docker pull gvenzl/oracle-free:latest
```

This is the community-maintained [gvenzl/oracle-free](https://github.com/gvenzl/oci-oracle-free) image — significantly smaller and faster to start than Oracle's official images.

### Step 3 — Launch the Database Container

```bash
docker run -d \
  --name "oracle-dev" \
  -p 1521:1521 \
  -e ORACLE_PASSWORD="YourSecurePassword123" \
  -v "$HOME/oracle-data:/opt/oracle/oradata" \
  gvenzl/oracle-free:latest
```

| Flag                   | Purpose                                              |
|------------------------|------------------------------------------------------|
| `-d`                   | Run detached (background)                            |
| `--name oracle-dev`    | Give the container a stable name                     |
| `-p 1521:1521`         | Expose Oracle listener on the host                   |
| `-e ORACLE_PASSWORD`   | Set SYS and SYSTEM passwords                         |
| `-v ~/oracle-data:...` | Persist data across container restarts               |

### Step 4 — Wait for Database Readiness

The script streams logs and polls for the `DATABASE IS READY TO USE!` marker:

```bash
docker logs -f "oracle-dev" &
LOG_PID=$!

while ! docker logs "oracle-dev" 2>&1 | grep -q "DATABASE IS READY TO USE!"; do
  sleep 3
done

kill "$LOG_PID" 2>/dev/null || true
```

```
  Container Startup Sequence
  ──────────────────────────
  1. Initialize datafiles         ░░░░░░░░░░░░░░░░░░░░
  2. Create PDB (FREEPDB1)        ░░░░░░░░░░░░░░░░░░░░
  3. Open redo log writer          ░░░░░░░░░░░░░░░░░░░░
  4. Start listener on 1521       ░░░░░░░░░░░░░░░░░░░░
  5. "DATABASE IS READY TO USE!"  ✔  ◄── Script unblocks here
```

> First-time startup can take **2–5 minutes** depending on hardware. Subsequent starts with existing data are much faster.

### Step 5 — Pull the SQLcl Image

```bash
docker pull container-registry.oracle.com/database/sqlcl:latest
```

SQLcl is Oracle's modern SQL client — supports formatting, scripting, and Liquibase out of the box.

### Step 6 — Verify the Connection

```bash
docker run -i --rm --network=host \
  container-registry.oracle.com/database/sqlcl:latest \
  -s "sys/YourSecurePassword123@localhost:1521/FREEPDB1 as sysdba" <<'EOF'
SET SQLFORMAT ansiconsole;
SHOW CON_NAME;
SHOW PDBS;
SELECT instance_name, status FROM v$instance;
EXIT;
EOF
```

Expected output confirms:
- Connected to **FREEPDB1** (pluggable database)
- Instance status is **OPEN**

---

## Quick Connection Reference

### 1. SQLcl via Docker (ad-hoc)

```bash
docker run -it --rm --network=host \
  container-registry.oracle.com/database/sqlcl:latest \
  'sys/YourSecurePassword123@localhost:1521/FREEPDB1 as sysdba'
```

### 2. Shell Alias (recommended for daily use)

Add to `~/.bashrc`:

```bash
alias sql='docker run -it --rm --network=host \
  -v $(pwd):/sqlcl -w /sqlcl \
  container-registry.oracle.com/database/sqlcl:latest'
```

Then connect with:

```bash
sql 'sys/YourSecurePassword123@localhost:1521/FREEPDB1 as sysdba'
```

> The `-v $(pwd):/sqlcl -w /sqlcl` mount lets you run `.sql` scripts from your current directory.

### 3. SQL*Plus (built into the DB container)

```bash
docker exec -it oracle-dev \
  sqlplus 'sys/YourSecurePassword123@FREEPDB1 as sysdba'
```

---

## Connection Methods — Decision Flow

```
  Need to connect to Oracle?
           │
           ├── Want a modern client with formatting?
           │        │
           │        └── YES ──► SQLcl container (Method 1 or 2)
           │
           ├── Need to run .sql files from current directory?
           │        │
           │        └── YES ──► SQLcl alias with volume mount (Method 2)
           │
           └── Just need a quick check, no extra images?
                    │
                    └── YES ──► SQL*Plus inside DB container (Method 3)
```

---

## Cleanup

```bash
# Stop and remove the database container
docker rm -f oracle-dev

# Remove persistent data (WARNING: destroys all database data)
rm -rf ~/oracle-data

# Optionally remove the images
docker rmi gvenzl/oracle-free:latest
docker rmi container-registry.oracle.com/database/sqlcl:latest
```
