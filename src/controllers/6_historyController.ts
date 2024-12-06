/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import History from '@src/models/6_History';
import { Request, Response } from 'express';

// Crear un nuevo registro de historial
export const createHistory = async (req: Request, res: Response) => {
    try {
        const { matchId, result, stats } = req.body;

        if (!matchId || !result) {
            return res.status(400).json({ message: 'matchId and result are required.' });
        }

        const history = await History.create({
            matchId,
            result,
            stats,
        });

        res.status(201).json(history);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Obtener un registro de historial por su ID
export const getHistoryById = async (req: Request, res: Response) => {
    try {
        const { historyId } = req.params;

        const history = await History.findById(historyId);

        if (!history || history.isDeleted) {
            return res.status(404).json({ message: 'History record not found.' });
        }

        res.status(200).json(history);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Actualizar un registro de historial
export const updateHistory = async (req: Request, res: Response) => {
    try {
        const { historyId } = req.params;
        const { result, stats } = req.body;

        const history = await History.findById(historyId);

        if (!history || history.isDeleted) {
            return res.status(404).json({ message: 'History record not found.' });
        }

        if (result) history.result = result;
        if (stats) history.stats = stats;
        history.updatedAt = new Date();

        await history.save();

        res.status(200).json(history);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Eliminar un registro de historial (soft delete)
export const deleteHistory = async (req: Request, res: Response) => {
    try {
        const { historyId } = req.params;

        const history: any = await History.findById(historyId);

        if (!history || history.isDeleted) {
            return res.status(404).json({ message: 'History record not found.' });
        }

        await history.softDelete();

        res.status(200).json({ message: 'History record deleted successfully.' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Restaurar un registro de historial eliminado
export const restoreHistory = async (req: Request, res: Response) => {
    try {
        const { historyId } = req.params;

        const history: any = await History.findById(historyId);

        if (!history || !history.isDeleted) {
            return res.status(404).json({ message: 'History record not found or not deleted.' });
        }

        await history.restore();

        res.status(200).json(history);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Listar registros de historial con filtros opcionales
export const listHistories = async (req: Request, res: Response) => {
    try {
        const filters: any = {
            ...req.query,
            isDeleted: false,
        };

        const histories = await History.find(filters).populate('matchId');

        res.status(200).json(histories);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
