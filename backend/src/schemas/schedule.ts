import { z } from 'zod';

// v3.0 新機能: スケジュール管理のスキーマ定義

export const projectScheduleSchema = z.object({
  projectId: z.string().cuid('有効なプロジェクトIDを指定してください'),
  publishDate: z.string().datetime('有効な投稿日を指定してください'),
  milestones: z.array(z.object({
    type: z.enum(['CONCEPT_APPROVAL', 'VIDEO_COMPLETION', 'FINAL_APPROVAL', 'PUBLISH_DATE'], {
      required_error: 'マイルストーンタイプを選択してください',
    }),
    title: z.string().min(1, 'タイトルは必須です'),
    description: z.string().optional(),
    dueDate: z.string().datetime('有効な期限を指定してください'),
  })).min(1, '少なくとも1つのマイルストーンを設定してください'),
});

export const milestoneSchema = z.object({
  type: z.enum(['CONCEPT_APPROVAL', 'VIDEO_COMPLETION', 'FINAL_APPROVAL', 'PUBLISH_DATE'], {
    required_error: 'マイルストーンタイプを選択してください',
  }),
  title: z.string().min(1, 'タイトルは必須です'),
  description: z.string().optional(),
  dueDate: z.string().datetime('有効な期限を指定してください'),
});

export const updateMilestoneSchema = z.object({
  title: z.string().min(1, 'タイトルは必須です').optional(),
  description: z.string().optional(),
  dueDate: z.string().datetime('有効な期限を指定してください').optional(),
  isCompleted: z.boolean().optional(),
});

export const createProjectScheduleSchema = projectScheduleSchema;
export const createMilestoneSchema = milestoneSchema;
export const updateMilestoneSchemaExport = updateMilestoneSchema;

export type CreateProjectScheduleInput = z.infer<typeof createProjectScheduleSchema>;
export type CreateMilestoneInput = z.infer<typeof createMilestoneSchema>;
export type UpdateMilestoneInput = z.infer<typeof updateMilestoneSchema>;