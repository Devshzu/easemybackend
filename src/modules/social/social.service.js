import { SocialPost, SocialAccount } from './social.model.js';

export class SocialService {
  /**
   * List paginated social posts with filters
   */
  static async getPosts({ page = 1, limit = 10, status, category, platform, search } = {}) {
    const query = {};
    if (status && status !== 'ALL') query.status = status;
    if (category && category !== 'ALL') query.category = category;
    if (platform && platform !== 'ALL') query.platform = platform;
    if (search) {
      query.$or = [
        { topic: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { hook: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const [posts, total] = await Promise.all([
      SocialPost.find(query)
        .populate('blogId', 'title slug image category')
        .populate('accountConfigId', 'accountName platform profileLink status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      SocialPost.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    return {
      posts,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasMore: pageNum < totalPages,
      },
    };
  }

  /**
   * Get single post by ID
   */
  static async getPostById(id) {
    const post = await SocialPost.findById(id)
      .populate('blogId', 'title slug image category')
      .populate('accountConfigId', 'accountName platform profileLink status');
    if (!post) throw new Error('Social post not found');
    return post;
  }

  /**
   * Update existing social post
   */
  static async updatePost(id, updateData) {
    const allowedFields = [
      'content',
      'hook',
      'category',
      'hashtags',
      'imageUrl',
      'imagePrompt',
      'status',
      'scheduledAt',
      'accountConfigId',
      'sources',
    ];

    const payload = {};
    for (const key of allowedFields) {
      if (updateData[key] !== undefined) {
        payload[key] = updateData[key];
      }
    }

    const post = await SocialPost.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    }).populate('blogId', 'title slug image category');

    if (!post) throw new Error('Social post not found');
    return post;
  }

  /**
   * Delete post
   */
  static async deletePost(id) {
    const post = await SocialPost.findByIdAndDelete(id);
    if (!post) throw new Error('Social post not found');
    return true;
  }

  /**
   * Approve post
   */
  static async approvePost(id) {
    const post = await SocialPost.findByIdAndUpdate(
      id,
      { status: 'APPROVED', errorMessage: null },
      { new: true }
    );
    if (!post) throw new Error('Social post not found');
    return post;
  }

  /**
   * Schedule post
   */
  static async schedulePost(id, scheduledAt) {
    if (!scheduledAt) throw new Error('Scheduled date and time is required');
    const post = await SocialPost.findByIdAndUpdate(
      id,
      {
        status: 'SCHEDULED',
        scheduledAt: new Date(scheduledAt),
        errorMessage: null,
      },
      { new: true }
    );
    if (!post) throw new Error('Social post not found');
    return post;
  }

  /**
   * Get all connected social accounts
   */
  static async getAccounts() {
    const accounts = await SocialAccount.find().sort({ createdAt: -1 }).lean();
    // Mask sensitive credential fields for security
    return accounts.map((acc) => ({
      ...acc,
      credentials: {
        hasAccessToken: Boolean(acc.credentials?.accessToken),
        hasRefreshToken: Boolean(acc.credentials?.refreshToken),
        hasClientId: Boolean(acc.credentials?.clientId),
        hasApiKey: Boolean(acc.credentials?.apiKey),
        webhookUrl: acc.credentials?.webhookUrl || '',
      },
    }));
  }

  /**
   * Create or connect a social account
   */
  static async createAccount(accountData) {
    const { platform, accountName, profileLink, credentials, isDefault } = accountData;

    if (isDefault) {
      await SocialAccount.updateMany({ platform }, { isDefault: false });
    }

    const account = await SocialAccount.create({
      platform: platform || 'LINKEDIN',
      accountName,
      profileLink: profileLink || '',
      credentials: credentials || {},
      isDefault: Boolean(isDefault),
      status: 'CONNECTED',
    });

    return account;
  }

  /**
   * Update social account
   */
  static async updateAccount(id, updateData) {
    const account = await SocialAccount.findById(id);
    if (!account) throw new Error('Social account not found');

    if (updateData.accountName) account.accountName = updateData.accountName;
    if (updateData.profileLink !== undefined) account.profileLink = updateData.profileLink;
    if (updateData.status) account.status = updateData.status;
    if (updateData.isDefault !== undefined) {
      if (updateData.isDefault) {
        await SocialAccount.updateMany({ platform: account.platform }, { isDefault: false });
      }
      account.isDefault = updateData.isDefault;
    }
    if (updateData.credentials) {
      account.credentials = {
        ...account.credentials.toObject(),
        ...updateData.credentials,
      };
    }

    await account.save();
    return account;
  }

  /**
   * Delete social account
   */
  static async deleteAccount(id) {
    const account = await SocialAccount.findByIdAndDelete(id);
    if (!account) throw new Error('Social account not found');
    return true;
  }
}

export default SocialService;
