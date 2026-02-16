# garmin-cli

A command-line interface for [Garmin Connect](https://connect.garmin.com). Fetch activities, wellness data, sleep, HRV, devices, workouts, and more from your Garmin account.

**Requirements:** Node.js ≥ 18

---

## Installation

```bash
# Run without installing (downloads on first use)
npx garmin-cli

# Install globally
npm install -g garmin-cli
# then run:
garmin-cli <command> [options]
```

## Configuration

Config is loaded from:

1. **Environment variables** (override file)
2. **Config file:** `~/.config/garmin-cli/config.json` (Linux/macOS) or `%APPDATA%\garmin-cli\config.json` (Windows)

| Variable / option        | Description                                                                                   |
| ------------------------ | --------------------------------------------------------------------------------------------- |
| `GARMIN_EMAIL`           | Garmin Connect email                                                                          |
| `GARMIN_PASSWORD`        | Password (prefer env over file)                                                               |
| `GARMIN_TOKEN_DIR`       | Directory for session tokens (default: `~/.local/share/garmin-cli` or `%APPDATA%\garmin-cli`) |
| `GARMIN_IS_CN`           | `1` for garmin.cn (China)                                                                     |
| `GARMIN_AUTH_STRATEGY`   | `mobile` \| `embed` \| `auto` (SSO strategy)                                                  |
| `GARMIN_REQUEST_TIMEOUT` | Request timeout in ms (default 60000)                                                         |
| `GARMIN_JSON`            | Same as global `--json`                                                                       |
| `GARMIN_DEBUG`           | Same as global `--debug`                                                                      |

---

## Authentication

Log in once; the CLI stores tokens and reuses them until they expire.

```bash
# Interactive: email → password → MFA code if required
garmin-cli login

# With email (password and MFA prompted if needed)
garmin-cli login --email you@example.com --password 'your-password'

# Log out (clears stored tokens)
garmin-cli logout
```

**Step-by-step (manual) authentication** — useful when MFA is required and you want to run login and MFA in separate steps (e.g. in scripts or CI):

1. **Step 1 — email and password.** If Garmin asks for MFA, the CLI saves state and prints the command for step 2.
   ```bash
   garmin-cli login manual login
   # or with options:
   garmin-cli login manual login --email you@example.com --password 'your-password'
   ```
2. **Step 2 — MFA code.** Run after step 1 when you see "MFA required".
   ```bash
   garmin-cli login manual mfa 123456
   # or run without code to be prompted:
   garmin-cli login manual mfa
   ```

Credentials can come from config, env vars, or prompts. MFA code is never stored; use TTY prompt or `GARMIN_MFA_CODE` for non-interactive use.

---

## Global options

- **`--json`** — Machine-readable JSON output
- **`--debug`** — Verbose debug logs
- **`-V, --version`** — Show version

Examples:

```bash
garmin-cli sleep 2025-08-08 --json
GARMIN_JSON=1 GARMIN_DEBUG=1 npm run garmin -- sleep 2025-08-08
```

---

## Command reference

All commands accept global options: `--json`, `--debug`, `-V, --version`. Date arguments use `YYYY-MM-DD`; optional dates default to today. Use `garmin-cli <command> --help` for details.

### Auth

| Command              | Arguments / options                           | Description                                                                                         |
| -------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `login`              | `--email <email>`, `--password <password>`    | Sign in to Garmin Connect and save session. Prompts for email/password/MFA if not provided.         |
| `login manual login` | `[email] [password]`, `--email`, `--password` | Step 1 of manual auth: submit email and password. On MFA, saves state and prints the `mfa` command. |
| `login manual mfa`   | `[code]`                                      | Step 2: submit MFA code to finish login (or omit to be prompted).                                   |
| `logout`             | —                                             | Remove saved tokens from tokenDir.                                                                  |

### Profile

| Command            | Description                                    |
| ------------------ | ---------------------------------------------- |
| `profile social`   | Full social profile JSON from Garmin Connect.  |
| `profile settings` | User settings (user-settings API).             |
| `profile display`  | Display name, full name, username, profile ID. |

### Sleep

| Command | Arguments | Description                                           |
| ------- | --------- | ----------------------------------------------------- |
| `sleep` | `[date]`  | Daily sleep data for the given date (default: today). |

### Wellness

Each subcommand takes optional `[date]` (YYYY-MM-DD, default today).

| Command                      | Description                                                 |
| ---------------------------- | ----------------------------------------------------------- |
| `wellness stress`            | Daily stress data.                                          |
| `wellness body-battery`      | Body Battery for the day.                                   |
| `wellness heart-rate`        | Daily heart rate.                                           |
| `wellness spo2`              | SpO2 (blood oxygen) for the day.                            |
| `wellness respiration`       | Daily respiration.                                          |
| `wellness intensity-minutes` | Daily intensity minutes.                                    |
| `wellness floors`            | Daily floors.                                               |
| `wellness daily-summary`     | Daily wellness summary (chart).                             |
| `wellness rhr`               | Resting heart rate from wellness daily.                     |
| `wellness daily-events`      | Wellness events for the day (uses userGuid from profile).   |
| `wellness spo2-acclimation`  | SpO2 acclimation for the day.                               |
| `wellness acclimation`       | Heat/altitude acclimation for the week containing the date. |

### Activities

| Command                                    | Arguments / options                                                               | Description                                                                               |
| ------------------------------------------ | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `activities list`                          | `[start] [limit]`, `-t, --activity-type <type>`, `-s, --sub-activity-type <type>` | List activities with pagination (start, limit; max limit 1000) and optional type filters. |
| `activities get <activity-id>`             | —                                                                                 | Full activity details by ID.                                                              |
| `activities count`                         | —                                                                                 | Total activity count.                                                                     |
| `activities types`                         | —                                                                                 | List activity types.                                                                      |
| `activities splits <activity-id>`          | —                                                                                 | Activity splits.                                                                          |
| `activities typedsplits <activity-id>`     | —                                                                                 | Activity typed splits.                                                                    |
| `activities split-summaries <activity-id>` | —                                                                                 | Activity split summaries.                                                                 |
| `activities weather <activity-id>`         | —                                                                                 | Weather data for the activity.                                                            |
| `activities details <activity-id>`         | `--max-chart-size <size>`, `--max-polyline-size <size>`                           | Chart and polyline details (defaults: 2000, 4000).                                        |
| `activities hr-zones <activity-id>`        | —                                                                                 | Heart rate time in zones.                                                                 |
| `activities power-zones <activity-id>`     | —                                                                                 | Power time in zones.                                                                      |
| `activities exercise-sets <activity-id>`   | —                                                                                 | Exercise sets (strength activities).                                                      |
| `activities gear <activity-id>`            | —                                                                                 | Gear used in the activity.                                                                |
| `activities download <activity-id>`        | `[format]`, `-o, --output <path>`                                                 | Download activity; format: fit, tcx, gpx, kml, csv (default: fit).                        |
| `activities upload <file>`                 | —                                                                                 | Upload activity file (FIT, GPX, TCX).                                                     |
| `activities delete <activity-id>`          | —                                                                                 | Delete the activity.                                                                      |
| `activities fordate`                       | `[date]`                                                                          | Activities for the given date (default: today).                                           |

### Weight

| Command         | Arguments         | Description                                   |
| --------------- | ----------------- | --------------------------------------------- |
| `weight daily`  | `[date]`          | Weight data for the day.                      |
| `weight range`  | `<start> <end>`   | Weight data for the date range.               |
| `weight add`    | `<weight> [date]` | Add weight record (weight in kg).             |
| `weight delete` | `<date> <pk>`     | Delete weight record by date and primary key. |

### HRV (Heart Rate Variability)

| Command     | Arguments       | Description                            |
| ----------- | --------------- | -------------------------------------- |
| `hrv daily` | `[date]`        | Daily HRV data.                        |
| `hrv range` | `<start> <end>` | HRV data for the date range (GraphQL). |

### Metrics (training metrics)

| Command                    | Arguments               | Description                           |
| -------------------------- | ----------------------- | ------------------------------------- |
| `metrics readiness`        | `[date]`                | Training readiness.                   |
| `metrics vo2max`           | `[date]`                | Daily VO2 max.                        |
| `metrics vo2max-range`     | `<start> <end>`         | VO2 max for the period (GraphQL).     |
| `metrics endurance`        | `[date]`                | Endurance score.                      |
| `metrics hill`             | `[date]`                | Hill score.                           |
| `metrics training-status`  | `[date]`                | Training status.                      |
| `metrics load-balance`     | `[date]`                | Training load balance (GraphQL).      |
| `metrics acclimation`      | `[date]`                | Heat/altitude acclimation (GraphQL).  |
| `metrics race-predictions` | `[date]`                | Race predictions.                     |
| `metrics power-curve`      | `<start> <end> [sport]` | Power curve; sport: cycling, running. |

### Biometric

| Command                         | Arguments | Description                                   |
| ------------------------------- | --------- | --------------------------------------------- |
| `biometric lactate-threshold`   | —         | Lactate threshold.                            |
| `biometric ftp`                 | —         | Functional threshold power (FTP) for cycling. |
| `biometric hr-zones`            | —         | Heart rate zones.                             |
| `biometric power-weight`        | —         | Power-to-weight ratio.                        |
| `biometric critical-swim-speed` | `[date]`  | Critical swim speed.                          |

### Devices

| Command             | Arguments     | Description                                                |
| ------------------- | ------------- | ---------------------------------------------------------- |
| `devices list`      | —             | List registered devices.                                   |
| `devices settings`  | `[device-id]` | Device settings (default: first device).                   |
| `devices primary`   | —             | Primary training device.                                   |
| `devices solar`     | `[device-id]` | Solar charging data (default: first solar-capable device). |
| `devices last-used` | —             | Last used device.                                          |

### Workouts

| Command                                 | Arguments         | Description                                 |
| --------------------------------------- | ----------------- | ------------------------------------------- |
| `workouts list`                         | `[start] [limit]` | List workouts (default offset 0, limit 50). |
| `workouts get <workout-id>`             | —                 | Workout details by ID.                      |
| `workouts download <workout-id>`        | —                 | Download workout in FIT format.             |
| `workouts delete <workout-id>`          | —                 | Delete workout.                             |
| `workouts schedule <workout-id> <date>` | —                 | Schedule workout for date (YYYY-MM-DD).     |
| `workouts unschedule <schedule-id>`     | —                 | Cancel scheduled workout.                   |
| `workouts create`                       | —                 | Create workout from JSON on stdin.          |

### Fitness

| Command                 | Arguments                       | Description                                              |
| ----------------------- | ------------------------------- | -------------------------------------------------------- |
| `fitness age`           | `[date]`                        | Fitness age.                                             |
| `fitness stats-summary` | `<start> <end>`                 | Fitness statistics summary for the period.               |
| `fitness stats-metrics` | `<start> <end> [activity-type]` | Available fitness stats metrics (e.g. running, cycling). |

### Goals

| Command        | Arguments       | Description                               |
| -------------- | --------------- | ----------------------------------------- |
| `goals list`   | `[status]`      | List goals; status: active, future, past. |
| `goals weight` | `<start> <end>` | Weight goal for the date range.           |

### Badges

| Command            | Description       |
| ------------------ | ----------------- |
| `badges earned`    | Earned badges.    |
| `badges available` | Available badges. |

### Challenges

| Command                          | Arguments         | Description                                            |
| -------------------------------- | ----------------- | ------------------------------------------------------ |
| `challenges adhoc`               | `[start] [limit]` | Ad-hoc challenge history (default offset 0, limit 50). |
| `challenges badge-completed`     | —                 | Completed badge challenges.                            |
| `challenges badge-available`     | —                 | Available badge challenges.                            |
| `challenges virtual-in-progress` | —                 | Virtual challenges in progress.                        |

### Gear

| Command             | Arguments | Description                      |
| ------------------- | --------- | -------------------------------- |
| `gear list`         | —         | List gear.                       |
| `gear stats <uuid>` | —         | Statistics for gear by UUID.     |
| `gear defaults`     | —         | Default gear for activity types. |

### Hydration

| Command           | Arguments       | Description                         |
| ----------------- | --------------- | ----------------------------------- |
| `hydration daily` | `[date]`        | Daily hydration data.               |
| `hydration range` | `<start> <end>` | Hydration for the date range.       |
| `hydration add`   | `<ml> [date]`   | Add hydration entry (volume in ml). |

### Blood pressure

| Command                | Arguments                       | Description                        |
| ---------------------- | ------------------------------- | ---------------------------------- |
| `blood-pressure range` | `<start> <end>`                 | Blood pressure for the date range. |
| `blood-pressure daily` | `[date]`                        | Daily blood pressure.              |
| `blood-pressure add`   | `<systolic> <diastolic> [date]` | Add blood pressure entry.          |

### Lifestyle

| Command           | Arguments | Description          |
| ----------------- | --------- | -------------------- |
| `lifestyle daily` | `[date]`  | Daily lifestyle log. |

### Menstrual

| Command               | Arguments       | Description                             |
| --------------------- | --------------- | --------------------------------------- |
| `menstrual day`       | `[date]`        | Daily menstrual cycle data.             |
| `menstrual calendar`  | `<start> <end>` | Menstrual cycle calendar for the range. |
| `menstrual pregnancy` | —               | Pregnancy snapshot.                     |

### Nutrition

| Command               | Arguments       | Description                     |
| --------------------- | --------------- | ------------------------------- |
| `nutrition calories`  | `<start> <end>` | Calorie summary for the period. |
| `nutrition food-logs` | `[date]`        | Food logs for the day.          |
| `nutrition meals`     | `[date]`        | Meals for the day.              |

### Training plans

| Command               | Arguments   | Description          |
| --------------------- | ----------- | -------------------- |
| `training-plans list` | —           | List training plans. |
| `training-plans get`  | `<plan-id>` | Training plan by ID. |

### Exercises (exercise library)

| Command                | Arguments / options                                        | Description                                     |
| ---------------------- | ---------------------------------------------------------- | ----------------------------------------------- |
| `exercises categories` | —                                                          | List exercise categories.                       |
| `exercises muscles`    | —                                                          | List muscle groups.                             |
| `exercises equipment`  | —                                                          | List equipment types.                           |
| `exercises list`       | `--category`, `--muscle`, `--equipment`, `--search <term>` | List exercises with optional filters.           |
| `exercises get`        | `<exercise-key>`                                           | Get exercise by key (e.g. BARBELL_BENCH_PRESS). |

---

## License

MIT
