"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeEmptyProps = void 0;
const removeEmptyProps = (obj = {}, { removeEmptyString } = { removeEmptyString: false }) => {
    const entries = Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && !(removeEmptyString && v === ''));
    return Object.fromEntries(entries);
};
exports.removeEmptyProps = removeEmptyProps;
