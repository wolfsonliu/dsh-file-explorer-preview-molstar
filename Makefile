# dsh-file-explorer-preview-molstar — build / install / deploy helpers.
#
# Typical flow (run the required core plugin first):
#   make install-core     # install dsh-file-explorer into the web profile
#   make install          # npm install
#   make deploy           # build + add this plugin to the web profile
#   make web              # boot: dsh web
#
# One-shot fresh setup:
#   make setup
#
# Overridable variables:
#   PROFILE  (default web)   DSH profile to install into
#   DSH      (default dsh)   the DSH CLI
#   NPM      (default npm)   the package manager

PKG     := $(shell node -p "require('./package.json').name")
DSH     ?= dsh
NPM     ?= npm
PROFILE ?= web

.DEFAULT_GOAL := help
.PHONY: help install ci build check test all setup install-core deploy undeploy redeploy web run

help: ## Show this help
	@printf 'Usage: make <target>\n\n'
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) \
		| awk 'BEGIN { FS = ":.*?## " } { printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2 }'

install: ## Install dev dependencies (npm install)
	$(NPM) install

ci: ## Clean reproducible install (npm ci)
	$(NPM) ci

build: ## Type-check + bundle → lib/ (npm run build)
	$(NPM) run build

check: ## Type-check src/ only (npm run check)
	$(NPM) run check

test: ## Run vitest specs (npm test)
	$(NPM) test

all: install test build ## Install, test, then build

install-core: ## Install the required dsh-file-explorer core plugin
	$(DSH) plugin --profile $(PROFILE) add github:wolfsonliu/dsh-file-explorer

deploy: build ## Build, then add this package to the DSH profile
	$(DSH) plugin --profile $(PROFILE) add .

undeploy: ## Remove this package from the DSH profile
	$(DSH) plugin --profile $(PROFILE) remove $(PKG)

redeploy: undeploy deploy ## Remove and re-add (forces a clean reinstall)

setup: install-core install deploy ## Full setup: core + deps + build + deploy

web: ## Boot the DSH web profile (dsh web)
	$(DSH) web

run: web ## Alias for web