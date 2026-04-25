import { Router, Request, Response } from 'express';
import { saveDealIntake } from '../lib/firestore';

export const dealRouter = Router();

interface DealIntakeBody {
  propertyType?: string;
  address?: string;
  askingPrice?: number;
  noi?: number;
  capRate?: number;
  downPayment?: number;
  annualDebtService?: number;
  financing?: string;
  questions?: string;
  contactEmail?: string;
}

dealRouter.post('/deal/intake', async (req: Request, res: Response) => {
  try {
    const body = req.body as DealIntakeBody;

    const hasAnyField = Object.values(body).some(
      (v) => v !== undefined && v !== null && v !== ''
    );
    if (!hasAnyField) {
      res.status(400).json({ error: 'At least one field is required' });
      return;
    }

    const id = await saveDealIntake(body as Record<string, unknown>);
    res.json({ id, message: 'Deal intake submitted successfully' });
  } catch (err) {
    console.error('POST /api/deal/intake:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
