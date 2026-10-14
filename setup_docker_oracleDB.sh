#!/usr/bin/env bash
set -euo pipefail

# Configuration (Removed '!' from password to avoid interactive Bash history expansion issues)
DATA_DIR="${HOME}/oracle-data"
CONTAINER_NAME="oracle-dev"
ORACLE_PWD="YourSecurePassword123"
ORACLE_IMAGE="gvenzl/oracle-free:latest"
SQLCL_IMAGE="container-registry.oracle.com/database/sqlcl:latest"

echo "=== Step 1: Preparing storage directory and permissions ==="
docker rm -f "${CONTAINER_NAME}" 2>/dev/null || true

mkdir -p "${DATA_DIR}"
sudo chmod -R 777 "${DATA_DIR}"

echo "=== Step 2: Pulling Oracle Database Free container image ==="
docker pull "${ORACLE_IMAGE}"

echo "=== Step 3: Launching Oracle Database container ==="
docker run -d \
  --name "${CONTAINER_NAME}" \
  -p 1521:1521 \
  -e ORACLE_PASSWORD="${ORACLE_PWD}" \
  -v "${DATA_DIR}:/opt/oracle/oradata" \
  "${ORACLE_IMAGE}"

echo "=== Step 4: Waiting for Oracle Database to be ready ==="
echo "Streaming logs until 'DATABASE IS READY TO USE!' appears..."

docker logs -f "${CONTAINER_NAME}" &
LOG_PID=$!

while ! docker logs "${CONTAINER_NAME}" 2>&1 | grep -q "DATABASE IS READY TO USE!"; do
  sleep 3
done

kill "${LOG_PID}" 2>/dev/null || true
echo -e "\n Oracle Database Free is up and running!"

echo "=== Step 5: Pulling official standalone SQLcl image ==="
docker pull "${SQLCL_IMAGE}"

echo "=== Step 6: Verifying connection via SQLcl container ==="
docker run -i --rm --network=host "${SQLCL_IMAGE}" \
  -s "sys/${ORACLE_PWD}@localhost:1521/FREEPDB1 as sysdba" <<'EOF'
SET SQLFORMAT ansiconsole;
SHOW CON_NAME;
SHOW PDBS;
SELECT instance_name, status FROM v$instance;
EXIT;
EOF

echo "=========================================================="
echo "Setup Complete!"
echo ""
echo "Quick Connection Commands (Single-quoted for terminal safety):"
echo "1. Run SQLcl via Official Docker container:"
echo "   docker run -it --rm --network=host ${SQLCL_IMAGE} 'sys/${ORACLE_PWD}@localhost:1521/FREEPDB1 as sysdba'"
echo ""
echo "2. Add an alias to ~/.bashrc for direct 'sql' command:"
echo "   echo \"alias sql='docker run -it --rm --network=host -v \\\$(pwd):/sqlcl -w /sqlcl ${SQLCL_IMAGE}'\" >> ~/.bashrc && source ~/.bashrc"
echo ""
echo "3. Once the alias is set, connect anytime with:"
echo "   sql 'sys/${ORACLE_PWD}@localhost:1521/FREEPDB1 as sysdba'"
echo ""
echo "4. Fallback: Run built-in SQL*Plus inside the DB container:"
echo "   docker exec -it ${CONTAINER_NAME} sqlplus 'sys/${ORACLE_PWD}@FREEPDB1 as sysdba'"
echo "=========================================================="
