const Event = require('../models/Event');
const Alert = require('../models/Alert');
const Case = require('../models/Case');
const Endpoint = require('../models/Endpoint');
const Account = require('../models/Account');
const IOC = require('../models/IOC');

async function getDashboardSummary(req, res, next) {
  try {
    const [
      totalEvents,
      totalAlerts,
      newAlerts,
      investigatingAlerts,
      resolvedAlerts,
      criticalAlerts,
      openCases,
      totalEndpoints,
      compromisedEndpoints,
      totalAccounts,
      compromisedAccounts,
      totalIOCs,
      maliciousIOCs,
      recentAlerts
    ] = await Promise.all([
      Event.countDocuments(),
      Alert.countDocuments(),
      Alert.countDocuments({ status: 'new' }),
      Alert.countDocuments({ status: 'investigating' }),
      Alert.countDocuments({ status: 'resolved' }),
      Alert.countDocuments({ severity: 'critical', status: { $in: ['new', 'investigating', 'assigned'] } }),
      Case.countDocuments({ status: { $in: ['open', 'investigating', 'pending_review'] } }),
      Endpoint.countDocuments(),
      Endpoint.countDocuments({ status: 'compromised' }),
      Account.countDocuments(),
      Account.countDocuments({ status: 'compromised' }),
      IOC.countDocuments(),
      IOC.countDocuments({ reputation: 'malicious' }),
      Alert.find()
        .populate('assignedTo', 'fullName username')
        .populate('ruleId', 'name mitreTechniqueId')
        .sort({ createdAt: -1 })
        .limit(8)
    ]);

    // Alerts by severity
    const alertsBySeverityAgg = await Alert.aggregate([
      { $group: { _id: '$severity', count: { $sum: 1 } } }
    ]);
    const alertsBySeverity = [
      { name: 'Critical', value: alertsBySeverityAgg.find(a => a._id === 'critical')?.count || 0, color: '#f43f5e' },
      { name: 'High', value: alertsBySeverityAgg.find(a => a._id === 'high')?.count || 0, color: '#f59e0b' },
      { name: 'Medium', value: alertsBySeverityAgg.find(a => a._id === 'medium')?.count || 0, color: '#38bdf8' },
      { name: 'Low', value: alertsBySeverityAgg.find(a => a._id === 'low')?.count || 0, color: '#10b981' }
    ];

    // Events by source (top 6)
    const eventsBySource = await Event.aggregate([
      { $group: { _id: '$source', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 6 },
      { $project: { name: '$_id', count: 1, _id: 0 } }
    ]);

    // Top Source IPs
    const topSourceIPs = await Event.aggregate([
      { $match: { sourceIP: { $ne: '', $exists: true } } },
      { $group: { _id: '$sourceIP', count: { $sum: 1 }, failedCount: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $project: { ip: '$_id', count: 1, failedCount: 1, _id: 0 } }
    ]);

    // Top Targeted Accounts
    const topTargetedAccounts = await Account.find()
      .sort({ riskScore: -1, failedLogins: -1 })
      .limit(5)
      .select('username domain privilege riskScore status failedLogins');

    // Top Affected Endpoints
    const topAffectedEndpoints = await Endpoint.find()
      .sort({ riskScore: -1 })
      .limit(5)
      .select('hostname os ipAddresses riskScore status userCount');

    // Events over time (last 24h bucketed by 2-hour windows, or realistic timeline)
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 3600 * 1000);
    
    // Check if we have events in last 24h; if not, query recent event span
    const countRecent = await Event.countDocuments({ timestamp: { $gte: oneDayAgo } });
    let timelineStart = oneDayAgo;
    
    if (countRecent === 0) {
      const latestEvent = await Event.findOne().sort({ timestamp: -1 });
      if (latestEvent && latestEvent.timestamp) {
        timelineStart = new Date(latestEvent.timestamp.getTime() - 24 * 3600 * 1000);
      }
    }

    const eventsTimelineAgg = await Event.aggregate([
      { $match: { timestamp: { $gte: timelineStart } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%H:00', date: '$timestamp' }
          },
          count: { $sum: 1 },
          failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
          security: { $sum: { $cond: [{ $in: ['$severity', ['high', 'critical']] }, 1, 0] } }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    const eventsOverTime = eventsTimelineAgg.map(item => ({
      time: item._id,
      events: item.count,
      failed: item.failed,
      security: item.security
    }));

    // If timeline is empty (e.g. before logs uploaded), provide fallback hours
    if (eventsOverTime.length === 0) {
      for (let h = 0; h < 24; h += 4) {
        eventsOverTime.push({
          time: `${String(h).padStart(2, '0')}:00`,
          events: 0,
          failed: 0,
          security: 0
        });
      }
    }

    res.json({
      totals: {
        events: totalEvents,
        alerts: totalAlerts,
        activeAlerts: newAlerts + investigatingAlerts,
        criticalAlerts,
        openCases,
        endpoints: totalEndpoints,
        compromisedEndpoints,
        accounts: totalAccounts,
        compromisedAccounts,
        iocs: totalIOCs,
        maliciousIOCs
      },
      alertsByStatus: {
        new: newAlerts,
        investigating: investigatingAlerts,
        resolved: resolvedAlerts
      },
      alertsBySeverity,
      eventsBySource,
      topSourceIPs,
      topTargetedAccounts,
      topAffectedEndpoints,
      eventsOverTime,
      recentAlerts
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDashboardSummary
};
