#!/bin/bash

# run the migrations script if MIGRATE_DB env var is set
[[ -z "${MIGRATE_DB}" ]] || npm run db:migrate
