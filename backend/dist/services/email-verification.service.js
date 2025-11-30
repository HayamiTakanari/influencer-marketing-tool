"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEmailVerificationStatus = exports.resendEmailVerification = exports.verifyEmailToken = exports.sendEmailVerification = void 0;
const client_1 = require("@prisma/client");
const crypto_1 = require("crypto");
const nodemailer_1 = __importDefault(require("nodemailer"));
const prisma = new client_1.PrismaClient();
// メール送信のセットアップ
const transporter = nodemailer_1.default.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});
/**
 * メール認証トークンを生成し、ユーザーにメールを送信
 * Chapter 1-1: メール認証の送信
 */
const sendEmailVerification = async (userId, email) => {
    try {
        // 有効期限24時間のトークンを生成
        const token = (0, crypto_1.randomUUID)();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24時間後
        // トークンをデータベースに保存
        await prisma.emailVerificationToken.create({
            data: {
                userId,
                token,
                expiresAt,
            },
        });
        // メール本文を構築
        const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
        const htmlContent = `
      <h2>メールアドレスの確認</h2>
      <p>以下のリンクをクリックして、メールアドレスを確認してください。</p>
      <p><a href="${verificationUrl}">メールアドレスを確認</a></p>
      <p>このリンクの有効期限は24時間です。</p>
      <p>このリンクをクリックしなかった場合は、このメールを無視してください。</p>
    `;
        // メール送信
        await transporter.sendMail({
            from: process.env.SMTP_FROM || 'noreply@influencer-marketing.jp',
            to: email,
            subject: 'メールアドレスの確認 - インフルエンサーマーケティングプラットフォーム',
            html: htmlContent,
        });
        console.log(`Email verification sent to ${email}`);
    }
    catch (error) {
        console.error('Error sending email verification:', error);
        throw new Error('Failed to send verification email');
    }
};
exports.sendEmailVerification = sendEmailVerification;
/**
 * メール認証トークンを検証し、ユーザーをメール認証完了に更新
 * Chapter 1-1: メール認証の確認
 */
const verifyEmailToken = async (token) => {
    try {
        // トークンを検索
        const emailToken = await prisma.emailVerificationToken.findUnique({
            where: { token },
            include: { user: { select: { id: true, email: true } } },
        });
        if (!emailToken) {
            throw new Error('Invalid verification token');
        }
        // 有効期限をチェック
        if (new Date() > emailToken.expiresAt) {
            throw new Error('Verification token has expired');
        }
        // 既に使用済みでないかチェック
        if (emailToken.usedAt) {
            throw new Error('Verification token has already been used');
        }
        // トランザクション内でユーザーを更新
        await prisma.$transaction(async (tx) => {
            // トークンを使用済みにマーク
            await tx.emailVerificationToken.update({
                where: { id: emailToken.id },
                data: { usedAt: new Date() },
            });
            // ユーザーを更新（メール認証完了）
            await tx.user.update({
                where: { id: emailToken.userId },
                data: {
                    emailVerifiedAt: new Date(),
                    status: 'VERIFICATION_PENDING', // 本人確認待ちに移行
                },
            });
            // メール認証記録を作成
            await tx.verificationRecord.create({
                data: {
                    userId: emailToken.userId,
                    type: 'EMAIL',
                    status: 'APPROVED',
                    verifiedAt: new Date(),
                },
            });
        });
        return {
            userId: emailToken.user.id,
            email: emailToken.user.email,
        };
    }
    catch (error) {
        console.error('Error verifying email token:', error);
        throw error;
    }
};
exports.verifyEmailToken = verifyEmailToken;
/**
 * メール認証トークンを再発行（有効期限切れ対応）
 * Chapter 1-1: メール再認証
 */
const resendEmailVerification = async (userId) => {
    try {
        // ユーザーを取得
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true, emailVerifiedAt: true },
        });
        if (!user) {
            throw new Error('User not found');
        }
        // 既にメール認証済みならスキップ
        if (user.emailVerifiedAt) {
            throw new Error('Email already verified');
        }
        // 既存の未使用トークンを削除
        await prisma.emailVerificationToken.deleteMany({
            where: {
                userId,
                usedAt: null,
            },
        });
        // 新しいトークンを送信
        await (0, exports.sendEmailVerification)(userId, user.email);
    }
    catch (error) {
        console.error('Error resending email verification:', error);
        throw error;
    }
};
exports.resendEmailVerification = resendEmailVerification;
/**
 * メール認証状態をチェック
 */
const getEmailVerificationStatus = async (userId) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { emailVerifiedAt: true },
        });
        return user?.emailVerifiedAt ? true : false;
    }
    catch (error) {
        console.error('Error checking email verification status:', error);
        throw error;
    }
};
exports.getEmailVerificationStatus = getEmailVerificationStatus;
//# sourceMappingURL=email-verification.service.js.map