const Report = require('../models/Report');
const reportService = require('../services/reportService');

async function getCaseReport(req, res, next) {
  try {
    const report = await Report.findOne({ caseId: req.params.caseId })
      .populate('generatedBy', 'fullName username email');

    if (!report) return res.status(404).json({ error: 'NotFound', message: 'Report not generated yet for this case' });
    res.json(report);
  } catch (err) {
    next(err);
  }
}

async function getAllReports(req, res, next) {
  try {
    const reports = await Report.find()
      .populate('caseId', 'caseId title priority status')
      .populate('generatedBy', 'fullName username email')
      .sort({ generatedAt: -1 });

    res.json(reports);
  } catch (err) {
    next(err);
  }
}

async function generateCaseReport(req, res, next) {
  try {
    const userId = req.user ? req.user._id : null;
    const report = await reportService.generateReportForCase(req.params.caseId, userId);
    res.status(201).json({
      message: 'Incident report generated successfully',
      report
    });
  } catch (err) {
    next(err);
  }
}

async function exportCaseReport(req, res, next) {
  try {
    const { format = 'md' } = req.query;
    let report = await Report.findOne({ caseId: req.params.caseId });
    if (!report) {
      report = await reportService.generateReportForCase(req.params.caseId, req.user ? req.user._id : null);
    }

    if (format === 'html') {
      const html = reportService.exportReportToHTML(report);
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `attachment; filename="${report.reportNumber}.html"`);
      return res.send(html);
    }

    // Default: markdown
    const md = reportService.exportReportToMarkdown(report);
    res.setHeader('Content-Type', 'text/markdown');
    res.setHeader('Content-Disposition', `attachment; filename="${report.reportNumber}.md"`);
    res.send(md);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getCaseReport,
  getAllReports,
  generateCaseReport,
  exportCaseReport
};
