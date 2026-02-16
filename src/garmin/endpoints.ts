/**
 * Garmin Connect REST API paths (connectapi.{domain}).
 * All paths are relative to https://connectapi.{domain}; pass to client.connectapi() or client.download().
 * Collected from: tmp_py_lib, garmin-connect, garmin-connect-client, tmp_py_garth, connect.garmin.com-endpoints (HAR),
 * GitHub (cyberjunky/python-garminconnect, garth), blog.sigsec.net; some from official Garmin Developer (Health/Activity API - different product).
 */

/** GraphQL base path (POST). */
export const GRAPHQL = '/graphql-gateway/graphql';

// ─── User profile & settings ───────────────────────────────────────────────

/** Profile: social profile (GET). */
export const USERPROFILE_SOCIAL = '/userprofile-service/socialProfile';

/** Profile: user settings (GET). */
export const USERPROFILE_SETTINGS = '/userprofile-service/userprofile/user-settings/';

/** Profile: extended settings (GET). */
export const USERPROFILE_SETTINGS_EXT = '/userprofile-service/userprofile/settings';

/** Profile: profile data (GET). */
export const USERPROFILE_PROFILE = '/userprofile-service/userprofile/profile';

// ─── Devices ────────────────────────────────────────────────────────────────

/** Device list (GET). */
export const DEVICE_LIST = '/device-service/deviceregistration/devices';

/** Devices: service (base for device-info, mylastused, etc.). */
export const DEVICE_SERVICE = '/device-service/deviceservice';

/** Primary training device (GET). */
export const DEVICE_PRIMARY = '/web-gateway/device-info/primary-training-device';

/** Device solar data (GET). */
export const DEVICE_SOLAR = '/web-gateway/solar';

/** Devices: all for user (GET). Path: .../devices/all/{userProfileId}. */
export const DEVICE_ALL_FOR_USER = '/device-service/deviceregistration/devices/all';

/** Devices: history (GET). */
export const DEVICE_HISTORICAL = '/device-service/deviceregistration/devices/historical';

/** Devices: last used (GET). */
export const DEVICE_MY_LAST_USED = '/device-service/deviceservice/mylastused';

/** Devices: device info (GET). Path: .../user-device/{deviceId}. */
export const DEVICE_USER_DEVICE = '/device-service/deviceservice/user-device';

/** Devices: sensors (GET). */
export const DEVICE_SENSORS = '/device-service/sensors';

// ─── Weight & body composition ─────────────────────────────────────────────

/** Weight: service base (weight/dateRange, user-weight, weight/dayview/..., weight/range/...). */
export const WEIGHT_SERVICE = '/weight-service';

// ─── User summary & daily ───────────────────────────────────────────────────

/** Daily summary (GET). Parameter: calendarDate. */
export const USERSUMMARY_DAILY = '/usersummary-service/usersummary/daily';

/** MaxMET metrics (GET). */
export const METRICS_MAXMET_DAILY = '/metrics-service/metrics/maxmet/daily';

/** Biometric (GET). */
export const BIOMETRIC = '/biometric-service/biometric';

/** Biometric: stats (GET). */
export const BIOMETRIC_STATS = '/biometric-service/stats';

/** Heart rate zones (GET). */
export const BIOMETRIC_HEART_RATE_ZONES = '/biometric-service/heartRateZones';

/** Biometric: lactate threshold (GET). */
export const BIOMETRIC_LACTATE_THRESHOLD = '/biometric-service/biometric/latestLactateThreshold';

/** Biometric: critical swim speed (GET). Path: .../criticalSwimSpeed/latest/{date}. */
export const BIOMETRIC_CRITICAL_SWIM_SPEED = '/biometric-service/criticalSwimSpeed/latest';

/** Biometric: FTP/LTH stats by sport (GET). Path: .../stats/functionalThresholdPower/range/... */
export const BIOMETRIC_STATS_FTP = '/biometric-service/stats/functionalThresholdPower/range';

// ─── Hydration ──────────────────────────────────────────────────────────────

/** Hydration: daily data (GET). */
export const HYDRATION_DAILY = '/usersummary-service/usersummary/hydration/daily';

/** Hydration: log (POST for adding). */
export const HYDRATION_LOG = '/usersummary-service/usersummary/hydration/log';

/** Hydration: all data (GET). */
export const HYDRATION_ALL = '/usersummary-service/usersummary/hydration/allData';

// ─── Steps & activity stats ─────────────────────────────────────────────────

/** Steps: daily stats (GET). */
export const STATS_STEPS_DAILY = '/usersummary-service/stats/steps/daily';

/** Steps: weekly stats (GET). */
export const STATS_STEPS_WEEKLY = '/usersummary-service/stats/steps/weekly';

/** Stress: weekly stats (GET). */
export const STATS_STRESS_WEEKLY = '/usersummary-service/stats/stress/weekly';

