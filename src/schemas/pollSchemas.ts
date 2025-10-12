import { z } from 'zod'

export enum EPollState {
  Published = 'Published',
  UnPublished = 'UnPublished',
  Draft = 'Draft',
  Scheduled = 'Scheduled',
}

export interface IVisualization {
  type: string
  icon: string
}

export enum EPollType {
  OptionsPoll = 'OptionsPoll',
  OpenAnswers = 'OpenAnswers',
}

export interface GroupPoll {
  groupPollId: string
  isMandatory: boolean
  sortPosition: number
}

export enum SchedulingType {
  ABSOLUTE = 'absolute',
  RELATIVE = 'relative',
}

export enum ScheduleAttribute {
  START_DATE = 'startDate',
  END_DATE = 'endDate',
}

export interface Scheduling {
  scheduledActionId?: string
  schedulingType?: SchedulingType
  scheduledTime?: Date
  relativeScheduling?: {
    offsetMilliseconds: number
    attribute: ScheduleAttribute
  }
}

export enum EPollRatingIconType {
  Star = 'Star',
  Heart = 'Heart',
  Fire = 'Fire',
  Clap = 'Clap',
  ThumbsUp = 'Thumbs up',
  Think = 'Think',
  Funny = 'Funny',
  Wow = 'Wow',
}

export enum EPollCrowdIconType {
  Thumbs = 'thumbs',
  Emotions = 'emotions',
  YesNo = 'yes-no',
}

export enum EVisualizationType {
  CrowdPoll = 'crowd vote',
  SliderPoll = 'slider poll',
  RatingPoll = 'rating scale',
}

const MaxPollAnswers = 8 as const

export const CreatePollDto = z.object({
  contextId: z.string().describe('Kaltura Session Id, entry id or channel id'),
  state: z.nativeEnum(EPollState).describe('Poll state, published, unpublished, draft, scheduled'),
  showResults: z.boolean().describe('Whether to show poll results to participants'),
  content: z.object({
    question: z.string().describe('Poll question. Example: "What is your favorite color?"'),
    options: z
      .array(z.string())
      .max(MaxPollAnswers)
      .optional()
      .describe('Poll options. Example: ["Red", "Blue", "Green"]. max 8 options'),
    correctAnswers: z
      .array(z.number().int().max(MaxPollAnswers).positive())
      .optional()
      .describe('Indexes of correct answers in the options array. Example: [0, 2]'),
  }),
  type: z.nativeEnum(EPollType).describe('Poll type, options poll or open answers'),
  // isEnded: z.boolean().optional().describe('Whether the poll is ended, false on creation'),
  visualization: z
    .discriminatedUnion('type', [
      z.object({
        type: z
          .literal(EVisualizationType.CrowdPoll)
          .describe(
            'Crowd poll visualization. The user selects either thumbs up or thumbs down for "thumbs" icon. the user select Like unLike for "emotions" icon and Yes or No for "yes-no" icon.',
          ),
        icon: z
          .nativeEnum(EPollCrowdIconType)
          .describe(
            'Icon to use for the crowd poll. The user selects either thumbs up or thumbs down for "thumbs" icon. the user select Like unLike for "emotions" icon and Yes or No for "yes-no" icon.',
          ),
      }),
      z.object({
        type: z.literal(EVisualizationType.SliderPoll).describe('Slider poll visualization'),
      }),
      z.object({
        type: z
          .literal(EVisualizationType.RatingPoll)
          .describe(
            'Rating poll visualization, user selects a rating from 1 to 5 emojis, depending on the icon.',
          ),
        icon: z.nativeEnum(EPollRatingIconType).describe('Icon to use for the rating poll'),
      }),
    ])
    .optional(),
  isAcceptingMultipleVotes: z
    .boolean()
    .optional()
    .describe('Whether to allow multiple votes from the same user. For options poll'),
  trackWordFrequency: z.boolean().optional().describe('Whether to track word frequency. For open answers'),
  groupPoll: z
    .object({
      groupPollId: z.string(),
      isMandatory: z.boolean(),
      sortPosition: z.number(),
    })
    .optional()
    .describe('Whether this poll is part of a group poll (survey)'),
  scheduling: z
    .discriminatedUnion('schedulingType', [
      z.object({
        schedulingType: z
          .literal(SchedulingType.ABSOLUTE)
          .describe('Absolute scheduling, poll will be scheduled at a specific time'),
        scheduledTime: z
          .string()
          .datetime()
          .optional()
          .describe('For absolute scheduling - what user requested'),
      }),
      z.object({
        schedulingType: z
          .literal(SchedulingType.RELATIVE)
          .describe('Relative scheduling, poll will be scheduled relative to an event attribute'),
        relativeScheduling: z.object({
          offsetMilliseconds: z.number().int().describe('For relative scheduling, Offset in milliseconds'),
          attribute: z.nativeEnum(ScheduleAttribute),
        }),
      }),
    ])
    .optional()
    .describe('Scheduling options, absolute or relative'),
  autoCloseMilliseconds: z.number().int().optional().describe('Auto close poll after X milliseconds'),
})
export type TCreatePollDto = z.infer<typeof CreatePollDto>
