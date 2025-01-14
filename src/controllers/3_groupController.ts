/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import User from '@src/models/1_User';
import Group from '@src/models/3_Group';

// Crear un grupo
export const createGroup = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, description } = req.body;

        if (!name) {
            res.status(400).send({ message: 'El nombre del grupo es obligatorio' });
            return;
        }

        const newGroup = new Group({ name, description, members: [] });
        await newGroup.save();

        res.status(201).send({ message: 'Grupo creado con éxito', group: newGroup });
    } catch (error: any) {
        res.status(500).send({ error: error.message });
    }
};

// Obtener detalles de un grupo por ID
export const getGroupById = async (req: Request, res: Response): Promise<void> => {
    try {
        const group = await Group.findById(req.params.id).populate('members', 'name email');
        if (!group) {
            res.status(404).send({ message: 'Grupo no encontrado' });
            return;
        }
        res.status(200).send(group);
    } catch (error: any) {
        res.status(500).send({ message: 'Grupo no encontrado' });
    }
};

// Unirse a un grupo
export const joinGroup = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId } = req.body; // ID del usuario que se unirá al grupo
        const group = await Group.findById(req.params.id);
        const user = await User.findById(userId);

        if (!group || !user) {
            res.status(404).send({ message: 'Grupo o usuario no encontrado' });
            return;
        }

        // Verificar si el usuario ya es miembro
        if (group.members.includes(userId)) {
            res.status(400).send({ message: 'El usuario ya es miembro del grupo' });
            return;
        }

        group.members.push(userId);
        await group.save();

        res.status(200).send({ message: 'Usuario añadido al grupo', group });
    } catch (error: any) {
        res.status(500).send({ error: error.message });
    }
};

// Listar miembros de un grupo
export const getGroupMembers = async (req: Request, res: Response): Promise<void> => {
    try {
        const group = await Group.findById(req.params.id).populate('members', 'name email');
        if (!group) {
            res.status(404).send({ message: 'Grupo no encontrado' });
            return;
        }
        res.status(200).send({ members: group.members });
    } catch (error: any) {
        res.status(500).send({ error: error.message });
    }
};

// Eliminar a un grupo
export const deleteGroup = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        // Buscar el grupo por ID
        const group: any = await Group.findById(id);
        if (!group) {
            res.status(404).send({ message: 'Grupo no encontrado' });
            return;
        }

        // Realizar el soft delete usando el método definido en el esquema
        await group.softDelete();

        res.status(200).send({ message: 'Grupo eliminado correctamente (soft delete)', group });
    } catch (error: any) {
        res.status(500).send({ error: error.message });
    }
};

// Recupera un grupo oculto
export const restoreGroup = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        // Buscar el grupo eliminado por ID
        const group: any = await Group.findOne({ _id: id });
        if (!group) {
            res.status(404).send({ message: 'Grupo no encontrado o no está eliminado' });
            return;
        }

        // Restaurar el grupo usando el método definido en el esquema
        await group.restore();

        res.status(200).send({ message: 'Grupo restaurado correctamente', group });
    } catch (error: any) {
        res.status(500).send({ error: error.message });
    }
};

// Actualizar un grupo
export const updateGroup = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { name, description, members } = req.body;

        // Buscar el grupo por ID
        const group = await Group.findById(id);
        if (!group) {
            res.status(404).send({ message: 'Grupo no encontrado' });
            return;
        }

        // Actualizar los campos permitidos
        if (name) group.name = name;
        if (description) group.description = description;
        if (members) group.members = members;

        await group.save();

        res.status(200).send({ message: 'Grupo actualizado correctamente', group });
    } catch (error: any) {
        res.status(500).send({ error: error.message });
    }
};

// Listar grupos con filtros opcionales y paginación
export const listGroups = async (req: Request, res: Response): Promise<void> => {
    try {
        const { page = 1, limit = 10, name, includeDeleted } = req.query;

        // Validar y convertir parámetros de paginación
        const pageNumber = parseInt(page as string, 10);
        const limitNumber = parseInt(limit as string, 10);

        if (isNaN(pageNumber) || isNaN(limitNumber) || pageNumber <= 0 || limitNumber <= 0) {
            res.status(400).send({ message: 'Page and limit must be positive numbers.' });
            return;
        }

        // Construir filtros dinámicamente
        const filters: any = { isDeleted: false }; // Por defecto, excluir eliminados
        if (includeDeleted === 'true') delete filters.isDeleted; // Incluir eliminados si se solicita
        if (name) filters.name = new RegExp(name as string, 'i'); // Búsqueda parcial (case-insensitive)

        // Calcular el número de documentos a omitir para la paginación
        const skip = (pageNumber - 1) * limitNumber;

        // Consultar la base de datos con paginación y filtros
        const groups = await Group.find(filters)
            .populate('members', 'name email') // Opcional: devolver campos específicos de los miembros
            .skip(skip)
            .limit(limitNumber);

        // Contar el total de grupos que coinciden con los filtros
        const totalGroups = await Group.countDocuments(filters);

        // Calcular el número total de páginas
        const totalPages = Math.ceil(totalGroups / limitNumber);

        // Enviar respuesta con datos paginados
        res.status(200).send({
            page: pageNumber,
            limit: limitNumber,
            totalPages,
            totalGroups,
            data: groups,
        });
    } catch (error: any) {
        res.status(500).send({ error: error.message });
    }
};