/** Intensity minutes: weekly stats (GET). */
export const STATS_IM_WEEKLY = '/usersummary-service/stats/im/weekly';

// ─── Personal records & badges ──────────────────────────────────────────────

/** Personal records (GET). Path: .../prs/{displayName}. */
export const PERSONALRECORD_PRS = '/personalrecord-service/personalrecord/prs';

/** Badges: earned (GET). */
export const BADGE_EARNED = '/badge-service/badge/earned';

/** Badges: available (GET). */
export const BADGE_AVAILABLE = '/badge-service/badge/available';

/** Challenges: ad-hoc history (GET). */
export const ADHOC_CHALLENGE_HISTORICAL = '/adhocchallenge-service/adHocChallenge/historical';

/** Challenges: completed (GET). */
export const BADGE_CHALLENGE_COMPLETED = '/badgechallenge-service/badgeChallenge/completed';

/** Challenges: available (GET). */
export const BADGE_CHALLENGE_AVAILABLE = '/badgechallenge-service/badgeChallenge/available';

/** Challenges: non-completed (GET). */
export const BADGE_CHALLENGE_NON_COMPLETED = '/badgechallenge-service/badgeChallenge/non-completed';

/** Virtual challenges: in progress (GET). */
export const VIRTUAL_CHALLENGE_IN_PROGRESS = '/badgechallenge-service/virtualChallenge/inProgress';

// ─── Sleep & wellness ───────────────────────────────────────────────────────

/** Sleep: daily data (GET). wellness or sleep-service - both are used. */
export const WELLNESS_DAILY_SLEEP = '/wellness-service/wellness/dailySleepData';

/** Sleep: daily data via sleep-service (GET). Parameter: date. */
export const SLEEP_DAILY = '/sleep-service/sleep/dailySleepData';

/** Sleep: daily/weekly stats (GET). Path: .../stats/sleep/daily|weekly/... */
export const SLEEP_STATS = '/sleep-service/stats/sleep';

/** Stress: daily data (GET). */
export const WELLNESS_DAILY_STRESS = '/wellness-service/wellness/dailyStress';

/** Hill Score (GET). */
export const METRICS_HILL_SCORE = '/metrics-service/metrics/hillscore';

/** Body Battery: daily reports (GET). */
export const WELLNESS_BODY_BATTERY_DAILY = '/wellness-service/wellness/bodyBattery/reports/daily';

/** Body Battery: events (GET). Path with date in segment: .../events/{date} (HAR: connect.garmin.com). */
export const WELLNESS_BODY_BATTERY_EVENTS = '/wellness-service/wellness/bodyBattery/events';

/** Body Battery: daily stats (GET). Path: .../daily/{fromDate}/{toDate} (usersummary-service, HAR). */
export const USERSUMMARY_STATS_BODYBATTERY_DAILY = '/usersummary-service/stats/bodybattery/daily';

// ─── Blood pressure ────────────────────────────────────────────────────────

/** Blood pressure: range (GET). */
export const BLOOD_PRESSURE_RANGE = '/bloodpressure-service/bloodpressure/range';

/** Blood pressure: set/record (POST). */
export const BLOOD_PRESSURE = '/bloodpressure-service/bloodpressure';

/** Blood pressure: day view (GET). Path: .../bloodpressure/dayview/{date}. */
export const BLOOD_PRESSURE_DAYVIEW = '/bloodpressure-service/bloodpressure/dayview';

// ─── Metrics (endurance, training, etc.) ────────────────────────────────────

/** Endurance Score (GET). */
export const METRICS_ENDURANCE_SCORE = '/metrics-service/metrics/endurancescore';

/** Menstrual cycle calendar (GET). */
export const PERIODIC_HEALTH_CALENDAR = '/periodichealth-service/menstrualcycle/calendar';

/** Menstrual cycle: day (GET). */
export const PERIODIC_HEALTH_DAYVIEW = '/periodichealth-service/menstrualcycle/dayview';

/** Menstrual cycle: pregnancy snapshot (GET). */
export const PERIODIC_HEALTH_PREGNANCY = '/periodichealth-service/menstrualcycle/pregnancysnapshot';

/** Goals (GET). */
export const GOAL_GOALS = '/goal-service/goal/goals';

/** Goals: effective weight goal (GET). Path: .../goal/user/effective/weightgoal/{start}/{end}. */
export const GOAL_WEIGHT_EFFECTIVE = '/goal-service/goal/user/effective/weightgoal';

/** RHR / wellness daily (GET). */
export const USERSTATS_WELLNESS_DAILY = '/userstats-service/wellness/daily';

/** HRV (GET). Path with date: /hrv-service/hrv/{date}. */
export const HRV_SERVICE = '/hrv-service/hrv';

