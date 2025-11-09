"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTeam = exports.updateMemberRole = exports.removeTeamMember = exports.addTeamMember = exports.updateTeam = exports.getMyTeam = exports.createTeam = void 0;
var client_1 = require("@prisma/client");
var zod_1 = require("zod");
var prisma = new client_1.PrismaClient();
var createTeamSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Team name is required').max(100, 'Team name too long'),
});
var updateTeamSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Team name is required').max(100, 'Team name too long').optional(),
});
var addMemberSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format'),
    isOwner: zod_1.z.boolean().default(false),
});
var createTeam = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId_1, userRole, name_1, client_2, team, teamWithMembers, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                userId_1 = req.user.id;
                userRole = req.user.role;
                if (userRole !== 'CLIENT') {
                    return [2 /*return*/, res.status(403).json({ error: 'Only clients can create teams' })];
                }
                name_1 = createTeamSchema.parse(req.body).name;
                return [4 /*yield*/, prisma.client.findUnique({
                        where: { userId: userId_1 },
                    })];
            case 1:
                client_2 = _a.sent();
                if (!client_2) {
                    return [2 /*return*/, res.status(404).json({ error: 'Client profile not found' })];
                }
                return [4 /*yield*/, prisma.$transaction(function (tx) { return __awaiter(void 0, void 0, void 0, function () {
                        var newTeam;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, tx.team.create({
                                        data: {
                                            name: name_1,
                                        },
                                    })];
                                case 1:
                                    newTeam = _a.sent();
                                    // Add current user as team owner
                                    return [4 /*yield*/, tx.teamMember.create({
                                            data: {
                                                teamId: newTeam.id,
                                                userId: userId_1,
                                                isOwner: true,
                                            },
                                        })];
                                case 2:
                                    // Add current user as team owner
                                    _a.sent();
                                    // Update client to belong to this team
                                    return [4 /*yield*/, tx.client.update({
                                            where: { id: client_2.id },
                                            data: { teamId: newTeam.id },
                                        })];
                                case 3:
                                    // Update client to belong to this team
                                    _a.sent();
                                    return [2 /*return*/, newTeam];
                            }
                        });
                    }); })];
            case 2:
                team = _a.sent();
                return [4 /*yield*/, prisma.team.findUnique({
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
                            clients: {
                                include: {
                                    user: {
                                        select: {
                                            id: true,
                                            email: true,
                                        },
                                    },
                                },
                            },
                        },
                    })];
            case 3:
                teamWithMembers = _a.sent();
                res.status(201).json(teamWithMembers);
                return [3 /*break*/, 5];
            case 4:
                error_1 = _a.sent();
                console.error('Create team error:', error_1);
                res.status(500).json({ error: 'Failed to create team' });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.createTeam = createTeam;
