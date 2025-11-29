import { Request, Response } from 'express';
import { PrismaClient, Platform, Gender, ProjectStatus } from '@prisma/client';
import { z } from 'zod';
import { NotificationService } from '../services/notification.service';

const prisma = new PrismaClient();

const getAvailableProjectsSchema = z.object({
  category: z.string().optional(),
  minBudget: z.number().optional(),
  maxBudget: z.number().optional(),
  platforms: z.array(z.nativeEnum(Platform)).optional(),
  prefecture: z.string().optional(),
  page: z.number().default(1),
  limit: z.number().default(20),
});

const applyToProjectSchema = z.object({
  projectId: z.string(),
  message: z.string().min(1, 'Message is required'),
  proposedPrice: z.number().min(0, 'Proposed price must be positive'),
});

export const getAvailableProjects = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;
    
    if (userRole !== 'INFLUENCER') {
      return res.status(403).json({ error: 'Only influencers can view available projects' });
    }

    const query = getAvailableProjectsSchema.parse(req.query);
    const skip = (query.page - 1) * query.limit;

    // Get influencer profile to match against projects
    const influencer = await prisma.influencer.findUnique({
      where: { userId },
      include: {
        socialAccounts: true,
      },
    });

    if (!influencer) {
      return res.status(404).json({ error: 'Influencer profile not found' });
    }

    const where: any = {
      status: 'PENDING',
      endDate: { gte: new Date() }, // Only show projects that haven't ended
    };

    if (query.category) {
      where.category = query.category;
    }

    if (query.minBudget !== undefined || query.maxBudget !== undefined) {
      where.budget = {};
      if (query.minBudget !== undefined) {
        where.budget.gte = query.minBudget;
      }
      if (query.maxBudget !== undefined) {
        where.budget.lte = query.maxBudget;
      }
    }

    if (query.platforms && query.platforms.length > 0) {
      where.targetPlatforms = { hasSome: query.platforms };
    }

    if (query.prefecture) {
      where.targetPrefecture = query.prefecture;
    }

    // インフルエンサーが連携しているプラットフォームを取得
    const connectedPlatforms = influencer.socialAccounts
      .filter(acc => acc.isVerified)
      .map(acc => acc.platform);

    // 連携しているプラットフォームを使用する案件のみ表示
    if (connectedPlatforms.length > 0) {
      where.OR = [
        { targetPlatforms: { isEmpty: true } }, // プラットフォーム指定なしの案件
        { targetPlatforms: { hasSome: connectedPlatforms } } // 連携済みプラットフォームを含む案件
      ];
    } else {
      // 連携していない場合はプラットフォーム指定なしの案件のみ
      where.targetPlatforms = { isEmpty: true };
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: {
          client: {
            include: {
              user: {
                select: {
                  email: true,
                },
              },
            },
          },
          applications: {
            where: {
              influencerId: influencer.id,
            },
          },
        },
        skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.project.count({ where }),
    ]);

    // Calculate if each project matches the influencer's profile
    const projectsWithMatchInfo = projects.map(project => {
      const isApplied = project.applications.length > 0;
      
      // Check if influencer matches project criteria
      let matchesProfile = true;
      
      // Check age requirements
      if (project.targetAgeMin && project.targetAgeMax && influencer.birthDate) {
        const age = new Date().getFullYear() - influencer.birthDate.getFullYear();
        if (age < project.targetAgeMin || age > project.targetAgeMax) {
          matchesProfile = false;
        }
      }
      
      // Check gender requirements
      if (project.targetGender && project.targetGender !== influencer.gender) {
        matchesProfile = false;
      }
      
      // Check location requirements
      if (project.targetPrefecture && project.targetPrefecture !== '全国' && 
          project.targetPrefecture !== influencer.prefecture) {
        matchesProfile = false;
      }
      
      // Check platform requirements - インフルエンサーが連携していないSNSを使用する案件は除外
      if (project.targetPlatforms.length > 0) {
        const connectedPlatforms = influencer.socialAccounts
          .filter(acc => acc.isVerified)
          .map(acc => acc.platform);
        const hasMatchingPlatform = project.targetPlatforms.some(platform => 
          connectedPlatforms.includes(platform)
        );
        if (!hasMatchingPlatform) {
          matchesProfile = false;
        }
      }
      
      // Check follower count requirements
      if (project.targetFollowerMin || project.targetFollowerMax) {
        const totalFollowers = influencer.socialAccounts.reduce(
          (sum, acc) => sum + acc.followerCount, 
          0
        );
        
        if (project.targetFollowerMin && totalFollowers < project.targetFollowerMin) {
          matchesProfile = false;
        }
        if (project.targetFollowerMax && totalFollowers > project.targetFollowerMax) {
          matchesProfile = false;
        }
      }

      return {
        ...project,
        isApplied,
        matchesProfile,
        applications: undefined, // Remove applications from response
      };
    });

    const totalPages = Math.ceil(total / query.limit);

    res.json({
      projects: projectsWithMatchInfo,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Get available projects error:', error);
    res.status(500).json({ error: 'Failed to get available projects' });
  }
};

