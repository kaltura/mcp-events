"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupportedTimeZones = void 0;
const timezone_support_1 = require("timezone-support");
exports.SupportedTimeZones = Object.freeze([
    ...(0, timezone_support_1.listTimeZones)(),
    'US/Central',
    'US/Eastern',
    'US/Mountain',
    'US/Pacific',
    'Europe/Copenhagen',
    'Europe/Amsterdam',
]);