/** Training readiness (GET). Path with date: .../trainingreadiness/{date}. */
export const METRICS_TRAINING_READINESS = '/metrics-service/metrics/trainingreadiness';

/** Race predictions (GET). */
export const METRICS_RACE_PREDICTIONS = '/metrics-service/metrics/racepredictions';

/** Training status: aggregated (GET). */
export const METRICS_TRAINING_STATUS = '/metrics-service/metrics/trainingstatus/aggregated';

/** Metrics: heat/altitude acclimation (GET). Path: .../heataltitudeacclimation/daily|latest|weekly/... */
export const METRICS_HEAT_ALTITUDE_ACCLIMATION = '/metrics-service/metrics/heataltitudeacclimation';

/** Metrics: training load balance (GET). Path: .../trainingloadbalance/latest/{date}. */
export const METRICS_TRAINING_LOAD_BALANCE = '/metrics-service/metrics/trainingloadbalance';

/** Metrics: running economy (GET). Path: .../runningeconomy/daily|latest|weekly. */
export const METRICS_RUNNING_ECONOMY = '/metrics-service/metrics/runningeconomy';

/** Daily summary chart (GET). */
export const WELLNESS_DAILY_SUMMARY_CHART = '/wellness-service/wellness/dailySummaryChart';

/** Floors: daily data (GET). */
export const WELLNESS_FLOORS_DAILY = '/wellness-service/wellness/floorsChartData/daily';

/** Heart rate: daily data (GET). Parameter: date. */
export const WELLNESS_DAILY_HEART_RATE = '/wellness-service/wellness/dailyHeartRate';

/** Respiration: daily data (GET). */
export const WELLNESS_DAILY_RESPIRATION = '/wellness-service/wellness/daily/respiration';

/** SpO2: daily data (GET). */
export const WELLNESS_DAILY_SPO2 = '/wellness-service/wellness/daily/spo2';

/** Intensity minutes: daily (GET). */
export const WELLNESS_DAILY_IM = '/wellness-service/wellness/daily/im';

/** Daily events (GET). Path: .../dailyEvents/{userGuid}?calendarDate= (HAR). */
export const WELLNESS_DAILY_EVENTS = '/wellness-service/wellness/dailyEvents';

/** SpO2: daily acclimation (GET). Path: .../daily/spo2acclimation/{date} (HAR). */
export const WELLNESS_SPO2_ACCLIMATION = '/wellness-service/wellness/daily/spo2acclimation';

/** Acclimation (heat/altitude) for period (GET). Query: fromDate, untilDate (HAR). */
export const WELLNESS_STATS_ACCLIMATION = '/wellness-service/stats/daily/acclimation';

/** Wellness epoch reload request (POST). */
export const WELLNESS_EPOCH_REQUEST = '/wellness-service/wellness/epoch/request';

// ─── Activities ────────────────────────────────────────────────────────────

/** Activity search (GET). Parameters: start, limit, etc. */
export const ACTIVITYLIST_SEARCH = '/activitylist-service/activities/search/activities';

/** Activity count (GET). */
export const ACTIVITYLIST_COUNT = '/activitylist-service/activities/count';

/** Activity path base (for /activitylist-service/activities/{id}, fordailysummary, etc.). */
export const ACTIVITYLIST_BASE = '/activitylist-service/activities/';

/** Activity list: for daily summary (GET). Path: .../activities/fordailysummary/{profileId}. Parameter: calendarDate. */
export const ACTIVITYLIST_FOR_DAILY_SUMMARY = '/activitylist-service/activities/fordailysummary';

/** Activity list: list by type (GET). Path: .../activities/list/{profileId}. Parameters: activityTypeId, startTimestampLocal, endTimestampLocal, start, limit. */
export const ACTIVITYLIST_LIST = '/activitylist-service/activities/list';

/** Activity list: feed status (GET). Parameter: lastViewedTimeGMT. */
export const ACTIVITYLIST_NEWSFEED_STATUS = '/activitylist-service/activities/newsfeed/status';

/** Activity: single (GET/PUT/DELETE). Path: .../activity or .../activity/{id}; subpaths: /details, /typedsplits, /mapdetails. */
export const ACTIVITY_SERVICE = '/activity-service/activity';

/** Activity types (GET). */
export const ACTIVITY_TYPES = '/activity-service/activity/activityTypes';

/** Heart rate for date (mobile-gateway) (GET). */
export const MOBILE_GATEWAY_HEART_RATE_FOR_DATE = '/mobile-gateway/heartRate/forDate';

/** Fitness stats by activities (GET). Parameters: aggregation, startDate, endDate, etc. */
export const FITNESSSTATS_ACTIVITY = '/fitnessstats-service/activity';

/** Fitness stats: available metrics (GET). Parameters: startDate, endDate, activityType. */
export const FITNESSSTATS_AVAILABLE_METRICS = '/fitnessstats-service/activity/availableMetrics';