export const applyToProject = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;
    
    if (userRole !== 'INFLUENCER') {
      return res.status(403).json({ error: 'Only influencers can apply to projects' });
    }

    const { projectId, message, proposedPrice } = applyToProjectSchema.parse(req.body);

    // Get influencer profile
    const influencer = await prisma.influencer.findUnique({
      where: { userId },
    });

    if (!influencer) {
      return res.status(404).json({ error: 'Influencer profile not found' });
    }

    // Check if project exists and is available
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        client: true,
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.status !== 'PENDING') {
      return res.status(400).json({ error: 'Project is no longer available for applications' });
    }

    if (project.endDate < new Date()) {
      return res.status(400).json({ error: 'Project application deadline has passed' });
    }

    // Check if already applied
    const existingApplication = await prisma.application.findUnique({
      where: {
        projectId_influencerId: {
          projectId,
          influencerId: influencer.id,
        },
      },
    });

    if (existingApplication) {
      return res.status(400).json({ error: 'You have already applied to this project' });
    }

    // Create application
    const application = await prisma.application.create({
      data: {
        projectId,
        influencerId: influencer.id,
        clientId: project.clientId,
        message,
        proposedPrice,
      },
      include: {
        influencer: {
          include: {
            user: {
              select: {
                email: true,
              },
            },
            socialAccounts: true,
          },
        },
        project: {
          include: {
            client: {
              include: {
                user: {
                  select: {
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Send notification to client
    try {
      await NotificationService.createApplicationReceivedNotification(
        project.client.userId,
        project.title,
        application.influencer.displayName,
        application.id
      );
    } catch (error) {
      console.error('Failed to send application notification:', error);
    }

    res.status(201).json(application);
  } catch (error) {
    console.error('Apply to project error:', error);
    res.status(500).json({ error: 'Failed to apply to project' });
  }
};

export const getMyApplications = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;
    
    if (userRole !== 'INFLUENCER') {
      return res.status(403).json({ error: 'Only influencers can view their applications' });
    }

    // Get influencer profile
    const influencer = await prisma.influencer.findUnique({
      where: { userId },
    });

    if (!influencer) {
      return res.status(404).json({ error: 'Influencer profile not found' });
    }

    const applications = await prisma.application.findMany({
      where: {
        influencerId: influencer.id,
      },
      include: {
        project: {
          include: {
            client: {
              include: {
                user: {
                  select: {
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { appliedAt: 'desc' },
    });

    res.json(applications);
  } catch (error) {
    console.error('Get my applications error:', error);
    res.status(500).json({ error: 'Failed to get applications' });
  }
};

export const getApplicationsForMyProjects = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;
    
    if (userRole !== 'CLIENT') {
      return res.status(403).json({ error: 'Only clients can view applications for their projects' });
    }

    // Get client profile
    const client = await prisma.client.findUnique({
      where: { userId },
    });

    if (!client) {
      return res.status(404).json({ error: 'Client profile not found' });
    }

    const applications = await prisma.application.findMany({
      where: {
        clientId: client.id,
      },
      include: {
        influencer: {
          include: {
            user: {
              select: {
                email: true,
              },
            },
            socialAccounts: true,
          },
        },
        project: true,
      },
      orderBy: { appliedAt: 'desc' },
    });

    res.json(applications);
  } catch (error) {
    console.error('Get applications for my projects error:', error);
    res.status(500).json({ error: 'Failed to get applications' });
  }
};

export const acceptApplication = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;
    const { applicationId } = req.params;
    
    if (userRole !== 'CLIENT') {
      return res.status(403).json({ error: 'Only clients can accept applications' });
    }

    // Get client profile
    const client = await prisma.client.findUnique({
      where: { userId },
    });

    if (!client) {
      return res.status(404).json({ error: 'Client profile not found' });
    }

    // Get application
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        project: true,
        influencer: true,
      },
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    if (application.clientId !== client.id) {
      return res.status(403).json({ error: 'You can only accept applications for your own projects' });
    }

    if (application.isAccepted) {
      return res.status(400).json({ error: 'Application has already been accepted' });
    }

    if (application.project.status !== 'PENDING') {
      return res.status(400).json({ error: 'Project is no longer available' });
    }

    // Accept application and update project
    const updatedApplication = await prisma.$transaction(async (tx) => {
      // Accept the application
      const accepted = await tx.application.update({
        where: { id: applicationId },
        data: { isAccepted: true },
        include: {
          influencer: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                },
              },
              socialAccounts: true,
            },
          },
          project: {
            include: {
              client: {
                include: {
                  user: {
                    select: {
                      email: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      // Update project status and assign influencer
      await tx.project.update({
        where: { id: application.projectId },
        data: {
          status: 'MATCHED',
          matchedInfluencerId: application.influencerId,
        },
      });

      return accepted;
    });

    // Send notifications
    try {
      // Notify influencer about acceptance
      await NotificationService.createApplicationAcceptedNotification(
        updatedApplication.influencer.user.id,
        updatedApplication.project.title,
        updatedApplication.project.client.companyName,
        updatedApplication.project.id
      );

      // Notify influencer about project matching
      await NotificationService.createProjectMatchedNotification(
        updatedApplication.influencer.user.id,
        updatedApplication.project.title,
        updatedApplication.project.client.companyName,
        updatedApplication.project.id
      );
    } catch (error) {
      console.error('Failed to send acceptance notifications:', error);
    }

    res.json(updatedApplication);
  } catch (error) {
    console.error('Accept application error:', error);
    res.status(500).json({ error: 'Failed to accept application' });
  }
};

export const rejectApplication = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;
    const { applicationId } = req.params;
    
    if (userRole !== 'CLIENT') {
      return res.status(403).json({ error: 'Only clients can reject applications' });
    }

    // Get client profile
    const client = await prisma.client.findUnique({
      where: { userId },
    });

    if (!client) {
      return res.status(404).json({ error: 'Client profile not found' });
    }

    // Get application
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    if (application.clientId !== client.id) {
      return res.status(403).json({ error: 'You can only reject applications for your own projects' });
    }

    if (application.isAccepted) {
      return res.status(400).json({ error: 'Cannot reject an already accepted application' });
    }

    // Delete the application (soft reject)
    await prisma.application.delete({
      where: { id: applicationId },
    });

    res.json({ message: 'Application rejected successfully' });
  } catch (error) {
    console.error('Reject application error:', error);
    res.status(500).json({ error: 'Failed to reject application' });
  }
};

export const getProjectCategories = async (req: Request, res: Response) => {
  try {
    const projects = await prisma.project.findMany({
      where: {
        status: 'PENDING',
        endDate: { gte: new Date() },
      },
      select: { category: true },
      distinct: ['category'],
    });

    const categories = projects.map(p => p.category).filter(Boolean).sort();

    res.json(categories);
  } catch (error) {
    console.error('Get project categories error:', error);
    res.status(500).json({ error: 'Failed to get project categories' });
  }
};

// Project CRUD operations

const createProjectSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().min(1, 'Description is required').max(2000, 'Description too long'),
  category: z.string().min(1, 'Category is required'),
  budget: z.number().min(1000, 'Budget must be at least 1000 yen'),
  targetPlatforms: z.array(z.nativeEnum(Platform)).min(1, 'At least one platform is required'),
  targetPrefecture: z.string().optional(),
  targetCity: z.string().optional(),
  targetGender: z.nativeEnum(Gender).optional(),
  targetAgeMin: z.number().min(18).max(100).optional(),
  targetAgeMax: z.number().min(18).max(100).optional(),
  targetFollowerMin: z.number().min(0).optional(),
  targetFollowerMax: z.number().min(0).optional(),
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid start date'),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid end date'),
});

const updateProjectSchema = createProjectSchema.partial();

export const createProject = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;

    console.log('Creating project - userId:', userId, 'userRole:', userRole);
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    if (userRole !== 'CLIENT') {
      return res.status(403).json({ error: 'Only clients can create projects' });
    }

    let data;
    try {
      data = createProjectSchema.parse(req.body);
    } catch (validationError: any) {
      console.error('Validation error:', validationError);
      return res.status(400).json({
        error: 'Validation error',
        details: validationError.errors || validationError.message
      });
    }

    // Get client profile
    const client = await prisma.client.findUnique({
      where: { userId },
    });

    if (!client) {
      return res.status(404).json({ error: 'Client profile not found' });
    }

    // Validate dates
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    // UTC 00:00 に設定して、ローカルタイムゾーンの影響を避ける
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    console.log('Start date:', startDate, 'End date:', endDate, 'Today:', todayStart);

    if (startDate >= endDate) {
      return res.status(400).json({ error: 'End date must be after start date' });
    }

    // 本日以降の日付を許可（本日は許可）
    if (startDate < todayStart) {
      return res.status(400).json({ error: 'Start date cannot be in the past' });
    }

    // Validate age range
    if (data.targetAgeMin && data.targetAgeMax && data.targetAgeMin > data.targetAgeMax) {
      return res.status(400).json({ error: 'Minimum age cannot be greater than maximum age' });
    }

    // Validate follower range
    if (data.targetFollowerMin && data.targetFollowerMax && data.targetFollowerMin > data.targetFollowerMax) {
      return res.status(400).json({ error: 'Minimum follower count cannot be greater than maximum' });
    }

    const project = await prisma.project.create({
      data: {
        clientId: client.id,
        title: data.title,
        description: data.description,
        category: data.category,
        budget: data.budget,
        targetPlatforms: data.targetPlatforms,
        targetPrefecture: data.targetPrefecture,
        targetCity: data.targetCity,
        targetGender: data.targetGender,
        targetAgeMin: data.targetAgeMin,
        targetAgeMax: data.targetAgeMax,
        targetFollowerMin: data.targetFollowerMin,
        targetFollowerMax: data.targetFollowerMax,
        startDate: startDate,
        endDate: endDate,
      },
      include: {
        client: {
          include: {
            user: {
              select: {
                email: true,
              },
            },
          },
        },
      },
    });

    res.status(201).json({
      project: project,
      message: 'Project created successfully'
    });
  } catch (error: any) {
    console.error('Create project error:', error);

    // より詳細なエラーメッセージを返す
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors
      });
    }

    res.status(500).json({ error: 'Failed to create project' });
  }
};

export const getMyProjects = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;
    
    if (userRole !== 'CLIENT') {
      return res.status(403).json({ error: 'Only clients can view their projects' });
    }

    // Get client profile
    const client = await prisma.client.findUnique({
      where: { userId },
    });

    if (!client) {
      return res.status(404).json({ error: 'Client profile not found' });
    }

    const projects = await prisma.project.findMany({
      where: {
        clientId: client.id,
      },
      include: {
        client: {
          include: {
            user: {
              select: {
                email: true,
              },
            },
          },
        },
        applications: {
          include: {
            influencer: {
              include: {
                user: {
                  select: {
                    email: true,
                  },
                },
                socialAccounts: true,
              },
            },
          },
        },
        matchedInfluencer: {
          include: {
            user: {
              select: {
                email: true,
              },
            },
            socialAccounts: true,
          },
        },
        transaction: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(projects);
  } catch (error) {
    console.error('Get my projects error:', error);
    res.status(500).json({ error: 'Failed to get projects' });
  }
};

export const getProjectById = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;
    const { projectId } = req.params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        client: {
          include: {
            user: {
              select: {
                email: true,
              },
            },
          },
        },
        applications: {
          include: {
            influencer: {
              include: {
                user: {
                  select: {
                    email: true,
                  },
                },
                socialAccounts: true,
              },
            },
          },
        },
        matchedInfluencer: {
          include: {
            user: {
              select: {
                email: true,
              },
            },
            socialAccounts: true,
          },
        },
        transaction: true,
        messages: {
          include: {
            sender: {
              select: {
                email: true,
              },
            },
            receiver: {
              select: {
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check access permissions
    if (userRole === 'CLIENT') {
      const client = await prisma.client.findUnique({
        where: { userId },
      });
      if (!client || project.clientId !== client.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    } else if (userRole === 'INFLUENCER') {
      const influencer = await prisma.influencer.findUnique({
        where: { userId },
      });
      if (!influencer) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      // Check if influencer has applied or is matched
      const hasAccess = project.applications.some(app => app.influencerId === influencer.id) ||
                       project.matchedInfluencerId === influencer.id;
      
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied' });
      }
    } else {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(project);
  } catch (error) {
    console.error('Get project by ID error:', error);
    res.status(500).json({ error: 'Failed to get project' });
  }
};

export const updateProject = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;
    const { projectId } = req.params;
    
    if (userRole !== 'CLIENT') {
      return res.status(403).json({ error: 'Only clients can update projects' });
    }

    const data = updateProjectSchema.parse(req.body);

    // Get client profile
    const client = await prisma.client.findUnique({
      where: { userId },
    });

    if (!client) {
      return res.status(404).json({ error: 'Client profile not found' });
    }

    // Get existing project
    const existingProject = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!existingProject) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (existingProject.clientId !== client.id) {
      return res.status(403).json({ error: 'You can only update your own projects' });
    }

    // Cannot update matched or completed projects
    if (['MATCHED', 'IN_PROGRESS', 'COMPLETED'].includes(existingProject.status)) {
      return res.status(400).json({ error: 'Cannot update project after it has been matched' });
    }

    // Validate dates if provided
    let startDate, endDate;
    if (data.startDate) {
      startDate = new Date(data.startDate);
      if (startDate < new Date()) {
        return res.status(400).json({ error: 'Start date cannot be in the past' });
      }
    }
    if (data.endDate) {
      endDate = new Date(data.endDate);
    }
    if (startDate && endDate && startDate >= endDate) {
      return res.status(400).json({ error: 'End date must be after start date' });
    }

    // Validate ranges if provided
    if (data.targetAgeMin && data.targetAgeMax && data.targetAgeMin > data.targetAgeMax) {
      return res.status(400).json({ error: 'Minimum age cannot be greater than maximum age' });
    }
    if (data.targetFollowerMin && data.targetFollowerMax && data.targetFollowerMin > data.targetFollowerMax) {
      return res.status(400).json({ error: 'Minimum follower count cannot be greater than maximum' });
    }

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.budget !== undefined) updateData.budget = data.budget;
    if (data.targetPlatforms !== undefined) updateData.targetPlatforms = data.targetPlatforms;
    if (data.targetPrefecture !== undefined) updateData.targetPrefecture = data.targetPrefecture;
    if (data.targetCity !== undefined) updateData.targetCity = data.targetCity;
    if (data.targetGender !== undefined) updateData.targetGender = data.targetGender;
    if (data.targetAgeMin !== undefined) updateData.targetAgeMin = data.targetAgeMin;
    if (data.targetAgeMax !== undefined) updateData.targetAgeMax = data.targetAgeMax;
    if (data.targetFollowerMin !== undefined) updateData.targetFollowerMin = data.targetFollowerMin;
    if (data.targetFollowerMax !== undefined) updateData.targetFollowerMax = data.targetFollowerMax;
    if (startDate !== undefined) updateData.startDate = startDate;
    if (endDate !== undefined) updateData.endDate = endDate;

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: updateData,
      include: {
        client: {
          include: {
            user: {
              select: {
                email: true,
              },
            },
          },
        },
        applications: {
          include: {
            influencer: {
              include: {
                user: {
                  select: {
                    email: true,
                  },
                },
                socialAccounts: true,
              },
            },
          },
        },
        matchedInfluencer: {
          include: {
            user: {
              select: {
                email: true,
              },
            },
            socialAccounts: true,
          },
        },
        transaction: true,
      },
    });

    res.json(updatedProject);
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
};

export const deleteProject = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;
    const { projectId } = req.params;
    
    if (userRole !== 'CLIENT') {
      return res.status(403).json({ error: 'Only clients can delete projects' });
    }

    // Get client profile
    const client = await prisma.client.findUnique({
      where: { userId },
    });

    if (!client) {
      return res.status(404).json({ error: 'Client profile not found' });
    }

    // Get existing project
    const existingProject = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        applications: true,
        transaction: true,
      },
    });

    if (!existingProject) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (existingProject.clientId !== client.id) {
      return res.status(403).json({ error: 'You can only delete your own projects' });
    }

    // Cannot delete projects with payments
    if (existingProject.transaction) {
      return res.status(400).json({ error: 'Cannot delete project with completed payment' });
    }

    // Cannot delete matched or in-progress projects
    if (['MATCHED', 'IN_PROGRESS', 'COMPLETED'].includes(existingProject.status)) {
      return res.status(400).json({ error: 'Cannot delete project after it has been matched' });
    }

    // Delete project (cascade will handle applications and messages)
    await prisma.project.delete({
      where: { id: projectId },
    });

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
};

