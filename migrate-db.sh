#!/bin/bash

[[ -z "${MIGRATE_DB}" ]] || npm run db:migrate