/** Fitness stats: power curve (GET). Parameters: startDate, endDate, sport. */
export const FITNESSSTATS_POWER_CURVE = '/fitnessstats-service/powerCurve';

/** Fitness age (GET). Path with date: .../fitnessage/{date}. */
export const FITNESSAGE = '/fitnessage-service/fitnessage';

/** Fitness age: daily/weekly stats (GET). Path: .../stats/daily|weekly/... */
export const FITNESSAGE_STATS = '/fitnessage-service/stats';

/** Health status summary (GET). Path: .../healthstatus/summary/{date} or .../summary/{start}/{end}. */
export const HEALTHSTATUS_SUMMARY = '/healthstatus-service/healthstatus/summary';

/** Info: system version (GET). */
export const INFO_RELEASE_SYSTEM = '/info-service/api/system/release-system';

// ─── Download & upload ──────────────────────────────────────────────────────

/** Download: FIT (original) (GET). Path: .../activity/{activityId}. */
export const DOWNLOAD_FIT = '/download-service/files/activity';

/** Download: TCX (GET). Path: .../activity/{activityId}. */
export const DOWNLOAD_TCX = '/download-service/export/tcx/activity';

/** Download: GPX (GET). Path: .../activity/{activityId}. */
export const DOWNLOAD_GPX = '/download-service/export/gpx/activity';

/** Download: KML (GET). Path: .../activity/{activityId}. */
export const DOWNLOAD_KML = '/download-service/export/kml/activity';

/** Download: CSV (GET). Path: .../activity/{activityId}. */
export const DOWNLOAD_CSV = '/download-service/export/csv/activity';

/** Activity file upload (POST). */
export const UPLOAD = '/upload-service/upload';

// ─── Gear ───────────────────────────────────────────────────────────────────

/** Gear: filter (GET). */
export const GEAR_FILTER = '/gear-service/gear/filterGear';

/** Gear: base (for /gear/user/{profileId}, /link/, /unlink/, etc.). */
export const GEAR_BASE = '/gear-service/gear';

// ─── Workouts & training plans ──────────────────────────────────────────────

/** Workouts: base (workouts, workout, workout/{id}, schedule). */
export const WORKOUT_SERVICE = '/workout-service';

/** Workout schedule (GET/POST). */
export const WORKOUT_SCHEDULE = '/workout-service/schedule';

/** Training plans (GET). */
export const TRAINING_PLAN = '/trainingplan-service/trainingplan';

/** Training plans: list (GET). Parameters: limit. */
export const TRAINING_PLAN_PLANS = '/trainingplan-service/trainingplan/plans';

// ─── Lifestyle logging ──────────────────────────────────────────────────────

/** Lifestyle daily log (GET). */
export const LIFESTYLE_DAILY_LOG = '/lifestylelogging-service/dailyLog';

// ─── Nutrition ──────────────────────────────────────────────────────────────

/** Nutrition: daily calories (GET). Parameters: startDate, endDate, currentDate, isDataForReport. */
export const NUTRITION_CALORIE_SUMMARY = '/nutrition-service/calorie/summary/daily';

/** Nutrition: food logs (GET). Path: .../food/logs/{date}. */
export const NUTRITION_FOOD_LOGS = '/nutrition-service/food/logs';

/** Nutrition: meals (GET). Path: .../meals/{date}. */
export const NUTRITION_MEALS = '/nutrition-service/meals';

/** Nutrition: settings (GET). Path: .../settings/{date}. */
export const NUTRITION_SETTINGS = '/nutrition-service/settings';

/** Nutrition: current user status (GET). */
export const NUTRITION_CURRENT_STATUS = '/nutrition-service/user/nutritionCurrentStatus';

// ─── System & preferences ───────────────────────────────────────────────────

/** System: time/timezone units (GET). */
export const SYSTEM_TIMEZONE_UNITS = '/system-service/timezoneUnits';

/** User preferences (UI flags) (GET/PUT). Path: .../userpreference-service/{key}, e.g. Activity.userHasSensors. */
export const USERPREFERENCE_SERVICE = '/userpreference-service';

/** Stats: metrics availability (GET). Path: .../statistics/availability/{userProfileId}. */
export const USERSTATS_AVAILABILITY = '/userstats-service/statistics/availability';

// ─── Wellness activity ──────────────────────────────────────────────────────

/** Wellness activities: daily summary (GET). Path: .../activity/summary/{date} or .../summary/list. */
export const WELLNESSACTIVITY_SUMMARY = '/wellnessactivity-service/activity/summary';

/** Wellness activities: epoch (GET). Path: .../activity/epoch/{activityUuid}. */
export const WELLNESSACTIVITY_EPOCH = '/wellnessactivity-service/activity/epoch';
