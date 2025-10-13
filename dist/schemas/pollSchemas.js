"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListPollsDto = exports.DeletePollDto = exports.UpdatePollDto = exports.CreatePollDto = exports.EVisualizationType = exports.EPollCrowdIconType = exports.EPollRatingIconType = exports.ScheduleAttribute = exports.SchedulingType = exports.EPollType = exports.EPollState = void 0;
const zod_1 = require("zod");
var EPollState;
(function (EPollState) {
    EPollState["Published"] = "Published";
    EPollState["UnPublished"] = "UnPublished";
    EPollState["Draft"] = "Draft";
    EPollState["Scheduled"] = "Scheduled";
})(EPollState || (exports.EPollState = EPollState = {}));
var EPollType;
(function (EPollType) {
    EPollType["OptionsPoll"] = "OptionsPoll";
    EPollType["OpenAnswers"] = "OpenAnswers";
})(EPollType || (exports.EPollType = EPollType = {}));
var SchedulingType;
(function (SchedulingType) {
    SchedulingType["ABSOLUTE"] = "absolute";
    SchedulingType["RELATIVE"] = "relative";
})(SchedulingType || (exports.SchedulingType = SchedulingType = {}));
var ScheduleAttribute;
(function (ScheduleAttribute) {
    ScheduleAttribute["START_DATE"] = "startDate";
    ScheduleAttribute["END_DATE"] = "endDate";
})(ScheduleAttribute || (exports.ScheduleAttribute = ScheduleAttribute = {}));
var EPollRatingIconType;
(function (EPollRatingIconType) {
    EPollRatingIconType["Star"] = "Star";
    EPollRatingIconType["Heart"] = "Heart";
    EPollRatingIconType["Fire"] = "Fire";
    EPollRatingIconType["Clap"] = "Clap";
    EPollRatingIconType["ThumbsUp"] = "Thumbs up";
    EPollRatingIconType["Think"] = "Think";
    EPollRatingIconType["Funny"] = "Funny";
    EPollRatingIconType["Wow"] = "Wow";
})(EPollRatingIconType || (exports.EPollRatingIconType = EPollRatingIconType = {}));
var EPollCrowdIconType;
(function (EPollCrowdIconType) {
    EPollCrowdIconType["Thumbs"] = "thumbs";
    EPollCrowdIconType["Emotions"] = "emotions";
    EPollCrowdIconType["YesNo"] = "yes-no";
})(EPollCrowdIconType || (exports.EPollCrowdIconType = EPollCrowdIconType = {}));
var EVisualizationType;
(function (EVisualizationType) {
    EVisualizationType["CrowdPoll"] = "crowd vote";
    EVisualizationType["SliderPoll"] = "slider poll";
    EVisualizationType["RatingPoll"] = "rating scale";
})(EVisualizationType || (exports.EVisualizationType = EVisualizationType = {}));
const MaxPollAnswers = 8;
exports.CreatePollDto = zod_1.z.object({
    contextId: zod_1.z.string().describe('Kaltura Session Id, entry id or channel id'),
    state: zod_1.z.nativeEnum(EPollState).describe('Poll state: Published, UnPublished, Draft, Scheduled'),
    showResults: zod_1.z.boolean().describe('Whether to show poll results to participants'),
    content: zod_1.z
        .object({
        question: zod_1.z.string().describe('Poll question. Example: "What is your favorite color?"'),
        options: zod_1.z
            .array(zod_1.z.string())
            .max(MaxPollAnswers)
            .optional()
            .describe('Poll options for poll of type "OptionsPoll". Example: ["Red", "Blue", "Green"]. max 8 options'),
        correctAnswers: zod_1.z
            .array(zod_1.z.number().int().max(MaxPollAnswers).positive())
            .optional()
            .describe('Indexes of correct answers in the options array. Example: [0, 2]'),
    })
        .describe('Poll content including question and options/correctAnswers if the poll is of type OptionsPoll'),
    type: zod_1.z
        .nativeEnum(EPollType)
        .describe('Poll type, options poll (OptionsPoll) or open answers (OpenAnswers)'),
    // isEnded: z.boolean().optional().describe('Whether the poll is ended, false on creation'),
    visualization: zod_1.z
        .discriminatedUnion('type', [
        zod_1.z.object({
            type: zod_1.z
                .literal(EVisualizationType.CrowdPoll)
                .describe('Crowd poll visualization. The user selects either thumbs up or thumbs down for "thumbs" icon. the user select Like unLike for "emotions" icon and Yes or No for "yes-no" icon.'),
            icon: zod_1.z
                .nativeEnum(EPollCrowdIconType)
                .describe('Icon to use for the crowd poll. The user selects either thumbs up or thumbs down for "thumbs" icon. the user select Like unLike for "emotions" icon and Yes or No for "yes-no" icon.'),
        }),
        zod_1.z.object({
            type: zod_1.z.literal(EVisualizationType.SliderPoll).describe('Slider poll visualization'),
        }),
        zod_1.z.object({
            type: zod_1.z
                .literal(EVisualizationType.RatingPoll)
                .describe('Rating poll visualization, user selects a rating from 1 to 5 emojis, depending on the icon.'),
            icon: zod_1.z.nativeEnum(EPollRatingIconType).describe('Icon to use for the rating poll'),
        }),
    ])
        .optional(),
    isAcceptingMultipleVotes: zod_1.z
        .boolean()
        .optional()
        .describe('Whether to allow multiple votes from the same user. For options poll'),
    trackWordFrequency: zod_1.z.boolean().optional().describe('Whether to track word frequency. For open answers'),
    groupPoll: zod_1.z
        .object({
        groupPollId: zod_1.z.string(),
        isMandatory: zod_1.z.boolean(),
        sortPosition: zod_1.z.number(),
    })
        .optional()
        .describe('Whether this poll is part of a group poll (survey). If set, groupPollId must be set'),
    scheduling: zod_1.z
        .discriminatedUnion('schedulingType', [
        zod_1.z.object({
            schedulingType: zod_1.z
                .literal(SchedulingType.ABSOLUTE)
                .describe('Absolute scheduling, poll will be scheduled at a specific time'),
            scheduledTime: zod_1.z
                .string()
                .datetime()
                .optional()
                .describe('For absolute scheduling - what user requested'),
        }),
        zod_1.z.object({
            schedulingType: zod_1.z
                .literal(SchedulingType.RELATIVE)
                .describe('Relative scheduling, poll will be scheduled relative to an event attribute'),
            relativeScheduling: zod_1.z.object({
                offsetMilliseconds: zod_1.z.number().int().describe('For relative scheduling, Offset in milliseconds'),
                attribute: zod_1.z.nativeEnum(ScheduleAttribute),
            }),
        }),
    ])
        .optional()
        .describe('Scheduling options, absolute or relative'),
    autoCloseMilliseconds: zod_1.z.number().int().optional().describe('Auto close poll after X milliseconds'),
});
exports.UpdatePollDto = exports.CreatePollDto.extend({
    _id: zod_1.z.string().describe('The id of the poll to update'),
    isEnded: zod_1.z
        .boolean()
        .optional()
        .describe('Whether the poll is ended, cannot be changed back to not ended. Set to true on UnPublish.'),
});
exports.DeletePollDto = zod_1.z.object({
    pollId: zod_1.z.string().describe('The id of the poll to delete'),
});
exports.ListPollsDto = zod_1.z.object({
    contextId: zod_1.z.string().describe('Kaltura Session Id - entry id or channel id'),
});
