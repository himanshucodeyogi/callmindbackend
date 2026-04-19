const User = require('../models/User');
const Recording = require('../models/Recording');
const Task = require('../models/Task');
const AppUsage = require('../models/AppUsage');
const { ok } = require('../utils/responseFormatter');

// Helper: date N days ago
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
};

const getStats = async (req, res) => {
  const now = new Date();
  const today = daysAgo(0);
  const week = daysAgo(7);
  const month = daysAgo(30);

  const [
    totalUsers,
    newUsersToday,
    newUsersWeek,
    newUsersMonth,
    totalRecordings,
    recordingsToday,
    recordingsWeek,
    completedRecordings,
    failedRecordings,
    totalTasks,
    completedTasks,
    totalUsageEvents,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ createdAt: { $gte: today } }),
    User.countDocuments({ createdAt: { $gte: week } }),
    User.countDocuments({ createdAt: { $gte: month } }),
    Recording.countDocuments(),
    Recording.countDocuments({ createdAt: { $gte: today } }),
    Recording.countDocuments({ createdAt: { $gte: week } }),
    Recording.countDocuments({ status: 'complete' }),
    Recording.countDocuments({ status: 'failed' }),
    Task.countDocuments(),
    Task.countDocuments({ isCompleted: true }),
    AppUsage.countDocuments(),
  ]);

  ok(res, {
    users: { total: totalUsers, today: newUsersToday, week: newUsersWeek, month: newUsersMonth },
    recordings: {
      total: totalRecordings,
      today: recordingsToday,
      week: recordingsWeek,
      complete: completedRecordings,
      failed: failedRecordings,
      successRate: totalRecordings
        ? Math.round((completedRecordings / totalRecordings) * 100)
        : 0,
    },
    tasks: {
      total: totalTasks,
      completed: completedTasks,
      pending: totalTasks - completedTasks,
      completionRate: totalTasks
        ? Math.round((completedTasks / totalTasks) * 100)
        : 0,
    },
    usage: { totalEvents: totalUsageEvents },
  });
};

const getTopUsers = async (req, res) => {
  const limit = Math.min(50, parseInt(req.query.limit) || 10);

  // Aggregate recordings per user
  const topByRecordings = await Recording.aggregate([
    { $group: { _id: '$userId', recordings: { $sum: 1 }, lastActive: { $max: '$createdAt' } } },
    { $sort: { recordings: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
    {
      $project: {
        _id: 0,
        userId: '$_id',
        name: '$user.name',
        deviceId: '$user.deviceId',
        recordings: 1,
        lastActive: 1,
      },
    },
  ]);

  // Add tasks count for each user
  const withTasks = await Promise.all(
    topByRecordings.map(async (u) => {
      const tasks = await Task.countDocuments({ userId: u.userId });
      return { ...u, tasks };
    })
  );

  ok(res, { users: withTasks });
};

const getFeatureUsage = async (req, res) => {
  // Action breakdown
  const actionCounts = await AppUsage.aggregate([
    { $group: { _id: '$action', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  // Daily recording activity (last 14 days)
  const dailyRecordings = await Recording.aggregate([
    { $match: { createdAt: { $gte: daysAgo(14) } } },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Daily new users (last 14 days)
  const dailyUsers = await User.aggregate([
    { $match: { createdAt: { $gte: daysAgo(14) } } },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Recording status distribution
  const statusDist = await Recording.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  // Avg tasks per completed recording
  const avgTasksResult = await Task.aggregate([
    {
      $group: {
        _id: '$recordingId',
        taskCount: { $sum: 1 },
      },
    },
    { $group: { _id: null, avgTasks: { $avg: '$taskCount' } } },
  ]);
  const avgTasksPerRecording = avgTasksResult[0]?.avgTasks?.toFixed(1) || '0';

  ok(res, {
    actionBreakdown: actionCounts.reduce((acc, a) => {
      acc[a._id] = a.count;
      return acc;
    }, {}),
    dailyRecordings,
    dailyUsers,
    statusDistribution: statusDist.reduce((acc, s) => {
      acc[s._id] = s.count;
      return acc;
    }, {}),
    avgTasksPerRecording: parseFloat(avgTasksPerRecording),
  });
};

const getRecentActivity = async (req, res) => {
  const limit = parseInt(req.query.limit) || 20;

  const [recentRecordings, recentUsers] = await Promise.all([
    Recording.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('userId', 'name')
      .lean(),
    User.find().sort({ createdAt: -1 }).limit(10).lean(),
  ]);

  ok(res, {
    recentRecordings: recentRecordings.map((r) => ({
      id: r._id,
      title: r.title,
      user: r.userId?.name || 'Unknown',
      status: r.status,
      duration: r.durationSeconds,
      createdAt: r.createdAt,
    })),
    recentUsers: recentUsers.map((u) => ({
      id: u._id,
      name: u.name,
      joinedAt: u.createdAt,
    })),
  });
};

module.exports = { getStats, getTopUsers, getFeatureUsage, getRecentActivity };
