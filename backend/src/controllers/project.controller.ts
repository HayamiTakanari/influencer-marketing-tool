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
  projectId: z.string().optional(),
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

    // インフルエンサーが連携しているプラットフォームを取得
    let connectedPlatforms: any[] = [];
    if (influencer) {
      connectedPlatforms = influencer.socialAccounts
        .filter(acc => acc.isVerified)
        .map(acc => acc.platform);
    }

    // Build the platform filter
    let platformFilter: any;
    if (connectedPlatforms.length > 0) {
      platformFilter = {
        OR: [
          { targetPlatforms: { isEmpty: true } }, // プラットフォーム指定なしの案件
          { targetPlatforms: { hasSome: connectedPlatforms } } // 連携済みプラットフォームを含む案件
        ]
      };
    } else {
      // 連携していない場合はプラットフォーム指定なしの案件のみ
      platformFilter = { targetPlatforms: { isEmpty: true } };
    }

    const where: any = {
      status: 'PENDING',
      AND: [
        {
          OR: [
            { endDate: { gte: new Date() } }, // Projects with future end dates
            { endDate: null } // Projects without end dates
          ]
        },
        platformFilter
      ]
    };

    if (query.category) {
      where.AND.push({ category: query.category });
    }

    if (query.minBudget !== undefined || query.maxBudget !== undefined) {
      const budgetFilter: any = {};
      if (query.minBudget !== undefined) {
        budgetFilter.gte = query.minBudget;
      }
      if (query.maxBudget !== undefined) {
        budgetFilter.lte = query.maxBudget;
      }
      where.AND.push({ budget: budgetFilter });
    }

    if (query.platforms && query.platforms.length > 0) {
      where.AND.push({ targetPlatforms: { hasSome: query.platforms } });
    }

    if (query.prefecture) {
      where.AND.push({ targetPrefecture: query.prefecture });
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
            where: influencer ? {
              influencerId: influencer.id,
            } : undefined,
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

      // If no influencer profile, still show projects but don't match profile
      if (influencer) {
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

    // Get projectId from either URL params or request body
    const projectId = req.params.projectId || req.body.projectId;
    const { message, proposedPrice } = applyToProjectSchema.parse(req.body);

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

    // Get or create influencer profile
    let influencer = await prisma.influencer.findUnique({
      where: { userId },
    });

    // If influencer profile doesn't exist, create a basic one
    if (!influencer) {
      influencer = await prisma.influencer.create({
        data: {
          userId,
          displayName: '',
          bio: '',
          birthDate: null,
          gender: null,
          prefecture: '',
          socialAccounts: {
            create: [],
          },
        },
      });
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

// Additional fields for detailed project information
const detailedProjectFields = z.object({
  deliverables: z.string().optional(),
  requirements: z.string().optional(),
  additionalInfo: z.string().optional(),
  advertiserName: z.string().optional(),
  brandName: z.string().optional(),
  productName: z.string().optional(),
  productUrl: z.string().optional(),
  productPrice: z.number().optional(),
  productFeatures: z.string().optional(),
  campaignObjective: z.string().optional(),
  campaignTarget: z.string().optional(),
  postingPeriodStart: z.string().optional(),
  postingPeriodEnd: z.string().optional(),
  postingMedia: z.array(z.string()).optional(),
  messageToConvey: z.array(z.string()).optional(),
  shootingAngle: z.string().optional(),
  packagePhotography: z.string().optional(),
  productOrientationSpecified: z.string().optional(),
  musicUsage: z.string().optional(),
  brandContentSettings: z.string().optional(),
  advertiserAccount: z.string().optional(),
  desiredHashtags: z.array(z.string()).optional(),
  ngItems: z.string().optional(),
  legalRequirements: z.string().optional(),
  notes: z.string().optional(),
  secondaryUsage: z.string().optional(),
  secondaryUsageScope: z.string().optional(),
  secondaryUsagePeriod: z.string().optional(),
  insightDisclosure: z.string().optional(),
});

const updateProjectSchema = createProjectSchema.partial().merge(detailedProjectFields);

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

    // Accept both 'CLIENT' and 'COMPANY' roles (COMPANY is used in frontend)
    if (userRole !== 'CLIENT' && userRole !== 'COMPANY') {
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
      // Influencers can view any available project details
      // Just verify that the user has the INFLUENCER role
      // No need to check if they have an influencer profile or if they've applied
      // This allows influencers to view projects even if their profile is not fully set up yet
    } else {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ project });
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
    }
    if (data.endDate) {
      endDate = new Date(data.endDate);
    }
    // Only validate end date is after start date if both are provided
    const dateToCheck = startDate || existingProject.startDate;
    const endDateToCheck = endDate || existingProject.endDate;
    if (dateToCheck && endDateToCheck && dateToCheck >= endDateToCheck) {
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

    // Add detailed project information fields
    if (data.deliverables !== undefined) updateData.deliverables = data.deliverables;
    if (data.requirements !== undefined) updateData.requirements = data.requirements;
    if (data.additionalInfo !== undefined) updateData.additionalInfo = data.additionalInfo;
    if (data.advertiserName !== undefined) updateData.advertiserName = data.advertiserName;
    if (data.brandName !== undefined) updateData.brandName = data.brandName;
    if (data.productName !== undefined) updateData.productName = data.productName;
    if (data.productUrl !== undefined) updateData.productUrl = data.productUrl;
    if (data.productPrice !== undefined) updateData.productPrice = data.productPrice;
    if (data.productFeatures !== undefined) updateData.productFeatures = data.productFeatures;
    if (data.campaignObjective !== undefined) updateData.campaignObjective = data.campaignObjective;
    if (data.campaignTarget !== undefined) updateData.campaignTarget = data.campaignTarget;
    if (data.postingPeriodStart !== undefined) updateData.postingPeriodStart = data.postingPeriodStart ? new Date(data.postingPeriodStart) : null;
    if (data.postingPeriodEnd !== undefined) updateData.postingPeriodEnd = data.postingPeriodEnd ? new Date(data.postingPeriodEnd) : null;
    if (data.postingMedia !== undefined) updateData.postingMedia = data.postingMedia;
    if (data.messageToConvey !== undefined) updateData.messageToConvey = data.messageToConvey;
    if (data.shootingAngle !== undefined) updateData.shootingAngle = data.shootingAngle;
    if (data.packagePhotography !== undefined) updateData.packagePhotography = data.packagePhotography;
    if (data.productOrientationSpecified !== undefined) updateData.productOrientationSpecified = data.productOrientationSpecified;
    if (data.musicUsage !== undefined) updateData.musicUsage = data.musicUsage;
    if (data.brandContentSettings !== undefined) updateData.brandContentSettings = data.brandContentSettings;
    if (data.advertiserAccount !== undefined) updateData.advertiserAccount = data.advertiserAccount;
    if (data.desiredHashtags !== undefined) updateData.desiredHashtags = data.desiredHashtags;
    if (data.ngItems !== undefined) updateData.ngItems = data.ngItems;
    if (data.legalRequirements !== undefined) updateData.legalRequirements = data.legalRequirements;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.secondaryUsage !== undefined) updateData.secondaryUsage = data.secondaryUsage;
    if (data.secondaryUsageScope !== undefined) updateData.secondaryUsageScope = data.secondaryUsageScope;
    if (data.secondaryUsagePeriod !== undefined) updateData.secondaryUsagePeriod = data.secondaryUsagePeriod;
    if (data.insightDisclosure !== undefined) updateData.insightDisclosure = data.insightDisclosure;

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

// Get company projects with matched influencers (for project chats)
export const getCompanyProjects = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;

    // Only clients can view their company projects
    if (userRole !== 'CLIENT' && userRole !== 'COMPANY') {
      return res.status(403).json({ error: 'Only clients can view their projects' });
    }

    // Get client profile
    const client = await prisma.client.findUnique({
      where: { userId },
    });

    if (!client) {
      return res.status(404).json({ error: 'Client profile not found' });
    }

    // Get all projects with matched influencers
    const projects = await prisma.project.findMany({
      where: {
        clientId: client.id,
        matchedInfluencerId: {
          not: null, // Only projects with matched influencers
        },
      },
      include: {
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
      orderBy: { createdAt: 'desc' },
    });

    res.json(projects);
  } catch (error) {
    console.error('Get company projects error:', error);
    res.status(500).json({ error: 'Failed to get company projects' });
  }
};

