import type { Request, Response } from 'express';
import { supabase } from '../config/supabase.js';

export const getInventoryItems = async (
    req: Request,
    res: Response
) => {
    try {
        const { data, error } = await supabase
            .from('inventory_items')
            .select('*');

        if (error) {
            throw error;
        }

        res.json({
            success: true,
            data,
        });
    } catch (error) {
        console.error('Select failed:', error);

        res.status(500).json({
            success: false,
            message: 'Select failed',
            error: error instanceof Error
                ? error.message
                : JSON.stringify(error),
        });
    }
};

export const createInventoryItem = async (
    req: Request,
    res: Response
) => {
    try {
        const { uuid, name, cnt, meta } = req.body;

        const { data, error } = await supabase
            .from('inventory_items')
            .insert({
                uuid,
                name,
                cnt,
                meta,
            })
            .select()
            .single();

        if (error) {
            throw error;
        }

        res.status(201).json({
            success: true,
            data,
        });
    } catch (error) {
        console.error('Insert failed:', error);

        res.status(500).json({
            success: false,
            message: 'Insert failed',
            error: error instanceof Error
                ? error.message
                : JSON.stringify(error),
        });
    }
};

export const updateInventoryItem = async (
    req: Request,
    res: Response
) => {
    try {
        const { uuid } = req.params;
        const { name, cnt, meta } = req.body;

        const { data, error } = await supabase
            .from('inventory_items')
            .update({
                name,
                cnt,
                meta,
            })
            .eq('uuid', uuid)
            .select()
            .single();

        if (error) {
            throw error;
        }

        res.json({
            success: true,
            data,
        });
    } catch (error) {
        console.error('Update failed:', error);

        res.status(500).json({
            success: false,
            message: 'Update failed',
            error: error instanceof Error
                ? error.message
                : JSON.stringify(error),
        });
    }
};

export const deleteInventoryItem = async (
    req: Request,
    res: Response
) => {
    try {
        const { uuid } = req.params;

        const { data, error } = await supabase
            .from('inventory_items')
            .delete()
            .eq('uuid', uuid)
            .select()
            .single();

        if (error) {
            throw error;
        }

        res.json({
            success: true,
            data,
        });
    } catch (error) {
        console.error('Delete failed:', error);

        res.status(500).json({
            success: false,
            message: 'Delete failed',
            error: error instanceof Error
                ? error.message
                : JSON.stringify(error),
        });
    }
};