export const updateProjectStatus = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;
    const { projectId } = req.params;
    const { status } = z.object({ status: z.nativeEnum(ProjectStatus) }).parse(req.body);
    
    if (userRole !== 'CLIENT') {
      return res.status(403).json({ error: 'Only clients can update project status' });
    }

    // Get client profile
    const client = await prisma.client.findUnique({
      where: { userId },
    });

    if (!client) {
      return res.status(404).json({ error: 'Client profile not found' });
    }

    // Get existing project
    const existingProject = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!existingProject) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (existingProject.clientId !== client.id) {
      return res.status(403).json({ error: 'You can only update your own projects' });
    }

    // Validate status transitions
    const validTransitions: Record<ProjectStatus, ProjectStatus[]> = {
      PENDING: ['CANCELLED'],
      MATCHED: ['IN_PROGRESS', 'CANCELLED'],
      IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
      COMPLETED: [],
      CANCELLED: [],
    };

    if (!validTransitions[existingProject.status].includes(status)) {
      return res.status(400).json({ 
        error: `Cannot change status from ${existingProject.status} to ${status}` 
      });
    }

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: { status },
      include: {
        client: {
          include: {
            user: {
              select: {
                email: true,
              },
            },
          },
        },
        matchedInfluencer: {
          include: {
            user: {
              select: {
                email: true,
              },
            },
            socialAccounts: true,
          },
        },
      },
    });

    res.json(updatedProject);
  } catch (error) {
    console.error('Update project status error:', error);
    res.status(500).json({ error: 'Failed to update project status' });
  }
};