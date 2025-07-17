"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMilestoneSchemaExport = exports.createMilestoneSchema = exports.createProjectScheduleSchema = exports.updateMilestoneSchema = exports.milestoneSchema = exports.projectScheduleSchema = void 0;
const zod_1 = require("zod");
// v3.0 新機能: スケジュール管理のスキーマ定義
exports.projectScheduleSchema = zod_1.z.object({
    projectId: zod_1.z.string().cuid('有効なプロジェクトIDを指定してください'),
    publishDate: zod_1.z.string().datetime('有効な投稿日を指定してください'),
    milestones: zod_1.z.array(zod_1.z.object({
        type: zod_1.z.enum(['CONCEPT_APPROVAL', 'VIDEO_COMPLETION', 'FINAL_APPROVAL', 'PUBLISH_DATE'], {
            required_error: 'マイルストーンタイプを選択してください',
        }),
        title: zod_1.z.string().min(1, 'タイトルは必須です'),
        description: zod_1.z.string().optional(),
        dueDate: zod_1.z.string().datetime('有効な期限を指定してください'),
    })).min(1, '少なくとも1つのマイルストーンを設定してください'),
});
exports.milestoneSchema = zod_1.z.object({
    type: zod_1.z.enum(['CONCEPT_APPROVAL', 'VIDEO_COMPLETION', 'FINAL_APPROVAL', 'PUBLISH_DATE'], {
        required_error: 'マイルストーンタイプを選択してください',
    }),
    title: zod_1.z.string().min(1, 'タイトルは必須です'),
    description: zod_1.z.string().optional(),
    dueDate: zod_1.z.string().datetime('有効な期限を指定してください'),
});
exports.updateMilestoneSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'タイトルは必須です').optional(),
    description: zod_1.z.string().optional(),
    dueDate: zod_1.z.string().datetime('有効な期限を指定してください').optional(),
    isCompleted: zod_1.z.boolean().optional(),
});
exports.createProjectScheduleSchema = exports.projectScheduleSchema;
exports.createMilestoneSchema = exports.milestoneSchema;
exports.updateMilestoneSchemaExport = exports.updateMilestoneSchema;