var getMyTeam = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, userRole, client, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                userId = req.user.id;
                userRole = req.user.role;
                if (userRole !== 'CLIENT') {
                    return [2 /*return*/, res.status(403).json({ error: 'Only clients can access team information' })];
                }
                return [4 /*yield*/, prisma.client.findUnique({
                        where: { userId: userId },
                        include: {
                            team: {
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
                                    clients: {
                                        include: {
                                            user: {
                                                select: {
                                                    id: true,
                                                    email: true,
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    })];
            case 1:
                client = _a.sent();
                if (!client) {
                    return [2 /*return*/, res.status(404).json({ error: 'Client profile not found' })];
                }
                res.json(client.team);
                return [3 /*break*/, 3];
            case 2:
                error_2 = _a.sent();
                console.error('Get my team error:', error_2);
                res.status(500).json({ error: 'Failed to get team information' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getMyTeam = getMyTeam;
var updateTeam = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, userRole, teamId, name_2, teamMember, updatedTeam, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                userId = req.user.id;
                userRole = req.user.role;
                teamId = req.params.teamId;
                if (userRole !== 'CLIENT') {
                    return [2 /*return*/, res.status(403).json({ error: 'Only clients can update teams' })];
                }
                name_2 = updateTeamSchema.parse(req.body).name;
                return [4 /*yield*/, prisma.teamMember.findFirst({
                        where: {
                            teamId: teamId,
                            userId: userId,
                            isOwner: true,
                        },
                    })];
            case 1:
                teamMember = _a.sent();
                if (!teamMember) {
                    return [2 /*return*/, res.status(403).json({ error: 'Only team owners can update team information' })];
                }
                return [4 /*yield*/, prisma.team.update({
                        where: { id: teamId },
                        data: { name: name_2 },
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
                            clients: {
                                include: {
                                    user: {
                                        select: {
                                            id: true,
                                            email: true,
                                        },
                                    },
                                },
                            },
                        },
                    })];
            case 2:
                updatedTeam = _a.sent();
                res.json(updatedTeam);
                return [3 /*break*/, 4];
            case 3:
                error_3 = _a.sent();
                console.error('Update team error:', error_3);
                res.status(500).json({ error: 'Failed to update team' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.updateTeam = updateTeam;
var addTeamMember = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, userRole, teamId, _a, email, isOwner, currentMember, targetUser, existingMember, newMember, error_4;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 5, , 6]);
                userId = req.user.id;
                userRole = req.user.role;
                teamId = req.params.teamId;
                if (userRole !== 'CLIENT') {
                    return [2 /*return*/, res.status(403).json({ error: 'Only clients can add team members' })];
                }
                _a = addMemberSchema.parse(req.body), email = _a.email, isOwner = _a.isOwner;
                return [4 /*yield*/, prisma.teamMember.findFirst({
                        where: {
                            teamId: teamId,
                            userId: userId,
                            isOwner: true,
                        },
                    })];
            case 1:
                currentMember = _b.sent();
                if (!currentMember) {
                    return [2 /*return*/, res.status(403).json({ error: 'Only team owners can add members' })];
                }
                return [4 /*yield*/, prisma.user.findUnique({
                        where: { email: email },
                    })];
            case 2:
                targetUser = _b.sent();
                if (!targetUser) {
                    return [2 /*return*/, res.status(404).json({ error: 'User not found' })];
                }
                if (targetUser.role !== 'CLIENT') {
                    return [2 /*return*/, res.status(400).json({ error: 'Only client users can be added to teams' })];
                }
                return [4 /*yield*/, prisma.teamMember.findFirst({
                        where: {
                            teamId: teamId,
                            userId: targetUser.id,
                        },
                    })];
            case 3:
                existingMember = _b.sent();
                if (existingMember) {
                    return [2 /*return*/, res.status(400).json({ error: 'User is already a team member' })];
                }
                return [4 /*yield*/, prisma.teamMember.create({
                        data: {
                            teamId: teamId,
                            userId: targetUser.id,
                            isOwner: isOwner,
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
                    })];
            case 4:
                newMember = _b.sent();
                res.status(201).json(newMember);
                return [3 /*break*/, 6];
            case 5:
                error_4 = _b.sent();
                console.error('Add team member error:', error_4);
                res.status(500).json({ error: 'Failed to add team member' });
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); };
exports.addTeamMember = addTeamMember;
var removeTeamMember = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, userRole, _a, teamId, memberId, currentMember, memberToRemove, ownerCount, error_5;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 6, , 7]);
                userId = req.user.id;
                userRole = req.user.role;
                _a = req.params, teamId = _a.teamId, memberId = _a.memberId;
                if (userRole !== 'CLIENT') {
                    return [2 /*return*/, res.status(403).json({ error: 'Only clients can remove team members' })];
                }
                return [4 /*yield*/, prisma.teamMember.findFirst({
                        where: {
                            teamId: teamId,
                            userId: userId,
                            isOwner: true,
                        },
                    })];
            case 1:
                currentMember = _b.sent();
                if (!currentMember) {
                    return [2 /*return*/, res.status(403).json({ error: 'Only team owners can remove members' })];
                }
                return [4 /*yield*/, prisma.teamMember.findUnique({
                        where: { id: memberId },
                    })];
            case 2:
                memberToRemove = _b.sent();
                if (!memberToRemove || memberToRemove.teamId !== teamId) {
                    return [2 /*return*/, res.status(404).json({ error: 'Team member not found' })];
                }
                if (!(memberToRemove.userId === userId)) return [3 /*break*/, 4];
                return [4 /*yield*/, prisma.teamMember.count({
                        where: {
                            teamId: teamId,
                            isOwner: true,
                        },
                    })];
            case 3:
                ownerCount = _b.sent();
                if (ownerCount === 1) {
                    return [2 /*return*/, res.status(400).json({ error: 'Cannot remove yourself as the only team owner' })];
                }
                _b.label = 4;
            case 4: 
            // Remove member
            return [4 /*yield*/, prisma.teamMember.delete({
                    where: { id: memberId },
                })];
            case 5:
                // Remove member
                _b.sent();
                res.json({ message: 'Team member removed successfully' });
                return [3 /*break*/, 7];
            case 6:
                error_5 = _b.sent();
                console.error('Remove team member error:', error_5);
                res.status(500).json({ error: 'Failed to remove team member' });
                return [3 /*break*/, 7];
            case 7: return [2 /*return*/];
        }
    });
}); };
exports.removeTeamMember = removeTeamMember;
var updateMemberRole = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, userRole, _a, teamId, memberId, isOwner, currentMember, memberToUpdate, ownerCount, updatedMember, error_6;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 6, , 7]);
                userId = req.user.id;
                userRole = req.user.role;
                _a = req.params, teamId = _a.teamId, memberId = _a.memberId;
                isOwner = zod_1.z.object({ isOwner: zod_1.z.boolean() }).parse(req.body).isOwner;
                if (userRole !== 'CLIENT') {
                    return [2 /*return*/, res.status(403).json({ error: 'Only clients can update member roles' })];
                }
                return [4 /*yield*/, prisma.teamMember.findFirst({
                        where: {
                            teamId: teamId,
                            userId: userId,
                            isOwner: true,
                        },
                    })];
            case 1:
                currentMember = _b.sent();
                if (!currentMember) {
                    return [2 /*return*/, res.status(403).json({ error: 'Only team owners can update member roles' })];
                }
                return [4 /*yield*/, prisma.teamMember.findUnique({
                        where: { id: memberId },
                    })];
            case 2:
                memberToUpdate = _b.sent();
                if (!memberToUpdate || memberToUpdate.teamId !== teamId) {
                    return [2 /*return*/, res.status(404).json({ error: 'Team member not found' })];
                }
                if (!(!isOwner && memberToUpdate.isOwner)) return [3 /*break*/, 4];
                return [4 /*yield*/, prisma.teamMember.count({
                        where: {
                            teamId: teamId,
                            isOwner: true,
                        },
                    })];
            case 3:
                ownerCount = _b.sent();
                if (ownerCount === 1) {
                    return [2 /*return*/, res.status(400).json({ error: 'Team must have at least one owner' })];
                }
                _b.label = 4;
            case 4: return [4 /*yield*/, prisma.teamMember.update({
                    where: { id: memberId },
                    data: { isOwner: isOwner },
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
                })];
            case 5:
                updatedMember = _b.sent();
                res.json(updatedMember);
                return [3 /*break*/, 7];
            case 6:
                error_6 = _b.sent();
                console.error('Update member role error:', error_6);
                res.status(500).json({ error: 'Failed to update member role' });
                return [3 /*break*/, 7];
            case 7: return [2 /*return*/];
        }
    });
}); };
exports.updateMemberRole = updateMemberRole;
var deleteTeam = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, userRole, teamId, currentMember, activeProjects, error_7;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                userId = req.user.id;
                userRole = req.user.role;
                teamId = req.params.teamId;
                if (userRole !== 'CLIENT') {
                    return [2 /*return*/, res.status(403).json({ error: 'Only clients can delete teams' })];
                }
                return [4 /*yield*/, prisma.teamMember.findFirst({
                        where: {
                            teamId: teamId,
                            userId: userId,
                            isOwner: true,
                        },
                    })];
            case 1:
                currentMember = _a.sent();
                if (!currentMember) {
                    return [2 /*return*/, res.status(403).json({ error: 'Only team owners can delete teams' })];
                }
                return [4 /*yield*/, prisma.project.count({
                        where: {
                            client: {
                                teamId: teamId,
                            },
                            status: {
                                in: ['PENDING', 'MATCHED', 'IN_PROGRESS'],
                            },
                        },
                    })];
            case 2:
                activeProjects = _a.sent();
                if (activeProjects > 0) {
                    return [2 /*return*/, res.status(400).json({
                            error: 'Cannot delete team with active projects. Please complete or cancel all projects first.'
                        })];
                }
                // Delete team (cascade will handle members and client updates)
                return [4 /*yield*/, prisma.team.delete({
                        where: { id: teamId },
                    })];
            case 3:
                // Delete team (cascade will handle members and client updates)
                _a.sent();
                res.json({ message: 'Team deleted successfully' });
                return [3 /*break*/, 5];
            case 4:
                error_7 = _a.sent();
                console.error('Delete team error:', error_7);
                res.status(500).json({ error: 'Failed to delete team' });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.deleteTeam = deleteTeam;
