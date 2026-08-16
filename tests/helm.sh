#!/bin/sh
set -eu

chart="charts/md2odt"

helm lint "$chart"

rendered=$(helm template md2odt "$chart" \
  --set httpRoute.enabled=true \
  --set httpRoute.parentRefs[0].name=public-gateway \
  --set httpRoute.parentRefs[0].namespace=gateway-system \
  --set httpRoute.hostnames[0]=md2odt.example.com)

require_manifest_text() {
  if ! printf '%s\n' "$rendered" | grep -q "$1"; then
    printf 'Expected rendered chart to contain: %s\n' "$1" >&2
    exit 1
  fi
}

require_manifest_text "kind: Deployment"
require_manifest_text "helm.sh/chart: md2odt-0.1.0"
require_manifest_text "app.kubernetes.io/name: md2odt"
require_manifest_text 'image: "ghcr.io/sohooo/md2odt:0.1.0"'
require_manifest_text "startupProbe:"
require_manifest_text "readinessProbe:"
require_manifest_text "livenessProbe:"
require_manifest_text "readOnlyRootFilesystem: true"
require_manifest_text "automountServiceAccountToken: false"
require_manifest_text "apiVersion: gateway.networking.k8s.io/v1"
require_manifest_text "kind: HTTPRoute"
require_manifest_text "name: public-gateway"
require_manifest_text "md2odt.example.com"
require_manifest_text "path: /healthz"
