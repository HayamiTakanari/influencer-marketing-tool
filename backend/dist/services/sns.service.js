"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.SNSSyncService = exports.YouTubeService = exports.InstagramService = exports.TwitterService = void 0;
var twitter_api_v2_1 = require("twitter-api-v2");
var client_1 = require("@prisma/client");
var prisma = new client_1.PrismaClient();
// Twitter API service
var TwitterService = /** @class */ (function () {
    function TwitterService() {
        this.client = null;
        if (process.env.TWITTER_API_KEY && process.env.TWITTER_API_SECRET) {
            this.client = new twitter_api_v2_1.TwitterApi({
                appKey: process.env.TWITTER_API_KEY,
                appSecret: process.env.TWITTER_API_SECRET,
                accessToken: process.env.TWITTER_ACCESS_TOKEN,
                accessSecret: process.env.TWITTER_ACCESS_SECRET,
            });
        }
    }
    TwitterService.prototype.ensureClient = function () {
        if (!this.client) {
            throw new Error('Twitter API credentials not configured');
        }
        return this.client;
    };
    TwitterService.prototype.getUserInfo = function (username) {
        return __awaiter(this, void 0, void 0, function () {
            var user, error_1;
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
            return __generator(this, function (_m) {
                switch (_m.label) {
                    case 0:
                        _m.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.ensureClient().v2.userByUsername(username, {
                                'user.fields': ['public_metrics', 'verified', 'profile_image_url'],
                            })];
                    case 1:
                        user = _m.sent();
                        return [2 /*return*/, {
                                id: (_a = user.data) === null || _a === void 0 ? void 0 : _a.id,
                                username: (_b = user.data) === null || _b === void 0 ? void 0 : _b.username,
                                name: (_c = user.data) === null || _c === void 0 ? void 0 : _c.name,
                                followersCount: ((_e = (_d = user.data) === null || _d === void 0 ? void 0 : _d.public_metrics) === null || _e === void 0 ? void 0 : _e.followers_count) || 0,
                                followingCount: ((_g = (_f = user.data) === null || _f === void 0 ? void 0 : _f.public_metrics) === null || _g === void 0 ? void 0 : _g.following_count) || 0,
                                tweetCount: ((_j = (_h = user.data) === null || _h === void 0 ? void 0 : _h.public_metrics) === null || _j === void 0 ? void 0 : _j.tweet_count) || 0,
                                verified: ((_k = user.data) === null || _k === void 0 ? void 0 : _k.verified) || false,
                                profileImageUrl: (_l = user.data) === null || _l === void 0 ? void 0 : _l.profile_image_url,
                            }];
                    case 2:
                        error_1 = _m.sent();
                        console.error('Twitter API error:', error_1);
                        throw new Error('Failed to fetch Twitter user info');
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    TwitterService.prototype.getUserTweets = function (userId_1) {
        return __awaiter(this, arguments, void 0, function (userId, maxResults) {
            var tweets, error_2;
            var _a;
            if (maxResults === void 0) { maxResults = 10; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.ensureClient().v2.userTimeline(userId, {
                                max_results: maxResults,
                                'tweet.fields': ['public_metrics', 'created_at'],
                            })];
                    case 1:
                        tweets = _b.sent();
                        return [2 /*return*/, ((_a = tweets.data.data) === null || _a === void 0 ? void 0 : _a.map(function (tweet) { return ({
                                id: tweet.id,
                                text: tweet.text,
                                createdAt: tweet.created_at,
                                metrics: tweet.public_metrics,
                            }); })) || []];
                    case 2:
                        error_2 = _b.sent();
                        console.error('Twitter API error:', error_2);
                        throw new Error('Failed to fetch Twitter tweets');
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    TwitterService.prototype.calculateEngagementRate = function (tweets) {
        if (tweets.length === 0)
            return 0;
        var totalEngagement = tweets.reduce(function (sum, tweet) {
            var _a, _b, _c;
            var likes = ((_a = tweet.metrics) === null || _a === void 0 ? void 0 : _a.like_count) || 0;
            var retweets = ((_b = tweet.metrics) === null || _b === void 0 ? void 0 : _b.retweet_count) || 0;
            var replies = ((_c = tweet.metrics) === null || _c === void 0 ? void 0 : _c.reply_count) || 0;
            return sum + likes + retweets + replies;
        }, 0);
        var totalImpressions = tweets.reduce(function (sum, tweet) {
            var _a;
            return sum + (((_a = tweet.metrics) === null || _a === void 0 ? void 0 : _a.impression_count) || 0);
        }, 0);
        return totalImpressions > 0 ? (totalEngagement / totalImpressions) * 100 : 0;
    };
    return TwitterService;
}());
exports.TwitterService = TwitterService;
// Instagram Basic Display API service
var InstagramService = /** @class */ (function () {
    function InstagramService(accessToken) {
        this.accessToken = accessToken;
    }
    InstagramService.prototype.getUserInfo = function () {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, fetch("https://graph.instagram.com/me?fields=id,username,account_type,media_count&access_token=".concat(this.accessToken))];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error('Failed to fetch Instagram user info');
                        }
                        return [4 /*yield*/, response.json()];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3:
                        error_3 = _a.sent();
                        console.error('Instagram API error:', error_3);
                        throw new Error('Failed to fetch Instagram user info');
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    InstagramService.prototype.getUserMedia = function () {
        return __awaiter(this, arguments, void 0, function (limit) {
            var response, data, error_4;
            if (limit === void 0) { limit = 10; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, fetch("https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count&limit=".concat(limit, "&access_token=").concat(this.accessToken))];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error('Failed to fetch Instagram media');
                        }
                        return [4 /*yield*/, response.json()];
                    case 2:
                        data = _a.sent();
                        return [2 /*return*/, data.data || []];
                    case 3:
                        error_4 = _a.sent();
                        console.error('Instagram API error:', error_4);
                        throw new Error('Failed to fetch Instagram media');
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    InstagramService.prototype.calculateEngagementRate = function (media, followersCount) {
        if (media.length === 0 || followersCount === 0)
            return 0;
        var totalEngagement = media.reduce(function (sum, item) {
            var likes = item.like_count || 0;
            var comments = item.comments_count || 0;
            return sum + likes + comments;
        }, 0);
        var averageEngagement = totalEngagement / media.length;
        return (averageEngagement / followersCount) * 100;
    };
    return InstagramService;
}());
exports.InstagramService = InstagramService;
// YouTube Data API service
var YouTubeService = /** @class */ (function () {
    function YouTubeService() {
        this.apiKey = process.env.YOUTUBE_API_KEY;
    }
    YouTubeService.prototype.getChannelInfo = function (channelId) {
        return __awaiter(this, void 0, void 0, function () {
            var response, data, channel, error_5;
            var _a, _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _d.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, fetch("https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=".concat(channelId, "&key=").concat(this.apiKey))];
                    case 1:
                        response = _d.sent();
                        if (!response.ok) {
                            throw new Error('Failed to fetch YouTube channel info');
                        }
                        return [4 /*yield*/, response.json()];
                    case 2:
                        data = _d.sent();
                        channel = (_a = data.items) === null || _a === void 0 ? void 0 : _a[0];
                        if (!channel) {
                            throw new Error('Channel not found');
                        }
                        return [2 /*return*/, {
                                id: channel.id,
                                title: channel.snippet.title,
                                description: channel.snippet.description,
                                subscriberCount: parseInt(channel.statistics.subscriberCount || '0'),
                                videoCount: parseInt(channel.statistics.videoCount || '0'),
                                viewCount: parseInt(channel.statistics.viewCount || '0'),
                                thumbnailUrl: (_c = (_b = channel.snippet.thumbnails) === null || _b === void 0 ? void 0 : _b.default) === null || _c === void 0 ? void 0 : _c.url,
                            }];
                    case 3:
                        error_5 = _d.sent();
                        console.error('YouTube API error:', error_5);
                        throw new Error('Failed to fetch YouTube channel info');
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    YouTubeService.prototype.getChannelVideos = function (channelId_1) {
        return __awaiter(this, arguments, void 0, function (channelId, maxResults) {
            var response, data, error_6;
            if (maxResults === void 0) { maxResults = 10; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, fetch("https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=".concat(channelId, "&type=video&order=date&maxResults=").concat(maxResults, "&key=").concat(this.apiKey))];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error('Failed to fetch YouTube videos');
                        }
                        return [4 /*yield*/, response.json()];
                    case 2:
                        data = _a.sent();
                        return [2 /*return*/, data.items || []];
                    case 3:
                        error_6 = _a.sent();
                        console.error('YouTube API error:', error_6);
                        throw new Error('Failed to fetch YouTube videos');
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    YouTubeService.prototype.getVideoStats = function (videoId) {
        return __awaiter(this, void 0, void 0, function () {
            var response, data, video, error_7;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, fetch("https://www.googleapis.com/youtube/v3/videos?part=statistics&id=".concat(videoId, "&key=").concat(this.apiKey))];
                    case 1:
                        response = _b.sent();
                        if (!response.ok) {
                            throw new Error('Failed to fetch YouTube video stats');
                        }
                        return [4 /*yield*/, response.json()];
                    case 2:
                        data = _b.sent();
                        video = (_a = data.items) === null || _a === void 0 ? void 0 : _a[0];
                        if (!video) {
                            throw new Error('Video not found');
                        }
                        return [2 /*return*/, {
                                viewCount: parseInt(video.statistics.viewCount || '0'),
                                likeCount: parseInt(video.statistics.likeCount || '0'),
                                commentCount: parseInt(video.statistics.commentCount || '0'),
                            }];
                    case 3:
                        error_7 = _b.sent();
                        console.error('YouTube API error:', error_7);
                        throw new Error('Failed to fetch YouTube video stats');
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    YouTubeService.prototype.calculateEngagementRate = function (videos, subscriberCount) {
        if (videos.length === 0 || subscriberCount === 0)
            return 0;
        var totalEngagement = videos.reduce(function (sum, video) {
            var likes = video.likeCount || 0;
            var comments = video.commentCount || 0;
            return sum + likes + comments;
        }, 0);
        var totalViews = videos.reduce(function (sum, video) {
            return sum + (video.viewCount || 0);
        }, 0);
        return totalViews > 0 ? (totalEngagement / totalViews) * 100 : 0;
    };
    return YouTubeService;
}());
exports.YouTubeService = YouTubeService;
// SNS synchronization service
var SNSSyncService = /** @class */ (function () {
    function SNSSyncService() {
        this.twitterService = new TwitterService();
        this.youtubeService = new YouTubeService();
    }
    SNSSyncService.prototype.syncSocialAccount = function (socialAccountId) {
        return __awaiter(this, void 0, void 0, function () {
            var socialAccount, updatedData, _a, twitterData, tweets, twitterEngagementRate, channelData, videos, videoStats, youtubeEngagementRate, updatedSocialAccount, error_8;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 13, , 14]);
                        return [4 /*yield*/, prisma.socialAccount.findUnique({
                                where: { id: socialAccountId },
                            })];
                    case 1:
                        socialAccount = _b.sent();
                        if (!socialAccount) {
                            throw new Error('Social account not found');
                        }
                        updatedData = {};
                        _a = socialAccount.platform;
                        switch (_a) {
                            case client_1.Platform.TWITTER: return [3 /*break*/, 2];
                            case client_1.Platform.YOUTUBE: return [3 /*break*/, 5];
                            case client_1.Platform.INSTAGRAM: return [3 /*break*/, 9];
                        }
                        return [3 /*break*/, 10];
                    case 2: return [4 /*yield*/, this.twitterService.getUserInfo(socialAccount.username)];
                    case 3:
                        twitterData = _b.sent();
                        return [4 /*yield*/, this.twitterService.getUserTweets(twitterData.id)];
                    case 4:
                        tweets = _b.sent();
                        twitterEngagementRate = this.twitterService.calculateEngagementRate(tweets);
                        updatedData = {
                            followerCount: twitterData.followersCount,
                            engagementRate: twitterEngagementRate,
                            isVerified: twitterData.verified,
                        };
                        return [3 /*break*/, 11];
                    case 5: return [4 /*yield*/, this.youtubeService.getChannelInfo(socialAccount.username)];
                    case 6:
                        channelData = _b.sent();
                        return [4 /*yield*/, this.youtubeService.getChannelVideos(socialAccount.username)];
                    case 7:
                        videos = _b.sent();
                        return [4 /*yield*/, Promise.all(videos.slice(0, 5).map(function (video) {
                                return _this.youtubeService.getVideoStats(video.id.videoId);
                            }))];
                    case 8:
                        videoStats = _b.sent();
                        youtubeEngagementRate = this.youtubeService.calculateEngagementRate(videoStats, channelData.subscriberCount);
                        updatedData = {
                            followerCount: channelData.subscriberCount,
                            engagementRate: youtubeEngagementRate,
                        };
                        return [3 /*break*/, 11];
                    case 9: 
                    // Instagram requires user-specific access token
                    // This would be implemented with OAuth flow
                    throw new Error('Instagram sync requires user authentication');
                    case 10: throw new Error("Unsupported platform: ".concat(socialAccount.platform));
                    case 11: return [4 /*yield*/, prisma.socialAccount.update({
                            where: { id: socialAccountId },
                            data: __assign(__assign({}, updatedData), { lastSynced: new Date() }),
                        })];
                    case 12:
                        updatedSocialAccount = _b.sent();
                        return [2 /*return*/, updatedSocialAccount];
                    case 13:
                        error_8 = _b.sent();
                        console.error('Sync social account error:', error_8);
                        throw error_8;
                    case 14: return [2 /*return*/];
                }
            });
        });
    };
    SNSSyncService.prototype.syncAllInfluencerAccounts = function (influencerId) {
        return __awaiter(this, void 0, void 0, function () {
            var socialAccounts, results, successful, failed, error_9;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, prisma.socialAccount.findMany({
                                where: { influencerId: influencerId },
                            })];
                    case 1:
                        socialAccounts = _a.sent();
                        return [4 /*yield*/, Promise.allSettled(socialAccounts.map(function (account) { return _this.syncSocialAccount(account.id); }))];
                    case 2:
                        results = _a.sent();
                        successful = results.filter(function (result) { return result.status === 'fulfilled'; }).length;
                        failed = results.filter(function (result) { return result.status === 'rejected'; }).length;
                        return [2 /*return*/, {
                                total: socialAccounts.length,
                                successful: successful,
                                failed: failed,
                                results: results,
                            }];
                    case 3:
                        error_9 = _a.sent();
                        console.error('Sync all accounts error:', error_9);
                        throw error_9;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    SNSSyncService.prototype.scheduleSyncForAllInfluencers = function () {
        return __awaiter(this, void 0, void 0, function () {
            var influencers, _i, influencers_1, influencer, error_10, error_11;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 8, , 9]);
                        return [4 /*yield*/, prisma.influencer.findMany({
                                where: { isRegistered: true },
                                include: {
                                    socialAccounts: true,
                                },
                            })];
                    case 1:
                        influencers = _a.sent();
                        console.log("Starting sync for ".concat(influencers.length, " influencers"));
                        _i = 0, influencers_1 = influencers;
                        _a.label = 2;
                    case 2:
                        if (!(_i < influencers_1.length)) return [3 /*break*/, 7];
                        influencer = influencers_1[_i];
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 5, , 6]);
                        return [4 /*yield*/, this.syncAllInfluencerAccounts(influencer.id)];
                    case 4:
                        _a.sent();
                        console.log("Synced accounts for influencer ".concat(influencer.id));
                        return [3 /*break*/, 6];
                    case 5:
                        error_10 = _a.sent();
                        console.error("Failed to sync influencer ".concat(influencer.id, ":"), error_10);
                        return [3 /*break*/, 6];
                    case 6:
                        _i++;
                        return [3 /*break*/, 2];
                    case 7:
                        console.log('Finished syncing all influencers');
                        return [3 /*break*/, 9];
                    case 8:
                        error_11 = _a.sent();
                        console.error('Schedule sync error:', error_11);
                        return [3 /*break*/, 9];
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    return SNSSyncService;
}());
exports.SNSSyncService = SNSSyncService;