// Get matched projects for influencer (for project chats)
export const getMatchedProjects = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;

    // Only influencers can view their matched projects
    if (userRole !== 'INFLUENCER') {
      return res.status(403).json({ error: 'Only influencers can view matched projects' });
    }

    // Get influencer profile
    const influencer = await prisma.influencer.findUnique({
      where: { userId },
    });

    if (!influencer) {
      return res.status(404).json({ error: 'Influencer profile not found' });
    }

    // Get all projects where this influencer is matched
    const projects = await prisma.project.findMany({
      where: {
        matchedInfluencerId: influencer.id,
        status: {
          in: ['MATCHED', 'IN_PROGRESS'],
        },
      },
      include: {
        client: {
          include: {
            user: {
              select: {
                email: true,
              },
            },
            team: true,
          },
        },
        matchedInfluencer: {
          include: {
            socialAccounts: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(projects);
  } catch (error) {
    console.error('Get matched projects error:', error);
    res.status(500).json({ error: 'Failed to get matched projects' });
  }
};

// Copy a project (for clients)
export const copyProject = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;
    const { projectId } = req.params;

    if (userRole !== 'CLIENT' && userRole !== 'COMPANY') {
      return res.status(403).json({ error: 'Only clients can copy projects' });
    }

    // Get the original project
    const originalProject = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!originalProject) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Verify the user owns the project
    const client = await prisma.client.findUnique({
      where: { userId },
    });

    if (!client || originalProject.clientId !== client.id) {
      return res.status(403).json({ error: 'You do not have permission to copy this project' });
    }

    // Create a copy of the project with a new title
    const copiedProject = await prisma.project.create({
      data: {
        title: `${originalProject.title} (コピー)`,
        description: originalProject.description,
        category: originalProject.category,
        budget: originalProject.budget,
        status: 'PENDING',
        targetPlatforms: originalProject.targetPlatforms,
        targetPrefecture: originalProject.targetPrefecture,
        targetCity: originalProject.targetCity || undefined,
        targetGender: originalProject.targetGender || undefined,
        targetAgeMin: originalProject.targetAgeMin || undefined,
        targetAgeMax: originalProject.targetAgeMax || undefined,
        targetFollowerMin: originalProject.targetFollowerMin || undefined,
        targetFollowerMax: originalProject.targetFollowerMax || undefined,
        startDate: originalProject.startDate,
        endDate: originalProject.endDate,
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
      },
    });

    res.json({
      success: true,
      message: 'Project copied successfully',
      data: copiedProject,
    });
  } catch (error) {
    console.error('Copy project error:', error);
    res.status(500).json({ error: 'Failed to copy project' });
  }
};

