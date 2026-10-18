#!/usr/bin/env bash
# Kubernetes Deep-Dive: SRE Revision Guide
# This script is meant to be read as a tutorial and executed step-by-step.
# It automates the extraction of dynamic values (like container IDs and IPs)
# to prove the concepts from Chapters 1-4.

set -e

echo "=== PREREQUISITES & CLUSTER SETUP ==="
# Install kind (Kubernetes in Docker) and kubectl if they don't exist
if ! command -v kind &> /dev/null; then
    curl -Lo ./kind https://kind.sigs.k8s.io/dl/latest/kind-linux-amd64
    chmod +x ./kind
    sudo mv ./kind /usr/local/bin/kind
fi

if ! command -v kubectl &> /dev/null; then
    sudo snap install kubectl --classic
fi

# Spin up the cluster
kind get clusters | grep -q "deep-dive" || kind create cluster --name deep-dive

# Helper variable for running commands inside the control plane node
NODE="docker exec deep-dive-control-plane"

echo -e "\n=== CHAPTER 1: THE API SERVER & ETCD ==="
# The API server translates REST to Protobuf and stores it in etcd.
# We bypass the API server to query etcd directly on the node.

# Install etcd-client on the node
$NODE apt-get update -qq
$NODE apt-get install -y -qq etcd-client

# Query raw etcd keys (bypassing API server authorization and decoding)
echo "[*] Listing raw etcd keys for the cluster:"
$NODE env ETCDCTL_API=3 etcdctl \
  --endpoints=https://127.0.0.1:2379 \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \
  --cert=/etc/kubernetes/pki/etcd/healthcheck-client.crt \
  --key=/etc/kubernetes/pki/etcd/healthcheck-client.key \
  get /registry/ --prefix --keys-only | head -n 10

echo -e "\n=== CHAPTER 2: KUBELET, CRI & CGROUPS ==="
# Kubelet delegates to the CRI (containerd) to create namespaces and cgroups.
kubectl run deep-dive-nginx --image=nginx --requests=memory=64Mi --limits=memory=128Mi || true
kubectl wait --for=condition=Ready pod/deep-dive-nginx --timeout=30s

# Get the container ID via CRI (crictl) instead of kubectl
CONTAINER_ID=$($NODE crictl ps --name deep-dive-nginx -q)
echo "[*] CRI Container ID: $CONTAINER_ID"

# Ask the CRI for the exact host PID
PID=$($NODE bash -c "crictl inspect $CONTAINER_ID | grep -m 1 '\"pid\"' | awk '{print \$2}' | tr -d ','")
echo "[*] Nginx Host PID: $PID"

# Use nsenter to run a command inside the Pod's network namespace directly from the host
echo "[*] Network namespace IP address (via nsenter):"
$NODE nsenter -t $PID -n ip -4 a

# Inspect the raw cgroups v2 memory limit programmed by kubelet
# 128Mi = 134217728 bytes
echo "[*] Cgroups v2 memory.max limit applied to this container:"
$NODE bash -c "POD_CGROUP=\$(find /sys/fs/cgroup/kubepods.slice/ -name \"*deep-dive-nginx*\" -type d | head -n 1); cat \$POD_CGROUP/memory.max"

echo -e "\n=== CHAPTER 3: CONTROLLERS & RECONCILIATION ==="
# Controllers use HTTP/2 watches against the API server.
# NOTE: To watch the level-triggered event stream live, open a separate terminal and run:
#   kubectl get events --watch --output-watch-events

echo "[*] Creating a Deployment to trigger the Controller Manager and Scheduler loop..."
kubectl create deployment deep-dive-deploy --image=nginx --replicas=2 --dry-run=client -o yaml | kubectl apply -f -
kubectl wait --for=condition=Available deployment/deep-dive-deploy --timeout=30s

echo -e "\n=== CHAPTER 4: CNI, KUBE-PROXY & KERNEL ROUTING ==="
# Kube-proxy translates Service ClusterIPs into iptables DNAT rules.
kubectl expose deployment deep-dive-deploy --port=80 --target-port=80 --dry-run=client -o yaml | kubectl apply -f -
CLUSTER_IP=$(kubectl get svc deep-dive-deploy -o jsonpath='{.spec.clusterIP}')
echo "[*] Service ClusterIP created: $CLUSTER_IP"

# Trace the iptables chains created by kube-proxy
echo "[*] 1. KUBE-SERVICES chain intercepting traffic to the ClusterIP:"
KUBE_SVC_CHAIN=$($NODE iptables-save -t nat | grep "$CLUSTER_IP/32" | grep -o 'KUBE-SVC-[a-zA-Z0-9-]*' | head -n 1)
$NODE iptables-save -t nat | grep "$CLUSTER_IP/32"

echo "[*] 2. The Load Balancer (KUBE-SVC) chain splitting traffic 50/50 using the statistic module:"
$NODE iptables-save -t nat | grep "^-A $KUBE_SVC_CHAIN"

echo "[*] 3. The Service Endpoint (KUBE-SEP) chain applying DNAT to the actual Pod IP:"
KUBE_SEP_CHAIN=$($NODE iptables-save -t nat | grep "^-A $KUBE_SVC_CHAIN" | grep -o 'KUBE-SEP-[a-zA-Z0-9-]*' | head -n 1)
$NODE iptables-save -t nat | grep "^-A $KUBE_SEP_CHAIN" | grep DNAT

echo -e "\n=== SCRIPT COMPLETE ==="
echo "To proceed to Chapter 5 (strace on Kubelet), let me know!"
