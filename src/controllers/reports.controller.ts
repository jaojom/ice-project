import { Request, Response, NextFunction } from 'express';
import * as reportsService from '../services/reports.service';

export async function progressByDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await reportsService.getProgressByDepartment();
    res.json(data);
  } catch (err) { next(err); }
}

export async function exportTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const format = (req.query.format as string) || 'json';
    const tasks = await reportsService.exportTasks();

    if (format === 'csv') {
      const csv = reportsService.tasksToCSV(tasks);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="tasks_export.csv"');
      res.send(csv);
    } else {
      res.json(tasks);
    }
  } catch (err) { next(err); }
}