// Chapter 2-8: Unpublish project (change from public to private)
export const unpublishProject = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { projectId } = req.params;

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
        client: true,
      },
    });

    if (!existingProject) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (existingProject.clientId !== client.id) {
      return res.status(403).json({ error: 'You can only unpublish your own projects' });
    }

    // Update project to be private
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        status: 'CANCELLED',
      },
      include: {
        client: {
          select: {
            companyName: true,
            user: {
              select: {
                email: true,
              },
            },
          },
        },
      },
    });

    // Create notification
    const applications = await prisma.application.findMany({
      where: { projectId },
      include: { influencer: { select: { userId: true } } },
    });

    for (const app of applications) {
      await prisma.notification.create({
        data: {
          userId: app.influencer.userId,
          type: 'PROJECT_STATUS_CHANGED',
          title: 'プロジェクトが非公開になりました',
          message: `「${existingProject.title}」が非公開（招待制）に変更されました`,
          data: {
            projectId,
          },
        },
      });
    }

    res.json({
      success: true,
      message: 'Project unpublished successfully',
      data: updatedProject,
    });
  } catch (error) {
    console.error('Unpublish project error:', error);
    res.status(500).json({ error: 'Failed to unpublish project' });
  }
};

// Chapter 2-8: End project (mark as completed and close to new applications)
export const endProject = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { projectId } = req.params;

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
      return res.status(403).json({ error: 'You can only end your own projects' });
    }

    // Can only end if project is MATCHED or IN_PROGRESS
    if (!['MATCHED', 'IN_PROGRESS'].includes(existingProject.status)) {
      return res.status(400).json({
        error: `Cannot end project with status ${existingProject.status}`,
      });
    }

    // Update project status to COMPLETED
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        status: 'COMPLETED' as any,
        endDate: new Date(),
      },
      include: {
        client: {
          select: {
            companyName: true,
            user: {
              select: {
                email: true,
              },
            },
          },
        },
      },
    });

    // Notify matched influencer
    if (existingProject.matchedInfluencerId) {
      const influencer = await prisma.influencer.findUnique({
        where: { id: existingProject.matchedInfluencerId },
        select: { userId: true },
      });

      if (influencer) {
        await prisma.notification.create({
          data: {
            userId: influencer.userId,
            type: 'PROJECT_STATUS_CHANGED',
            title: 'プロジェクトが完了しました',
            message: `「${existingProject.title}」が完了状態に更新されました`,
            data: {
              projectId,
              status: 'COMPLETED',
            },
          },
        });
      }
    }

    res.json({
      success: true,
      message: 'Project ended successfully',
      data: updatedProject,
    });
  } catch (error) {
    console.error('End project error:', error);
    res.status(500).json({ error: 'Failed to end project' });
  }
};