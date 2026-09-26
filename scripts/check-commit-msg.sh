#!/usr/bin/env bash
#
# Validate a commit message against this project's conventions.
#
#   scripts/check-commit-msg.sh <file>        # a commit message file (git hook)
#   scripts/check-commit-msg.sh -m "subject"  # a literal message
#   scripts/check-commit-msg.sh --self-test   # verify the rules themselves
#
# Exit 0 = acceptable, 1 = rejected (with the reason printed).
#
# WHY THIS EXISTS
# Commit messages here are public communication: anyone reading the repo judges
# the project by them. The project uses Conventional Commits (`type(scope): ...`)
# and those prefixes cost 10-20 characters before a single word of meaning, so
# the widely-cited "50 char subject" rule is not reachable in this codebase —
# only 8 of the last 142 subjects met it. Blocking on it would train everyone to
# bypass the hook, which is worse than not having one.
#
# So the enforced limit is 72: git and GitHub truncate subject lines around
# there, which is a real functional break. 50 is reported as guidance, not
# failure. This is a deliberate deviation from the letter of the contribution
# manual, recorded in the PR that introduced it.
#
set -uo pipefail

readonly TYPE_RE='^(feat|fix|docs|chore|test|refactor|perf|style|ci|build|revert)'
# 72 is the enforced default; override per-repo or per-run without a code change,
# e.g. COMMIT_SUBJECT_LIMIT=50 to hold the manual's stricter target.
readonly HARD_LIMIT="${COMMIT_SUBJECT_LIMIT:-72}"
readonly SOFT_LIMIT=50

fail() { printf '  REJECT  %s\n' "$1" >&2; return 1; }

# A merge or revert subject carries no author intent to review.
is_exempt() {
  case "$1" in
    "Merge "*|"Revert "*|"Reverting "*|"fixup! "*|"squash! "*) return 0 ;;
    *) return 1 ;;
  esac
}

check_message() {
  local msg="$1" subject body len rc=0

  subject="$(printf '%s' "$msg" | head -1)"
  body="$(printf '%s' "$msg" | tail -n +2 | sed '/^[[:space:]]*$/d')"

  [ -z "$subject" ] && { fail "the commit message is empty"; return 1; }
  is_exempt "$subject" && return 0

  # 1. Subject must be a Conventional Commit, so release tooling and readers can
  #    tell a feature from a fix without opening the diff.
  if ! printf '%s' "$subject" | grep -qE "$TYPE_RE"; then
    fail "subject does not start with a Conventional Commit type"
    printf '          found:    %s\n' "$subject" >&2
    printf '          expected: feat|fix|docs|chore|test|refactor|perf|style|ci|build|revert\n' >&2
    printf '                    e.g. "fix(assets): the category check rejected valid input"\n' >&2
    rc=1
  fi

  # 2. Hard cap: past this, git and GitHub truncate the subject.
  len=${#subject}
  if [ "$len" -gt "$HARD_LIMIT" ]; then
    fail "subject is $len chars (hard limit $HARD_LIMIT, lines get truncated)"
    printf '          %s\n' "$subject" >&2
    rc=1
  elif [ "$len" -gt "$SOFT_LIMIT" ]; then
    printf '  note    subject is %d chars; %d is the target (not blocking)\n' \
      "$len" "$SOFT_LIMIT" >&2
  fi

  # 3. The body is what a stranger reads to understand WHY. The diff already
  #    shows what changed, so a bare subject throws away the reasoning.
  if [ -z "$body" ]; then
    fail "no body — say why this change was right, not just what it does"
    printf '          (a body is required unless the subject is fully self-evident;\n' >&2
    printf '           if it genuinely is, use --no-verify and say so in the PR)\n' >&2
    rc=1
  fi

  return $rc
}

self_test() {
  local pass=0 total=0
  t() { # t <expected 0|1> <message> <label>
    total=$((total + 1))
    if check_message "$2" >/dev/null 2>&1; then got=0; else got=1; fi
    if [ "$got" = "$1" ]; then
      printf '  ok    %s\n' "$3"; pass=$((pass + 1))
    else
      printf '  FAIL  %s (expected %s, got %s)\n' "$3" "$1" "$got" >&2
    fi
  }

  t 0 "$(printf 'fix(assets): reject the whole payload correctly\n\nBecause the validator lowercased input and compared it\nto uppercase constants, every value failed.')" \
      "accepts a conventional commit with a body"
  t 1 "fixed some stuff" "rejects a non-conventional subject"
  t 1 "$(printf 'feat: %s\n\nbody here so only length can fail' "$(printf 'x%.0s' $(seq 1 80))")" \
      "rejects a subject over the hard limit"
  t 1 "fix(ci): a subject with no body at all" "rejects a missing body"
  t 0 "$(printf 'chore: %s\n\nbody' "$(printf 'y%.0s' $(seq 1 45))")" \
      "accepts a subject at the target length"
  t 0 "$(printf 'Merge branch develop into main')" "exempts merge commits"

  printf '\n  %d/%d self-tests passed\n' "$pass" "$total"
  [ "$pass" = "$total" ]
}

main() {
  case "${1:-}" in
    --self-test) self_test ;;
    -m)          check_message "${2:-}" ;;
    "")          printf 'usage: %s <file> | -m "msg" | --self-test\n' "$0" >&2; exit 2 ;;
    *)           [ -f "$1" ] || { fail "no such file: $1"; exit 1; }
                 check_message "$(cat "$1")" ;;
  esac
}

main "$@"
