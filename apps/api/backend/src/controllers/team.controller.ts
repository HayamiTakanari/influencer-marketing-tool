import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const createTeamSchema = z.object({
  name: z.string().min(1, 'Team name is required').max(100, 'Team name too long'),
});

const updateTeamSchema = z.object({
  name: z.string().min(1, 'Team name is required').max(100, 'Team name too long').optional(),
});

const addMemberSchema = z.object({
  email: z.string().email('Invalid email format'),
  isOwner: z.boolean().default(false),
});

export const createTeam = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;
    
    if (userRole !== 'COMPANY') {
      return res.status(403).json({ error: 'Only companies can create teams' });
    }

    const { name } = createTeamSchema.parse(req.body);

    // Check if user has a client profile
    const client = await prisma.company.findUnique({
      where: { userId },
    });

    if (!client) {
      return res.status(404).json({ error: 'Client profile not found' });
    }

    // Create team with the current user as owner
    const team = await prisma.$transaction(async (tx) => {
      const newTeam = await tx.team.create({
        data: {
          name,
        },
      });

      // Add current user as team owner
      await tx.teamMember.create({
        data: {
          teamId: newTeam.id,
          userId,
          isOwner: true,
        },
      });

      // Skip team assignment - Company model doesn't have teamId field

      return newTeam;
    });

    const teamWithMembers = await prisma.team.findUnique({
      where: { id: team.id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
    });

    res.status(201).json(teamWithMembers);
  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({ error: 'Failed to create team' });
  }
};

export const getMyTeam = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;
    
    if (userRole !== 'COMPANY') {
      return res.status(403).json({ error: 'Only clients can access team information' });
    }

    // Get team through client or team membership
    const client = await prisma.company.findUnique({
      where: { userId },
    });

    if (!client) {
      return res.status(404).json({ error: 'Client profile not found' });
    }

    res.json({ team: null });
  } catch (error) {
    console.error('Get my team error:', error);
    res.status(500).json({ error: 'Failed to get team information' });
  }
};

export const updateTeam = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;
    const { teamId } = req.params;
    
    if (userRole !== 'COMPANY') {
      return res.status(403).json({ error: 'Only clients can update teams' });
    }

    const { name } = updateTeamSchema.parse(req.body);

    // Check if user is team owner
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId,
        isOwner: true,
      },
    });

    if (!teamMember) {
      return res.status(403).json({ error: 'Only team owners can update team information' });
    }

    const updatedTeam = await prisma.team.update({
      where: { id: teamId },
      data: { name },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                role: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    res.json(updatedTeam);
  } catch (error) {
    console.error('Update team error:', error);
    res.status(500).json({ error: 'Failed to update team' });
  }
};

export const addTeamMember = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;
    const { teamId } = req.params;
    
    if (userRole !== 'COMPANY') {
      return res.status(403).json({ error: 'Only clients can add team members' });
    }

    const { email, isOwner } = addMemberSchema.parse(req.body);

    // Check if current user is team owner
    const currentMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId,
        isOwner: true,
      },
    });

    if (!currentMember) {
      return res.status(403).json({ error: 'Only team owners can add members' });
    }

    // Find user by email
    const targetUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (targetUser.role !== 'COMPANY') {
      return res.status(400).json({ error: 'Only client users can be added to teams' });
    }

    // Check if user is already a team member
    const existingMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: targetUser.id,
      },
    });

    if (existingMember) {
      return res.status(400).json({ error: 'User is already a team member' });
    }

    // Add member to team
    const newMember = await prisma.teamMember.create({
      data: {
        teamId,
        userId: targetUser.id,
        isOwner,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            createdAt: true,
          },
        },
      },
    });

    res.status(201).json(newMember);
  } catch (error) {
    console.error('Add team member error:', error);
    res.status(500).json({ error: 'Failed to add team member' });
  }
};

export const removeTeamMember = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;
    const { teamId, memberId } = req.params;
    
    if (userRole !== 'COMPANY') {
      return res.status(403).json({ error: 'Only clients can remove team members' });
    }

    // Check if current user is team owner
    const currentMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId,
        isOwner: true,
      },
    });

    if (!currentMember) {
      return res.status(403).json({ error: 'Only team owners can remove members' });
    }

    // Get member to remove
    const memberToRemove = await prisma.teamMember.findUnique({
      where: { id: memberId },
    });

    if (!memberToRemove || memberToRemove.teamId !== teamId) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    // Don't allow removing yourself if you're the only owner
    if (memberToRemove.userId === userId) {
      const ownerCount = await prisma.teamMember.count({
        where: {
          teamId,
          isOwner: true,
        },
      });

      if (ownerCount === 1) {
        return res.status(400).json({ error: 'Cannot remove yourself as the only team owner' });
      }
    }

    // Remove member
    await prisma.teamMember.delete({
      where: { id: memberId },
    });

    res.json({ message: 'Team member removed successfully' });
  } catch (error) {
    console.error('Remove team member error:', error);
    res.status(500).json({ error: 'Failed to remove team member' });
  }
};

export const updateMemberRole = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;
    const { teamId, memberId } = req.params;
    const { isOwner } = z.object({ isOwner: z.boolean() }).parse(req.body);
    
    if (userRole !== 'COMPANY') {
      return res.status(403).json({ error: 'Only clients can update member roles' });
    }

    // Check if current user is team owner
    const currentMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId,
        isOwner: true,
      },
    });

    if (!currentMember) {
      return res.status(403).json({ error: 'Only team owners can update member roles' });
    }

    // Get member to update
    const memberToUpdate = await prisma.teamMember.findUnique({
      where: { id: memberId },
    });

    if (!memberToUpdate || memberToUpdate.teamId !== teamId) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    // If removing owner role, ensure there's at least one owner left
    if (!isOwner && memberToUpdate.isOwner) {
      const ownerCount = await prisma.teamMember.count({
        where: {
          teamId,
          isOwner: true,
        },
      });

      if (ownerCount === 1) {
        return res.status(400).json({ error: 'Team must have at least one owner' });
      }
    }

    // Update member role
    const updatedMember = await prisma.teamMember.update({
      where: { id: memberId },
      data: { isOwner },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            createdAt: true,
          },
        },
      },
    });

    res.json(updatedMember);
  } catch (error) {
    console.error('Update member role error:', error);
    res.status(500).json({ error: 'Failed to update member role' });
  }
};

export const deleteTeam = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;
    const { teamId } = req.params;
    
    if (userRole !== 'COMPANY') {
      return res.status(403).json({ error: 'Only clients can delete teams' });
    }

    // Check if current user is team owner
    const currentMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId,
        isOwner: true,
      },
    });

    if (!currentMember) {
      return res.status(403).json({ error: 'Only team owners can delete teams' });
    }

    // Check if team has active projects
    const activeProjects = await prisma.project.count({
      where: {
        status: {
          in: ['PENDING', 'MATCHED', 'IN_PROGRESS'],
        },
      },
    });

    if (activeProjects > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete team with active projects. Please complete or cancel all projects first.' 
      });
    }

    // Delete team (cascade will handle members and client updates)
    await prisma.team.delete({
      where: { id: teamId },
    });

    res.json({ message: 'Team deleted successfully' });
  } catch (error) {
    console.error('Delete team error:', error);
    res.status(500).json({ error: 'Failed to delete team' });
  }
};