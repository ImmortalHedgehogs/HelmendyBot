/* eslint-env jest */
// Add the above comment to all jest files so they don't fail linting due to no-undef

const mockingoose = require('mockingoose')
const Group = require('../db-schemas/group')
const schedule = require('../src/schedule')
const { App } = require('@slack/bolt')

jest.mock('../src/slack')

describe('schedule.js testing suite', () => {
  const app = new App({})

  describe('removeTasks function with empty list', () => {
    const groupName = 'test_group2'
    test('removing something from the task list', () => {
      const list = []
      const res = schedule.removeTasks(list, groupName)
      expect(res).toBe(0)
    })

    test('removeTasks function valid', () => {
      const list = [
        {
          group: 'test_group1',
          eodTask: {
            stop: jest.fn()
          },
          subscriberTask: {
            stop: jest.fn()
          }
        },
        {
          group: 'test_group2',
          eodTask: {
            stop: jest.fn()
          },
          subscriberTask: {
            stop: jest.fn()
          }
        },
        {
          group: 'test_group3',
          eodTask: {
            stop: jest.fn()
          },
          subscriberTask: {
            stop: jest.fn()
          }
        }
      ]
      const res = schedule.removeTasks(list, groupName)
      expect(res).toBe(1)
      expect(list.length).toBe(2)
    })
  })

  test('Handle cron job setup from single group in DB', async () => {
    const groups = [{
      name: 'Group 1',
      contributors: ['UID123', 'UID456'],
      subscribers: ['UIS789'],
      postTime: 16,
      channel: 'CID123'
    }]

    mockingoose(Group).toReturn(groups, 'find')

    const result = await schedule.startCronJobs([], app)

    expect(result).toBe(0)
  })

  test('Handle cron job setup from multiple groups in DB', async () => {
    const groups = [{
      name: 'Group 1',
      contributors: ['UID123', 'UID456'],
      subscribers: ['UIS789'],
      postTime: 16,
      channel: 'CID123'
    },
    {
      name: 'Group 2',
      contributors: ['UID123', 'UID456'],
      subscribers: ['UIS789'],
      postTime: 16,
      channel: 'CID123'
    }]

    mockingoose(Group).toReturn(groups, 'find')

    const result = await schedule.startCronJobs([], app)

    expect(result).toBe(0)
  })

  test('Handle cron job setup from zero groups in DB', async () => {
    const groups = []

    mockingoose(Group).toReturn(groups, 'find')

    const result = await schedule.startCronJobs([], app)

    expect(result).toBeNull()
  })

  test('Schedule cron job from valid group', async () => {
    const group = {
      name: 'Group 1',
      contributors: ['UID123', 'UID456'],
      subscribers: ['UIS789'],
      postTime: 16,
      channel: 'CID123'
    }

    mockingoose(Group).toReturn(group, 'findOne')

    const result = await schedule.scheduleCronJob([], group, app)

    expect(result).toBe(0)
  })

  test('Skip adding a group with invalid time to schedule', async () => {
    const group = {
      name: 'Group 2',
      contributors: ['UID123'],
      subscribers: ['UIS789'],
      postTime: 25,
      channel: 'CID123'
    }

    mockingoose(Group).toReturn(group, 'findOne')

    const result = await schedule.scheduleCronJob([], group, app)

    expect(result).toBeNull()
  })

  test('Skip adding a nonexistent group to schedule', async () => {
    mockingoose(Group).toReturn(null, 'findOne')

    const result = await schedule.scheduleCronJob([], null, app)

    expect(result).toBeNull()
  })

  test('Pass double digit time to convertPostTimeToCron', async () => {
    const result = schedule.convertPostTimeToCron(15)
    expect(result).toBe('0 15 * * 1-5')
  })

  test('Pass single digit time to convertPostTimeToCron', async () => {
    const result = schedule.convertPostTimeToCron(5)
    expect(result).toBe('0 5 * * 1-5')
  })

  test('Pass invalid time to convertPostTimeToCron', async () => {
    const result = schedule.convertPostTimeToCron(25)
    expect(result).toBeNull()
  })
})
